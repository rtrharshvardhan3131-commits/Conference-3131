import type { Metadata } from "next"
import { DocumentPage } from "@/components/public/document-page"

export const metadata: Metadata = { title: "Privacy Policy" }

export default function PrivacyPage() {
  return <DocumentPage slug="privacy" />
}
