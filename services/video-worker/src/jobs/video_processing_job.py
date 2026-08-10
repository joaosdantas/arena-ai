"""Tarefa de processamento de um vídeo.

Fluxo: reivindicar tarefas 'pending' -> baixar o original do Storage ->
extrair metadados/thumbnail/preview -> enviar de volta ao Storage ->
atualizar `videos` e `matches` para 'ready'.
"""

import shutil
from datetime import datetime, timedelta, timezone
from pathlib import Path

from supabase import Client

from src.config.settings import settings
from src.processor import extract_thumbnail, generate_preview, get_video_duration, get_video_metadata
from src.storage.supabase_storage import download_to_temp, remove_object, upload_bytes
from src.utils.logger import get_logger

logger = get_logger('jobs')

THUMBNAIL_FILENAME = 'thumbnail.jpg'
PREVIEW_FILENAME = 'preview.mp4'


def claim_pending_videos(client: Client, batch_size: int) -> list:
    """Seleciona vídeos 'pending' ou 'processing' obsoletos.

    O dono (owner_id) pode vir de duas origens:
      - join com `matches` (partida vinculada);
      - cadeia session -> court -> arena (gravações de captura sem partida).
    Usa left join para não descartar vídeos cujo match_id é nulo.

    Vídeos 'processing' com `updated_at` mais antigo que claim_timeout_seconds
    são reivindicados novamente: um worker anterior pode ter caído ou sido
    interrompido entre o claim e a atualização para 'ready'/'failed'.
    """
    stale_cutoff = datetime.now(timezone.utc) - timedelta(seconds=settings.claim_timeout_seconds)
    stale_iso = stale_cutoff.strftime('%Y-%m-%dT%H:%M:%SZ')
    result = (
        client.table('videos')
        .select(
            '*, matches!left(owner_id, status, title), '
            'sessions!left(courts(arenas(owner_id)))'
        )
        .or_(
            'processing_status.eq.pending,'
            f'and(processing_status.eq.processing,updated_at.lt.{stale_iso})'
        )
        .order('created_at', desc=True)
        .limit(batch_size)
        .execute()
    )
    return result.data if result else []


def _resolve_owner(video: dict) -> str:
    """Deriva o owner_id do vídeo (via match ou via session -> court -> arena)."""
    match_owner = video.get('matches') and video['matches'].get('owner_id')
    if match_owner:
        return match_owner
    session = video.get('sessions') or {}
    courts = session.get('courts') or {}
    arenas = courts.get('arenas') or {}
    owner_id = arenas.get('owner_id')
    if not owner_id:
        raise ValueError('impossível determinar owner_id do vídeo (sem match e sem sessão)')
    return owner_id


def mark_video_processing(client: Client, video_id: str) -> None:
    """Marca o vídeo como 'processing' para reivindicar a tarefa.

    Também atualiza `updated_at`, servindo de "lease": permite detectar
    claims obsoletos (processing antigo) na próxima rodada.
    """
    client.table('videos').update({
        'processing_status': 'processing',
        'updated_at': 'now()',
    }).eq('id', video_id).execute()


def _upload_file(bucket: str, storage_path: str, local: Path, content_type: str) -> str:
    """Envia um arquivo local para o Storage e retorna a URL pública."""
    return upload_bytes(bucket, storage_path, local.read_bytes(), content_type)


