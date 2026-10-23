"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { beginCheckout, lookupDistrictMember, previewCoupon } from "@/app/actions/public"
import { Toast } from "@/components/ui/toast"
import { ClubCombobox } from "@/components/register/club-combobox"
import { prepareUpload } from "@/components/register/prepare-upload"
import { districtBankLines } from "@/content/district-bank"
import { suggestEmail } from "@/domain/experience"
import { formatInrFromPaise } from "@/domain/money"
import type { FieldRequirements, PublicSlab } from "@/domain/public-site"
import { COUNCIL_POSITIONS } from "@/domain/council-positions"
import { PARTICIPANT_ROLES, participantRoleLabel } from "@/domain/participant-role"
import { DISTRICT_ZONES } from "@/domain/zones"
import { TSHIRT_SIZES } from "@/domain/tshirt"
import { registrationDetailsSchema, type RegistrationDetails } from "@/domain/schemas"
import { activeSlabs, firstRegistrationSlab } from "@/domain/slabs"

type Details = RegistrationDetails

export function RegistrationWizard({
  slabs,
  registrationOpen,
  requirements,
  databaseReady,
  serverNow,
  policyVersion,
  paymentReviewNote,
}: {
  slabs: PublicSlab[]
  registrationOpen: boolean
  requirements: FieldRequirements
  databaseReady: boolean
  serverNow: string
  policyVersion: string
  paymentReviewNote: string
}) {
  const [reached, setReached] = useState(1)
  const [active, setActive] = useState(1)
  const skipScroll = useRef(true)
  const [slabId, setSlabId] = useState("")
  const [consent, setConsent] = useState({ terms: false, privacy: false, refunds: false, guidelines: false })
  const [message, setMessage] = useState("")
  const [pending, setPending] = useState(false)
  const [manualReference, setManualReference] = useState("")
  const [governmentId, setGovernmentId] = useState<File | null>(null)
  const [photograph, setPhotograph] = useState<File | null>(null)
  const [paymentProof, setPaymentProof] = useState<File | null>(null)
  const [governmentIdNote, setGovernmentIdNote] = useState("")
  const [photographNote, setPhotographNote] = useState("")
  const [paymentProofNote, setPaymentProofNote] = useState("")
  const [couponInput, setCouponInput] = useState("")
  const [couponNote, setCouponNote] = useState("")
  const [couponPending, setCouponPending] = useState(false)
  const [offer, setOffer] = useState<{ code: string; name: string; amountPaise: number; discountPaise: number; slabId: string } | null>(null)
  const [draftNotice, setDraftNotice] = useState(false)
  const [dirty, setDirty] = useState(false)
  const [memberNotice, setMemberNotice] = useState("")
  const [memberToast, setMemberToast] = useState("")
  const [memberLookup, setMemberLookup] = useState(false)
  const submitLock = useRef(false)
  const historySteps = useRef<number[]>([1])
  const leaving = useRef(false)
  const router = useRouter()
  const form = useForm<Details>({
    resolver: zodResolver(registrationDetailsSchema),
    shouldFocusError: false,
    defaultValues: { fullName: "", email: "", phone: "", participantRole: "", rotaryId: "", club: "", designation: "", districtZone: "", tshirtSize: "", emergencyContactName: "", emergencyContactPhone: "", dietaryPreference: "", accommodationPreference: "", councilMember: false, councilPosition: "" },
  })
  const councilMember = useWatch({ control: form.control, name: "councilMember" })
  const details = useWatch({ control: form.control })
  const lookupSerial = useRef(0)
  useEffect(() => {
    const id = (details.rotaryId ?? "").trim()
    if (id.length < 6) {
      setMemberNotice("")
      setMemberToast("")
      setMemberLookup(false)
      return
    }
    setMemberNotice("Make sure your Rotary ID is correct.")
    setMemberLookup(true)
    const serial = lookupSerial.current + 1
    lookupSerial.current = serial
    const timer = window.setTimeout(() => {
      void lookupDistrictMember(id).then((result) => {
        if (lookupSerial.current !== serial) return
        setMemberLookup(false)
        if (result.status === "one") {
          form.setValue("fullName", result.fullName, { shouldDirty: true, shouldValidate: true })
          form.setValue("participantRole", result.participantRole, { shouldDirty: true, shouldValidate: true })
          if (result.club) form.setValue("club", result.club, { shouldDirty: true, shouldValidate: true })
          if (result.zone) form.setValue("districtZone", result.zone, { shouldDirty: true, shouldValidate: true })
          setMemberToast("")
          return
        }
        if (result.status === "none") {
          setMemberToast("You are not added on the district website. Please fill in all the information.")
          return
        }
        if (result.status === "many") {
          setMemberToast("This Rotary ID matches more than one member. Check that it is yours, then fill in your details.")
        }
      }).catch(() => {
        if (lookupSerial.current !== serial) return
        setMemberLookup(false)
        setMemberToast("The district list could not be checked. You can still fill in your details.")
      })
    }, 600)
    return () => window.clearTimeout(timer)
  }, [details.rotaryId, form])
  const emailSuggestion = suggestEmail(details.email ?? "")
  useEffect(() => {
    if (skipScroll.current) {
      skipScroll.current = false
      return
    }
    document.getElementById(`register-step-${active}`)?.scrollIntoView({ behavior: "smooth", block: "start" })
  }, [active])
  useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY)
      if (!raw) return
      const saved = JSON.parse(raw) as { version?: number }
      if (saved.version === 1) setDraftNotice(true)
    } catch {
      try { localStorage.removeItem(DRAFT_KEY) } catch { /* The browser blocked storage. */ }
    }
  }, [])
  useEffect(() => {
    if (!dirty) return
    const id = window.setTimeout(() => {
      try {
        localStorage.setItem(DRAFT_KEY, JSON.stringify({ version: 1, details, consent, slabId, couponInput, manualReference }))
      } catch { /* The browser blocked storage. */ }
    }, 400)
    return () => window.clearTimeout(id)
  }, [dirty, details, consent, slabId, couponInput, manualReference])
  useEffect(() => {
    if (form.formState.isDirty) setDirty(true)
  }, [form.formState.isDirty])
  useEffect(() => {
    function onPop(event: PopStateEvent) {
      if (leaving.current || historySteps.current.length <= 1) return
      const step = event.state?.registerStep
      const current = historySteps.current.at(-1)
      if (typeof step === "number" && step === current) return
      if (typeof step === "number") {
        const index = historySteps.current.lastIndexOf(step)
        if (index === -1) return
        historySteps.current = historySteps.current.slice(0, index + 1)
        setActive(step)
        return
      }
      historySteps.current = [1]
      setActive(1)
    }
    window.addEventListener("popstate", onPop)
    return () => window.removeEventListener("popstate", onPop)
  }, [])
  function pushStep(next: number) {
    setReached((current) => Math.max(current, next))
    setActive(next)
    if (historySteps.current.at(-1) === next) return
    window.history.pushState({ registerStep: next }, "")
    historySteps.current.push(next)
  }
  function openNext(from: number) {
    pushStep(Math.min(from + 1, 4))
  }
  function retreat() {
    if (historySteps.current.length > 1) {
      window.history.back()
      return
    }
    setActive((current) => Math.max(1, current - 1))
  }
  function editStep(to: number) {
    const index = historySteps.current.lastIndexOf(to)
    if (index === -1) {
      setActive(to)
      return
    }
    const delta = historySteps.current.length - 1 - index
    if (delta <= 0) {
      setActive(to)
      return
    }
    window.history.go(-delta)
  }
  function continueFromDetails() {
    if (councilMember && firstSlab) {
      setSlabId(firstSlab.id)
      pushStep(3)
      return
    }
    openNext(1)
  }
  const openSlabs = activeSlabs(
    slabs.map((slab) => ({ ...slab, status: "published" as const })),
    new Date(serverNow),
  )
  const firstSlab = firstRegistrationSlab(slabs)
  const openSlab = openSlabs.find((slab) => slab.id === slabId) ?? openSlabs[0]
  const selected = councilMember && firstSlab ? firstSlab : openSlab
  const applied = offer && selected && offer.slabId === selected.id ? offer : null
  const payablePaise = applied?.amountPaise ?? selected?.pricePaise ?? 0

  async function applyCoupon() {
    if (!selected) return
    setCouponNote("")
    setCouponPending(true)
    let result: Awaited<ReturnType<typeof previewCoupon>>
    try {
      result = await previewCoupon({ code: couponInput, slabId: selected.id, councilMember: Boolean(councilMember) })
    } catch {
      setCouponPending(false)
      setOffer(null)
      setCouponNote("The offer could not be checked. Try the code again.")
      return
    }
    setCouponPending(false)
    if (!result.ok) {
      setOffer(null)
      setCouponNote(result.message)
      return
    }
    setOffer({ ...result.offer, slabId: selected.id })
  }

  function chooseSlab(id: string) {
    setSlabId(id)
    setOffer(null)
    setCouponNote("")
  }

  function restoreDraft() {
    try {
      const raw = localStorage.getItem(DRAFT_KEY)
      if (!raw) return
      const saved = JSON.parse(raw) as { details?: Details; consent?: typeof consent; slabId?: string; couponInput?: string; manualReference?: string }
      if (saved.details) form.reset(saved.details)
      if (saved.consent) setConsent(saved.consent)
      if (saved.slabId) setSlabId(saved.slabId)
      if (typeof saved.couponInput === "string") setCouponInput(saved.couponInput)
      if (typeof saved.manualReference === "string") setManualReference(saved.manualReference)
      setDirty(true)
    } catch { /* Keep the empty form. */ }
    setDraftNotice(false)
  }

  async function pay() {
    if (submitLock.current) return
    setMessage("")
    const governmentNote = documentNote(governmentId)
    const photographMissing = documentNote(photograph)
    const proofNote = documentNote(paymentProof)
    if (governmentNote || photographMissing || proofNote) {
      setGovernmentIdNote(governmentNote ?? "")
      setPhotographNote(photographMissing ?? "")
      setPaymentProofNote(proofNote ?? "")
      scrollToField(governmentNote ? "government-id" : photographMissing ? "photograph" : "payment-proof")
      return
    }
    submitLock.current = true
    setPending(true)
    const body = new FormData()
    body.set("details", JSON.stringify(form.getValues()))
    body.set("slabId", selected?.id ?? "")
    body.set("terms", String(consent.terms))
    body.set("privacy", String(consent.privacy))
    body.set("refunds", String(consent.refunds))
    body.set("guidelines", String(consent.guidelines))
    body.set("mode", "manual")
    body.set("manualReference", manualReference)
    body.set("couponCode", applied?.code ?? "")
    if (governmentId) body.set("governmentId", governmentId)
    if (photograph) body.set("photograph", photograph)
    if (paymentProof) body.set("paymentProof", paymentProof)
    try {
      const result = await beginCheckout(body)
      if (!result.ok) {
        submitLock.current = false
        setPending(false)
        setMessage(result.message)
        return
      }
      try { localStorage.removeItem(DRAFT_KEY) } catch { /* The draft can stay if storage is blocked. */ }
      const extra = historySteps.current.length - 1
      leaving.current = true
      if (extra > 0) {
        await new Promise<void>((resolve) => {
          function done() {
            window.removeEventListener("popstate", done)
            resolve()
          }
          window.addEventListener("popstate", done)
          window.history.go(-extra)
        })
      }
      router.push("/register/confirmation")
    } catch {
      submitLock.current = false
      setPending(false)
      setMessage("The registration could not be submitted. Your details are still here.")
    }
  }

  if (!databaseReady) {
    return (
      <div className="grid gap-4">
        <p className="panel p-8">Registration opens when the conference database is connected. Only the slab that is open today is shown. Checkout is not live.</p>
        {openSlabs.length === 0 ? <p className="font-serif text-4xl">Registration is closed.</p> : null}
        {openSlabs.map((slab) => (
          <article key={slab.id} className="panel p-5">
            <h2 className="font-serif text-3xl">{slab.name}</h2>
            <p className="mt-2">{formatInrFromPaise(slab.pricePaise)}</p>
            <p className="mt-3 text-slate">{slab.description}</p>
          </article>
        ))}
      </div>
    )
  }
  if (!registrationOpen) {
    return <p className="font-serif text-4xl">Registration is closed.</p>
  }
  if (openSlabs.length === 0) {
    return <p className="font-serif text-4xl">Registration is closed.</p>
  }

  const consentReady = consent.terms && consent.privacy && consent.refunds && consent.guidelines

  return (
    <div className="grid min-w-0 max-w-full gap-6 pb-24 lg:gap-4 lg:pb-0">
      <div>
        <div className="flex gap-1.5" aria-hidden="true">
          {[1, 2, 3, 4].map((step) => (
            <span key={step} className={`h-1 flex-1 ${step <= active ? "bg-cranberry" : "bg-line"}`} />
          ))}
        </div>
        <div className="mt-4 flex items-center justify-between gap-3">
          <p className="text-xs font-semibold tracking-[0.22em] text-cranberry uppercase">Step {active} of 4</p>
          {active > 1 ? (
            <button type="button" className="min-h-11 px-1 text-sm font-semibold text-navy underline lg:hidden" onClick={retreat}>
              Back
            </button>
          ) : null}
        </div>
        {active === 1 ? (
          <p className="mt-2 max-w-md text-base leading-relaxed text-ink">
            About 3 minutes. Have your Rotary ID, a government ID photo, a professional photograph, and your club name. You pay only after these details, then upload the screenshot.
          </p>
        ) : null}
      </div>
      {draftNotice ? (
        <div className="border border-line bg-ivory px-4 py-4" role="status">
          <p className="text-sm text-ink">Continue where you left off.</p>
          <div className="mt-3 flex gap-3">
            <button type="button" className="btn min-h-11 px-4" onClick={restoreDraft}>Continue</button>
            <button type="button" className="min-h-11 px-3 text-sm underline" onClick={() => { setDraftNotice(false); try { localStorage.removeItem(DRAFT_KEY) } catch { /* ignore */ } }}>Start again</button>
          </div>
        </div>
      ) : null}
      {message ? (
        <div role="alert" className="border border-red-800/30 bg-red-50 px-4 py-3 text-red-900">
          <p>{message}</p>
          <button type="button" className="mt-3 min-h-11 underline" onClick={() => void pay()}>Retry</button>
        </div>
      ) : null}
      <StepSection id={1} title="Details" open={active === 1} summary={oneLine([details.fullName, details.club, details.districtZone])} onEdit={active === 1 ? undefined : () => editStep(1)}>
        {active === 1 ? (
          <form
            className="grid gap-6"
            onSubmit={form.handleSubmit(() => {
              if (memberLookup) return
              const note = documentNote(governmentId)
              const photoNote = documentNote(photograph)
              if (note || photoNote) {
                setGovernmentIdNote(note ?? "")
                setPhotographNote(photoNote ?? "")
                scrollToField(note ? "government-id" : "photograph")
                return
              }
              setGovernmentIdNote("")
              setPhotographNote("")
              setMessage("")
              continueFromDetails()
            }, (errors) => {
              const name = detailFields.find((field) => errors[field])
              if (name) scrollToField(name)
            })}
            noValidate
          >
            <div className="grid gap-2">
              <Input label="Rotary ID" autoComplete="off" inputMode="numeric" error={quietFieldError(form.formState.errors.rotaryId?.message, details.rotaryId)} {...form.register("rotaryId")} />
              {memberLookup ? (
                <p className="flex items-center gap-3 border border-line bg-ivory px-3 py-3 text-sm leading-relaxed text-ink" role="status" aria-live="polite">
                  <span className="inline-block size-5 shrink-0 animate-spin rounded-full border-2 border-line border-t-cranberry" aria-hidden="true" />
                  Looking up this Rotary ID. Make sure it is correct.
                </p>
              ) : memberNotice ? (
                <p className="text-sm text-ink" role="status">{memberNotice}</p>
              ) : null}
            </div>
            <fieldset disabled={memberLookup} aria-busy={memberLookup || undefined} className="grid min-w-0 max-w-full gap-5 border-0 p-0">
            <Input label="Full name" autoComplete="name" disabled={memberLookup} error={quietFieldError(form.formState.errors.fullName?.message, details.fullName)} {...form.register("fullName")} />
            <Input label="Email" type="email" autoComplete="email" inputMode="email" disabled={memberLookup} error={quietFieldError(form.formState.errors.email?.message, details.email)} {...form.register("email")} />
            {emailSuggestion ? (
              <button type="button" className="min-h-11 text-left text-sm text-cranberry" disabled={memberLookup} onClick={() => form.setValue("email", emailSuggestion, { shouldValidate: true, shouldDirty: true })}>
                Did you mean {emailSuggestion}?
              </button>
            ) : null}
            <Input label="Mobile" autoComplete="tel" inputMode="tel" disabled={memberLookup} error={quietFieldError(form.formState.errors.phone?.message, details.phone)} {...form.register("phone")} />
            <SelectField label="Are you a?" disabled={memberLookup} error={quietFieldError(form.formState.errors.participantRole?.message, details.participantRole)} {...form.register("participantRole")}>
              <option value="">Select</option>
              {PARTICIPANT_ROLES.map((role) => (
                <option key={role.value} value={role.value}>{role.label}</option>
              ))}
            </SelectField>
            <ClubCombobox
              value={details.club ?? ""}
              disabled={memberLookup}
              error={quietFieldError(form.formState.errors.club?.message, details.club)}
              onChange={(club) => form.setValue("club", club, { shouldValidate: true, shouldDirty: true })}
            />
            <label className="flex min-h-12 items-center gap-3 border border-line bg-ivory px-3 text-base">
              <input
                type="checkbox"
                className="shrink-0"
                disabled={memberLookup}
                style={{ width: "1.25rem", height: "1.25rem", minHeight: "1.25rem", accentColor: "#0c1424" }}
                checked={councilMember}
                onChange={(event) => {
                  form.setValue("councilMember", event.target.checked, { shouldValidate: true })
                  if (!event.target.checked) form.setValue("councilPosition", "")
                }}
              />
              <span>I am a council member</span>
            </label>
            {councilMember ? (
              <SelectField label="Council position" disabled={memberLookup} error={quietFieldError(form.formState.errors.councilPosition?.message, details.councilPosition)} {...form.register("councilPosition")}>
                <option value="">Select your council position</option>
                {COUNCIL_POSITIONS.map((position) => (
                  <option key={position} value={position}>{position}</option>
                ))}
              </SelectField>
            ) : null}
            <Input label="Club position" disabled={memberLookup} error={quietFieldError(form.formState.errors.designation?.message, details.designation)} {...form.register("designation")} />
            <fieldset data-field="districtZone" disabled={memberLookup} className="grid scroll-mt-28 gap-2 border-0 p-0">
              <legend className="text-sm">Zone</legend>
              <div role="radiogroup" aria-label="Zone" className="grid grid-cols-2 gap-2">
                {DISTRICT_ZONES.map((zone) => (
                  <label key={zone} className="flex min-h-11 items-center gap-3 border border-line bg-paper px-3 text-base">
                    <input type="radio" value={zone} disabled={memberLookup} {...form.register("districtZone")} style={{ width: "1.25rem", height: "1.25rem", minHeight: "1.25rem", accentColor: "#0c1424" }} />
                    {zone}
                  </label>
                ))}
              </div>
              <FieldNote message={quietFieldError(form.formState.errors.districtZone?.message, details.districtZone)} />
            </fieldset>
            <SelectField label="T-shirt size" disabled={memberLookup} error={quietFieldError(form.formState.errors.tshirtSize?.message, details.tshirtSize)} {...form.register("tshirtSize")}>
              <option value="">Select a size</option>
              {TSHIRT_SIZES.map((size) => (
                <option key={size} value={size}>{size}</option>
              ))}
            </SelectField>
            <Input label={`Emergency contact name${requirements.emergencyContact ? "" : " (optional)"}`} autoComplete="name" disabled={memberLookup} {...form.register("emergencyContactName")} />
            <Input label={`Emergency contact number${requirements.emergencyContact ? "" : " (optional)"}`} autoComplete="tel" inputMode="tel" disabled={memberLookup} {...form.register("emergencyContactPhone")} />
            <Input label={`Dietary preference${requirements.dietary ? "" : " (optional)"}`} disabled={memberLookup} {...form.register("dietaryPreference")} />
            <Input label={`Accommodation preference${requirements.accommodation ? "" : " (optional)"}`} disabled={memberLookup} {...form.register("accommodationPreference")} />
          <FileField
            field="government-id"
            label="Government ID"
            hint="A photo or PDF of a government ID. JPG, PNG, WEBP, or PDF, up to 5 MB. Only the organising committee can open it."
            file={governmentId}
            disabled={memberLookup}
            error={governmentIdNote}
            onChange={(file) => {
              setGovernmentId(file)
              setGovernmentIdNote("")
            }}
          />
            <FileField
              field="photograph"
              label="Professional photograph"
              hint="A clear head-and-shoulders photo. JPG, PNG, or WEBP, up to 5 MB. Only the organising committee can open it."
              imagesOnly
              file={photograph}
              disabled={memberLookup}
              error={photographNote}
              onChange={(file) => {
                setPhotograph(file)
                setPhotographNote("")
              }}
            />
            <button className="register-next btn min-h-12 w-full text-base" disabled={memberLookup}>Next</button>
            </fieldset>
          </form>
        ) : null}
      </StepSection>
      {reached >= 2 ? (
        <StepSection id={2} title="Slab" open={active === 2} summary={selected ? (councilMember ? `First slab · ${selected.name}` : `${selected.name} · ${formatInrFromPaise(payablePaise)}`) : "Select a slab."} onEdit={active === 2 || councilMember ? undefined : () => editStep(2)}>
          {active === 2 ? (
            <div className="grid gap-4">
              {councilMember && firstSlab ? (
                <article className="border border-line bg-ivory p-4">
                  <p className="text-sm text-slate">First slab</p>
                  <p className="mt-1 font-serif text-2xl text-navy">{firstSlab.name}</p>
                </article>
              ) : null}
              {!councilMember ? openSlabs.map((slab) => (
                <label key={slab.id} className="flex gap-3 border border-line bg-ivory p-4">
                  <input type="radio" name="slab" className="mt-1 shrink-0" style={{ width: "1.25rem", height: "1.25rem", minHeight: "1.25rem", accentColor: "#0c1424" }} checked={(selected?.id ?? "") === slab.id} onChange={() => chooseSlab(slab.id)} />
                  <span>
                    <span className="font-serif text-2xl text-navy">{slab.name}</span>
                    <span className="mt-1 block text-lg">{formatInrFromPaise(slab.pricePaise)}</span>
                    <span className="mt-2 block text-sm text-slate">{slab.description}</span>
                  </span>
                </label>
              )) : null}
              <CouponField
                value={couponInput}
                note={couponNote}
                pending={couponPending}
                applied={applied}
                onChange={setCouponInput}
                onApply={() => void applyCoupon()}
                onClear={() => { setOffer(null); setCouponInput(""); setCouponNote("") }}
              />
              {selected ? <PriceBreakdown name={councilMember ? `First slab · ${selected.name}` : selected.name} pricePaise={selected.pricePaise} discountPaise={applied?.discountPaise ?? 0} payablePaise={payablePaise} council={Boolean(councilMember)} /> : null}
              <button type="button" className="register-next btn min-h-12 w-full text-base" disabled={!selected} onClick={() => { setDirty(true); if (selected) openNext(2) }}>Next</button>
            </div>
          ) : null}
        </StepSection>
      ) : null}
      {reached >= 3 && selected ? (
        <StepSection id={3} title="Consent" open={active === 3} summary={consentReady ? "Policies accepted." : "Policies still need to be accepted."} onEdit={active === 3 ? undefined : () => editStep(3)}>
          {active === 3 ? (
            <div className="grid gap-4">
              <div className="border border-line bg-ivory p-4">
                <p>{details.fullName} · {details.email}</p>
                <p className="mt-2">{participantRoleLabel(details.participantRole ?? "")} · {details.club}</p>
                {councilMember ? <p className="mt-2">Council · {details.councilPosition}</p> : null}
                {councilMember ? <CouponField value={couponInput} note={couponNote} pending={couponPending} applied={applied} onChange={(value) => { setDirty(true); setCouponInput(value) }} onApply={() => void applyCoupon()} onClear={() => { setOffer(null); setCouponInput(""); setCouponNote("") }} /> : null}
                {councilMember ? <p className="mt-4 text-sm text-slate">Council members register on the first slab, {selected.name}. That is the fee to transfer.</p> : null}
                <PriceBreakdown name={councilMember ? `First slab · ${selected.name}` : selected.name} pricePaise={selected.pricePaise} discountPaise={applied?.discountPaise ?? 0} payablePaise={payablePaise} council={Boolean(councilMember)} />
                <p className="mt-3 text-sm text-slate">Policy version {policyVersion}</p>
              </div>
              <Check label="I accept the Terms and Conditions." checked={consent.terms} onChange={(terms) => { setDirty(true); setConsent({ ...consent, terms }) }} href="/terms" />
              <Check label="I accept the Privacy Policy." checked={consent.privacy} onChange={(privacy) => { setDirty(true); setConsent({ ...consent, privacy }) }} href="/privacy" />
              <Check label="I accept the Refund and Cancellation Policy." checked={consent.refunds} onChange={(refunds) => { setDirty(true); setConsent({ ...consent, refunds }) }} href="/refunds" />
              <Check label="I accept the event guidelines." checked={consent.guidelines} onChange={(guidelines) => { setDirty(true); setConsent({ ...consent, guidelines }) }} href="/guidelines" />
              <button type="button" className="register-next btn min-h-12 w-full text-base" disabled={!consentReady} onClick={() => openNext(3)}>
                Next
              </button>
            </div>
          ) : null}
        </StepSection>
      ) : null}
      {reached >= 4 && selected ? (
        <StepSection id={4} title="Payment" open={active === 4} summary={paymentProof ? `${formatInrFromPaise(payablePaise)} · screenshot added` : `${formatInrFromPaise(payablePaise)} · screenshot not added yet`} onEdit={active === 4 ? undefined : () => editStep(4)}>
          {active === 4 ? (
            <div className="grid gap-4">
              <ol className="grid gap-2 text-sm text-ink">
                <li>1. Transfer {formatInrFromPaise(payablePaise)} to the district account.</li>
                <li>2. Upload the payment screenshot.</li>
                <li>3. Wait for finance to confirm it.</li>
              </ol>
              <p className="text-sm text-slate">{paymentReviewNote}</p>
              {applied ? <p className="text-sm text-slate">{applied.name} applied. {formatInrFromPaise(applied.discountPaise)} is taken off the open fee.</p> : null}
              <CopyRow label="Amount to transfer" value={formatInrFromPaise(payablePaise)} />
              <dl className="border border-line bg-ivory px-4">
                {districtBankLines().map((line) => (
                  <div key={line.label} className="grid min-w-0 gap-1 border-b border-line py-3 last:border-b-0">
                    <dt className="text-sm text-slate">{line.label}</dt>
                    <dd className="flex min-w-0 items-center justify-between gap-3 break-words text-navy">{line.value || "Not published"}{line.value ? <CopyButton value={line.value} /> : null}</dd>
                  </div>
                ))}
              </dl>
              <p className="text-sm text-slate">Transfer only to the account shown here. A screenshot does not confirm the registration.</p>
              <FileField
                field="payment-proof"
                label="Payment screenshot"
                hint="A screenshot of the online payment. JPG, PNG, WEBP, or PDF, up to 5 MB."
                file={paymentProof}
                error={paymentProofNote}
                onChange={(file) => {
                  setPaymentProof(file)
                  setPaymentProofNote("")
                }}
              />
              <label className="grid gap-2 text-sm">
                UTR or transaction reference, if you have one
                <input value={manualReference} onChange={(event) => { setDirty(true); setManualReference(event.target.value) }} className="border border-line bg-ivory px-3 py-3 text-base" />
              </label>
              <button type="button" disabled={pending} className="register-next btn min-h-12 w-full text-base" onClick={() => pay()}>
                {pending ? "Submitting…" : "Submit for finance review"}
              </button>
            </div>
          ) : null}
        </StepSection>
      ) : null}
      {memberToast ? <Toast onDismiss={() => setMemberToast("")}>{memberToast}</Toast> : null}
    </div>
  )
}

