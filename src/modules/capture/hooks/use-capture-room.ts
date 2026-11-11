import { useMutation, useQuery } from '@tanstack/react-query'

import { captureRoomService } from '@/services/capture-room.service'

export const captureRoomKeys = {
  all: ['capture-room'] as const,
  byToken: (token: string) => [...captureRoomKeys.all, token] as const,
}

export function useCaptureRoom(roomToken: string | undefined) {
  return useQuery({
    queryKey: captureRoomKeys.byToken(roomToken ?? ''),
    queryFn: () => captureRoomService.getByToken(roomToken ?? ''),
    enabled: Boolean(roomToken),
    refetchInterval: 15_000,
  })
}

export function useJoinCaptureRoom() {
  return useMutation({
    mutationFn: ({
      roomToken,
      installationId,
      deviceName,
    }: {
      roomToken: string
      installationId: string
      deviceName: string
    }) => captureRoomService.join(roomToken, installationId, deviceName),
  })
}
