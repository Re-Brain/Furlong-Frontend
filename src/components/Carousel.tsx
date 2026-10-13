import { useRef, useEffect, useState, type ReactNode } from 'react'

type CarouselProps = {
  children: ReactNode
  /** Auto-scroll speed in pixels per second. */
  speed?: number
  /** Auto-scroll direction: 'left' moves items leftward, 'right' rightward. */
  direction?: 'left' | 'right'
}

// Horizontal carousel that continuously auto-scrolls (marquee) and can also be
// dragged by hand.
//
// Behaviour:
//   • Auto-scroll — drifts at `speed` px/s toward `direction`, pausing while the
//     pointer hovers or drags, and disabled entirely under prefers-reduced-motion.
//   • Mouse drag — click and move left/right to scroll; a drag past a ~5px
//     threshold suppresses the trailing click so dragging over a card doesn't
//     navigate its Link.
//   • Touch/pen — left to the browser's native momentum scrolling; only mouse
//     drags are hijacked.
//
// Looping: only kicks in when the content overflows. The children are rendered
// three times so there's a full copy of runway on each side of the middle one;
// we keep the scroll position parked in that middle copy and snap it back by one
// copy-width before it can hit either edge, giving a seamless, jump-free loop.
// (See `wrap` — the browser clamps scrollLeft at 0 and at max, so we never let
// it reach either boundary.)
function Carousel({ children, speed = 40, direction = 'left' }: CarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const track1Ref = useRef<HTMLDivElement>(null)
  const track2Ref = useRef<HTMLDivElement>(null)
  const [loop, setLoop] = useState(false)

  const dragging = useRef(false)
  const moved = useRef(false)
  const hovering = useRef(false)
  // Touch/pen scrolling is native (see onPointerDown) so it never sets
  // `dragging`, and hover doesn't reliably fire on touchscreens either -
  // without this, the marquee below has no way to know a touch drag is in
  // progress and keeps resetting scrollLeft every frame, fighting the
  // user's own drag.
  const touching = useRef(false)
  const startX = useRef(0)
  const startScroll = useRef(0)
  const pointerId = useRef<number | null>(null)
  // Authoritative scroll position kept as a float. Reading it back from
  // el.scrollLeft each frame loses sub-pixel steps to browser rounding, which
  // at ~0.6px/frame stalls the marquee entirely — so we accumulate here.
  const pos = useRef(0)

  // The marquee (auto-scroll + infinite loop) only makes sense for a mouse,
  // where it never has to compete with anything. On a touch-primary device
  // it kept fighting the user's own drag in new ways no matter what we
  // patched (the auto-scroll resetting scrollLeft mid-drag, then snapping
  // back to a stale position once the drag ended) — simpler and more robust
  // to just not run it there at all and let the row be a plain, natively
  // scrollable one instead.
  const isTouchDevice = window.matchMedia('(pointer: coarse)').matches

  // Only enable the duplicated track + auto-scroll when content overflows
  // (and never on a touch-primary device - see isTouchDevice above).
  useEffect(() => {
    const el = scrollRef.current
    const track = track1Ref.current
    if (!el || !track) return
    const update = () => setLoop(!isTouchDevice && track.scrollWidth > el.clientWidth + 1)
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    ro.observe(track)
    return () => ro.disconnect()
  }, [children, isTouchDevice])

  // Distance from the start of the first track to the start of its duplicate —
  // the point at which we can reset scrollLeft for a seamless loop.
  function loopDistance() {
    const a = track1Ref.current
    const b = track2Ref.current
    if (!a || !b) return 0
    return b.offsetLeft - a.offsetLeft
  }

  // Keep the scroll position parked in the middle copy so there's a full copy
  // of runway on both sides — the browser clamps scrollLeft at 0 and at the max,
  // and staying centered means we never reach either edge (which is what made
  // dragging left get stuck).
  function wrap(el: HTMLDivElement) {
    const d = loopDistance()
    if (d <= 0) return
    const max = el.scrollWidth - el.clientWidth
    const center = (max - d) / 2
    if (pos.current < center) pos.current += d
    else if (pos.current >= center + d) pos.current -= d
    el.scrollLeft = pos.current
  }

  // Start in the middle copy once the loop (and its extra tracks) exist.
  useEffect(() => {
    const el = scrollRef.current
    if (!loop || !el) return
    pos.current = loopDistance()
    el.scrollLeft = pos.current
  }, [loop])

  useEffect(() => {
    if (!loop) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const dir = direction === 'right' ? -1 : 1
    let raf = 0
    let last = performance.now()
    const tick = (now: number) => {
      const dt = (now - last) / 1000
      last = now
      const el = scrollRef.current
      if (el && !dragging.current && !hovering.current && !touching.current) {
        pos.current += dir * speed * dt
        el.scrollLeft = pos.current
        wrap(el)
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [loop, speed, direction])

  function onPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    // Let touch/pen use native scrolling; only hijack mouse drags. Still
    // track that a touch/pen scroll is active so the marquee pauses for it.
    if (e.pointerType !== 'mouse') {
      touching.current = true
      return
    }
    const el = scrollRef.current
    if (!el) return
    pointerId.current = e.pointerId
    dragging.current = false
    moved.current = false
    startX.current = e.clientX
    startScroll.current = el.scrollLeft
    // Note: capture is deferred until an actual drag begins — capturing on a
    // plain click would retarget the click to this container and stop the card
    // Link from navigating.
  }

  function onPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (pointerId.current !== e.pointerId) return
    const el = scrollRef.current
    if (!el) return
    const dx = e.clientX - startX.current
    if (!dragging.current) {
      if (Math.abs(dx) <= 5) return // below threshold: still a potential click
      dragging.current = true
      moved.current = true
      el.setPointerCapture(e.pointerId)
    }
    pos.current = startScroll.current - dx
    el.scrollLeft = pos.current
    if (loop) wrap(el)
  }

  function endDrag(e: React.PointerEvent<HTMLDivElement>) {
    if (e.pointerType !== 'mouse') {
      touching.current = false
      return
    }
    if (pointerId.current !== e.pointerId) return
    pointerId.current = null
    if (dragging.current) {
      dragging.current = false
      scrollRef.current?.releasePointerCapture(e.pointerId)
    }
  }

  // Runs in the capture phase (before the card's own click), so a drag can
  // cancel the navigation a Link would otherwise trigger.
  function onClickCapture(e: React.MouseEvent<HTMLDivElement>) {
    if (moved.current) {
      e.preventDefault()
      e.stopPropagation()
      moved.current = false
    }
  }

  return (
    <div
      ref={scrollRef}
      // Lenis (App.tsx) intercepts scroll/touch gestures globally and only
      // leaves an element alone if it's marked like this - without it, Lenis
      // was fighting this carousel's own native touch handling the whole
      // time, independent of the marquee-pause and touch-action fixes above.
      data-lenis-prevent
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onClickCapture={onClickCapture}
      onDragStart={e => e.preventDefault()}
      onPointerEnter={() => { hovering.current = true }}
      onPointerLeave={() => { hovering.current = false }}
      // Without this, a real touchscreen has to guess whether a drag here
      // means "scroll this row sideways" or "scroll the page" - pan-x tells
      // it horizontal gestures belong to this element, so dragging feels
      // immediate instead of sluggish/fighting the page scroll.
      className="flex gap-3 overflow-x-auto py-2 cursor-grab active:cursor-grabbing select-none touch-pan-x [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      {/* Three identical copies when looping: the first is the "real" content;
          the middle (track2) is where we park the scroll position; the third
          provides runway on the right so a rightward drift never runs out of
          content before wrap() snaps back. Copies 2 and 3 are aria-hidden so
          screen readers announce the children only once. */}
      <div ref={track1Ref} className="flex gap-3 shrink-0">
        {children}
      </div>
      {loop && (
        <>
          <div ref={track2Ref} aria-hidden className="flex gap-3 shrink-0">
            {children}
          </div>
          <div aria-hidden className="flex gap-3 shrink-0">
            {children}
          </div>
        </>
      )}
    </div>
  )
}

export default Carousel
