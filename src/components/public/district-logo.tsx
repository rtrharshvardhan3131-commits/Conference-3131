import Image from "next/image"

export function DistrictLogo({ className, priority = false }: { className?: string; priority?: boolean }) {
  return (
    <Image
      src="/images/rotaract-district-3131.png"
      alt="Rotaract District 3131"
      width={778}
      height={283}
      priority={priority}
      sizes="(max-width: 1024px) 176px, 240px"
      className={className ?? "h-11 w-auto max-w-full"}
      style={{ width: "auto", maxWidth: "100%" }}
    />
  )
}
