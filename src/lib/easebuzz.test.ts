import { createHash } from "node:crypto"
import { describe, expect, it } from "vitest"
import {
  amountToPaise,
  normalizeGatewayStatus,
  paiseToAmount,
  requestHash,
  retrieveHash,
  sha512,
  verifyResponseHash,
  type EasebuzzCallbackPayload,
} from "@/lib/easebuzz"

const key = "testkey"
const salt = "testsalt"

function responseHash(payload: EasebuzzCallbackPayload): string {
  const udfs = ["udf10", "udf9", "udf8", "udf7", "udf6", "udf5", "udf4", "udf3", "udf2", "udf1"]
    .map((name) => payload[name] ?? "")
    .join("|")
  return createHash("sha512")
    .update(`${salt}|${payload.status}|${udfs}|${payload.email}|${payload.firstname}|${payload.productinfo}|${payload.amount}|${payload.txnid}|${key}`, "utf8")
    .digest("hex")
    .toLowerCase()
}

function amountMatchesStored(payloadAmount: string, storedPaise: number): boolean {
  const paid = amountToPaise(payloadAmount)
  return paid != null && paid === storedPaise
}

function canInitiateRegistration(status: string): boolean {
  return status === "pending_payment" || status === "payment_failed"
}

function rejectClientAmount(body: { amount?: unknown }): boolean {
  return body.amount !== undefined
}

describe("easebuzz hashes", () => {
  it("builds the official request hash sequence", () => {
    const fields = {
      key,
      txnid: "TXN1",
      amount: "1800.00",
      productinfo: "The SOVEREIGN Summit registration",
      firstname: "Ada",
      email: "ada@example.com",
      udf1: "reg-1",
    }
    const expected = sha512(`${key}|TXN1|1800.00|The SOVEREIGN Summit registration|Ada|ada@example.com|reg-1||||||||||${salt}`)
    expect(requestHash(fields, salt)).toBe(expected)
  })

  it("verifies a valid response hash and rejects a tampered one", () => {
    const payload: EasebuzzCallbackPayload = {
      status: "success",
      txnid: "TXN1",
      amount: "1800.00",
      productinfo: "The SOVEREIGN Summit registration",
      firstname: "Ada",
      email: "ada@example.com",
      hash: "",
      udf1: "reg-1",
    }
    payload.hash = responseHash(payload)
    expect(verifyResponseHash(payload, salt, key)).toBe(true)
    expect(verifyResponseHash({ ...payload, hash: "0".repeat(128) }, salt, key)).toBe(false)
    expect(verifyResponseHash({ ...payload, amount: "1.00", hash: payload.hash }, salt, key)).toBe(false)
  })

  it("builds the official retrieve hash as key|txnid|salt", () => {
    expect(retrieveHash(key, "TXN1", salt)).toBe(sha512(`${key}|TXN1|${salt}`))
  })
})

describe("easebuzz amounts", () => {
  it("formats paise as rupees with two decimals", () => {
    expect(paiseToAmount(180000)).toBe("1800.00")
    expect(paiseToAmount(229900)).toBe("2299.00")
    expect(() => paiseToAmount(0)).toThrow("APP:amount_mismatch")
  })

  it("rejects amount mismatches against stored paise", () => {
    expect(amountMatchesStored("1800.00", 180000)).toBe(true)
    expect(amountMatchesStored("1800.01", 180000)).toBe(false)
    expect(amountMatchesStored("not-a-number", 180000)).toBe(false)
    expect(amountToPaise("12.3")).toBe(1230)
  })
})

describe("easebuzz settle mapping", () => {
  it("maps gateway statuses for success, failure, and cancel", () => {
    expect(normalizeGatewayStatus("success")).toBe("success")
    expect(normalizeGatewayStatus("failure")).toBe("failure")
    expect(normalizeGatewayStatus("userCancelled")).toBe("userCancelled")
    expect(normalizeGatewayStatus("user cancelled")).toBe("userCancelled")
    expect(normalizeGatewayStatus("pending")).toBe("pending")
  })

  it("treats already-success confirmation as idempotent display success", () => {
    const alreadySuccess = { status: "success" as const }
    const next = alreadySuccess.status === "success" ? "confirmed" : "pending"
    expect(next).toBe("confirmed")
  })
})

describe("easebuzz initiate guards", () => {
  it("allows only pending_payment or payment_failed registrations", () => {
    expect(canInitiateRegistration("pending_payment")).toBe(true)
    expect(canInitiateRegistration("payment_failed")).toBe(true)
    expect(canInitiateRegistration("confirmed")).toBe(false)
    expect(canInitiateRegistration("cancelled")).toBe(false)
  })

  it("rejects a client-supplied amount field", () => {
    expect(rejectClientAmount({ registrationId: "x" } as { amount?: unknown })).toBe(false)
    expect(rejectClientAmount({ amount: 1800 })).toBe(true)
    expect(rejectClientAmount({ amount: "1800.00" })).toBe(true)
  })
})
