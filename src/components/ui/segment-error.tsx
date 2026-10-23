"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ErrorState } from "@/components/ui/error-state"

export function SegmentError({
  reset,
  homeHref,
  homeLabel,
}: {
  reset: () => void
  homeHref: string
  homeLabel: string
}) {
  return (
    <div className="mx-auto w-full max-w-lg px-4 py-16">
      <ErrorState
        title="This page could not be opened"
        body="Try again. If it keeps happening, go back and open the page once more."
        action={
          <div className="flex flex-wrap justify-center gap-3">
            <Button type="button" onClick={reset}>Try again</Button>
            <Link href={homeHref} className="inline-flex min-h-11 items-center justify-center border border-ink bg-paper px-4 text-base font-semibold text-ink">
              {homeLabel}
            </Link>
          </div>
        }
      />
    </div>
  )
}
