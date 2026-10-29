import { Children, type ReactNode } from 'react'
import Carousel from './Carousel'
import { useMediaQuery } from '../hooks/useMediaQuery'

type CardRowProps = {
  /** One element per card. */
  children: ReactNode
  /** Marquee direction on desktop. */
  direction?: 'left' | 'right'
}

// Lays a list of cards out to suit the screen:
//   • phone (<640px)    — a snap-scrolling swipe row; cards are ~78% wide so the
//                         next one peeks in, hinting that the row scrolls.
//   • tablet (640-1023) — a 3-column grid of the first six cards (the section's
//                         "see all" link covers the rest).
//   • desktop (1024+)   — the auto-scrolling marquee Carousel.
function CardRow({ children, direction }: CardRowProps) {
  const isDesktop = useMediaQuery('(min-width: 1024px)')
  const isTablet = useMediaQuery('(min-width: 640px)')
  const cards = Children.toArray(children)

  if (isDesktop) {
    return (
      <Carousel direction={direction}>
        {cards.map((card, i) => (
          <div key={i} className="flex-none w-56">
            {card}
          </div>
        ))}
      </Carousel>
    )
  }

  if (isTablet) {
    return (
      <div className="grid grid-cols-3 gap-4">
        {cards.slice(0, 6).map((card, i) => (
          <div key={i}>{card}</div>
        ))}
      </div>
    )
  }

  return (
    <div
      data-lenis-prevent
      className="flex gap-3 overflow-x-auto snap-x snap-mandatory px-1 -mx-1 py-2 touch-pan-x [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      {cards.map((card, i) => (
        <div key={i} className="flex-none w-[78%] snap-start">
          {card}
        </div>
      ))}
    </div>
  )
}

export default CardRow