def process_video(client: Client, video: dict, tmp_dir: Path) -> dict:
    """Processa um único vídeo: download -> processar -> upload -> update no banco."""
    video_id = video['id']
    match_id = video.get('match_id')
    owner_id = _resolve_owner(video)
    original_path = video['original_url']
    video_title = (video.get('matches') or {}).get('title', '')

    logger.info(
        'processando vídeo %s (match=%s, owner=%s, título=%r)',
        video_id, match_id, owner_id, video_title,
    )

    local_video = download_to_temp(settings.videos_bucket, original_path, tmp_dir)
    job_dir = tmp_dir / video_id
    job_dir.mkdir(parents=True, exist_ok=True)

    # Caminhos do Storage: partidas usam {owner_id}/{match_id}; gravações de
    # captura (sem partida) usam {owner_id}/{session_id}.
    asset_key = match_id or video.get('session_id')
    if not asset_key:
        raise ValueError('vídeo sem match_id e sem session_id para os caminhos do storage')

    try:
        metadata = get_video_metadata(local_video)
        duration = get_video_duration(local_video)
        logger.info(
            'metadados: duração=%.2fs, %dx%d, fps=%.2f, codec=%s',
            metadata['duration'], metadata['width'], metadata['height'],
            metadata['fps'], metadata['codec'],
        )

        thumbnail_local = job_dir / THUMBNAIL_FILENAME
        extract_thumbnail(local_video, thumbnail_local, position_ratio=settings.thumbnail_position_ratio)
        thumbnail_path = f'{owner_id}/{asset_key}/{THUMBNAIL_FILENAME}'
        thumbnail_url = _upload_file(settings.thumbnails_bucket, thumbnail_path, thumbnail_local, 'image/jpeg')

        preview_local = job_dir / PREVIEW_FILENAME
        generate_preview(local_video, preview_local, duration=settings.preview_duration_seconds)
        preview_path = f'{settings.previews_folder}/{owner_id}/{asset_key}/{PREVIEW_FILENAME}'
        preview_url = _upload_file(settings.videos_bucket, preview_path, preview_local, 'video/mp4')

        client.table('videos').update({
            'duration': max(1, round(duration)),
            'width': metadata['width'],
            'height': metadata['height'],
            'fps': metadata['fps'],
            'codec': metadata['codec'],
            'thumbnail_url': thumbnail_url,
            'preview_url': preview_url,
            'processing_status': 'ready',
            'updated_at': 'now()',
        }).eq('id', video_id).execute()

        if match_id:
            client.table('matches').update({
                'status': 'ready',
                'thumbnail_url': thumbnail_url,
                'preview_url': preview_url,
            }).eq('id', match_id).execute()

        return {
            'video_id': video_id,
            'match_id': match_id,
            'session_id': video.get('session_id'),
            'duration': metadata['duration'],
            'thumbnail_url': thumbnail_url,
            'preview_url': preview_url,
        }
    finally:
        shutil.rmtree(job_dir, ignore_errors=True)


def mark_video_failed(client: Client, video: dict, error: Exception) -> None:
    """Marca vídeo (e partida, quando houver) como falhos e registra o erro."""
    logger.error('falha ao processar vídeo %s: %s', video.get('id'), error, exc_info=True)
    try:
        client.table('videos').update({
            'processing_status': 'failed',
            'updated_at': 'now()',
        }).eq('id', video['id']).execute()
        match_id = video.get('match_id')
        if match_id:
            client.table('matches').update({'status': 'failed'}).eq('id', match_id).execute()
    except Exception as cleanup_exc:  # noqa: BLE001 - update de falha não pode mascarar o erro original
        logger.warning('falha ao marcar vídeo %s como failed: %s', video.get('id'), cleanup_exc)


def cleanup_failed_uploads(video: dict) -> None:
    """Remove artefatos parciais do Storage (thumbnail/preview) de um vídeo falho."""
    owner_id = (video.get('matches') or {}).get('owner_id')
    if not owner_id:
        try:
            owner_id = _resolve_owner(video)
        except ValueError:
            return
    asset_key = video.get('match_id') or video.get('session_id')
    if not owner_id or not asset_key:
        return
    remove_object(settings.thumbnails_bucket, f'{owner_id}/{asset_key}/{THUMBNAIL_FILENAME}')
    remove_object(settings.videos_bucket, f'{settings.previews_folder}/{owner_id}/{asset_key}/{PREVIEW_FILENAME}')
