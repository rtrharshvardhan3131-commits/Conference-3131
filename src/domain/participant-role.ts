export const PARTICIPANT_ROLES = [
  { value: "rotaractor", label: "Rotaractor" },
  { value: "rotarian", label: "Rotarian" },
  { value: "drr_designate", label: "DRR Designate" },
] as const

export type ParticipantRole = (typeof PARTICIPANT_ROLES)[number]["value"]

export function isParticipantRole(value: string): value is ParticipantRole {
  return PARTICIPANT_ROLES.some((role) => role.value === value)
}

export function participantRoleLabel(value: string): string {
  return PARTICIPANT_ROLES.find((role) => role.value === value)?.label ?? ""
}
