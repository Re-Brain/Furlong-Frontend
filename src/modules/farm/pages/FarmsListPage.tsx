import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { getActiveFarms, type ActiveFarm } from '../api/farm'
import OverlayCard from '../../../components/OverlayCard'

function FarmsListPage() {
  const navigate = useNavigate()

  // State for farms, error handling, and loading state
  const [farms, setFarms] = useState<ActiveFarm[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  // Fetch farms data when the component mounts
  useEffect(() => {
    getActiveFarms()
      .then(setFarms)
      .catch(() => setError('Failed to load farms. Please try again later.'))
      .finally(() => setLoading(false))
  }, [])

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
          Farms Open to Visitors
        </h1>

        {/* Show loading state when farms are being fetched */}
        {loading && <p className="text-brand-muted text-sm">Loading...</p>}
        
        {/* Show error message if there was an error fetching farms */}
        {error && <p className="text-red-600 text-sm">{error}</p>}
        
        {/* Show message if there are no active farms */}
        {!loading && !error && farms.length === 0 && (
          <p className="text-brand-muted text-sm">No active farms yet.</p>
        )}

        {/* Show grid of farms if there are any */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 gap-4 sm:gap-6">
          {farms.map(farm => (
            <OverlayCard
              key={farm.id}
              to={`/farms/${farm.id}`}
              imageUrl={farm.images?.[0]?.image_url}
              title={farm.name}
              aspect="aspect-[5/4]"
            />
          ))}
        </div>
      </div>
    </div>
  )
}

export default FarmsListPage
