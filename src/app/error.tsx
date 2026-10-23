"use client"

import Link from "next/link"
import { ErrorState } from "@/components/ui/error-state"
import { Button } from "@/components/ui/button"

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="grid min-h-screen place-items-center bg-ivory px-6">
      <div className="w-full max-w-lg">
        <ErrorState
          title="We'll be back shortly"
          body="The page could not be completed. Try again. If this continues, return home and open the page once more."
          action={
            <div className="flex flex-wrap justify-center gap-3">
              <Button type="button" onClick={reset}>Try again</Button>
              <Link href="/" className="inline-flex min-h-11 items-center justify-center border border-ink bg-paper px-4 text-base font-semibold text-ink">Home</Link>
            </div>
          }
        />
      </div>
    </main>
  )
}
