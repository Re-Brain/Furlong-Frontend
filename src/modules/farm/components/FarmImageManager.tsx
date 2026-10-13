import { useState, useRef } from 'react'
import { Upload, Trash2, ChevronLeft, ChevronRight, MoveLeft, MoveRight, Loader2 } from 'lucide-react'
import {
  uploadFarmImage,
  deleteFarmImage,
  reorderFarmImages,
  FARM_IMAGE_LIMIT,
  type Farm,
} from '../api/farm'

type Props = {
  farm: Farm
  onChange: (farm: Farm) => void
  // Locked while the surrounding farm-info form is being edited, so only one
  // thing happens at a time (mirrors the horse detail page).
  disabled?: boolean
}

function FarmImageManager({ farm, onChange, disabled = false }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  // The backend may not include `images` yet; treat a missing array as empty.
  const images = farm.images ?? []

  const [uploadingImage, setUploadingImage] = useState(false)
  const [deletingImage, setDeletingImage] = useState(false)
  const [reordering, setReordering] = useState(false)
  const [imageError, setImageError] = useState<string | null>(null)
  const [deleteImageConfirmId, setDeleteImageConfirmId] = useState<number | null>(null)
  const [activeImageIndex, setActiveImageIndex] = useState(0)

  const imageCount = images.length
  // Clamp during render: after deleting the active image, activeImageIndex can
  // momentarily point past the now-shorter array before the effect-free update
  // runs. Reading images[outOfRange] would be undefined and crash the render.
  const safeImageIndex = Math.min(activeImageIndex, Math.max(0, imageCount - 1))
  const activeImage = images[safeImageIndex]

  const imageBusy = uploadingImage || deletingImage || reordering
  const actionsLocked = disabled || imageBusy

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingImage(true)
    setImageError(null)
    try {
      const updated = await uploadFarmImage(file)
      onChange(updated)
    } catch (err) {
      setImageError(err instanceof Error ? err.message : 'Failed to upload image')
    } finally {
      setUploadingImage(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  async function handleImageDelete(imageId: number) {
    setImageError(null)
    setDeletingImage(true)
    try {
      const updated = await deleteFarmImage(imageId)
      onChange(updated)
      // Keep the active index in range now that the array is shorter.
      setActiveImageIndex(i => Math.min(i, Math.max(0, (updated.images ?? []).length - 1)))
      setDeleteImageConfirmId(null)
    } catch (err) {
      setImageError(err instanceof Error ? err.message : 'Failed to delete image')
    } finally {
      setDeletingImage(false)
    }
  }

  async function handleReorderImage(direction: -1 | 1) {
    const target = safeImageIndex + direction
    if (target < 0 || target >= imageCount) return
    const ids = images.map(img => img.id)
    ;[ids[safeImageIndex], ids[target]] = [ids[target], ids[safeImageIndex]]
    setReordering(true)
    setImageError(null)
    try {
      const updated = await reorderFarmImages(ids)
      onChange(updated)
      setActiveImageIndex(target)
    } catch (err) {
      setImageError(err instanceof Error ? err.message : 'Failed to reorder image')
    } finally {
      setReordering(false)
    }
  }

  return (
    <div className="bg-brand-surface border border-brand-border rounded-lg p-4 xs:p-6 flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-bold text-brand-muted uppercase">
          Farm Photos <span className="text-red-600">*</span> <span className="normal-case font-normal">({imageCount}/{FARM_IMAGE_LIMIT})</span>
        </p>
        {imageCount < FARM_IMAGE_LIMIT && (
          <>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={actionsLocked}
              className="flex items-center gap-2 text-xs font-bold bg-brand-gold text-brand-bg px-3 py-1.5 rounded-lg hover:bg-brand-gold-light transition disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-brand-gold"
              title={imageBusy ? 'Wait for the image action to finish' : disabled ? 'Finish editing first' : 'Upload image'}
            >
              <Upload size={13} /> {uploadingImage ? 'Uploading...' : 'Upload'}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageUpload}
            />
          </>
        )}
      </div>

      <p className="text-[12px] text-brand-muted normal-case">
        Add up to {FARM_IMAGE_LIMIT} photos of your farm. The first one is shown on your public farm page. At least one photo is required before your farm can be approved. Max 10MB per file.
      </p>

      {imageCount === 0 || !activeImage ? (
        <div className="flex items-center justify-center h-40 rounded-lg border border-dashed border-brand-border text-brand-muted text-sm">
          No photos uploaded
        </div>
      ) : (
        <div className="group relative rounded-xl overflow-hidden h-56 xs:h-72 sm:h-96 bg-brand-bg">
          {/* Blurred fill of the same photo so the letterbox gaps read as a
              soft border around the image instead of flat empty bars. */}
          <div
            aria-hidden
            className="absolute inset-0 bg-cover bg-center scale-110 blur-2xl brightness-90"
            style={{ backgroundImage: `url(${activeImage.image_url})` }}
          />
          <img
            key={activeImage.id}
            src={activeImage.image_url}
            alt={farm.name}
            className="relative z-1 w-full h-full object-contain"
            decoding="async"
          />

          {/* Delete confirm overlay */}
          {deleteImageConfirmId === activeImage.id ? (
            <div className="absolute inset-0 z-10 bg-black/70 flex flex-col items-center justify-center gap-2">
              {deletingImage ? (
                <>
                  <Loader2 size={24} className="text-white animate-spin" />
                  <p className="text-white text-xs font-bold">Deleting...</p>
                </>
              ) : (
                <>
                  <p className="text-white text-xs font-bold">Delete this photo?</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleImageDelete(activeImage.id)}
                      className="text-xs font-bold bg-red-500 hover:bg-red-400 text-white px-3 py-1 rounded transition"
                    >
                      Yes
                    </button>
                    <button
                      onClick={() => setDeleteImageConfirmId(null)}
                      className="text-xs font-bold bg-white/20 hover:bg-white/30 text-white px-3 py-1 rounded transition"
                    >
                      No
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : !actionsLocked ? (
            <button
              onClick={() => setDeleteImageConfirmId(activeImage.id)}
              className="absolute top-3 right-3 z-10 bg-black/50 hover:bg-black/80 text-white p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:opacity-100 transition"
              title="Delete photo"
            >
              <Trash2 size={14} />
            </button>
          ) : null}

          {/* Prev / Next arrows */}
          {imageCount > 1 && (
            <>
              <button
                onClick={() => setActiveImageIndex(i => (i - 1 + imageCount) % imageCount)}
                className="absolute left-3 top-1/2 -translate-y-1/2 z-10 bg-black/50 hover:bg-black/80 text-white p-2 rounded-full transition backdrop-blur-sm"
                aria-label="Previous photo"
              >
                <ChevronLeft size={20} />
              </button>
              <button
                onClick={() => setActiveImageIndex(i => (i + 1) % imageCount)}
                className="absolute right-3 top-1/2 -translate-y-1/2 z-10 bg-black/50 hover:bg-black/80 text-white p-2 rounded-full transition backdrop-blur-sm"
                aria-label="Next photo"
              >
                <ChevronRight size={20} />
              </button>
            </>
          )}

          {/* Dot indicators */}
          {imageCount > 1 && (
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 flex gap-2">
              {images.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImageIndex(i)}
                  aria-label={`Go to photo ${i + 1}`}
                  className={`rounded-full transition-all duration-200 ${i === safeImageIndex ? 'w-5 h-2 bg-white' : 'w-2 h-2 bg-white/50 hover:bg-white/80'}`}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Reorder controls */}
      {imageCount > 1 && (
        <div className="flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => handleReorderImage(-1)}
            disabled={actionsLocked || safeImageIndex === 0}
            className="flex items-center gap-1 text-xs font-bold text-brand-muted hover:text-brand-gold px-3 py-1.5 rounded-lg border border-brand-border transition disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:text-brand-muted"
            title="Move photo earlier"
          >
            <MoveLeft size={13} /> Move earlier
          </button>
          <span className="text-xs text-brand-muted">{safeImageIndex + 1} / {imageCount}</span>
          <button
            type="button"
            onClick={() => handleReorderImage(1)}
            disabled={actionsLocked || safeImageIndex === imageCount - 1}
            className="flex items-center gap-1 text-xs font-bold text-brand-muted hover:text-brand-gold px-3 py-1.5 rounded-lg border border-brand-border transition disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:text-brand-muted"
            title="Move photo later"
          >
            Move later <MoveRight size={13} />
          </button>
        </div>
      )}

      {imageError && <p className="text-red-600 text-sm">{imageError}</p>}
    </div>
  )
}

export default FarmImageManager
