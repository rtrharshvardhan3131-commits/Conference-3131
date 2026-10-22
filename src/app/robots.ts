import type { MetadataRoute } from "next"
import { appUrl } from "@/lib/env"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/admin", "/delegate", "/api", "/register/confirmation", "/register/status"] },
    sitemap: `${appUrl()}/sitemap.xml`,
  }
}
