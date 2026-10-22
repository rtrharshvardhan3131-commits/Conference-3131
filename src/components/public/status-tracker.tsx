import { registrationStage } from "@/domain/experience"

const steps = ["Submitted", "Payment under review", "Confirmed"] as const

export function StatusTracker({ status }: { status: string }) {
  const stage = registrationStage(status)
  const current = stage === "confirmed" ? 2 : stage === "closed" ? 1 : 1
  return (
    <ol className="grid gap-3" aria-label="Registration progress">
      {steps.map((label, index) => {
        const done = stage === "confirmed" ? true : index < current
        const active = stage !== "confirmed" && stage !== "closed" && index === current
        return (
          <li key={label} className="flex min-h-11 items-center gap-3" aria-current={active ? "step" : undefined}>
            <span className={`inline-flex h-8 w-8 items-center justify-center border text-sm ${done || active ? "border-cranberry bg-cranberry text-white" : "border-line text-slate"}`}>
              {index + 1}
            </span>
            <span className={done || active ? "font-semibold text-ink" : "text-slate"}>{label}</span>
          </li>
        )
      })}
    </ol>
  )
}
