import type { Metadata } from "next"
import { DocumentPage } from "@/components/public/document-page"

export const metadata: Metadata = { title: "Terms and Conditions" }

export default function TermsPage() {
  return <DocumentPage slug="terms" />
}
