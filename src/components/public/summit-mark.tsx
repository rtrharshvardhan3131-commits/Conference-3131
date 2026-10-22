import Image from "next/image"

export function SummitMark() {
  return (
    <div className="reign-stage">
      <Image
        src="/images/reign-logo.png"
        alt="REIGN. Rotaract Empowering Individuals for Growth and Networking. DRR Dr. Karishma Awari. RIY 2026–27, RID 3131."
        width={653}
        height={1024}
        priority
        sizes="(max-width: 1024px) 168px, 240px"
        className="reign-logo"
      />
    </div>
  )
}
