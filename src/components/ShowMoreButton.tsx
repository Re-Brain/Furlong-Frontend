type ShowMoreButtonProps = {
  /** How many items are still hidden; the button renders nothing at 0. */
  remaining: number
  onClick: () => void
}

// Centred "Show more" button under a card grid, with the hidden count.
function ShowMoreButton({ remaining, onClick }: ShowMoreButtonProps) {
  if (remaining <= 0) return null

  return (
    <div className="flex justify-center mt-8">
      <button
        type="button"
        onClick={onClick}
        className="text-xs sm:text-sm font-bold text-brand-gold border border-brand-gold rounded-full px-6 py-2 hover:bg-brand-gold hover:text-brand-bg transition"
      >
        Show more ({remaining} more)
      </button>
    </div>
  )
}

export default ShowMoreButton
