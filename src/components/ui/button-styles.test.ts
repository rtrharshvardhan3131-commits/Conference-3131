import { describe, expect, it } from "vitest"
import { buttonClassName } from "@/components/ui/button-styles"

describe("button styles", () => {
  it("keeps every variant at the 44px tap size with 16px text and a focus ring", () => {
    for (const variant of ["primary", "secondary", "ghost"] as const) {
      const classes = buttonClassName(variant)
      expect(classes).toContain("min-h-[var(--spacing-tap)]")
      expect(classes).toContain("text-base")
      expect(classes).toContain("focus-visible:outline-cranberry")
    }
  })

  it("puts white text on cranberry for the primary action", () => {
    expect(buttonClassName("primary")).toContain("bg-cranberry")
    expect(buttonClassName("primary")).toContain("text-white")
  })
})
