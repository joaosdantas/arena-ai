import { useMutation, useQueryClient } from '@tanstack/react-query'

import { arenaDashboardKeys } from '@/modules/arena/hooks/use-arena'
import { sessionLifecycleService, sessionService } from '@/services/session.service'

import type { CreateSessionInput, SessionStatus } from '@/types/domain'

export type SessionLifecycleAction = 'start' | 'finish' | 'fail'

const lifecycleStatus: Record<SessionLifecycleAction, SessionStatus> = {
  start: 'active',
  finish: 'finished',
  fail: 'failed',
}

export function useCreateSession() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: CreateSessionInput) => {
      const session = await sessionService.create(input)
      if (input.status === 'active' && session.id) {
        await sessionLifecycleService.start(session.id)
      }
      return session
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: arenaDashboardKeys.all })
    },
  })
}

export function useSessionLifecycle() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      sessionId,
      action,
      deviceIds,
    }: {
      sessionId: string
      action: SessionLifecycleAction
      deviceIds?: string[]
    }) =>
      sessionLifecycleService.setStatus(sessionId, lifecycleStatus[action]).then(async (session) => {
        if (action === 'start' && deviceIds) {
          for (const deviceId of deviceIds) {
            await sessionLifecycleService.attachDevice(session.id, deviceId)
          }
        }
        return session
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: arenaDashboardKeys.all })
    },
  })
}