function StepSection({ id, title, open, summary, onEdit, children }: { id: number; title: string; open: boolean; summary: string; onEdit?: () => void; children: React.ReactNode }) {
  return (
    <section id={`register-step-${id}`} className={`scroll-mt-28 ${open ? "bg-transparent" : "hidden border border-line bg-paper lg:block"}`}>
      <div className={`flex items-center justify-between gap-3 ${open ? "pb-1" : "border-b border-line px-4 py-3"}`}>
        {onEdit ? (
          <button type="button" className="min-h-11 flex-1 text-left" onClick={onEdit}>
            <span className="font-serif text-2xl text-navy">0{id} {title}</span>
            <span className="mt-1 block truncate text-sm text-slate">{summary}</span>
          </button>
        ) : (
          <h2 className="font-serif text-3xl text-navy lg:text-2xl lg:text-gold">{title}</h2>
        )}
        {onEdit ? (
          <button type="button" className="min-h-11 shrink-0 px-3 text-sm underline decoration-gold" onClick={onEdit}>
            Edit
          </button>
        ) : null}
      </div>
      {open ? <div className="pt-2 lg:p-4">{children}</div> : null}
    </section>
  )
}

function CouponField({
  value,
  note,
  pending,
  applied,
  onChange,
  onApply,
  onClear,
}: {
  value: string
  note: string
  pending: boolean
  applied: { name: string; amountPaise: number; discountPaise: number } | null
  onChange: (value: string) => void
  onApply: () => void
  onClear: () => void
}) {
  return (
    <div className="grid gap-3 border border-line bg-paper p-4">
      <div>
        <p className="text-sm font-semibold text-navy">Coupon code</p>
        <p className="mt-1 text-sm text-slate">Optional. Leave this blank unless you have an offer code.</p>
      </div>
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          autoCapitalize="characters"
          autoCorrect="off"
          spellCheck={false}
          aria-label="Coupon code"
          className="min-h-12 w-full border border-line bg-ivory px-3 py-3"
        />
        <button type="button" className="inline-flex min-h-12 items-center justify-center border border-navy px-5 font-semibold" disabled={pending} onClick={onApply}>
          {pending ? "Checking…" : "Apply"}
        </button>
      </div>
      {applied ? (
        <p className="text-sm text-navy">
          Coupon applied, you save {formatInrFromPaise(applied.discountPaise)}. Transfer {formatInrFromPaise(applied.amountPaise)}.
          <button type="button" className="ml-3 underline decoration-gold underline-offset-4" onClick={onClear}>Remove</button>
        </p>
      ) : null}
      {note ? <p className="text-xs tracking-wide text-gold-deep">{note}</p> : null}
    </div>
  )
}

