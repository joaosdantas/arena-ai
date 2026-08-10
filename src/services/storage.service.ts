import { env } from '@/lib/env'

import { getSupabase, isSupabaseConfigured } from '@/services/supabase'

import { toErrorMessage } from '@/utils/errors'
import { createLogger } from '@/utils/log'

const log = createLogger('VideoUpload')

interface UploadFileOptions {
  onProgress?: (percent: number) => void
  signal?: AbortSignal
}

function mapUploadError(status: number, rawMessage: string | null): string {
  const error = new Error(rawMessage ?? `status ${status}`)
  if (status === 413) {
    return toErrorMessage(error, 'O arquivo é grande demais para o plano atual.')
  }
  if (status === 400 || status === 401 || status === 403) {
    return toErrorMessage(error, 'Não foi possível enviar o vídeo. Verifique suas permissões.')
  }
  return toErrorMessage(error, 'Não conseguimos enviar este vídeo. Tente novamente.')
}

function uploadWithProgress(
  url: string,
  path: string,
  file: File,
  accessToken: string,
  anonKey: string,
  options: UploadFileOptions,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('POST', url)
    xhr.setRequestHeader('Authorization', `Bearer ${accessToken}`)
    xhr.setRequestHeader('apikey', anonKey)
    xhr.setRequestHeader('x-upsert', 'true')
    xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream')

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        options.onProgress?.(Math.round((event.loaded / event.total) * 100))
      }
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(path)
        return
      }
      let rawMessage: string | null = null
      try {
        const body = JSON.parse(xhr.responseText) as { message?: string }
        rawMessage = body.message ?? null
      } catch {
        // sem corpo parseável; usa a mensagem mapeada por status
      }
      log.error('falha no upload', { status: xhr.status, rawMessage, path })
      reject(new Error(mapUploadError(xhr.status, rawMessage)))
    }

    xhr.onerror = () => reject(new Error('Falha de conexão ao enviar o vídeo.'))
    xhr.onabort = () => reject(new DOMException('Upload cancelado.', 'AbortError'))
    options.signal?.addEventListener('abort', () => xhr.abort(), { once: true })

    xhr.send(file)
  })
}

export const storageService = {
  async uploadFile(
    bucket: string,
    path: string,
    file: File,
    options: UploadFileOptions = {},
  ): Promise<string> {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase não configurado.')
    }
    const client = getSupabase()
    const { data } = await client.auth.getSession()
    const accessToken = data.session?.access_token
    if (!accessToken) {
      throw new Error('Sessão não autenticada.')
    }

    const url = `${env.VITE_SUPABASE_URL}/storage/v1/object/${bucket}/${path}`
    return uploadWithProgress(url, path, file, accessToken, env.VITE_SUPABASE_ANON_KEY, options)
  },

  /**
   * Upload anônimo (role anon) usando apenas a anon key no Authorization.
   * Usado pelo celular no modo captura, que não está logado; as políticas de
   * storage de videos/capture/... autorizam o envio.
   */
  async uploadAnonymous(
    bucket: string,
    path: string,
    file: File,
    options: UploadFileOptions = {},
  ): Promise<string> {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase não configurado.')
    }
    const url = `${env.VITE_SUPABASE_URL}/storage/v1/object/${bucket}/${path}`
    return uploadWithProgress(
      url,
      path,
      file,
      env.VITE_SUPABASE_ANON_KEY,
      env.VITE_SUPABASE_ANON_KEY,
      options,
    )
  },

  async deleteFile(bucket: string, path: string): Promise<void> {
    if (!isSupabaseConfigured()) return
    const { error } = await getSupabase().storage.from(bucket).remove([path])
    if (error) throw error
  },

  getPublicUrl(bucket: string, path: string): string {
    if (!isSupabaseConfigured()) {
      return ''
    }
    return getSupabase().storage.from(bucket).getPublicUrl(path).data.publicUrl
  },
}
