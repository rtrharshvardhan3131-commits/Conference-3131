import Link from "next/link"
import type { PublicSite } from "@/domain/public-site"
import { DistrictLogo } from "@/components/public/district-logo"

const links = [
  ["About", "/about"],
  ["Agenda", "/agenda"],
  ["Venue", "/venue"],
  ["Sponsors", "/sponsors"],
  ["FAQ", "/faq"],
  ["Contact", "/contact"],
  ["Privacy Policy", "/privacy"],
  ["Terms and Conditions", "/terms"],
  ["Refund and Cancellation Policy", "/refunds"],
  ["Accessibility", "/accessibility"],
] as const

export function SiteFooter({ site }: { site: PublicSite }) {
  return (
    <footer className="mt-0 w-full max-w-full border-t-4 border-cranberry bg-navy text-ivory">
      <div className="container-summit grid min-w-0 gap-8 py-10 md:grid-cols-3 md:gap-10 md:py-12">
        <div>
          <DistrictLogo className="h-14 w-auto" />
          <p className="mt-4 font-serif text-2xl font-semibold">{site.event.name}</p>
          <p className="mt-2 text-sm font-semibold text-gold">{site.event.districtName}</p>
          <p className="mt-3 text-sm text-ivory/75">{site.event.subtitle}</p>
          <p className="mt-3 text-sm text-ivory/75">Host club announcement coming soon.</p>
        </div>
        <div>
          <p className="text-sm font-semibold">Visit</p>
          <ul className="mt-3 grid min-w-0 gap-2 md:grid-cols-2">
            {links.map(([label, href]) => (
              <li key={href} className="min-w-0">
                <Link href={href} className="block break-words text-sm text-ivory/75 hover:text-gold">
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="text-sm font-semibold">Contact</p>
          {site.event.publicEmail ? (
            <a className="mt-3 block text-sm text-magenta" href={`mailto:${site.event.publicEmail}`}>
              {site.event.publicEmail}
            </a>
          ) : (
            <p className="mt-3 text-sm text-ivory/75">A public mailbox will be published by the organising committee.</p>
          )}
          {site.event.publicPhone ? <p className="mt-2 text-sm">{site.event.publicPhone}</p> : null}
          {site.event.socialLinks.length > 0 ? (
            <ul className="mt-4 space-y-2">
              {site.event.socialLinks.map((link) => (
                <li key={link.url}>
                  <a href={link.url} className="text-sm text-magenta" rel="noreferrer">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </div>
      <div className="border-t border-ivory/10">
        <p className="container-summit py-4 text-sm text-ivory/60">
          © {site.event.rotaractYear} {site.event.districtName}. {site.event.name}.
        </p>
      </div>
    </footer>
  )
}
