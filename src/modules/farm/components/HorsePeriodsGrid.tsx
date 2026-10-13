import { useState } from 'react'
import { X } from 'lucide-react'
import type { Horse } from '../api/horse'
import {
  PERIODS,
  saveHorsePeriods,
  type Period,
} from '../api/availability'

type Capacities = Record<Period, number>
type PeriodsByHorse = Record<number, Capacities>

const EMPTY_CAPACITIES: Capacities = { morning: 0, afternoon: 0, evening: 0 }

const sameCapacities = (a: Capacities, b: Capacities) =>
  PERIODS.every(p => (a[p.key] || 0) === (b[p.key] || 0))

// Coerce each period's capacity to a real number — the API can hand back a
// zero-padded string (e.g. "05"), which a controlled number input would
// otherwise render verbatim instead of normalizing it to "5".
const periodsFromHorses = (horses: Horse[]): PeriodsByHorse =>
  Object.fromEntries(
    horses.map(h => [
      h.id,
      {
        morning: Number(h.periods?.morning) || 0,
        afternoon: Number(h.periods?.afternoon) || 0,
        evening: Number(h.periods?.evening) || 0,
      },
    ])
  )

// Only an approved horse is actually visible/bookable to visitors, so a
// draft, pending, or rejected horse has nothing meaningful to configure
// periods for yet — hide it entirely rather than showing it disabled.
function HorsePeriodsGrid({
  horses: allHorses,
  openPeriods,
  locked = false,
  onEditingChange,
}: {
  horses: Horse[]
  openPeriods: Period[]
  // Disables the Edit button while some other section (e.g. the farm
  // schedule editor) is mid-edit, so only one thing can be edited at a time.
  locked?: boolean
  onEditingChange?: (editing: boolean) => void
}) {
  const horses = allHorses.filter(h => h.status === 'approved')

  // `committed` is what's saved; `draft` is the working copy while editing.
  const [committed, setCommitted] = useState<PeriodsByHorse>(() => periodsFromHorses(horses))
  const [draft, setDraft] = useState<PeriodsByHorse>(committed)
  const [isEditing, setIsEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  // Re-sync from the horses prop when it changes (e.g. the dashboard finishes
  // loading them) — adjusting state during render rather than in an effect, and
  // never clobbering an in-progress edit. After a save `committed` diverges from
  // the (possibly stale) prop until the parent refetches, so this only runs when
  // the prop reference actually changes.
  const [syncedHorses, setSyncedHorses] = useState(allHorses)
  if (allHorses !== syncedHorses && !isEditing) {
    setSyncedHorses(allHorses)
    const next = periodsFromHorses(horses)
    setCommitted(next)
    setDraft(next)
  }

  function setCapacity(horseId: number, period: Period, value: number) {
    const capacity = Number.isFinite(value) ? Math.max(0, Math.trunc(value)) : 0
    setDraft(prev => ({
      ...prev,
      [horseId]: { ...(prev[horseId] ?? EMPTY_CAPACITIES), [period]: capacity },
    }))
  }

  function handleEdit() {
    setDraft(committed)
    setSaveError(null)
    setIsEditing(true)
    onEditingChange?.(true)
  }

  function handleCancel() {
    setDraft(committed)
    setSaveError(null)
    setIsEditing(false)
    onEditingChange?.(false)
  }

  async function handleSave() {
    setSaving(true)
    setSaveError(null)
    try {
      // Only PUT the horses whose periods actually changed.
      await Promise.all(
        horses
          .filter(h => !sameCapacities(committed[h.id] ?? EMPTY_CAPACITIES, draft[h.id] ?? EMPTY_CAPACITIES))
          .map(h => saveHorsePeriods(h.id, draft[h.id] ?? EMPTY_CAPACITIES))
      )
      setCommitted(draft)
      setIsEditing(false)
      onEditingChange?.(false)
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to save.')
    } finally {
      setSaving(false)
    }
  }

  if (horses.length === 0) {
    return (
      <p className="text-brand-muted text-sm">
        Add a horse first, then choose which periods it can be visited in.
      </p>
    )
  }

  const view = isEditing ? draft : committed

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-3">
        {!isEditing ? (
          <button
            onClick={handleEdit}
            disabled={locked}
            title={locked ? 'Finish editing the other section first' : undefined}
            className="bg-brand-gold text-brand-bg font-bold px-4 py-2 rounded-lg hover:bg-brand-gold-light transition text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Edit
          </button>
        ) : (
          <>
            <button
              onClick={handleSave}
              disabled={saving}
              className="bg-brand-gold text-brand-bg font-bold px-4 py-2 rounded-lg hover:bg-brand-gold-light transition text-sm disabled:opacity-50"
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
            <button
              onClick={handleCancel}
              disabled={saving}
              className="flex items-center gap-1 text-brand-muted hover:text-brand-text text-sm font-bold px-4 py-2 rounded-lg border border-brand-border transition"
            >
              <X size={14} /> Cancel
            </button>
          </>
        )}
      </div>

      {saveError && <p className="text-red-600 text-sm">{saveError}</p>}

      <div className="rounded-lg border border-brand-border overflow-hidden">
        {/* Scroll lives on its own inner element, separate from the rounded
            border above (see HorseRaceRecords for why), with a min-w so the
            table actually overflows and scrolls instead of squeezing its
            columns down on a narrow screen. */}
        <div className="overflow-x-auto mask-[linear-gradient(to_right,black_calc(100%-2rem),transparent)] lg:mask-none">
          <table className="w-full min-w-150 text-sm">
          <thead>
            <tr className="bg-brand-surface border-b border-brand-border text-brand-muted text-xs uppercase">
              <th className="text-left px-4 py-3 font-bold">Horse</th>
              {PERIODS.map(p => {
                const closed = !openPeriods.includes(p.key)
                return (
                  <th
                    key={p.key}
                    className={`px-4 py-3 font-bold text-center ${closed ? 'opacity-40' : ''}`}
                    title={closed ? 'Closed in the farm schedule' : undefined}
                  >
                    {p.label}
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody>
            {horses.map(horse => {
              const capacities = view[horse.id] ?? EMPTY_CAPACITIES
              return (
                <tr key={horse.id} className="border-b border-brand-border last:border-0">
                  <td className="px-4 py-3 font-bold text-brand-text">{horse.name}</td>
                  {PERIODS.map(p => {
                    const farmOpen = openPeriods.includes(p.key)
                    const disabled = !isEditing || !farmOpen || saving
                    return (
                      <td key={p.key} className="p-0 text-center">
                        <input
                          type="number"
                          min={0}
                          max={99}
                          step={1}
                          // A period the farm has closed always shows 0 for every
                          // horse; inputs are only editable in edit mode.
                          value={farmOpen ? capacities[p.key] || 0 : 0}
                          disabled={disabled}
                          onChange={e => setCapacity(horse.id, p.key, e.target.valueAsNumber)}
                          // Number inputs otherwise change value on scroll (while
                          // focused) and on ArrowUp/ArrowDown, on top of the spin
                          // buttons already hidden below - blur/preventDefault so
                          // typing is the only way to change it, like a normal input.
                          onWheel={e => e.currentTarget.blur()}
                          onKeyDown={e => {
                            if (e.key === 'ArrowUp' || e.key === 'ArrowDown') e.preventDefault()
                          }}
                          aria-label={`${horse.name} — ${p.label} capacity`}
                          title={farmOpen ? 'Max visitors for this period' : 'Closed in the farm schedule'}
                          className="w-full h-full bg-brand-bg px-4 py-3 text-center text-brand-text text-sm focus:outline-none focus:bg-brand-surface focus:ring-2 focus:ring-inset focus:ring-brand-gold disabled:opacity-40 disabled:cursor-not-allowed [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                        />
                      </td>
                    )
                  })}
                </tr>
              )
            })}
          </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default HorsePeriodsGrid
