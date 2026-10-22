import Link from "next/link"
import { connection } from "next/server"
import type { PublicSlab } from "@/domain/public-site"
import { activeSlabs } from "@/domain/slabs"

export async function ActiveSlab({
  slabs,
  registrationOpen,
}: {
  slabs: PublicSlab[]
  registrationOpen: boolean
}) {
  await connection()
  // eslint-disable-next-line react-hooks/purity
  const serverNow = Date.now()
  const current = activeSlabs(
    slabs.map((slab) => ({ ...slab, status: "published" as const })),
    new Date(serverNow),
  )[0] ?? null
  const open = registrationOpen && current

  return (
    <div className="panel flex h-full min-w-0 flex-col px-6 py-8 md:px-8">
      {open ? (
        <>
          <h3 className="font-serif text-3xl">{current.name}</h3>
          <p className="mt-3 max-w-xl text-slate">{current.description}</p>
          <ul className="mt-4 space-y-1 text-sm text-ink">
            {current.benefits.map((benefit) => (
              <li key={benefit}>{benefit}</li>
            ))}
          </ul>
          <div className="mt-auto pt-8">
            <Link href="/register" className="btn inline-flex max-w-full text-center">
              Register for the Summit
            </Link>
          </div>
        </>
      ) : (
        <>
          <h3 className="font-serif text-3xl">Registration is closed</h3>
          <p className="mt-3 max-w-xl text-slate">There is no open registration slab. The action stays unavailable until an administrator publishes one.</p>
          <div className="mt-auto pt-8">
            <button type="button" disabled className="btn inline-flex">
              Register Now
            </button>
          </div>
        </>
      )}
    </div>
  )
}
