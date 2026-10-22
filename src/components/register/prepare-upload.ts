import { IMAGE_UPLOAD_TARGET_BYTES, uploadNeedsCompression } from "@/domain/experience"

const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp", "application/pdf"])

export async function prepareUpload(file: File, onProgress: (value: number) => void): Promise<File> {
  onProgress(10)
  const mime = file.type || (file.name.toLowerCase().endsWith(".pdf") ? "application/pdf" : "")
  if (!ALLOWED.has(mime)) throw new Error("Use a JPG, PNG, WEBP, or PDF.")
  if (file.size > 5 * 1024 * 1024 && mime === "application/pdf") throw new Error("Use a file under 5 MB.")
  if (!uploadNeedsCompression(mime, file.size)) {
    onProgress(100)
    return file
  }
  onProgress(35)
  const compressed = await compressImage(file)
  onProgress(100)
  if (compressed.size > 5 * 1024 * 1024) throw new Error("Use a file under 5 MB.")
  return compressed
}

async function compressImage(file: File): Promise<File> {
  const bitmap = await createImageBitmap(file)
  let width = bitmap.width
  let height = bitmap.height
  const longest = Math.max(width, height)
  if (longest > 2000) {
    const scale = 2000 / longest
    width = Math.round(width * scale)
    height = Math.round(height * scale)
  }
  const canvas = document.createElement("canvas")
  canvas.width = width
  canvas.height = height
  const context = canvas.getContext("2d")
  if (!context) return file
  context.drawImage(bitmap, 0, 0, width, height)
  bitmap.close()
  let quality = 0.82
  let blob = await canvasToBlob(canvas, quality)
  while (blob && blob.size > IMAGE_UPLOAD_TARGET_BYTES && quality > 0.45) {
    quality -= 0.12
    blob = await canvasToBlob(canvas, quality)
  }
  if (!blob) return file
  const name = file.name.replace(/\.[^.]+$/, "") || "photo"
  return new File([blob], `${name}.jpg`, { type: "image/jpeg" })
}

function canvasToBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob((blob) => resolve(blob), "image/jpeg", quality))
}
