"use client"

import { useEffect, useRef, useState } from "react"
import { checkIn } from "@/app/actions/admin"

export type DeskRegistration = {
  reference: string
  full_name: string
  club: string | null
  status: string
  checked_in_at: string | null
}

const STORAGE_KEY = "ss_desk_registrations"

const notices: Record<string, string> = {
  "checked-in": "Checked in. The server recorded the arrival.",
  missing: "No registration matched that reference.",
  already: "This reference is already checked in.",
  exception: "Payment is not confirmed. Add an exception reason of at least 8 characters.",
}

export function CheckInDesk({
  rows,
  reference,
  notice,
}: {
  rows: DeskRegistration[]
  reference: string
  notice: string
}) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [query, setQuery] = useState(reference)
  const [camera, setCamera] = useState("")
  const [live, setLive] = useState(false)
  const [offlineRows, setOfflineRows] = useState<DeskRegistration[]>([])
  const [offlineNote, setOfflineNote] = useState("")

  useEffect(() => {
    if (rows.length > 0) localStorage.setItem(STORAGE_KEY, JSON.stringify(rows))
  }, [rows])

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((track) => track.stop())
    }
  }, [])

  function loadSavedList() {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) {
      setOfflineNote("No registration list has been downloaded on this phone yet.")
      return
    }
    try {
      const parsed = JSON.parse(stored) as DeskRegistration[]
      if (!Array.isArray(parsed) || parsed.length === 0) {
        setOfflineNote("No registration list has been downloaded on this phone yet.")
        return
      }
      setOfflineRows(parsed)
      setOfflineNote("Showing the last list downloaded on this phone. Confirming a check-in still needs the server.")
    } catch {
      localStorage.removeItem(STORAGE_KEY)
      setOfflineNote("The saved list on this phone could not be read.")
    }
  }

  async function startCamera() {
    setCamera("")
    const Detector = (window as unknown as {
      BarcodeDetector?: new (options: { formats: string[] }) => {
        detect: (source: HTMLVideoElement) => Promise<Array<{ rawValue: string }>>
      }
    }).BarcodeDetector
    if (!Detector || !navigator.mediaDevices || !videoRef.current) {
      setCamera("This browser cannot scan a code. Type the reference.")
      return
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } })
      streamRef.current = stream
      videoRef.current.srcObject = stream
      await videoRef.current.play()
      setLive(true)
      const detector = new Detector({ formats: ["qr_code"] })
      const watch = async () => {
        if (!videoRef.current || !streamRef.current) return
        const codes = await detector.detect(videoRef.current).catch(() => [])
        const value = codes[0]?.rawValue?.trim()
        if (value) {
          setQuery(value.toUpperCase())
          stream.getTracks().forEach((track) => track.stop())
          streamRef.current = null
          setLive(false)
          setCamera("Code read. Confirm the reference, then check in.")
          return
        }
        window.setTimeout(() => void watch(), 300)
      }
      void watch()
    } catch {
      setCamera("The camera could not start. Type the reference.")
    }
  }

  const list = rows.length > 0 ? rows : offlineRows
  const needle = query.trim().toLowerCase()
  const matches = needle.length < 2
    ? []
    : list.filter((row) =>
        row.reference.toLowerCase().includes(needle)
        || row.full_name.toLowerCase().includes(needle)
        || (row.club ?? "").toLowerCase().includes(needle),
      ).slice(0, 8)

  return (
    <div className="mt-8 grid gap-6">
      {notices[notice] ? <p className="border border-line bg-ivory px-4 py-3">{notices[notice]}</p> : null}
      {offlineNote ? <p className="text-sm text-slate">{offlineNote}</p> : null}
      <video ref={videoRef} className={live ? "w-full bg-navy" : "hidden"} playsInline muted />
      <button type="button" className="inline-flex min-h-12 items-center justify-center border border-navy px-4 font-semibold" onClick={() => void startCamera()}>
        Scan QR
      </button>
      {camera ? <p className="text-sm text-slate">{camera}</p> : null}
      <button type="button" className="inline-flex min-h-12 items-center justify-center border border-navy px-4 font-semibold" onClick={loadSavedList}>
        Use the list saved on this phone
      </button>
      <form action={checkIn} className="grid gap-4">
        <label className="grid gap-2">Rotary ID
          <input name="reference" value={query} onChange={(event) => setQuery(event.target.value)} className="border border-line px-3 py-4 text-lg" placeholder="10843281" />
        </label>
        <label className="grid gap-2 text-sm">Exception reason, only if payment is not confirmed
          <input name="exception_reason" className="border border-line px-3 py-3" />
        </label>
        <button className="inline-flex min-h-12 items-center justify-center bg-navy px-5 text-ivory">Check in</button>
      </form>
      {matches.length > 0 ? (
        <ul className="divide-y divide-line border-y border-line">
          {matches.map((row) => (
            <li key={row.reference}>
              <button type="button" className="grid w-full gap-1 py-3 text-left" onClick={() => setQuery(row.reference)}>
                <span className="font-semibold">{row.full_name}</span>
                <span className="text-sm text-slate">{row.reference} · {row.club || "No club"} · {row.status.replaceAll("_", " ")}{row.checked_in_at ? " · already in" : ""}</span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}
