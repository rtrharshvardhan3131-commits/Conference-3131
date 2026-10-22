import type { Metadata } from "next"
import { DocumentPage } from "@/components/public/document-page"

export const metadata: Metadata = { title: "Accessibility" }

export default function AccessibilityPage() {
  return <DocumentPage slug="accessibility" />
}
