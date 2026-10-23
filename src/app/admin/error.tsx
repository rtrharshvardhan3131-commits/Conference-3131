"use client"

import { SegmentError } from "@/components/ui/segment-error"

export default function AdminError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <SegmentError reset={reset} homeHref="/admin" homeLabel="Administration" />
}
