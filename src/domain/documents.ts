export const REGISTRATION_DOCUMENT_MAX_BYTES = 5 * 1024 * 1024

const EXTENSIONS = {
  jpg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  pdf: "application/pdf",
} as const

export type RegistrationDocumentKind = keyof typeof EXTENSIONS

export function inspectRegistrationDocument(bytes: Uint8Array): { mime: string; extension: RegistrationDocumentKind } | null {
  if (bytes.byteLength < 12 || bytes.byteLength > REGISTRATION_DOCUMENT_MAX_BYTES) return null
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return { mime: EXTENSIONS.jpg, extension: "jpg" }
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) return { mime: EXTENSIONS.png, extension: "png" }
  if (
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  ) {
    return { mime: EXTENSIONS.webp, extension: "webp" }
  }
  if (bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46) return { mime: EXTENSIONS.pdf, extension: "pdf" }
  return null
}

export function safeDownloadName(original: string, extension: RegistrationDocumentKind): string {
  const base = original.split(/[/\\]/).pop()?.replace(/\.[^.]+$/, "") ?? ""
  const cleaned = base.replace(/[^\w.\- ()]/g, "").trim().slice(0, 60)
  return `${cleaned || "document"}.${extension}`
}

export function registrationDocumentPath(registrationId: string, role: "government-id" | "payment-proof" | "photograph", extension: RegistrationDocumentKind): string {
  return `${registrationId}/${role}.${extension}`
}

export function mimeForRegistrationPath(path: string): string | null {
  const extension = path.split(".").pop()
  if (extension === "jpg" || extension === "png" || extension === "webp" || extension === "pdf") return EXTENSIONS[extension]
  return null
}
