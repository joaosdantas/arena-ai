import { createLogger } from '@/utils/log'

const log = createLogger('Errors')

/** Marcadores de mensagens já amigáveis (pt-BR) que podem ser exibidas como estão. */
const FRIENDLY_HINTS = [
  /não/i,
  /suportado|suportada/i,
  /excede|máximo/i,
  /inválido|inválida/i,
  /autenticado/i,
  /encontrado|encontrada/i,
  /vazio/i,
  /formato/i,
  /conexão/i,
  /dispositivo|quadra|sessão/i,
  /câmera|gravação/i,
  /cancelado/i,
  /permissões|permissao/i,
]

const ERROR_MESSAGE_HINTS: Array<[RegExp, string]> = [
  [/413|requested file size exceeds/i, 'Este arquivo é grande demais para o plano atual. Comprima o vídeo ou fale com o suporte para habilitar arquivos maiores.'],
  [/row-level security policy|new row violates/i, 'Não foi possível concluir a operação. Verifique suas permissões e tente novamente.'],
  [/storageobjectnotfound|bucket not found|no such object/i, 'O arquivo não foi encontrado. Ele pode ter sido removido ou o link pode ter expirado.'],
  [/invalid_text_representation|22p02|invalid input syntax/i, 'O identificador informado é inválido.'],
  [/could not get signed url|unauthorized|401|403/i, 'Não foi possível acessar este vídeo. Tente novamente em instantes.'],
  [/failed to fetch|networkerror|erro de rede|network request/i, 'Falha de conexão. Verifique sua internet e tente novamente.'],
]

function isProbablyFriendly(message: string): boolean {
  return FRIENDLY_HINTS.some((pattern) => pattern.test(message))
}

/**
 * Converte um erro técnico (mensagem bruta do Supabase/storage/rede) em uma
 * mensagem amigável em pt-BR. Mensagens que já parecem amigáveis são mantidas;
 * o restante é mapeado por padrões conhecidos ou substituído pelo fallback.
 */
export function toErrorMessage(error: unknown, fallback: string): string {
  const message = error instanceof Error && error.message ? error.message : ''
  if (message && isProbablyFriendly(message)) {
    return message
  }
  if (message) {
    for (const [pattern, friendly] of ERROR_MESSAGE_HINTS) {
      if (pattern.test(message)) {
        log.warn('erro mapeado para mensagem amigável:', message)
        return friendly
      }
    }
    log.warn('erro exibido via fallback:', message)
  }
  return fallback
}
