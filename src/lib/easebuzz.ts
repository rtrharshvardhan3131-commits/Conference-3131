import { createHash, timingSafeEqual } from "node:crypto"

/**
 * Easebuzz Payment Gateway helpers.
 *
 * Official docs: https://docs.easebuzz.in/
 * Reference kit (hash sequences): https://github.com/easebuzz/paywitheasebuzz-php-lib
 * Initiate: POST {payBase}/payment/initiateLink
 * Hosted page: {payBase}/pay/{access_key}
 * Retrieve: POST {dashboardBase}/transaction/v2/retrieve
 * Request hash: key|txnid|amount|productinfo|firstname|email|udf1..udf10|salt
 * Response hash: salt|status|udf10..udf1|email|firstname|productinfo|amount|txnid|key
 * Retrieve hash: key|txnid|salt
 */

function read(name: string): string | undefined {
  const value = process.env[name]
  if (!value || value.trim().length === 0) return undefined
  return value.trim()
}

export type EasebuzzEnv = "test" | "prod"

export type EasebuzzCredentials = {
  key: string
  salt: string
  env: EasebuzzEnv
}

export type EasebuzzInitiateFields = {
  txnid: string
  amount: string
  productinfo: string
  firstname: string
  email: string
  phone: string
  surl: string
  furl: string
  udf1?: string
  udf2?: string
  udf3?: string
  udf4?: string
  udf5?: string
  udf6?: string
  udf7?: string
  udf8?: string
  udf9?: string
  udf10?: string
}

export type EasebuzzCallbackPayload = {
  status: string
  txnid: string
  amount: string
  productinfo: string
  firstname: string
  email: string
  hash: string
  key?: string
  easepayid?: string
  bank_ref_num?: string
  mode?: string
  error?: string
  error_Message?: string
  udf1?: string
  udf2?: string
  udf3?: string
  udf4?: string
  udf5?: string
  udf6?: string
  udf7?: string
  udf8?: string
  udf9?: string
  udf10?: string
  [key: string]: string | undefined
}

export type EasebuzzRetrieveResult = {
  ok: boolean
  status: string
  txnid: string
  amount: string
  easepayid: string | null
  mode: string | null
  bankRefNum: string | null
  raw: Record<string, unknown>
}

const REQUEST_HASH_FIELDS = [
  "key",
  "txnid",
  "amount",
  "productinfo",
  "firstname",
  "email",
  "udf1",
  "udf2",
  "udf3",
  "udf4",
  "udf5",
  "udf6",
  "udf7",
  "udf8",
  "udf9",
  "udf10",
] as const

const RESPONSE_HASH_FIELDS = [
  "udf10",
  "udf9",
  "udf8",
  "udf7",
  "udf6",
  "udf5",
  "udf4",
  "udf3",
  "udf2",
  "udf1",
  "email",
  "firstname",
  "productinfo",
  "amount",
  "txnid",
  "key",
] as const

export function isEasebuzzConfigured(): boolean {
  return Boolean(read("EASEBUZZ_KEY") && read("EASEBUZZ_SALT"))
}

export function easebuzzCredentials(): EasebuzzCredentials {
  const key = read("EASEBUZZ_KEY")
  const salt = read("EASEBUZZ_SALT")
  if (!key || !salt) throw new Error("APP:payment_unconfigured")
  const env = read("EASEBUZZ_ENV") === "prod" ? "prod" : "test"
  return { key, salt, env }
}

export function easebuzzPayBaseUrl(env: EasebuzzEnv = easebuzzCredentials().env): string {
  return env === "prod" ? "https://pay.easebuzz.in/" : "https://testpay.easebuzz.in/"
}

export function easebuzzDashboardBaseUrl(env: EasebuzzEnv = easebuzzCredentials().env): string {
  return env === "prod" ? "https://dashboard.easebuzz.in/" : "https://testdashboard.easebuzz.in/"
}

export function siteUrl(): string {
  return read("NEXT_PUBLIC_SITE_URL") ?? read("NEXT_PUBLIC_APP_URL") ?? "http://localhost:3000"
}

export function sha512(value: string): string {
  return createHash("sha512").update(value, "utf8").digest("hex").toLowerCase()
}

export function paiseToAmount(paise: number): string {
  if (!Number.isInteger(paise) || paise <= 0) throw new Error("APP:amount_mismatch")
  return (paise / 100).toFixed(2)
}

export function amountToPaise(amount: string): number | null {
  if (!/^[0-9]+(\.[0-9]{1,2})?$/.test(amount.trim())) return null
  return Math.round(Number(amount) * 100)
}

function field(values: Record<string, string | undefined>, name: string): string {
  return values[name] ?? ""
}

export function requestHash(fields: Record<string, string | undefined>, salt: string): string {
  const parts = REQUEST_HASH_FIELDS.map((name) => field(fields, name))
  return sha512(`${parts.join("|")}|${salt}`)
}

export function verifyResponseHash(payload: EasebuzzCallbackPayload, salt: string, key: string): boolean {
  const values: Record<string, string | undefined> = { ...payload, key: payload.key ?? key }
  const expected = sha512(`${salt}|${field(values, "status")}|${RESPONSE_HASH_FIELDS.map((name) => field(values, name)).join("|")}`)
  const actual = (payload.hash ?? "").toLowerCase()
  const left = Buffer.from(expected)
  const right = Buffer.from(actual)
  if (left.length !== right.length) return false
  return timingSafeEqual(left, right)
}

