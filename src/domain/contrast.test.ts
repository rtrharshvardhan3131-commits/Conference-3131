import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"
import { CRANBERRY, CRANBERRY_DEEP, contrastRatio, cranberryPairsMeetAa, meetsAaText } from "@/domain/contrast"

describe("cranberry contrast", () => {
  it("keeps white text on the logo cranberry at WCAG AA", () => {
    expect(cranberryPairsMeetAa()).toBe(true)
    expect(contrastRatio("#ffffff", CRANBERRY)).toBeGreaterThanOrEqual(4.5)
    expect(contrastRatio("#ffffff", CRANBERRY_DEEP)).toBeGreaterThanOrEqual(4.5)
  })

  it("rejects a pale cranberry that would fail for normal text", () => {
    expect(meetsAaText("#ffffff", "#f3a4c0")).toBe(false)
  })

  it("publishes the same cranberry, radius, and tap size in the theme", () => {
    const theme = readFileSync(new URL("../app/globals.css", import.meta.url), "utf8")
    expect(theme).toContain(`--color-cranberry: ${CRANBERRY}`)
    expect(theme).toContain(`--color-cranberry-deep: ${CRANBERRY_DEEP}`)
    expect(theme).toContain("--radius-card: 0px")
    expect(theme).toContain("--spacing-tap: 2.75rem")
    expect(theme).toContain("font-size: 1rem")
  })
})
