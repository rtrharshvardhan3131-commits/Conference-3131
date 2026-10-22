import "server-only"
import {
  inspectRegistrationDocument,
  REGISTRATION_DOCUMENT_MAX_BYTES,
  registrationDocumentPath,
  safeDownloadName,
  type RegistrationDocumentKind,
} from "@/domain/documents"
import { createAdminClient } from "@/lib/supabase/admin"

export const REGISTRATION_DOCUMENT_BUCKET = "registration-documents"

export type StoredRegistrationDocument = {
  bytes: Uint8Array
  filename: string
  mime: string
  extension: RegistrationDocumentKind
}

export async function readRegistrationUpload(value: FormDataEntryValue | null, label: string): Promise<StoredRegistrationDocument> {
  if (!(value instanceof File) || value.size === 0) {
    throw new Error(`Upload a ${label} before submitting.`)
  }
  if (value.size > REGISTRATION_DOCUMENT_MAX_BYTES) {
    throw new Error("Each file must be 5 MB or smaller.")
  }
  const bytes = new Uint8Array(await value.arrayBuffer())
  const inspected = inspectRegistrationDocument(bytes)
  if (!inspected) throw new Error("Upload a JPG, PNG, WEBP, or PDF.")
  return {
    bytes,
    filename: safeDownloadName(value.name, inspected.extension),
    mime: inspected.mime,
    extension: inspected.extension,
  }
}

export async function readPhotographUpload(value: FormDataEntryValue | null): Promise<StoredRegistrationDocument> {
  const document = await readRegistrationUpload(value, "professional photograph")
  if (document.extension === "pdf") throw new Error("Upload a JPG, PNG, or WEBP photograph.")
  return document
}

export async function storeRegistrationDocument(
  registrationId: string,
  role: "government-id" | "payment-proof" | "photograph",
  document: StoredRegistrationDocument,
): Promise<string> {
  const admin = createAdminClient()
  const path = registrationDocumentPath(registrationId, role, document.extension)
  const { error } = await admin.storage.from(REGISTRATION_DOCUMENT_BUCKET).upload(path, Buffer.from(document.bytes), {
    contentType: document.mime,
    upsert: false,
  })
  if (error) throw new Error("The files could not be saved. Please try again.")
  return path
}

export async function discardRegistrationDocuments(registrationId: string) {
  const admin = createAdminClient()
  const { data } = await admin.storage.from(REGISTRATION_DOCUMENT_BUCKET).list(registrationId)
  const paths = (data ?? []).map((file) => `${registrationId}/${file.name}`)
  if (paths.length > 0) await admin.storage.from(REGISTRATION_DOCUMENT_BUCKET).remove(paths)
  await admin.from("registrations").delete().eq("id", registrationId)
}
