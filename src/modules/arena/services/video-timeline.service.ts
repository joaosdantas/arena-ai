import type { SessionVideoView, SessionView } from '@/modules/arena/types/arena-dashboard.types'

export interface VideoTimelinePosition {
  offsetMs: number
  durationMs: number
  startMs: number
  endMs: number
}

export function getVideoTimelinePosition(
  video: Pick<SessionVideoView, 'duration' | 'recordingStartedAt' | 'recordingEndedAt' | 'timelineOffsetMs'>,
  session: Pick<SessionView, 'startedAt'>,
): VideoTimelinePosition {
  const sessionStart = session.startedAt ? Date.parse(session.startedAt) : Number.NaN
  const recordingStart = video.recordingStartedAt ? Date.parse(video.recordingStartedAt) : Number.NaN
  const offsetFromTimestamps = Number.isFinite(sessionStart) && Number.isFinite(recordingStart)
    ? Math.max(0, recordingStart - sessionStart)
    : null
  const offsetMs = Math.max(0, video.timelineOffsetMs ?? offsetFromTimestamps ?? 0)
  const timestampDuration = video.recordingStartedAt && video.recordingEndedAt
    ? Date.parse(video.recordingEndedAt) - Date.parse(video.recordingStartedAt)
    : Number.NaN
  const durationMs = Number.isFinite(timestampDuration) && timestampDuration >= 0
    ? timestampDuration
    : Math.max(0, (video.duration ?? 0) * 1000)

  return { offsetMs, durationMs, startMs: offsetMs, endMs: offsetMs + durationMs }
}

export function orderVideosByTimeline<T extends SessionVideoView>(
  videos: T[],
  session: Pick<SessionView, 'startedAt'>,
): T[] {
  return [...videos].sort((a, b) => {
    const difference = getVideoTimelinePosition(a, session).startMs - getVideoTimelinePosition(b, session).startMs
    return difference || a.id.localeCompare(b.id)
  })
}

export function groupVideosByCamera<T extends SessionVideoView>(videos: T[]): Map<string, T[]> {
  const groups = new Map<string, T[]>()
  for (const video of videos) {
    const key = video.captureDeviceId ?? 'unknown-camera'
    groups.set(key, [...(groups.get(key) ?? []), video])
  }
  return groups
}

export function formatTimelineTime(milliseconds: number): string {
  const totalMs = Math.max(0, Math.floor(milliseconds))
  const minutes = Math.floor(totalMs / 60_000)
  const seconds = Math.floor((totalMs % 60_000) / 1000)
  const millis = totalMs % 1000
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(millis).padStart(3, '0')}`
}
