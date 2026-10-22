export type WebhookRecordStatus = "processing" | "processed" | "failed"

export function decideWebhookDelivery(
  existing: { processingStatus: WebhookRecordStatus } | null,
): "process" | "skip" | "retry" {
  if (!existing) return "process"
  if (existing.processingStatus === "processed") return "skip"
  if (existing.processingStatus === "failed") return "retry"
  return "skip"
}
