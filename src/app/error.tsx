"use client"

import { ErrorState } from "@/components/ui/error-state"
import { Button } from "@/components/ui/button"

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="grid min-h-screen place-items-center bg-ivory px-6">
      <div className="w-full max-w-lg">
        <ErrorState
          title="We'll be back shortly"
          body="The page could not be completed. Try again. If this continues, the conference team can look up the request in the server log."
          action={<Button type="button" onClick={reset}>Try again</Button>}
        />
      </div>
    </main>
  )
}
