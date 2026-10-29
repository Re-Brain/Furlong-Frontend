import { useState } from 'react'

// Reveals `items` in batches of `step`: starts with the first `step` and adds
// another batch each time `showMore` is called. `remaining` is how many are
// still hidden, so callers can hide the button when it reaches 0.
export function useShowMore<T>(items: T[], step = 12) {
  const [count, setCount] = useState(step)

  return {
    visible: items.slice(0, count),
    remaining: Math.max(0, items.length - count),
    showMore: () => setCount(c => c + step),
  }
}