function oneLine(parts: Array<string | undefined>) {
  return parts.filter(Boolean).join(" · ")
}

const DRAFT_KEY = "sovereign-summit-registration-draft"

function PriceBreakdown({ name, pricePaise, discountPaise, payablePaise, council }: { name: string; pricePaise: number; discountPaise: number; payablePaise: number; council: boolean }) {
  return (
    <div className="grid gap-2 border border-line bg-paper p-4 text-sm">
      {council ? <p className="text-slate">Council registration uses the Early Bird fee, shown here as the amount to transfer.</p> : null}
      <dl className="grid gap-2">
      <div className="flex justify-between gap-4"><dt>Slab</dt><dd>{name}</dd></div>
      <div className="flex justify-between gap-4"><dt>Fee</dt><dd>{formatInrFromPaise(pricePaise)}</dd></div>
      <div className="flex justify-between gap-4"><dt>Discount</dt><dd>{discountPaise > 0 ? formatInrFromPaise(discountPaise) : "None"}</dd></div>
      <div className="flex justify-between gap-4 font-semibold"><dt>Amount to transfer</dt><dd>{formatInrFromPaise(payablePaise)}</dd></div>
      </dl>
    </div>
  )
}

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      type="button"
      className="min-h-11 px-2 text-sm underline"
      onClick={() => {
        void navigator.clipboard.writeText(value).then(() => {
          setCopied(true)
          window.setTimeout(() => setCopied(false), 1500)
        }).catch(() => setCopied(false))
      }}
    >
      {copied ? "Copied" : "Copy"}
    </button>
  )
}

function CopyRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 border border-line bg-ivory px-4 py-2">
      <p><span className="text-sm text-slate">{label}</span><span className="mt-1 block font-semibold">{value}</span></p>
      <CopyButton value={value} />
    </div>
  )
}

function SelectField({ label, error, children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement> & { label: string; error?: string }) {
  return (
    <label data-field={props.name} className="grid scroll-mt-28 gap-2 text-sm">
      {label}
      <select {...props} aria-invalid={error ? true : undefined} className={`w-full border bg-paper px-3 py-3 text-base disabled:cursor-not-allowed disabled:bg-ivory ${error ? "border-gold-deep" : "border-line"}`}>
        {children}
      </select>
      <FieldNote message={error} />
    </label>
  )
}

function Input({ label, error, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label: string; error?: string }) {
  return (
    <label data-field={props.name} className="grid scroll-mt-28 gap-2 text-sm">
      {label}
      <input {...props} aria-invalid={error ? true : undefined} className={`w-full border bg-paper px-3 py-3 text-base disabled:cursor-not-allowed disabled:bg-ivory ${error ? "border-gold-deep" : "border-line"}`} />
      <FieldNote message={error} />
    </label>
  )
}

function FileField({ field, label, hint, file, error, imagesOnly = false, disabled = false, onChange }: { field: string; label: string; hint: string; file: File | null; error?: string; imagesOnly?: boolean; disabled?: boolean; onChange: (file: File | null) => void }) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [progress, setProgress] = useState<number | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [localError, setLocalError] = useState("")
  useEffect(() => {
    if (!file || !file.type.startsWith("image/")) {
      setPreview(null)
      return
    }
    const url = URL.createObjectURL(file)
    setPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [file])
  return (
    <div data-field={field} className="grid scroll-mt-28 gap-2 text-sm">
      <label htmlFor={field} className="text-sm">{label}</label>
      <input
        ref={inputRef}
        id={field}
        type="file"
        accept={imagesOnly ? "image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp" : "image/jpeg,image/png,image/webp,application/pdf,.jpg,.jpeg,.png,.webp,.pdf"}
        aria-invalid={error || localError ? true : undefined}
        disabled={disabled}
        className={`w-full min-w-0 max-w-full border bg-paper px-3 py-3 text-base file:mr-3 file:border-0 file:bg-navy file:px-3 file:py-2 file:text-sm file:text-ivory disabled:cursor-not-allowed disabled:bg-ivory ${error || localError ? "border-gold-deep" : "border-line"}`}
        onChange={(event) => {
          const next = event.target.files?.[0] ?? null
          if (!next) {
            onChange(null)
            setProgress(null)
            return
          }
          if (imagesOnly && (next.type === "application/pdf" || next.name.toLowerCase().endsWith(".pdf"))) {
            onChange(null)
            setLocalError("Upload a JPG, PNG, or WEBP photograph.")
            if (inputRef.current) inputRef.current.value = ""
            return
          }
          setLocalError("")
          void prepareUpload(next, setProgress).then((prepared) => onChange(prepared)).catch((reason: unknown) => {
            onChange(null)
            setProgress(null)
            setLocalError(reason instanceof Error ? reason.message : "Use a file under 5 MB.")
            if (inputRef.current) inputRef.current.value = ""
          })
        }}
      />
      {progress !== null && progress < 100 ? (
        <div role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress} className="h-2 bg-line">
          <div className="h-2 bg-cranberry" style={{ width: `${progress}%` }} />
        </div>
      ) : null}
      {preview ? <img src={preview} alt="" className="max-h-40 w-auto border border-line" /> : null}
      <FieldNote message={localError || error} />
      <span className="text-slate">{hint}{imagesOnly ? " Use your camera or photo library. Images are reduced toward 1.5 MB." : " Use your camera or photo library. Images are reduced toward 1.5 MB. PDF is allowed up to 5 MB."}</span>
      {file ? (
        <button type="button" className="min-h-11 text-left underline" onClick={() => { onChange(null); setProgress(null); if (inputRef.current) inputRef.current.value = "" }}>
          Remove {file.name}
        </button>
      ) : null}
    </div>
  )
}

