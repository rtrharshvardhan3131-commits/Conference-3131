import { ImageResponse } from "next/og"

export const alt = "The SOVEREIGN Summit. Rotaract District 3131. 13–14 February 2027. Venue coming soon."
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#0c1424",
          color: "#f6f1e7",
          padding: "72px",
        }}
      >
        <div style={{ fontSize: 28, letterSpacing: 6, color: "#d22163" }}>ROTARACT DISTRICT 3131</div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 84, lineHeight: 1 }}>The SOVEREIGN Summit</div>
          <div style={{ marginTop: 24, fontSize: 36 }}>Two Days. One Summit. A District United.</div>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 28 }}>
          <div>13–14 February 2027</div>
          <div>Venue Coming Soon</div>
        </div>
      </div>
    ),
    { ...size },
  )
}
