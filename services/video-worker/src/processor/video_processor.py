"""Processamento de vídeo com OpenCV e FFmpeg.

Responsável por extrair duração/metadados (ffprobe), gerar o thumbnail (frame
em ~10% do vídeo, OpenCV) e o preview (15s do início, re-encode com ffmpeg).
Nenhuma análise de IA/tracking é feita nesta etapa.
"""

from fractions import Fraction
from pathlib import Path

import cv2
import ffmpeg
from ffmpeg import Error as FfmpegError

from src.utils.logger import get_logger

logger = get_logger('processor')


def _duration_from_probe(probe: dict) -> float:
    """Duração em segundos a partir de um probe do ffprobe."""
    duration = probe.get('format', {}).get('duration')
    if duration:
        try:
            return float(duration)
        except (TypeError, ValueError):
            pass
    for stream in probe.get('streams', []):
        duration = stream.get('duration')
        if duration:
            try:
                return float(duration)
            except (TypeError, ValueError):
                continue
    return 0.0


def _frame_rate_from_stream(stream: dict) -> float:
    """FPS a partir de avg_frame_rate (ex.: '30000/1001')."""
    raw = stream.get('avg_frame_rate') or stream.get('r_frame_rate') or '0/0'
    try:
        numerator, denominator = raw.split('/')
        return float(Fraction(int(numerator), int(denominator))) if int(denominator) else 0.0
    except (ValueError, ZeroDivisionError):
        return 0.0


def get_video_duration(path: str | Path) -> float:
    """Retorna a duração do vídeo em segundos."""
    return _duration_from_probe(ffmpeg.probe(str(path)))


def get_video_metadata(path: str | Path) -> dict:
    """Retorna metadados essenciais do vídeo (duração, dimensões, FPS, codec...)."""
    probe = ffmpeg.probe(str(path))
    fmt = probe.get('format', {})
    video_stream = next(
        (s for s in probe.get('streams', []) if s.get('codec_type') == 'video'),
        {},
    )
    duration = _duration_from_probe(probe)
    return {
        'duration': round(duration, 3),
        'width': video_stream.get('width') or 0,
        'height': video_stream.get('height') or 0,
        'codec': video_stream.get('codec_name') or '',
        'fps': round(_frame_rate_from_stream(video_stream), 2),
        'bit_rate': int(fmt.get('bit_rate') or 0),
        'size_bytes': int(fmt.get('size') or 0),
    }


def extract_thumbnail(
    input_path: str | Path,
    output_path: str | Path,
    position_ratio: float = 0.10,
    quality: int = 90,
) -> str:
    """Extrai um frame do vídeo como JPEG.

    O frame é capturado na posição `position_ratio * duração` (10% por padrão),
    com um limite mínimo para vídeos muito curtos.
    """
    input_path = Path(input_path)
    output_path = Path(output_path)

    duration = get_video_duration(input_path)
    if duration > 0:
        position_sec = max(duration * position_ratio, min(0.5, duration))
    else:
        position_sec = 0.5

    logger.info('gerando thumbnail em %.2fs de %s', position_sec, input_path)

    cap = cv2.VideoCapture(str(input_path))
    if not cap.isOpened():
        raise RuntimeError(f'não foi possível abrir o vídeo: {input_path}')

    try:
        cap.set(cv2.CAP_PROP_POS_MSEC, position_sec * 1000)
        ok, frame = cap.read()
    finally:
        cap.release()

    if not ok or frame is None:
        raise RuntimeError(f'não foi possível capturar o frame em {position_sec:.2f}s')

    output_path.parent.mkdir(parents=True, exist_ok=True)
    written = cv2.imwrite(
        str(output_path),
        frame,
        [cv2.IMWRITE_JPEG_QUALITY, quality],
    )
    if not written:
        raise RuntimeError(f'falha ao gravar o thumbnail: {output_path}')

    logger.info('thumbnail gerado: %s', output_path)
    return str(output_path)


def generate_preview(
    input_path: str | Path,
    output_path: str | Path,
    duration: int = 15,
    max_width: int = 480,
) -> str:
    """Gera um preview de `duration` segundos (do início do vídeo).

    O preview é re-codificado em H.264 (yuv420p, com faststart) e limitado a
    `max_width` de largura para manter o arquivo leve.
    """
    input_path = Path(input_path)
    output_path = Path(output_path)

    video_duration = get_video_duration(input_path)
    if video_duration > 0:
        preview_length = max(1.0, min(float(duration), video_duration))
    else:
        preview_length = float(duration)

    logger.info('gerando preview de %.1fs (%s)', preview_length, input_path)

    stream = ffmpeg.input(str(input_path), t=preview_length)
    stream = (
        stream.video.filter('scale', -2, max_width)
        .filter('format', 'yuv420p')
        .filter('fps', 30)
    )

    output_path.parent.mkdir(parents=True, exist_ok=True)
    try:
        ffmpeg.output(
            stream,
            str(output_path),
            vcodec='libx264',
            preset='veryfast',
            crf=23,
            movflags='+faststart',
            an=None,
        ).overwrite_output().run(quiet=True, capture_stderr=True)
    except FfmpegError as exc:
        stderr = exc.stderr.decode('utf-8', errors='replace') if exc.stderr else str(exc)
        raise RuntimeError(f'falha ao gerar preview: {stderr}') from exc

    logger.info('preview gerado: %s (%d bytes)', output_path, output_path.stat().st_size)
    return str(output_path)
