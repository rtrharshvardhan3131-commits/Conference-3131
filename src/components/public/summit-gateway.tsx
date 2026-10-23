import { SummitMark } from "@/components/public/summit-mark"

const nucleus = { x: 500, y: 420 }

export function SummitGateway() {
  const { x, y } = nucleus

  return (
    <div className="orbit-slot">
      <div className="orbit-stage">
        <svg className="orbit-svg" viewBox="0 0 1000 1000" fill="none" aria-hidden="true">
          <defs>
            <radialGradient id="orbit-glow" cx="50%" cy="42%" r="46%">
              <stop offset="0%" stopColor="#d22163" stopOpacity="0.5" />
              <stop offset="46%" stopColor="#a41a4d" stopOpacity="0.16" />
              <stop offset="100%" stopColor="#070b14" stopOpacity="0" />
            </radialGradient>
          </defs>
          <circle cx={x} cy={y} r="380" fill="url(#orbit-glow)" />
          <g className="orbit-spin">
            <ellipse cx={x} cy={y} rx="430" ry="400" stroke="#c6a36b" strokeOpacity="0.7" transform={`rotate(-14 ${x} ${y})`} />
            <ellipse cx={x} cy={y} rx="400" ry="300" stroke="#d22163" strokeOpacity="0.9" strokeDasharray="9 16" transform={`rotate(26 ${x} ${y})`} />
            <ellipse cx={x} cy={y} rx="340" ry="250" stroke="#f6f1e7" strokeOpacity="0.45" transform={`rotate(-38 ${x} ${y})`} />
            <ellipse cx={x} cy={y} rx="450" ry="340" stroke="#c6a36b" strokeOpacity="0.9" strokeDasharray="2 190" transform={`rotate(12 ${x} ${y})`} />
            <circle cx={x} cy={y} r="132" stroke="#f6f1e7" strokeOpacity="0.22" />
          </g>
          <circle cx={x} cy={y} r="18" stroke="#f6f1e7" strokeOpacity="0.9" />
          <circle cx={x} cy={y} r="6" fill="#d22163" />
        </svg>
        <div className="orbit-logo">
          <SummitMark />
        </div>
        <p className="orbit-note">Conceptual gateway. Not the venue.</p>
      </div>
    </div>
  )
}
