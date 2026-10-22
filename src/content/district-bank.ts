export const DISTRICT_BANK = {
  accountName: "",
  bankName: "",
  accountNumber: "",
  ifsc: "",
  branch: "",
  upi: "",
}

export function districtBankLines(): Array<{ label: string; value: string }> {
  const lines = [
    { label: "Account name", value: DISTRICT_BANK.accountName },
    { label: "Bank", value: DISTRICT_BANK.bankName },
    { label: "Account number", value: DISTRICT_BANK.accountNumber },
    { label: "IFSC", value: DISTRICT_BANK.ifsc },
    { label: "Branch", value: DISTRICT_BANK.branch },
  ]
  if (DISTRICT_BANK.upi) lines.push({ label: "UPI", value: DISTRICT_BANK.upi })
  return lines
}
