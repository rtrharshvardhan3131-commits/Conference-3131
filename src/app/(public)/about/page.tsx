import type { Metadata } from "next"
import { DocumentPage } from "@/components/public/document-page"

export const metadata: Metadata = { title: "About" }

export default function AboutPage() {
  return <DocumentPage slug="about" />
}
