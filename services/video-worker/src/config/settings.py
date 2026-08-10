"""Configuração do video worker.

Carrega variáveis de ambiente (com suporte a um arquivo .env no diretório
raiz do serviço) e expõe os valores validados em `settings`.
"""

import os
from pathlib import Path

from dotenv import load_dotenv

SERVICE_ROOT = Path(__file__).resolve().parent.parent.parent

load_dotenv(SERVICE_ROOT / '.env')


class Settings:
    """Configuração central do worker, lida a partir do ambiente."""

    supabase_url: str = os.getenv('SUPABASE_URL', '')
    service_role_key: str = os.getenv('SUPABASE_SERVICE_ROLE_KEY', '')

    poll_interval_seconds: int = int(os.getenv('POLL_INTERVAL_SECONDS', '15'))
    batch_size: int = int(os.getenv('WORKER_BATCH_SIZE', '5'))
    # Tempo (em segundos) após o qual um vídeo 'processing' pode ser
    # reivindicado novamente (worker anterior caiu/foi interrompido).
    claim_timeout_seconds: int = int(os.getenv('CLAIM_TIMEOUT_SECONDS', '600'))

    thumbnail_position_ratio: float = float(os.getenv('THUMBNAIL_POSITION_RATIO', '0.10'))
    preview_duration_seconds: int = int(os.getenv('PREVIEW_DURATION_SECONDS', '15'))

    # Buckets/prefixos fixos (alinhados com supabase/migrations).
    videos_bucket: str = 'videos'
    thumbnails_bucket: str = 'thumbnails'
    previews_folder: str = 'previews'

    @property
    def is_configured(self) -> bool:
        return bool(self.supabase_url and self.service_role_key)


settings = Settings()


def validate_settings() -> None:
    """Garante que a configuração essencial está presente antes de iniciar."""
    if not settings.is_configured:
        raise RuntimeError(
            'SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórios. '
            'Copie .env.example para .env e preencha os valores.'
        )
