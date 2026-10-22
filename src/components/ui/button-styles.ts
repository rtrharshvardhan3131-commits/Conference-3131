export type ButtonVariant = "primary" | "secondary" | "ghost"

const focus =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-cranberry"

const variants: Record<ButtonVariant, string> = {
  primary: "bg-cranberry text-white hover:bg-cranberry-deep disabled:bg-line disabled:text-slate",
  secondary: "border border-ink bg-paper text-ink hover:border-cranberry hover:text-cranberry disabled:border-line disabled:text-slate",
  ghost: "bg-transparent text-ink hover:text-cranberry disabled:text-slate",
}

export function buttonClassName(variant: ButtonVariant = "primary"): string {
  return `inline-flex min-h-[var(--spacing-tap)] items-center justify-center px-4 text-base font-semibold disabled:cursor-not-allowed ${focus} ${variants[variant]}`
}
