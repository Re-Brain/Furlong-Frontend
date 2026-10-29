import { useState, useEffect } from 'react'
import { getActiveFarms, type ActiveFarm, getAllHorses, type Horse } from '../modules/farm'
import { Link } from 'react-router-dom'
import { Search, CalendarCheck, HeartHandshake, HandCoins } from 'lucide-react'
import OverlayCard from '../components/OverlayCard'
import CardRow from '../components/CardRow'
import HorseshoeIcon from '../components/HorseshoeIcon'

// The 3-step explainer shown in the "How It Works" section below the hero.
const HOW_IT_WORKS_STEPS = [
  {
    icon: Search,
    title: 'Browse Farms & Horses',
    description: 'Explore vetted farms across the country and meet the champions who call them home.',
  },
  {
    icon: CalendarCheck,
    title: 'Book a Visit',
    description: 'Pick a farm, pick a horse, and schedule a visit to meet a retired racehorse in person.',
  },
  {
    icon: HeartHandshake,
    title: 'Support From Afar',
    description: "Can't make it in person? Donate directly to a farm and help fund a horse's care.",
  },
]

function HomePage() {

  // State for farms and horses, along with error handling
  const [farms, setFarms] = useState<ActiveFarm[]>([])
  const [farmsError, setFarmsError] = useState<string | null>(null)
  const [horses, setHorses] = useState<Horse[]>([])
  const [horsesError, setHorsesError] = useState<string | null>(null)

  // Loading state to indicate whether data is being fetched
  const [loading, setLoading] = useState(true)

  // Fetch farms and horses data when the component mounts
  useEffect(() => {
    Promise.all([
      getActiveFarms()
        .then(setFarms)
        .catch(() => setFarmsError('Failed to load farms. Please try again later.')),
      getAllHorses()
        .then(setHorses)
        .catch(() => setHorsesError('Failed to load horses. Please try again later.')),
    ]).finally(() => setLoading(false))
  }, [])

  // A draft/pending/rejected horse isn't meant to be public yet — filter it
  // out client-side too, rather than trusting the backend response alone.
  const approvedHorses = horses.filter(horse => horse.status === 'approved')

  return (
    <div className="bg-brand-bg text-brand-text">
      
      {/* Hero Section For First Impression which fills in full screen*/}
      <section className="relative min-h-[max(420px,calc(100vh-3.25rem))] flex items-center justify-center overflow-hidden">

        {/* Background image of hero */}
        <img
          src="https://images.unsplash.com/photo-1599635406076-0f40532a59fc?fm=jpg&q=80&w=1920&auto=format&fit=crop"
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
        />

        {/* Sologan Text of the Hero*/}
        <div className="absolute inset-0 bg-linear-to-t from-[#0f2a1f]/85 via-[#1f4d3a]/45 to-[#1f4d3a]/25" />
        <div className="relative z-10 px-4 xs:px-6 text-center">
          <h1 className="text-2xl xs:text-4xl sm:text-5xl md:text-6xl 2xl:text-7xl font-bold text-white drop-shadow-lg max-w-4xl 2xl:max-w-5xl mx-auto">
            Life Beyond the Track
          </h1>
          <p className="mt-4 text-sm xs:text-lg sm:text-xl text-white/90 drop-shadow">
            Discover the champions who once ruled the track — book a visit, or support their care from afar.
          </p>
        </div>
      </section>

      {/* Mission Blurb - short "why this exists" statement before anything else */}
      <section className="max-w-4xl mx-auto px-4 xs:px-6 sm:px-8 py-20 sm:py-24 text-center">
        <h2
          style={{ fontFamily: 'var(--font-story-title)' }}
          className="text-2xl xs:text-3xl sm:text-4xl font-semibold tracking-wide text-brand-gold mb-6"
        >
          Why Furlong
        </h2>
        <p className="text-brand-muted text-base xs:text-lg sm:text-xl leading-relaxed">
          Every year, thousands of racehorses retire from the track into the care of farms
          across the country — whether they're out to pasture or still earning their keep at
          stud. Furlong is where you find them — browse the farms already caring for these
          horses, book a visit to meet one in person, or donate to support their day-to-day
          care.
        </p>
      </section>

      {/* How It Works - 3-step explainer for first-time visitors */}
      <section className="bg-brand-surface border-y border-brand-border">
        <div className="max-w-6xl mx-auto px-4 xs:px-6 sm:px-8 py-20 sm:py-24">
          <h2
            style={{ fontFamily: 'var(--font-story-title)' }}
            className="text-2xl xs:text-3xl sm:text-4xl font-semibold tracking-wide text-brand-gold text-center mb-16"
          >
            How It Works
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-14">
            {HOW_IT_WORKS_STEPS.map(({ icon: Icon, title, description }) => (
              <div key={title} className="flex flex-col items-center text-center gap-4">
                <span className="flex items-center justify-center w-20 h-20 rounded-full bg-brand-gold/10 text-brand-gold">
                  <Icon className="h-9 w-9" />
                </span>
                <h3 className="text-lg font-bold text-brand-text">{title}</h3>
                <p className="text-base text-brand-muted">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 xs:px-6 sm:px-8 py-16 sm:py-20">

        {/* Farms Section Zone */}

        {/* Farms Section Header - Header text & Button link to the list of all farms  */}
        <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between mb-6 sm:mb-8">
          <h1 className="text-xl xs:text-2xl sm:text-3xl 2xl:text-4xl font-extrabold text-brand-gold">Farms Open to Visitors</h1>
          <Link to="/farms" className="text-xs sm:text-sm font-bold text-brand-gold border border-brand-gold rounded-full px-4 py-1.5 hover:bg-brand-gold hover:text-brand-bg transition shrink-0">Browse all farms</Link>
        </div>

        {/* Farms Section Content */}

        {/* Show when the farm content is loading */}
        {loading && <p className="text-brand-muted text-sm">Loading...</p>}

        {/* Show when there is an error loading farms */}
        {farmsError && <p className="text-red-600 text-sm">{farmsError}</p>}

        {/* Show when there are no active farms */}
        {!loading && !farmsError && farms.length === 0 && (
          <p className="text-brand-muted text-sm">No active farms yet.</p>
        )}

        {/* Show Carousel of active farms if there are any */}
        {/* Maximum at 12 farms */}
        <CardRow>
          {farms.slice(0, 12).map(farm => (
            <OverlayCard
              key={farm.id}
              to={`/farms/${farm.id}`}
              imageUrl={farm.images?.[0]?.image_url}
              title={farm.name}
              aspect="aspect-[5/4]"
            />
          ))}
        </CardRow>

        {/* Horses Section Content */}

        {/* Horses Section Header - Header text & Button link to the list of all horses  */}
        <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between mb-6 sm:mb-8 mt-12 sm:mt-16">
          <h1 className="text-xl xs:text-2xl sm:text-3xl 2xl:text-4xl font-extrabold text-brand-gold">Champions in Retirement</h1>
          <Link to="/horses" className="text-xs sm:text-sm font-bold text-brand-gold border border-brand-gold rounded-full px-4 py-1.5 hover:bg-brand-gold hover:text-brand-bg transition shrink-0">Meet every champion</Link>
        </div>

        {/* Show when the horse content is loading */}
        {loading && <p className="text-brand-muted text-sm">Loading...</p>}

        {/* Show when there is an error loading horses */}
        {horsesError && <p className="text-red-600 text-sm">{horsesError}</p>}

        {/* Show when there are no horses listed */}
        {!loading && !horsesError && approvedHorses.length === 0 && (
          <p className="text-brand-muted text-sm">No horses listed yet.</p>
        )}

        {/* Show Carousel of approved horses if there are any */}
        {/* Maximum at 12 horses */}
        <CardRow direction="right">
          {approvedHorses.slice(0, 12).map(horse => (
            <OverlayCard
              key={horse.id}
              to={`/horses/${horse.id}`}
              imageUrl={horse.images[0]?.image_url}
              title={horse.name}
              aspect="aspect-[5/4]"
            />
          ))}
        </CardRow>

        {/* Meet/Support CTAs - surface the booking and donation flows, which
            otherwise only appear once you're already on a horse's or farm's
            page */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-16">
          <div className="relative overflow-hidden bg-brand-surface border border-brand-border rounded-2xl shadow-sm p-6 xs:p-8 lg:p-12 flex flex-col items-center gap-4 text-center">
            <div
              aria-hidden
              className="absolute top-0 inset-x-0 h-1.5 bg-linear-to-r from-brand-gold/30 via-brand-gold to-brand-gold/30"
            />
            <span className="flex items-center justify-center w-14 h-14 rounded-full bg-brand-gold/10 text-brand-gold">
              <HorseshoeIcon className="h-6 w-6" />
            </span>
            <h2
              style={{ fontFamily: 'var(--font-story-title)' }}
              className="text-xl xs:text-2xl sm:text-3xl font-semibold tracking-wide text-brand-gold"
            >
              Meet a Retired Champion
            </h2>
            <p className="text-brand-muted max-w-2xl">
              Every horse has a story worth hearing in person. Browse our champions and book a
              visit to meet one at their farm.
            </p>
            <Link
              to="/horses"
              className="mt-auto text-sm font-bold text-brand-gold border border-brand-gold rounded-full px-6 py-2 hover:bg-brand-gold hover:text-brand-bg transition"
            >
              Find a Champion to Meet
            </Link>
          </div>

          <div className="relative overflow-hidden bg-brand-surface border border-brand-border rounded-2xl shadow-sm p-6 xs:p-8 lg:p-12 flex flex-col items-center gap-4 text-center">
            <div
              aria-hidden
              className="absolute top-0 inset-x-0 h-1.5 bg-linear-to-r from-brand-gold/30 via-brand-gold to-brand-gold/30"
            />
            <span className="flex items-center justify-center w-14 h-14 rounded-full bg-brand-gold/10 text-brand-gold">
              <HandCoins className="h-6 w-6" />
            </span>
            <h2
              style={{ fontFamily: 'var(--font-story-title)' }}
              className="text-xl xs:text-2xl sm:text-3xl font-semibold tracking-wide text-brand-gold"
            >
              Support a Retired Champion
            </h2>
            <p className="text-brand-muted max-w-2xl">
              Not everyone can visit in person. Your donation goes directly to the farm caring for
              these horses — covering feed, vet care, and daily upkeep.
            </p>
            <Link
              to="/farms"
              className="mt-auto text-sm font-bold text-brand-gold border border-brand-gold rounded-full px-6 py-2 hover:bg-brand-gold hover:text-brand-bg transition"
            >
              Find a Farm to Support
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default HomePage
