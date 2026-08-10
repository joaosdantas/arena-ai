#!/usr/bin/env python3
"""Worker de processamento de vídeos do Arena AI.

Coleta vídeos com `processing_status = 'pending'`, processa (thumbnail,
preview e metadados) e atualiza `videos`/`matches` para 'ready'.

Uso:
    python worker.py          # loop contínuo (com polling a cada POLL_INTERVAL_SECONDS)
    python worker.py --once   # processa as tarefas pendentes e encerra
"""

import argparse
import shutil
import signal
import sys
import tempfile
import time
from pathlib import Path
from typing import Optional

from src.config.settings import settings, validate_settings
from src.jobs.video_processing_job import (
    cleanup_failed_uploads,
    claim_pending_videos,
    mark_video_failed,
    mark_video_processing,
    process_video,
)
from src.storage.supabase_storage import get_supabase_client
from src.utils.logger import get_logger

logger = get_logger('worker')

_stop_requested = False


def _handle_sigint(signum, frame) -> None:
    """Encerra o loop de forma graciosa ao receber Ctrl+C."""
    global _stop_requested
    logger.info('encerramento solicitado (SIGINT); finalizando após a tarefa atual...')
    _stop_requested = True


def process_pending_batch(client, batch_size: int, tmp_dir: Path) -> int:
    """Processa um lote de vídeos pendentes e retorna quantos foram concluídos."""
    pending = claim_pending_videos(client, batch_size)
    if not pending:
        return 0

    logger.info('%d tarefa(s) pendente(s) encontrada(s)', len(pending))
    processed = 0

    for video in pending:
        if _stop_requested:
            logger.info('stop solicitado; interrompendo o lote')
            break

        video_id = video['id']
        mark_video_processing(client, video_id)
        try:
            result = process_video(client, video, tmp_dir)
            processed += 1
            logger.info(
                'vídeo %s concluído: duração=%.2fs, thumbnail=%s, preview=%s',
                result['video_id'], result['duration'], result['thumbnail_url'], result['preview_url'],
            )
        except Exception as exc:  # noqa: BLE001 - erro de uma tarefa não derruba o worker
            logger.error('erro ao processar vídeo %s: %s', video_id, exc, exc_info=True)
            try:
                mark_video_failed(client, video, exc)
                cleanup_failed_uploads(video)
            except Exception as cleanup_exc:  # noqa: BLE001
                logger.warning('falha na limpeza do vídeo %s: %s', video_id, cleanup_exc)

    return processed


def run_once() -> None:
    """Processa um único lote de tarefas pendentes e retorna."""
    validate_settings()
    client = get_supabase_client()
    tmp_root = Path(tempfile.mkdtemp(prefix='video-worker-'))
    try:
        process_pending_batch(client, settings.batch_size, tmp_root)
    finally:
        shutil.rmtree(tmp_root, ignore_errors=True)


def run_loop() -> None:
    """Loop contínuo: processa pendentes e dorme até o próximo poll."""
    validate_settings()
    client = get_supabase_client()

    signal.signal(signal.SIGINT, _handle_sigint)

    logger.info(
        'worker iniciado (poll=%ds, batch=%d)',
        settings.poll_interval_seconds, settings.batch_size,
    )

    tmp_root = Path(tempfile.mkdtemp(prefix='video-worker-'))
    try:
        while not _stop_requested:
            try:
                processed = process_pending_batch(client, settings.batch_size, tmp_root)
            except Exception as exc:  # noqa: BLE001 - erro de polling não derruba o worker
                logger.error('erro na rodada de polling: %s', exc, exc_info=True)
                processed = 0

            if _stop_requested:
                break

            if processed:
                logger.info('rodada concluída (%d vídeo(s)); aguardando próxima rodada', processed)
            time.sleep(settings.poll_interval_seconds)
    finally:
        shutil.rmtree(tmp_root, ignore_errors=True)
        logger.info('worker encerrado')


def main(argv: Optional[list] = None) -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        '--once',
        action='store_true',
        help='processa as tarefas pendentes uma única vez e encerra',
    )
    args = parser.parse_args(argv)

    try:
        run_once() if args.once else run_loop()
    except RuntimeError as exc:
        logger.error('%s', exc)
        sys.exit(1)
    except KeyboardInterrupt:
        logger.info('encerrado via Ctrl+C')


if __name__ == '__main__':
    main()
