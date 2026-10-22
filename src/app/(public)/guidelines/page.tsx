import type { Metadata } from "next"
import { DocumentPage } from "@/components/public/document-page"

export const metadata: Metadata = { title: "Event guidelines" }

export default function GuidelinesPage() {
  return <DocumentPage slug="guidelines" />
}
