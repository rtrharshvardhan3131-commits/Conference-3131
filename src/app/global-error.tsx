"use client"

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, background: "#f6f1e7", color: "#172033", fontFamily: "Georgia, serif" }}>
        <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: "1.5rem" }}>
          <div style={{ maxWidth: "28rem", textAlign: "center" }}>
            <h1 style={{ fontSize: "2rem", fontWeight: 500 }}>The page could not be opened</h1>
            <p style={{ lineHeight: 1.6 }}>Try again. If this continues, return to the summit home page.</p>
            <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center", marginTop: "1.5rem" }}>
              <button type="button" onClick={reset} style={{ minHeight: "2.75rem", padding: "0 1rem", background: "#d22163", color: "#fff", border: 0, font: "inherit" }}>
                Try again
              </button>
              <a href="/" style={{ minHeight: "2.75rem", display: "inline-flex", alignItems: "center", padding: "0 1rem", color: "#172033" }}>
                Home
              </a>
            </div>
          </div>
        </main>
      </body>
    </html>
  )
}
