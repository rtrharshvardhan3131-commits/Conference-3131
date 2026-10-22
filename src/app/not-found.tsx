import Link from "next/link"
import { EmptyState } from "@/components/ui/empty-state"

export default function NotFound() {
  return (
    <main className="grid min-h-screen place-items-center bg-ivory px-6">
      <div className="w-full max-w-lg">
        <EmptyState
          title="This page is not on the programme."
          body="The address does not match a published page."
          action={<Link href="/" className="btn">Return home</Link>}
        />
      </div>
    </main>
  )
}
