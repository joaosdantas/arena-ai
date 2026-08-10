"""Acesso ao Supabase (Postgres + Storage) usando a service role key.

A service role ignora as políticas de RLS, permitindo ao worker ler o vídeo
original de qualquer partida e escrever thumbnails/previews. Nunca exponha essa
chave no cliente (frontend usa apenas a anon key).
"""

from pathlib import Path
from typing import Optional

from supabase import Client, create_client

from src.config.settings import settings
from src.utils.logger import get_logger

logger = get_logger('storage')

_client: Optional[Client] = None


def get_supabase_client() -> Client:
    """Cliente Supabase singleton com a service role key."""
    global _client
    if _client is None:
        _client = create_client(settings.supabase_url, settings.service_role_key)
    return _client


def _as_bytes(payload) -> bytes:
    """Normaliza o retorno de download (bytes, str ou dict) para bytes."""
    if isinstance(payload, bytes):
        return payload
    if isinstance(payload, str):
        return payload.encode('utf-8')
    if isinstance(payload, dict):
        data = payload.get('data') or payload.get('body')
        if isinstance(data, str):
            return data.encode('utf-8')
        return bytes(data or b'')
    return bytes(payload or b'')


def download_to_temp(bucket: str, path: str, tmp_dir: Path) -> Path:
    """Baixa um objeto do Storage para um arquivo temporário."""
    logger.info('baixando %s/%s', bucket, path)
    payload = get_supabase_client().storage.from_(bucket).download(path)
    local_path = tmp_dir / Path(path).name
    local_path.write_bytes(_as_bytes(payload))
    logger.info('download concluído: %s (%d bytes)', local_path, local_path.stat().st_size)
    return local_path


def upload_bytes(bucket: str, path: str, data: bytes, content_type: str) -> str:
    """Envia bytes para o Storage e retorna a URL pública do objeto."""
    logger.info('enviando %s/%s (%d bytes)', bucket, path, len(data))
    get_supabase_client().storage.from_(bucket).upload(
        path,
        data,
        file_options={'content-type': content_type, 'upsert': 'true'},
    )
    url = get_public_url(bucket, path)
    logger.info('upload concluído: %s', url)
    return url


def get_public_url(bucket: str, path: str) -> str:
    """URL pública de um objeto (funciona para buckets públicos/previews)."""
    url = get_supabase_client().storage.from_(bucket).get_public_url(path)
    if isinstance(url, dict):
        return str(url.get('publicURL', ''))
    return str(url)


def remove_object(bucket: str, path: str) -> None:
    """Remove um objeto do Storage (usado na limpeza de falhas)."""
    try:
        get_supabase_client().storage.from_(bucket).remove([path])
    except Exception as exc:  # noqa: BLE001 - limpeza não pode quebrar o fluxo
        logger.warning('falha ao remover %s/%s: %s', bucket, path, exc)
