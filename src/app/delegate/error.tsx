"use client"

import { SegmentError } from "@/components/ui/segment-error"

export default function DelegateError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <SegmentError reset={reset} homeHref="/delegate" homeLabel="Delegate portal" />
}
