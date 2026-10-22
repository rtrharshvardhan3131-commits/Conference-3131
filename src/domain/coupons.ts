export type StoredCoupon = {
  code: string
  name: string
  kind: "percent" | "amount"
  percent: number | null
  amountPaise: number | null
  status: "draft" | "published" | "archived"
  startsAt: string | null
  endsAt: string | null
  quantityLimit: number | null
  quantityUsed: number
}

export type CouponQuote =
  | { ok: true; code: string; name: string; amountPaise: number; discountPaise: number }
  | { ok: false }

export function normalizeCouponCode(value: string): string {
  return value.trim().toUpperCase().replace(/\s+/g, "")
}

export function couponCodeIsWellFormed(code: string): boolean {
  return /^[A-Z0-9-]{3,32}$/.test(code)
}

export function quoteCoupon(pricePaise: number, coupon: StoredCoupon, now: Date): CouponQuote {
  if (!Number.isInteger(pricePaise) || pricePaise <= 0) return { ok: false }
  if (coupon.status !== "published") return { ok: false }
  if (coupon.startsAt && now < new Date(coupon.startsAt)) return { ok: false }
  if (coupon.endsAt && now > new Date(coupon.endsAt)) return { ok: false }
  if (coupon.quantityLimit !== null && coupon.quantityUsed >= coupon.quantityLimit) return { ok: false }

  let discount = 0
  if (coupon.kind === "percent") {
    if (!coupon.percent || coupon.percent < 1 || coupon.percent > 100) return { ok: false }
    discount = Math.floor((pricePaise * coupon.percent) / 100)
  } else if (!coupon.amountPaise || coupon.amountPaise <= 0) {
    return { ok: false }
  } else {
    discount = coupon.amountPaise
  }

  if (discount <= 0 || discount >= pricePaise) return { ok: false }
  return {
    ok: true,
    code: coupon.code,
    name: coupon.name,
    discountPaise: discount,
    amountPaise: pricePaise - discount,
  }
}
