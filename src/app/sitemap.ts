import type { MetadataRoute } from "next"
import { appUrl } from "@/lib/env"

export default function sitemap(): MetadataRoute.Sitemap {
  const base = appUrl()
  return ["", "/about", "/agenda", "/speakers", "/venue", "/sponsors", "/faq", "/contact", "/register", "/privacy", "/terms", "/refunds", "/accessibility", "/guidelines"].map((path) => ({
    url: `${base}${path || "/"}`,
    changeFrequency: "weekly",
    priority: path === "" ? 1 : 0.7,
  }))
}
