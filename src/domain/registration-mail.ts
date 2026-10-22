export const REGISTRATION_FROM_ADDRESS = "rtr.harshvardhan3131@gmail.com"
export const REGISTRATION_FROM_NAME = "Rotaract District 3131"

export type RegistrationMail = {
  kind: "submitted" | "confirmed"
  name: string
  email: string
  phone: string
  role: string
  rotaryId: string
  tshirtSize: string
  club: string
  designation: string
  zone: string
  councilMember: boolean
  councilPosition: string
  reference: string
  slabName: string
  amountLabel: string
  loginPassword?: string
  loginUrl?: string
}

export function registrationMailSubject(mail: Pick<RegistrationMail, "kind" | "reference">): string {
  const title = mail.kind === "confirmed" ? "Registration confirmed" : "Registration received"
  return `${title} · ${mail.reference}`
}

export function registrationMailLines(mail: RegistrationMail): string[] {
  const lines = [
    mail.kind === "confirmed"
      ? "Your registration for The SOVEREIGN Summit is confirmed."
      : "Your registration for The SOVEREIGN Summit has been submitted. It is confirmed only after the finance team verifies the payment.",
    `Rotary ID: ${mail.reference}`,
    `Name: ${mail.name}`,
    `Email: ${mail.email}`,
    `Mobile: ${mail.phone}`,
    `Participant: ${mail.role}`,
    `T-shirt size: ${mail.tshirtSize}`,
    `Rotaract club: ${mail.club}`,
    `Club position: ${mail.designation}`,
    `Zone: ${mail.zone}`,
  ]
  if (mail.councilMember) lines.push(`Council position: ${mail.councilPosition}`)
  lines.push(`Slab: ${mail.slabName}`, `Amount: ${mail.amountLabel}`)
  if (mail.kind === "submitted" && mail.loginUrl && mail.loginPassword) {
    lines.push(
      "Your delegate login is ready. This password stays the same.",
      `Sign in: ${mail.loginUrl}`,
      `Password: ${mail.loginPassword}`,
    )
  } else if (mail.kind === "submitted" && mail.loginUrl) {
    lines.push(`Sign in at ${mail.loginUrl} with this email and your existing password.`)
  }
  lines.push("The conference is on 13–14 February 2027. Venue and programme details will appear on the website when they are approved.")
  return lines
}
