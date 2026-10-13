import { useState, useEffect } from 'react'
import { CalendarClock, X } from 'lucide-react'
import {
  WEEKDAY_LABELS,
  PERIODS,
  getFarmAvailability,
  saveFarmAvailability,
  validatePeriodSchedule,
  formatTime,
  timeOptions,
  toMinutes,
  fromMinutes,
  type FarmAvailability,
  type Period,
  type PeriodDef,
  type PeriodSchedule,
} from '../api/availability'

const STEP_MIN = 15 // dropdown granularity

// The farm's visit schedule: which weekdays it's open, and for each period of
// the day whether it's open and its single time range. Read-only until the
// farmer clicks Edit. `onChange` reports the loaded/saved schedule so the parent
// can reflect which periods are open (e.g. to disable closed periods elsewhere).
function FarmAvailabilityEditor({
  onChange,
  locked = false,
  onEditingChange,
}: {
  onChange?: (schedule: FarmAvailability) => void
  // Disables the Edit button while some other section (e.g. the horse
  // periods grid) is mid-edit, so only one thing can be edited at a time.
  locked?: boolean
  onEditingChange?: (editing: boolean) => void
}) {
  // `committed` is what's saved on the server; `draft` is the working copy while
  // editing. Both null until the initial load resolves.
  const [committed, setCommitted] = useState<FarmAvailability | null>(null)
  const [draft, setDraft] = useState<FarmAvailability | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  // Raw text of the minimum-notice field while it's being typed — lets the box
  // go empty mid-edit instead of snapping back to a clamped number on every
  // keystroke. Reconciled into `draft.min_lead_days` on blur; null means "not
  // actively being typed in", so it falls back to showing the draft's value.
  const [leadDaysText, setLeadDaysText] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  useEffect(() => {
    getFarmAvailability()
      .then(a => {
        setCommitted(a)
        setDraft(a)
        onChange?.(a)
      })
      .catch(err =>
        setLoadError(err instanceof Error ? err.message : 'Failed to load schedule.')
      )
      .finally(() => setLoading(false))
    // Load once on mount; onChange is a stable setter from the parent.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function toggleWeekday(day: number) {
    setDraft(d =>
      d
        ? {
            ...d,
            weekdays: d.weekdays.includes(day)
              ? d.weekdays.filter(x => x !== day)
              : [...d.weekdays, day].sort((a, b) => a - b),
          }
        : d
    )
  }

  function setPeriod(period: Period, patch: Partial<PeriodSchedule>) {
    setDraft(d =>
      d ? { ...d, periods: { ...d.periods, [period]: { ...d.periods[period], ...patch } } } : d
    )
  }

  // Changing the start time may push it at/past the end; bump the end to keep it
  // after the start (clamped to the window).
  function changeStart(def: PeriodDef, value: string) {
    setDraft(d => {
      if (!d) return d
      const sched = d.periods[def.key]
      const startMin = toMinutes(value)
      let endMin = toMinutes(sched.end)
      if (endMin <= startMin) endMin = Math.min(startMin + STEP_MIN, toMinutes(def.window.end))
      return {
        ...d,
        periods: { ...d.periods, [def.key]: { ...sched, start: value, end: fromMinutes(endMin) } },
      }
    })
  }

  // The minimum-notice field's raw text (leadDaysText while being typed,
  // otherwise the draft's committed number) and whether it's currently valid.
  const leadDaysRaw = leadDaysText ?? String(draft?.min_lead_days ?? '')
  const leadDaysNum = Number(leadDaysRaw)
  const leadDaysError =
    leadDaysRaw.trim() === '' || Number.isNaN(leadDaysNum) || leadDaysNum < 1
      ? 'Minimum notice must be at least 1 day.'
      : leadDaysNum > 90
      ? 'Minimum notice must be 90 days or fewer.'
      : null

  const periodsHaveErrors =
    !!draft &&
    draft.enabled &&
    PERIODS.some(p => {
      const sched = draft.periods[p.key]
      return sched.open && validatePeriodSchedule(sched, p) !== null
    })

  const hasErrors = periodsHaveErrors || (isEditing && leadDaysError !== null)

  function handleEdit() {
    setDraft(committed)
    setSaveError(null)
    setLeadDaysText(null)
    setIsEditing(true)
    onEditingChange?.(true)
  }

  function handleCancel() {
    setDraft(committed)
    setSaveError(null)
    setLeadDaysText(null)
    setIsEditing(false)
    onEditingChange?.(false)
  }

  async function handleSave() {
    if (!draft || hasErrors) return
    setSaving(true)
    setSaveError(null)
    try {
      const saved = await saveFarmAvailability(draft)
      setCommitted(saved)
      setDraft(saved)
      setLeadDaysText(null)
      setIsEditing(false)
      onEditingChange?.(false)
      onChange?.(saved)
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to save schedule.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="bg-brand-surface border border-brand-border rounded-lg p-4 xs:p-6 text-brand-muted text-sm">
        Loading schedule…
      </div>
    )
  }

  if (loadError || !committed) {
    return (
      <div className="bg-red-500/10 border border-red-500/40 text-red-600 rounded-lg p-4 xs:p-6 text-sm font-medium">
        {loadError ?? 'Failed to load schedule.'}
      </div>
    )
  }

  // Values shown depend on mode: the draft while editing, otherwise the saved one.
  const view = isEditing ? draft ?? committed : committed

  return (
    <div className="bg-brand-surface border border-brand-border rounded-lg p-4 xs:p-6 flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <CalendarClock size={18} className="text-brand-gold" />
          <h3 className="text-lg font-bold text-brand-text">Farm schedule</h3>
        </div>
        {!isEditing && (
          <button
            onClick={handleEdit}
            disabled={locked}
            title={locked ? 'Finish editing the other section first' : undefined}
            className="bg-brand-gold text-brand-bg font-bold px-4 py-2 rounded-lg hover:bg-brand-gold-light transition text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Edit schedule
          </button>
        )}
      </div>

      {isEditing ? (
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={view.enabled}
            onChange={e => setDraft(d => (d ? { ...d, enabled: e.target.checked } : d))}
            className="h-4 w-4 accent-brand-gold"
          />
          <span className="text-sm font-bold text-brand-text">Open for visit bookings</span>
        </label>
      ) : (
        <p className="text-sm font-bold text-brand-text">
          Open for visit bookings:{' '}
          <span className={committed.enabled ? 'text-green-600' : 'text-brand-muted'}>
            {committed.enabled ? 'Yes' : 'No'}
          </span>
        </p>
      )}

      {/* Minimum notice — how many days ahead a visitor must book */}
      {isEditing ? (
        <div className="flex flex-col gap-1.5">
          <label className="flex items-center gap-3">
            <span className="text-sm font-bold text-brand-text">Minimum notice</span>
            <input
              type="number"
              min={1}
              max={90}
              value={leadDaysRaw}
              onChange={e => setLeadDaysText(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'ArrowUp' || e.key === 'ArrowDown') e.preventDefault()
              }}
              onWheel={e => e.currentTarget.blur()}
              onBlur={() => {
                if (leadDaysError) return
                setDraft(d => (d ? { ...d, min_lead_days: leadDaysNum } : d))
                setLeadDaysText(null)
              }}
              className={`w-20 bg-brand-bg border rounded-lg px-3 py-1.5 text-brand-text text-sm focus:outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none ${
                leadDaysError ? 'border-red-500/60 focus:border-red-500' : 'border-brand-border focus:border-brand-gold'
              }`}
            />
            <span className="text-sm text-brand-muted">
              day{leadDaysNum === 1 ? '' : 's'} ahead
            </span>
          </label>
          {leadDaysError && <p className="text-red-600 text-xs">{leadDaysError}</p>}
        </div>
      ) : (
        <p className="text-sm font-bold text-brand-text">
          Minimum notice:{' '}
          <span className="text-brand-muted font-normal">
            {committed.min_lead_days === 0
              ? 'None — same-day booking allowed'
              : `${committed.min_lead_days} day${committed.min_lead_days === 1 ? '' : 's'} ahead`}
          </span>
        </p>
      )}

      <fieldset
        disabled={!view.enabled}
        className={`flex flex-col gap-6 border-0 p-0 m-0 ${view.enabled ? '' : 'opacity-40'}`}
      >
        {/* Weekdays */}
        <div className="flex flex-col gap-2">
          <span className="text-xs font-bold text-brand-muted uppercase">Available days</span>
          <div className="flex flex-wrap gap-2">
            {WEEKDAY_LABELS.map((label, day) => {
              const on = view.weekdays.includes(day)
              const base = `w-11 xs:w-14 rounded-lg py-2 text-center text-sm font-bold border transition ${
                on
                  ? 'bg-brand-gold text-brand-bg border-brand-gold'
                  : 'border-brand-border text-brand-text'
              }`
              return isEditing ? (
                <button
                  key={day}
                  type="button"
                  onClick={() => toggleWeekday(day)}
                  className={`${base} ${on ? '' : 'hover:border-brand-gold'}`}
                >
                  {label}
                </button>
              ) : (
                <span key={day} className={`${base} ${on ? '' : 'text-brand-muted'}`}>
                  {label}
                </span>
              )
            })}
          </div>
        </div>

        {/* One time range per period */}
        <div className="flex flex-col gap-4">
          <span className="text-xs font-bold text-brand-muted uppercase">Times</span>
          {PERIODS.map(def => {
            const sched = view.periods[def.key]
            const error = isEditing && sched.open ? validatePeriodSchedule(sched, def) : null
            return (
              <div
                key={def.key}
                className="rounded-lg border border-brand-border bg-brand-bg p-4 flex flex-col gap-3"
              >
                {isEditing ? (
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={sched.open}
                      onChange={e => setPeriod(def.key, { open: e.target.checked })}
                      className="h-4 w-4 accent-brand-gold"
                    />
                    <span className="text-sm font-bold text-brand-text">
                      {def.label}{' '}
                      <span className="text-brand-muted font-normal">
                        ({formatTime(def.window.start)}–{formatTime(def.window.end)})
                      </span>
                    </span>
                  </label>
                ) : (
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-sm font-bold text-brand-text">
                      {def.label}{' '}
                      <span className="text-brand-muted font-normal">
                        ({formatTime(def.window.start)}–{formatTime(def.window.end)})
                      </span>
                    </span>
                    <span className={`text-sm font-bold ${sched.open ? 'text-brand-text' : 'text-brand-muted'}`}>
                      {sched.open ? `${formatTime(sched.start)}–${formatTime(sched.end)}` : 'Closed'}
                    </span>
                  </div>
                )}

                {isEditing && sched.open && (
                  <div className="flex flex-col gap-1 pl-7">
                    <div className="flex flex-wrap items-center gap-2">
                      {/* Start: any time in the window except the very last slot */}
                      <select
                        value={sched.start}
                        onChange={e => changeStart(def, e.target.value)}
                        className="bg-brand-surface border border-brand-border rounded-lg px-2 py-1.5 text-brand-text text-sm focus:outline-none focus:border-brand-gold"
                      >
                        {timeOptions(def.window.start, def.window.end, STEP_MIN)
                          .slice(0, -1)
                          .map(t => (
                            <option key={t} value={t}>
                              {formatTime(t)}
                            </option>
                          ))}
                      </select>
                      <span className="text-brand-muted text-sm">to</span>
                      {/* End: only times after the chosen start, up to the window end */}
                      <select
                        value={sched.end}
                        onChange={e => setPeriod(def.key, { end: e.target.value })}
                        className="bg-brand-surface border border-brand-border rounded-lg px-2 py-1.5 text-brand-text text-sm focus:outline-none focus:border-brand-gold"
                      >
                        {timeOptions(sched.start, def.window.end, STEP_MIN)
                          .slice(1)
                          .map(t => (
                            <option key={t} value={t}>
                              {formatTime(t)}
                            </option>
                          ))}
                      </select>
                    </div>
                    {error && <p className="text-red-600 text-xs">{error}</p>}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </fieldset>

      {isEditing && (
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleSave}
              disabled={hasErrors || saving}
              className="bg-brand-gold text-brand-bg font-bold px-4 py-2 rounded-lg hover:bg-brand-gold-light transition text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving…' : 'Save schedule'}
            </button>
            <button
              onClick={handleCancel}
              disabled={saving}
              className="flex items-center gap-1 text-brand-muted hover:text-brand-text text-sm font-bold px-4 py-2 rounded-lg border border-brand-border transition"
            >
              <X size={14} /> Cancel
            </button>
            {hasErrors && (
              <span className="text-red-600 text-sm font-bold">
                {periodsHaveErrors ? 'Fix the highlighted times first.' : 'Fix the minimum notice first.'}
              </span>
            )}
          </div>
          {saveError && <p className="text-red-600 text-sm">{saveError}</p>}
        </div>
      )}
    </div>
  )
}

export default FarmAvailabilityEditor
