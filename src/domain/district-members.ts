import { isDistrictClub } from "@/domain/clubs"
import { isDistrictZone } from "@/domain/zones"

const CLUB_ALIASES: Record<string, string> = {
  "Rotaract Club of Symbiosis Law Viman Nagar": "Rotaract Club of Symboisis Law Viman Nagar",
  "Rotaract Club of Udyognagri Drishti": "Rotaract Club of Udyognagari Drishti",
  "Rotaract Club of Vishwakarma Institute of Technology, Pune": "Rotaract Club of Vishwakarma Institute of Technology Pune",
  "Rotaract Club of Roar NIBM": "Rotaract Club of ROAR NIBM",
  "Rotaract Club of Nigdi Pune": "Rotaract Club of Nigdi-Pune",
}

export type DistrictMemberRow = {
  fullName: string
  rotaryId: string
  club: string
  zone: string
}

export type DistrictMemberLookup =
  | { status: "skipped" }
  | { status: "none" }
  | { status: "many" }
  | { status: "one"; fullName: string; club: string; zone: string; participantRole: "rotaractor" }
  | { status: "unavailable" }

export function normalizeRotaryId(value: string) {
  return value.trim().replace(/\s+/g, "")
}

export function formClubName(club: string) {
  const mapped = CLUB_ALIASES[club.trim()] ?? club.trim()
  return isDistrictClub(mapped) ? mapped : ""
}

export function matchDistrictMembers(rows: DistrictMemberRow[], rotaryId: string): DistrictMemberLookup {
  const id = normalizeRotaryId(rotaryId)
  if (id.length < 6 || id.length > 40) return { status: "skipped" }
  const matches = rows.filter((row) => normalizeRotaryId(row.rotaryId) === id)
  if (matches.length === 0) return { status: "none" }
  if (matches.length > 1) return { status: "many" }
  const match = matches[0]
  const zone = match.zone.trim()
  return {
    status: "one",
    fullName: match.fullName.trim(),
    club: formClubName(match.club),
    zone: isDistrictZone(zone) ? zone : "",
    participantRole: "rotaractor",
  }
}
