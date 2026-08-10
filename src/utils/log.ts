/**
 * Logger leve e consistente por domínio. Os logs usam o padrão
 * `[Tag] mensagem` para facilitar a busca no console do navegador.
 *
 * Uso:
 *   const log = createLogger('VideoUpload')
 *   log.info('upload iniciado', { matchId })
 */
export function createLogger(tag: string) {
  const prefix = `[${tag}]`

  function format(args: unknown[]): unknown[] {
    if (args.length === 0) return []
    const last = args[args.length - 1]
    if (typeof last === 'object' && last !== null) {
      try {
        return [...args.slice(0, -1), JSON.stringify(last)]
      } catch {
        return args
      }
    }
    return args
  }

  return {
    info: (...args: unknown[]) => console.info(prefix, ...format(args)),
    warn: (...args: unknown[]) => console.warn(prefix, ...format(args)),
    error: (...args: unknown[]) => console.error(prefix, ...format(args)),
  }
}
