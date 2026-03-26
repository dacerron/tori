import { useCallback, useEffect, useRef, useState } from 'react'
import { EXPORT_JPEG_QUALITY } from '../constants/exportImage.js'
import { useInventory } from '../context/InventoryContext.jsx'
import './CameraPanel.css'

export function CameraPanel() {
  const videoRef = useRef(null)
  const fileInputRef = useRef(null)
  const [streamError, setStreamError] = useState(null)
  const { selectedId, updateItem } = useInventory()

  useEffect(() => {
    let stream = null
    ;(async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
          audio: false,
        })
        const el = videoRef.current
        if (el) {
          el.srcObject = stream
          await el.play().catch(() => {})
        }
        setStreamError(null)
      } catch {
        setStreamError(
          'Camera unavailable or permission denied. Use “Choose photo” instead.',
        )
      }
    })()
    return () => {
      stream?.getTracks().forEach((t) => t.stop())
      const el = videoRef.current
      if (el) el.srcObject = null
    }
  }, [])

  const applyThumbnailBlob = useCallback(
    (blob) => {
      if (!selectedId || !blob) return
      const url = URL.createObjectURL(blob)
      updateItem(selectedId, { thumbnailUrl: url })
    },
    [selectedId, updateItem],
  )

  const captureFrame = useCallback(() => {
    const video = videoRef.current
    if (!video || !selectedId || !video.videoWidth) return
    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.drawImage(video, 0, 0)
    canvas.toBlob(
      (blob) => applyThumbnailBlob(blob),
      'image/jpeg',
      EXPORT_JPEG_QUALITY,
    )
  }, [selectedId, applyThumbnailBlob])

  const onFileChange = (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file || !selectedId) return
    if (!file.type.startsWith('image/')) return
    applyThumbnailBlob(file)
  }

  const choosePhoto = () => fileInputRef.current?.click()

  return (
    <section className="camera-panel" aria-label="Camera">
      <div className="camera-panel__frame">
        <video
          ref={videoRef}
          className="camera-panel__video"
          playsInline
          muted
          autoPlay
        />
        {!streamError ? null : (
          <p className="camera-panel__fallback-msg">{streamError}</p>
        )}
      </div>
      <div className="camera-panel__actions">
        <button
          type="button"
          className="camera-panel__btn"
          onClick={captureFrame}
          disabled={!selectedId || !!streamError}
        >
          Capture photo
        </button>
        <button
          type="button"
          className="camera-panel__btn camera-panel__btn--secondary"
          onClick={choosePhoto}
          disabled={!selectedId}
        >
          Choose photo
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="camera-panel__file"
          aria-hidden
          tabIndex={-1}
          onChange={onFileChange}
        />
      </div>
    </section>
  )
}
