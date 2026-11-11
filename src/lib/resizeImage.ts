// Cover shows up to ~830px wide; 2400px stays sharp on 2x/3x screens with room to spare.
const MAX_EDGE = 2400
const QUALITY = 0.9
// Already small enough: upload untouched rather than re-encode (re-encoding never adds detail).
const SKIP_BELOW_BYTES = 1024 * 1024

/** The pixel size to draw at: shrunk to fit `maxEdge`, never enlarged. */
export function fitWithin(width: number, height: number, maxEdge = MAX_EDGE) {
  const scale = Math.min(1, maxEdge / Math.max(width, height))
  return { width: Math.round(width * scale), height: Math.round(height * scale) }
}

function toBlob(canvas: HTMLCanvasElement, type: string) {
  return new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, QUALITY))
}

/**
 * Shrinks a large photo for upload without visible loss. GIFs pass through (would lose animation),
 * as does anything the browser can't decode or that wouldn't come out smaller.
 */
export async function resizeCoverImage(file: File): Promise<File> {
  if (file.type === 'image/gif') return file
  let bitmap: ImageBitmap
  try {
    // Applies EXIF rotation, so phone photos aren't sideways.
    bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' })
  } catch {
    return file
  }
  const { width, height } = fitWithin(bitmap.width, bitmap.height)
  if (width === bitmap.width && file.size < SKIP_BELOW_BYTES) {
    bitmap.close()
    return file
  }

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const context = canvas.getContext('2d')
  if (!context) {
    bitmap.close()
    return file
  }
  context.imageSmoothingEnabled = true
  context.imageSmoothingQuality = 'high'
  context.drawImage(bitmap, 0, 0, width, height)
  bitmap.close()

  // Safari can't encode WebP (it hands back PNG); fall back to JPEG on white, as JPEG has no transparency.
  let blob = await toBlob(canvas, 'image/webp')
  if (blob?.type !== 'image/webp') {
    context.globalCompositeOperation = 'destination-over'
    context.fillStyle = '#fff'
    context.fillRect(0, 0, width, height)
    blob = await toBlob(canvas, 'image/jpeg')
  }
  if (!blob || blob.size >= file.size) return file

  const name = file.name.replace(/\.[^.]+$/, '') + (blob.type === 'image/webp' ? '.webp' : '.jpg')
  return new File([blob], name, { type: blob.type })
}
