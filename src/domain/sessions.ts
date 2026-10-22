export type TimedSession = {
  id: string
  sessionDate: string
  startsAt: string
  endsAt: string
  location: string | null
}

export function sessionTimeValid(startsAt: string, endsAt: string): boolean {
  return startsAt < endsAt
}

export function sessionsOverlap(a: TimedSession, b: TimedSession): boolean {
  if (a.id === b.id || a.sessionDate !== b.sessionDate) return false
  if (a.location && b.location && a.location.trim().toLowerCase() !== b.location.trim().toLowerCase()) {
    return false
  }
  return a.startsAt < b.endsAt && b.startsAt < a.endsAt
}

export function overlappingSessionIds(sessions: readonly TimedSession[]): string[] {
  const ids = new Set<string>()
  for (let i = 0; i < sessions.length; i += 1) {
    for (let j = i + 1; j < sessions.length; j += 1) {
      if (sessionsOverlap(sessions[i], sessions[j])) {
        ids.add(sessions[i].id)
        ids.add(sessions[j].id)
      }
    }
  }
  return [...ids]
}