export function retrieveHash(key: string, txnid: string, salt: string): string {
  return sha512(`${key}|${txnid}|${salt}`)
}

export function hostedPayUrl(accessKey: string, env: EasebuzzEnv = easebuzzCredentials().env): string {
  return `${easebuzzPayBaseUrl(env)}pay/${accessKey}`
}

export async function initiatePayment(fields: EasebuzzInitiateFields): Promise<{ accessKey: string; url: string }> {
  const credentials = easebuzzCredentials()
  const body: Record<string, string> = {
    key: credentials.key,
    txnid: fields.txnid,
    amount: fields.amount,
    productinfo: fields.productinfo,
    firstname: fields.firstname,
    email: fields.email,
    phone: fields.phone,
    surl: fields.surl,
    furl: fields.furl,
    udf1: fields.udf1 ?? "",
    udf2: fields.udf2 ?? "",
    udf3: fields.udf3 ?? "",
    udf4: fields.udf4 ?? "",
    udf5: fields.udf5 ?? "",
    udf6: fields.udf6 ?? "",
    udf7: fields.udf7 ?? "",
    udf8: fields.udf8 ?? "",
    udf9: fields.udf9 ?? "",
    udf10: fields.udf10 ?? "",
  }
  body.hash = requestHash(body, credentials.salt)
  // udf8–10 are part of the hash but must not be sent in the POST body.
  delete body.udf8
  delete body.udf9
  delete body.udf10
  for (const [name, value] of Object.entries(body)) {
    if (value === "") delete body[name]
  }

  const response = await fetch(`${easebuzzPayBaseUrl(credentials.env)}payment/initiateLink`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(body),
    cache: "no-store",
  })
  const json = (await response.json()) as { status?: number | string; data?: string }
  if (!response.ok || String(json.status) !== "1" || !json.data) {
    throw new Error("APP:payment_unconfigured")
  }
  return { accessKey: json.data, url: hostedPayUrl(json.data, credentials.env) }
}

export async function retrieveTransaction(txnid: string): Promise<EasebuzzRetrieveResult> {
  const credentials = easebuzzCredentials()
  const body = new URLSearchParams({
    key: credentials.key,
    txnid,
    hash: retrieveHash(credentials.key, txnid, credentials.salt),
  })
  const response = await fetch(`${easebuzzDashboardBaseUrl(credentials.env)}transaction/v2/retrieve`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
    cache: "no-store",
  })
  const json = (await response.json()) as Record<string, unknown>
  const msg = (json.msg && typeof json.msg === "object" ? json.msg : json) as Record<string, unknown>
  const status = String(msg.status ?? json.status ?? "").toLowerCase()
  const amount = String(msg.amount ?? "")
  const easepayid = msg.easepayid != null ? String(msg.easepayid) : msg.easebuzz_id != null ? String(msg.easebuzz_id) : null
  return {
    ok: response.ok && (status === "success" || String(json.status) === "1"),
    status,
    txnid: String(msg.txnid ?? txnid),
    amount,
    easepayid,
    mode: msg.mode != null ? String(msg.mode) : null,
    bankRefNum: msg.bank_ref_num != null ? String(msg.bank_ref_num) : null,
    raw: json,
  }
}

export function parseEasebuzzForm(form: FormData | URLSearchParams | Record<string, string>): EasebuzzCallbackPayload {
  const readValue = (name: string): string => {
    if (form instanceof FormData || form instanceof URLSearchParams) return String(form.get(name) ?? "")
    return String(form[name] ?? "")
  }
  return {
    status: readValue("status"),
    txnid: readValue("txnid"),
    amount: readValue("amount"),
    productinfo: readValue("productinfo"),
    firstname: readValue("firstname"),
    email: readValue("email"),
    hash: readValue("hash"),
    key: readValue("key") || undefined,
    easepayid: readValue("easepayid") || undefined,
    bank_ref_num: readValue("bank_ref_num") || undefined,
    mode: readValue("mode") || undefined,
    error: readValue("error") || undefined,
    error_Message: readValue("error_Message") || undefined,
    udf1: readValue("udf1") || undefined,
    udf2: readValue("udf2") || undefined,
    udf3: readValue("udf3") || undefined,
    udf4: readValue("udf4") || undefined,
    udf5: readValue("udf5") || undefined,
    udf6: readValue("udf6") || undefined,
    udf7: readValue("udf7") || undefined,
    udf8: readValue("udf8") || undefined,
    udf9: readValue("udf9") || undefined,
    udf10: readValue("udf10") || undefined,
  }
}

export function normalizeGatewayStatus(status: string): "success" | "failure" | "userCancelled" | "pending" | "other" {
  const value = status.trim().toLowerCase()
  if (value === "success") return "success"
  if (value === "user cancelled" || value === "usercancelled" || value === "cancelled") return "userCancelled"
  if (value === "failure" || value === "failed" || value === "abort") return "failure"
  if (value === "pending" || value === "initiated") return "pending"
  return "other"
}
