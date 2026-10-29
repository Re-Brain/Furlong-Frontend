import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { getAllHorses, type Horse } from '../api/horse'
import OverlayCard from '../../../components/OverlayCard'
import ShowMoreButton from '../../../components/ShowMoreButton'
import { useShowMore } from '../../../hooks/useShowMore'

function HorsesListPage() {
  const navigate = useNavigate()

  // State for horses, error handling, and loading state
  const [horses, setHorses] = useState<Horse[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  // Fetch horses data when the component mounts
  useEffect(() => {
    getAllHorses()
      .then(setHorses)
      .catch(() => setError('Failed to load horses. Please try again later.'))
      .finally(() => setLoading(false))
  }, [])

  // A draft/pending/rejected horse isn't meant to be public yet — filter it
  // out client-side too, rather than trusting the backend response alone.
  const approvedHorses = horses.filter(horse => horse.status === 'approved')

  // Reveal horses 12 at a time rather than rendering the whole list at once.
  const { visible: visibleHorses, remaining, showMore } = useShowMore(approvedHorses)

  return (
    <div className="min-h-[calc(100vh-3.25rem)] bg-brand-bg text-brand-text">
      <div className="max-w-7xl mx-auto px-4 xs:px-6 sm:px-8 py-10">
        
        {/* Back button — uses real history-back navigation (not a Link to a
            hardcoded path) so it restores the previous page's scroll
            position instead of always landing at its top. */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-brand-muted hover:text-brand-gold text-sm font-bold mb-8 transition w-fit"
        >
          <ArrowLeft size={16} /> Back
        </button>

        {/* Page title */}
        <h1 className="text-xl xs:text-2xl sm:text-3xl 2xl:text-4xl font-extrabold text-brand-gold mb-8">
          Champions in Retirement
        </h1>

        {/* Show loading state when horses are being fetched */}
        {loading && <p className="text-brand-muted text-sm">Loading...</p>}

        {/* Show error message if there was an error fetching horses */}
        {error && <p className="text-red-600 text-sm">{error}</p>}

        {/* Show message if there are no horses */}
        {!loading && !error && approvedHorses.length === 0 && (
          <p className="text-brand-muted text-sm">No horses listed yet.</p>
        )}

        {/* Show grid of approved horses if there are any */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 gap-4 sm:gap-6">
          {visibleHorses.map(horse => (
            <OverlayCard
              key={horse.id}
              to={`/horses/${horse.id}`}
              imageUrl={horse.images[0]?.image_url}
              title={horse.name}
              aspect="aspect-[5/4]"
            />
          ))}
        </div>
        <ShowMoreButton remaining={remaining} onClick={showMore} />
      </div>
    </div>
  )
}

export default HorsesListPage
