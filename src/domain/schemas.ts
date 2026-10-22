import { z } from "zod"
import { isDistrictClub } from "@/domain/clubs"
import { isParticipantRole } from "@/domain/participant-role"
import { isDistrictZone } from "@/domain/zones"
import { isCouncilPosition } from "@/domain/council-positions"
import { isTshirtSize } from "@/domain/tshirt"

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Enter a valid email address")

export const phoneSchema = z
  .string()
  .trim()
  .transform((value) => value.replace(/[\s()-]/g, ""))
  .refine((value) => /^(\+91)?[6-9]\d{9}$/.test(value), "Enter a valid Indian mobile number")

export const registrationDetailsSchema = z.object({
  fullName: z.string().trim().min(2, "Enter the delegate's full name").max(120),
  email: emailSchema,
  phone: phoneSchema,
  participantRole: z.string().refine(isParticipantRole, "Select whether you are a Rotaractor, a Rotarian, or a DRR Designate."),
  rotaryId: z.string().trim().min(4, "Enter your Rotary ID.").max(40, "Enter your Rotary ID.").regex(/^[A-Za-z0-9][A-Za-z0-9 -]*$/, "Enter your Rotary ID."),
  club: z.string().trim().refine(isDistrictClub, "Select a Rotaract club"),
  designation: z.string().trim().min(2, "Enter your club position.").max(120),
  districtZone: z.string().trim().refine(isDistrictZone, "Select a zone."),
  tshirtSize: z.string().refine(isTshirtSize, "Select a T-shirt size."),
  emergencyContactName: z.string().trim().max(120).optional().default(""),
  emergencyContactPhone: z.string().trim().optional().default(""),
  dietaryPreference: z.string().trim().max(80).optional().default(""),
  accommodationPreference: z.string().trim().max(160).optional().default(""),
  councilMember: z.boolean().optional().default(false),
  councilPosition: z.string().trim().max(160).optional().default(""),
}).superRefine((value, context) => {
  if (value.councilMember && !isCouncilPosition(value.councilPosition)) {
    context.addIssue({ code: "custom", message: "Select your council position.", path: ["councilPosition"] })
  }
})

export type RegistrationDetails = z.input<typeof registrationDetailsSchema>

export const consentSchema = z.object({
  terms: z.literal(true, { error: "Accept the Terms and Conditions to continue." }),
  privacy: z.literal(true, { error: "Accept the Privacy Policy to continue." }),
  refunds: z.literal(true, { error: "Accept the Refund and Cancellation Policy to continue." }),
  guidelines: z.literal(true, { error: "Accept the event guidelines to continue." }),
})

export const interestSchema = z.object({
  email: emailSchema,
  topic: z.enum(["speakers", "sponsors", "venue"]),
  companyWebsite: z.string().max(0).optional().default(""),
})

export const contactSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: emailSchema,
  subject: z.string().trim().min(3).max(160),
  message: z.string().trim().min(10).max(4000),
  companyWebsite: z.string().max(0).optional().default(""),
})

export const sponsorshipSchema = z.object({
  organisation: z.string().trim().min(2).max(160),
  name: z.string().trim().min(2).max(120),
  email: emailSchema,
  phone: phoneSchema,
  message: z.string().trim().min(10).max(4000),
  companyWebsite: z.string().max(0).optional().default(""),
})

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(8, "Password must be at least 8 characters").max(200),
})

export function fieldRequirementsMet(
  input: z.infer<typeof registrationDetailsSchema>,
  requirements: {
    designation: boolean
    districtZone: boolean
    emergencyContact: boolean
    dietary: boolean
    accommodation: boolean
  },
): string | null {
  if (!input.designation) return "Enter your club position."
  if (!input.districtZone) return "Select a zone."
  if (requirements.emergencyContact && !input.emergencyContactName) return "Emergency contact name is required."
  if (requirements.emergencyContact) {
    const phone = phoneSchema.safeParse(input.emergencyContactPhone)
    if (!phone.success) return "Enter a valid emergency contact number."
  }
  if (requirements.dietary && !input.dietaryPreference) return "Dietary preference is required."
  if (requirements.accommodation && !input.accommodationPreference) return "Accommodation preference is required."
  return null
}
