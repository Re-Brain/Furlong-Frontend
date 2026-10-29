import { useContext, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { ArrowLeft, Heart, MapPin, ImageOff } from 'lucide-react'
import type { ActiveFarm } from '../api/farm'
import { LenisContext } from '../../../context/LenisContext'

type FarmHeroProps = {
  farm: ActiveFarm
}

// Full-height farm hero: a gold details panel (name, location, photo thumbnails)
// on the left and a framed photo — on a blurred backdrop — on the right, or an
// empty state when the farm has no photos. Owns its own selected-photo index.
function FarmHero({ farm }: FarmHeroProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const lenisRef = useContext(LenisContext)
  const [activeImageIndex, setActiveImageIndex] = useState(0)

  // Normally "Back" just pops one step of browser history. But arriving here
  // from the donate cancel/success flow means the previous entry is Stripe's
  // own checkout page (outside our control, likely dead/expired by now) — so
  // that flow tags its navigation with state telling us to go Home instead.
  const cameFromDonationFlow = Boolean(
    (location.state as { fromDonation?: boolean } | null)?.fromDonation
  )

  const farmImages = farm.images ?? []
  const hasImages = farmImages.length > 0
  // Selected photo, or '' when the farm has none (an empty state is shown instead).
  const farmImage = farmImages[activeImageIndex]?.image_url ?? ''

  // Glide down to the "Support This Farm" section further down the page,
  // rather than navigating anywhere — the donate form already lives here.
  function scrollToDonate() {
    const el = document.getElementById('support-farm')
    if (!el) return
    const lenis = lenisRef?.current
    if (lenis) {
      lenis.scrollTo(el, { offset: -80, duration: 1.4 })
    } else {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  // Click a thumbnail to change the main photo. Only shown with 2+ photos.
  const thumbnails = (className: string) =>
    farmImages.length > 1 && (
      <div className={`flex gap-3 ${className}`}>
        {farmImages.map((img, i) => (
          <button
            key={img.id}
            onClick={() => setActiveImageIndex(i)}
            aria-label={`View photo ${i + 1}`}
            className={`flex-none w-24 h-16 xs:w-28 xs:h-20 lg:w-32 lg:h-24 rounded-md overflow-hidden border-2 transition ${
              i === activeImageIndex
                ? 'border-white'
                : 'border-white/30 opacity-70 hover:opacity-100'
            }`}
          >
            <img src={img.image_url} alt="" className="w-full h-full object-cover" decoding="async" />
          </button>
        ))}
      </div>
    )

  return (
    <section className="relative grid lg:grid-cols-[1fr_1.4fr] lg:min-h-[calc(100vh-3.25rem)]">
      <button
        onClick={() => (cameFromDonationFlow ? navigate('/') : navigate(-1))}
        className="fixed top-20 left-2 z-40 flex items-center gap-2 bg-black/50 hover:bg-black/70 text-white text-sm font-bold px-3 py-1.5 rounded-full backdrop-blur-sm transition"
      >
        <ArrowLeft size={16} /> Back
      </button>

      {/* Left (lg+): details panel. Below lg the photo stacks first, then this. */}
      <div className="relative order-2 lg:order-1 flex flex-col items-center justify-center text-center gap-7 bg-brand-gold text-white p-6 xs:p-8 sm:p-10 lg:p-16 overflow-hidden">
        {hasImages && (
          <div
            aria-hidden
            className="absolute inset-0 bg-cover bg-center blur-3xl scale-150 brightness-50"
            style={{ backgroundImage: `url(${farmImage})` }}
          />
        )}
        <div
          aria-hidden
          className="absolute inset-0 bg-linear-to-b from-brand-gold/40 via-brand-gold/70 to-brand-gold"
        />

        <div className="relative z-1 flex flex-col items-center gap-6">
          <div className="flex flex-col items-center gap-4">
            <h1 className="text-2xl xs:text-3xl sm:text-4xl lg:text-6xl font-extrabold tracking-wide uppercase leading-none">
              <span className="text-amber-300">{farm.name.charAt(0)}</span>
              {farm.name.slice(1)}
            </h1>
            <span className="block w-14 h-px bg-white/40" />
            <p className="flex flex-col items-center gap-2 text-sm lg:text-base uppercase tracking-[0.2em] text-white/80">
              <MapPin size={20} />
              {farm.location ?? 'Location not specified'}
            </p>
          </div>

          <button
            type="button"
            onClick={scrollToDonate}
            className="flex items-center gap-2 bg-white text-brand-gold font-bold uppercase tracking-[0.2em] text-sm px-8 xs:px-10 sm:px-12 py-3.5 rounded-full shadow-md hover:bg-brand-bg hover:scale-[1.03] transition"
          >
            <Heart size={16} fill="currentColor" /> Donate
          </button>

          {/* Thumbnails live here only at lg+; below that they sit under the
              main photo so they're reachable without scrolling past the name. */}
          <div className="hidden lg:block mt-2">{thumbnails('flex-wrap justify-center max-w-xl')}</div>
        </div>
      </div>

      {/* Right: framed photo on a blurred backdrop, or an empty state
          when the farm hasn't shared any photos yet. */}
      {/* pt-16 clears the fixed Back button pinned at top-20, which sits over this
          panel below lg; not needed at lg where there's more room. */}
      <div className="relative order-1 lg:order-2 bg-brand-bg flex flex-col items-center justify-center gap-4 overflow-hidden px-4 pb-6 pt-16 xs:px-6 sm:pb-8 lg:p-10">
        {hasImages ? (
          <>
            <div
              aria-hidden
              className="absolute inset-0 bg-cover bg-center scale-125 blur-3xl brightness-90"
              style={{ backgroundImage: `url(${farmImage})` }}
            />
            <img
              src={farmImage}
              alt={farm.name}
              className="relative z-1 w-full max-w-2xl aspect-4/3 object-cover rounded-lg border-4 border-white shadow-2xl"
              loading="lazy"
              decoding="async"
            />
          </>
        ) : (
          <div className="relative z-1 w-full max-w-2xl aspect-4/3 rounded-lg border-4 border-dashed border-brand-border bg-brand-surface/40 flex flex-col items-center justify-center gap-4 text-center px-6">
            <ImageOff size={56} strokeWidth={1.25} className="text-brand-gold/70" />
            <p className="text-lg font-bold uppercase tracking-[0.2em] text-brand-text">
              No photos yet
            </p>
            <p className="text-sm text-brand-muted max-w-xs">
              {farm.name} hasn't shared any photos of the farm yet — check back soon.
            </p>
          </div>
        )}

        {/* Below lg: thumbnails right under the photo, scrolling sideways if
            there are more than fit. */}
        <div className="relative z-1 w-full max-w-2xl lg:hidden">
          {thumbnails('overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden')}
        </div>
      </div>
    </section>
  )
}

export default FarmHero
