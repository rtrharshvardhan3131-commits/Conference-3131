import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react"

const control =
  "w-full border border-line bg-paper px-3 text-base text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-cranberry"

function describedBy(id: string, hint?: string, error?: string): string | undefined {
  const ids = [hint ? `${id}-hint` : "", error ? `${id}-error` : ""].filter(Boolean)
  return ids.length > 0 ? ids.join(" ") : undefined
}

function Notes({ id, hint, error }: { id: string; hint?: string; error?: string }) {
  return (
    <>
      {hint ? (
        <p id={`${id}-hint`} className="text-sm text-slate">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={`${id}-error`} className="text-sm text-cranberry" role="alert">
          {error}
        </p>
      ) : null}
    </>
  )
}

export function Field({ id, label, hint, error, children }: { id: string; label: string; hint?: string; error?: string; children: ReactNode }) {
  return (
    <div className="grid gap-2">
      <label htmlFor={id} className="text-sm font-medium text-ink">
        {label}
      </label>
      {children}
      <Notes id={id} hint={hint} error={error} />
    </div>
  )
}

type TextFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  id: string
  label: string
  hint?: string
  error?: string
}

export function TextField({ id, label, hint, error, className, ...props }: TextFieldProps) {
  return (
    <Field id={id} label={label} hint={hint} error={error}>
      <input
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, hint, error)}
        className={[control, error ? "border-cranberry" : "", className].filter(Boolean).join(" ")}
        {...props}
      />
    </Field>
  )
}

type SelectFieldProps = SelectHTMLAttributes<HTMLSelectElement> & {
  id: string
  label: string
  hint?: string
  error?: string
}

export function SelectField({ id, label, hint, error, className, children, ...props }: SelectFieldProps) {
  return (
    <Field id={id} label={label} hint={hint} error={error}>
      <select
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, hint, error)}
        className={[control, error ? "border-cranberry" : "", className].filter(Boolean).join(" ")}
        {...props}
      >
        {children}
      </select>
    </Field>
  )
}

type TextAreaFieldProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  id: string
  label: string
  hint?: string
  error?: string
}

export function TextAreaField({ id, label, hint, error, className, ...props }: TextAreaFieldProps) {
  return (
    <Field id={id} label={label} hint={hint} error={error}>
      <textarea
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, hint, error)}
        className={[control, "min-h-28 py-3", error ? "border-cranberry" : "", className].filter(Boolean).join(" ")}
        {...props}
      />
    </Field>
  )
}