function FieldNote({ message }: { message?: string }) {
  if (!message) return null
  return <span className="text-xs tracking-wide text-gold-deep" role="alert">{message}</span>
}

const detailFields = ["rotaryId", "fullName", "email", "phone", "participantRole", "club", "councilPosition", "designation", "districtZone", "tshirtSize"] as const

function quietFieldError(message: string | undefined, value: string | undefined) {
  if (!message) return undefined
  if (!value?.trim()) return "Required"
  return message
}

function scrollToField(name: string) {
  window.setTimeout(() => {
    const field = document.querySelector<HTMLElement>(`[data-field="${name}"]`)
    field?.scrollIntoView({ behavior: "smooth", block: "center" })
    field?.querySelector<HTMLElement>("input, select, textarea")?.focus({ preventScroll: true })
  }, 40)
}

function documentNote(file: File | null) {
  if (!file || file.size === 0) return "Required"
  if (file.size > 5 * 1024 * 1024) return "Use a file under 5 MB."
  return null
}

function Check({ label, checked, onChange, href }: { label: string; checked: boolean; onChange: (value: boolean) => void; href: string }) {
  return (
    <label className="flex min-h-12 items-center gap-3 border border-line bg-paper px-3 text-base">
      <input type="checkbox" style={{ width: "1.25rem", height: "1.25rem", minHeight: "1.25rem", accentColor: "#0c1424" }} checked={checked} onChange={(event) => onChange(event.target.checked)} />
      <span>{label} <a className="underline decoration-gold" href={href} target="_blank" rel="noopener noreferrer">Read</a></span>
    </label>
  )
}
