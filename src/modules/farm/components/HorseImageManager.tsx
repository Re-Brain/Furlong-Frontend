import { Upload, Trash2, ChevronLeft, ChevronRight, MoveLeft, MoveRight, Loader2 } from 'lucide-react'
import type { Horse } from '../api/horse'
import type { useHorseImages } from '../hooks/useHorseImages'

type HorseImageManagerProps = {
  horse: Horse
  images: ReturnType<typeof useHorseImages>
  /** True when another section is being edited or an image action is in flight. */
  locked: boolean
}

// The image management card: upload (max 3), a viewer with delete-confirm
// overlay, prev/next + dot navigation, and reorder controls. All state and
// async logic live in the `useHorseImages` hook; this renders it.
function HorseImageManager({ horse, images, locked }: HorseImageManagerProps) {
  const {
    fileInputRef,
    activeImageIndex,
    setActiveImageIndex,
    uploadingImage,
    deletingImage,
    imageError,
    deleteImageConfirmId,
    setDeleteImageConfirmId,
    handleImageUpload,
    handleImageDelete,
    handleReorderImage,
    busy,
  } = images

  const imageCount = horse.images.length
  const safeImageIndex = Math.min(activeImageIndex, Math.max(0, imageCount - 1))
  const activeImage = horse.images[safeImageIndex]

  return (
    <div className="bg-brand-surface border border-brand-border rounded-lg p-4 xs:p-6 flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-bold text-brand-muted uppercase">Images <span className="normal-case font-normal">({imageCount}/3)</span></p>

        {imageCount < 3 && (
          <>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={locked}
              className="flex items-center gap-2 text-xs font-bold bg-brand-gold text-brand-bg px-3 py-1.5 rounded-lg hover:bg-brand-gold-light transition disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-brand-gold"
              title={busy ? 'Wait for the image action to finish' : locked ? 'Finish editing first' : 'Upload image'}
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

      <p className="text-[12px] text-brand-muted normal-case">Max 10MB per file.</p>

      {/* Active image, or a placeholder when none are uploaded. */}
      {imageCount === 0 ? (
        <div className="flex items-center justify-center h-40 rounded-lg border border-dashed border-brand-border text-brand-muted text-sm">
          No images uploaded
        </div>
      ) : (
        <div className="group relative rounded-xl overflow-hidden h-56 xs:h-72 sm:h-96">
          <img
            key={activeImage.id}
            src={activeImage.image_url}
            alt={horse.name}
            className="w-full h-full object-contain"
            decoding="async"
          />

          {/* Delete confirm overlay */}
          {deleteImageConfirmId === activeImage.id ? (
            <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center gap-2">
              {deletingImage ? (
                <>
                  <Loader2 size={24} className="text-white animate-spin" />
                  <p className="text-white text-xs font-bold">Deleting...</p>
                </>
              ) : (
                <>
                  <p className="text-white text-xs font-bold">Delete this image?</p>
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
          ) : !locked ? (
            <button
              onClick={() => setDeleteImageConfirmId(activeImage.id)}
              className="absolute top-3 right-3 bg-black/50 hover:bg-black/80 text-white p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:opacity-100 transition"
              title="Delete image"
            >
              <Trash2 size={14} />
            </button>
          ) : null}

          {/* Prev / Next arrows */}
          {imageCount > 1 && (
            <>
              <button
                onClick={() => setActiveImageIndex(i => (i - 1 + imageCount) % imageCount)}
                className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/80 text-white p-2 rounded-full transition backdrop-blur-sm"
                aria-label="Previous image"
              >
                <ChevronLeft size={20} />
              </button>
              <button
                onClick={() => setActiveImageIndex(i => (i + 1) % imageCount)}
                className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/80 text-white p-2 rounded-full transition backdrop-blur-sm"
                aria-label="Next image"
              >
                <ChevronRight size={20} />
              </button>
            </>
          )}

          {/* Dot indicators */}
          {imageCount > 1 && (
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2">
              {horse.images.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImageIndex(i)}
                  aria-label={`Go to image ${i + 1}`}
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
            disabled={locked || safeImageIndex === 0}
            className="flex items-center gap-1 text-xs font-bold text-brand-muted hover:text-brand-gold px-3 py-1.5 rounded-lg border border-brand-border transition disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:text-brand-muted"
            title="Move image earlier"
          >
            <MoveLeft size={13} /> Move earlier
          </button>
          <span className="text-xs text-brand-muted">{safeImageIndex + 1} / {imageCount}</span>
          <button
            type="button"
            onClick={() => handleReorderImage(1)}
            disabled={locked || safeImageIndex === imageCount - 1}
            className="flex items-center gap-1 text-xs font-bold text-brand-muted hover:text-brand-gold px-3 py-1.5 rounded-lg border border-brand-border transition disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:text-brand-muted"
            title="Move image later"
          >
            Move later <MoveRight size={13} />
          </button>
        </div>
      )}

      {imageError && <p className="text-red-600 text-sm">{imageError}</p>}
    </div>
  )
}

export default HorseImageManager
