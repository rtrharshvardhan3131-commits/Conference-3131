"use client"

import { SegmentError } from "@/components/ui/segment-error"

export default function PublicError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <SegmentError reset={reset} homeHref="/" homeLabel="Home" />
}
