import { EXPORT_JPEG_QUALITY, EXPORT_MAX_HEIGHT } from '../constants/exportImage.js'

/**
 * @param {string} url
 * @returns {Promise<HTMLImageElement>}
 */
export function loadImageFromUrl(url) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('Could not decode image'))
    img.src = url
  })
}

/**
 * Encode to JPEG per spec: max height 720, preserve aspect, no upscale.
 * @param {HTMLImageElement} img
 * @returns {Promise<Blob>}
 */
export async function imageToJpegBlob(img) {
  const sw = img.naturalWidth
  const sh = img.naturalHeight
  if (!sw || !sh) {
    throw new Error('Image has no dimensions')
  }
  let outW = sw
  let outH = sh
  if (sh > EXPORT_MAX_HEIGHT) {
    outH = EXPORT_MAX_HEIGHT
    outW = Math.round(EXPORT_MAX_HEIGHT * (sw / sh))
  }
  const canvas = document.createElement('canvas')
  canvas.width = outW
  canvas.height = outH
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas not supported')
  ctx.drawImage(img, 0, 0, outW, outH)
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob)
        else reject(new Error('JPEG encoding failed'))
      },
      'image/jpeg',
      EXPORT_JPEG_QUALITY,
    )
  })
}

/**
 * @param {string} objectUrlOrDataUrl
 * @returns {Promise<Blob>}
 */
export async function urlToExportJpegBlob(objectUrlOrDataUrl) {
  const img = await loadImageFromUrl(objectUrlOrDataUrl)
  return imageToJpegBlob(img)
}
