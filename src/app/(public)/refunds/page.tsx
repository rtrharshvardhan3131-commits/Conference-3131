import type { Metadata } from "next"
import { DocumentPage } from "@/components/public/document-page"

export const metadata: Metadata = { title: "Refund and Cancellation Policy" }

export default function RefundsPage() {
  return <DocumentPage slug="refunds" />
}
