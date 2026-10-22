import type { ButtonHTMLAttributes } from "react"
import { buttonClassName, type ButtonVariant } from "@/components/ui/button-styles"

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant
}

export function Button({ variant = "primary", className, type = "button", ...props }: ButtonProps) {
  return <button type={type} className={[buttonClassName(variant), className].filter(Boolean).join(" ")} {...props} />
}
