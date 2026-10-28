import { Check, X, Pencil, FileText, Trophy, Dna, ImageIcon, ShieldCheck } from 'lucide-react'
import { DOCUMENT_TYPES, type Horse } from '../api/horse'
import { PEDIGREE_FIELDS } from '../hooks/useHorseInfoForm'

type Props = {
  horse: Horse
  // Jumps the wizard back to the step where a section can be edited.
  onEdit: (step: 1 | 2) => void
  // Disables the edit links while another section is mid-edit or the horse is locked.
  locked: boolean
}

const MAX_IMAGES = 3

function ageFrom(dob: string | null): string | null {
  if (!dob) return null
  const born = new Date(dob)
  if (Number.isNaN(born.getTime())) return null
  const now = new Date()
  let years = now.getFullYear() - born.getFullYear()
  const beforeBirthday =
    now.getMonth() < born.getMonth() || (now.getMonth() === born.getMonth() && now.getDate() < born.getDate())
  if (beforeBirthday) years -= 1
  return years >= 0 ? `${years} yrs` : null
}

function Section({
  icon,
  title,
  meta,
  onEdit,
  locked,
  children,
}: {
  icon: React.ReactNode
  title: string
  meta?: string
  onEdit?: () => void
  locked: boolean
  children: React.ReactNode
}) {
  return (
    <section className="bg-brand-surface border border-brand-border rounded-xl overflow-hidden">
      <header className="flex items-center justify-between gap-3 px-4 xs:px-6 py-3 border-b border-brand-border">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-brand-gold shrink-0">{icon}</span>
          <h2 className="text-sm font-bold text-brand-text">{title}</h2>
          {meta && <span className="text-xs text-brand-muted">{meta}</span>}
        </div>
        {onEdit && (
          <button
            type="button"
            onClick={onEdit}
            disabled={locked}
            className="flex items-center gap-1 text-xs font-bold text-brand-muted hover:text-brand-gold transition disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Pencil size={12} /> Edit
          </button>
        )}
      </header>
      <div className="p-4 xs:p-6">{children}</div>
    </section>
  )
}

function Stat({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="min-w-0">
      <p className="text-[10px] font-bold uppercase tracking-wide text-brand-muted">{label}</p>
      <p className={`text-sm font-semibold truncate capitalize ${value ? 'text-brand-text' : 'text-brand-muted'}`}>
        {value || '—'}
      </p>
    </div>
  )
}

// One box in the pedigree tree. `tier` controls emphasis: the horse itself is
// gold, parents are solid, grandparents are the quietest.
function PedigreeNode({ label, name, tier }: { label: string; name: string | null; tier: 'horse' | 'parent' | 'grand' }) {
  const styles = {
    horse: 'border-brand-gold bg-brand-gold/10 sm:w-44',
    parent: 'border-brand-border bg-brand-bg sm:w-40',
    grand: 'border-brand-border bg-brand-surface sm:w-36',
  }[tier]
  return (
    <div className={`rounded-lg border px-3 py-2 ${styles}`}>
      <p className="text-[10px] font-bold uppercase tracking-wide text-brand-muted">{label}</p>
      <p className={`text-sm truncate ${name ? 'font-semibold text-brand-text' : 'text-brand-muted'}`} title={name ?? undefined}>
        {name || 'Not provided'}
      </p>
    </div>
  )
}

// A parent plus its two parents, joined by bracket connectors on wider screens
// and indented under the parent on phones.
function PedigreeBranch({
  parent,
  grands,
}: {
  parent: { label: string; name: string | null }
  grands: { label: string; name: string | null }[]
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center">
      <div
        className={`relative sm:after:absolute sm:after:left-full sm:after:top-1/2 sm:after:w-6 sm:after:border-t-2 sm:after:border-brand-border`}
      >
        <PedigreeNode {...parent} tier="parent" />
      </div>
      <div
        className={`relative mt-2 ml-3 pl-3 border-l-2 border-brand-border flex flex-col gap-2 sm:mt-0 sm:ml-6 sm:pl-6 sm:border-l-0`}
      >
        {grands.map((g, i) => (
          <div
            key={g.label}
            className={`relative sm:before:absolute sm:before:right-full sm:before:top-1/2 sm:before:w-6 sm:before:border-t-2 sm:before:border-brand-border sm:after:absolute sm:after:-left-6 sm:after:border-l-2 sm:after:border-brand-border ${i === 0 ? 'sm:after:top-1/2 sm:after:-bottom-2' : 'sm:after:-top-2 sm:after:bottom-1/2'}`}
          >
            <PedigreeNode {...g} tier="grand" />
          </div>
        ))}
      </div>
    </div>
  )
}

function HorseReviewSummary({ horse, onEdit, locked }: Props) {
  const pedigreeFilled = PEDIGREE_FIELDS.filter(({ key }) => horse[key]).length
  const docsAttached = DOCUMENT_TYPES.filter(({ key }) => horse.documents?.some(d => d.document_type === key)).length
  const detailsComplete = !!(horse.color && horse.gender && horse.date_of_birth)
  const age = ageFrom(horse.date_of_birth)
  const cover = horse.images[0]
  const races = [...horse.race_records].sort((a, b) => b.race_date.localeCompare(a.race_date))
  const wins = horse.race_records.filter(r => r.finish_position === 1).length

  // Only documents are required to submit; the rest are flagged as recommended.
  const checklist: { label: string; detail: string; ok: boolean; required: boolean }[] = [
    { label: 'Basic details', detail: detailsComplete ? 'Complete' : 'Color, gender or birth date missing', ok: detailsComplete, required: false },
    { label: 'Pedigree', detail: `${pedigreeFilled}/${PEDIGREE_FIELDS.length} ancestors`, ok: pedigreeFilled === PEDIGREE_FIELDS.length, required: false },
    { label: 'Photos', detail: `${horse.images.length}/${MAX_IMAGES} uploaded`, ok: horse.images.length > 0, required: false },
    { label: 'Proof documents', detail: `${docsAttached}/${DOCUMENT_TYPES.length} attached`, ok: docsAttached === DOCUMENT_TYPES.length, required: true },
  ]

  return (
    <div className="flex flex-col gap-5">
      {/* Hero: cover photo, identity, and quick stats. */}
      <div className="bg-brand-surface border border-brand-border rounded-xl overflow-hidden flex flex-col sm:flex-row">
        <div className="sm:w-80 shrink-0 p-4 xs:p-6 sm:pr-0 flex items-center justify-center">
          {cover ? (
            <img
              src={cover.image_url}
              alt={horse.name}
              className="w-full h-auto rounded-lg border border-brand-border"
            />
          ) : (
            <ImageIcon size={32} className="text-brand-muted" />
          )}
        </div>
        <div className="flex-1 p-4 xs:p-6 flex flex-col gap-4 min-w-0">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wide text-brand-muted">Review your listing</p>
            <h2 className="text-xl xs:text-2xl font-bold text-brand-gold truncate">{horse.name}</h2>
          </div>
          <div className="grid grid-cols-2 xs:grid-cols-4 gap-4">
            <Stat label="Gender" value={horse.gender} />
            <Stat label="Color" value={horse.color} />
            <Stat label="Born" value={horse.date_of_birth} />
            <Stat label="Age" value={age} />
          </div>
          {horse.story && <p className="text-sm text-brand-muted line-clamp-3">{horse.story}</p>}
          <button
            type="button"
            onClick={() => onEdit(1)}
            disabled={locked}
            className="self-start flex items-center gap-1 text-xs font-bold text-brand-muted hover:text-brand-gold transition disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Pencil size={12} /> Edit details
          </button>
        </div>
      </div>

      {/* Readiness checklist. */}
      <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-3">
        {checklist.map(item => (
          <div
            key={item.label}
            className={`flex items-start gap-3 rounded-xl border px-4 py-3 ${
              item.ok
                ? 'border-green-600/30 bg-green-600/5'
                : item.required
                ? 'border-red-500/40 bg-red-500/5'
                : 'border-yellow-500/40 bg-yellow-500/5'
            }`}
          >
            <span
              className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
                item.ok ? 'bg-green-600 text-white' : item.required ? 'bg-red-500 text-white' : 'bg-yellow-500 text-white'
              }`}
            >
              {item.ok ? <Check size={12} /> : <X size={12} />}
            </span>
            <div className="min-w-0">
              <p className="text-sm font-bold text-brand-text">{item.label}</p>
              <p className="text-xs text-brand-muted">{item.detail}</p>
            </div>
          </div>
        ))}
      </div>

      <Section
        icon={<Dna size={16} />}
        title="Pedigree"
        meta={`${pedigreeFilled}/${PEDIGREE_FIELDS.length} filled`}
        onEdit={() => onEdit(1)}
        locked={locked}
      >
        <div className="overflow-x-auto">
          <div className="flex flex-col gap-3 sm:gap-0 sm:flex-row sm:items-center sm:w-max sm:mx-auto">
            <div className="relative sm:after:absolute sm:after:left-full sm:after:top-1/2 sm:after:w-6 sm:after:border-t-2 sm:after:border-brand-border">
              <PedigreeNode label="Horse" name={horse.name} tier="horse" />
            </div>
            <div className="relative flex flex-col gap-4 sm:ml-6 sm:pl-6">
              {[
                { parent: { label: 'Sire', name: horse.sire }, grands: [{ label: "Sire's Sire", name: horse.sires_sire }, { label: "Sire's Dam", name: horse.sires_dam }] },
                { parent: { label: 'Dam', name: horse.dam }, grands: [{ label: "Dam's Sire", name: horse.dams_sire }, { label: "Dam's Dam", name: horse.dams_dam }] },
              ].map((branch, i) => (
                <div
                  key={branch.parent.label}
                  className={`relative sm:before:absolute sm:before:right-full sm:before:top-1/2 sm:before:w-6 sm:before:border-t-2 sm:before:border-brand-border sm:after:absolute sm:after:-left-6 sm:after:border-l-2 sm:after:border-brand-border ${i === 0 ? 'sm:after:top-1/2 sm:after:-bottom-4' : 'sm:after:-top-4 sm:after:bottom-1/2'}`}
                >
                  <PedigreeBranch {...branch} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </Section>

      <Section
        icon={<ImageIcon size={16} />}
        title="Photos"
        meta={`${horse.images.length}/${MAX_IMAGES}`}
        onEdit={() => onEdit(1)}
        locked={locked}
      >
        {horse.images.length === 0 ? (
          <p className="text-sm text-brand-muted">No photos uploaded yet.</p>
        ) : (
          <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 gap-3">
            {horse.images.map(img => (
              <img
                key={img.id}
                src={img.image_url}
                alt={horse.name}
                className="w-full h-auto self-start rounded-lg border border-brand-border"
              />
            ))}
          </div>
        )}
      </Section>

      <Section
        icon={<ShieldCheck size={16} />}
        title="Proof documents"
        meta={`${docsAttached}/${DOCUMENT_TYPES.length} attached`}
        onEdit={() => onEdit(2)}
        locked={locked}
      >
        <ul className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {DOCUMENT_TYPES.map(({ key, label }) => {
            const attached = horse.documents?.some(d => d.document_type === key)
            return (
              <li
                key={key}
                className={`flex items-center gap-3 rounded-lg border px-3 py-3 ${
                  attached ? 'border-green-600/30 bg-green-600/5' : 'border-red-500/40 bg-red-500/5'
                }`}
              >
                <FileText size={18} className={attached ? 'text-green-600' : 'text-red-500'} />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-brand-text truncate">{label}</p>
                  <p className={`text-xs font-bold ${attached ? 'text-green-600' : 'text-red-500'}`}>
                    {attached ? 'Attached' : 'Missing'}
                  </p>
                </div>
              </li>
            )
          })}
        </ul>
      </Section>

      <Section
        icon={<Trophy size={16} />}
        title="Race records"
        meta={races.length > 0 ? `${races.length} races · ${wins} ${wins === 1 ? 'win' : 'wins'}` : undefined}
        onEdit={() => onEdit(1)}
        locked={locked}
      >
        {races.length === 0 ? (
          <p className="text-sm text-brand-muted">No race records added.</p>
        ) : (
          <div className="max-h-80 overflow-y-auto -mx-4 xs:-mx-6 px-4 xs:px-6">
            <table className="w-full table-fixed text-left text-sm">
              <colgroup>
                <col className="w-24 sm:w-28" />
                <col />
                <col className="hidden sm:table-column sm:w-28" />
                <col className="hidden md:table-column md:w-40" />
                <col className="w-14" />
              </colgroup>
              <thead className="sticky top-0 bg-brand-surface">
                <tr className="text-[10px] font-bold uppercase tracking-wide text-brand-muted">
                  <th className="py-2 pr-3 font-bold">Date</th>
                  <th className="py-2 pr-3 font-bold">Race</th>
                  <th className="py-2 pr-3 font-bold hidden sm:table-cell">Course</th>
                  <th className="py-2 pr-3 font-bold hidden md:table-cell">Distance</th>
                  <th className="py-2 text-center font-bold">Finish</th>
                </tr>
              </thead>
              <tbody>
                {races.map(r => (
                  <tr key={r.id} className="border-t border-brand-border align-middle">
                    <td className="py-2.5 pr-3 whitespace-nowrap tabular-nums text-brand-muted">{r.race_date}</td>
                    <td className="py-2.5 pr-3 text-brand-text">
                      <span className="flex items-center gap-2 min-w-0">
                        <span className="truncate" title={r.race_name}>{r.race_name}</span>
                        {r.grade && (
                          <span className="shrink-0 rounded bg-brand-gold/15 px-1.5 py-0.5 text-[10px] font-bold text-brand-gold">
                            {r.grade}
                          </span>
                        )}
                      </span>
                      <span className="block sm:hidden text-xs text-brand-muted truncate">{r.course}</span>
                    </td>
                    <td className="py-2.5 pr-3 hidden sm:table-cell text-brand-muted truncate">{r.course}</td>
                    <td className="py-2.5 pr-3 hidden md:table-cell text-brand-muted truncate">
                      {[r.distance ? `${r.distance}m` : null, r.track, r.condition].filter(Boolean).join(' · ') || '—'}
                    </td>
                    <td className="py-2.5 text-center">
                      {r.finish_position ? (
                        <span
                          className={`inline-flex h-6 min-w-6 items-center justify-center rounded-full px-1.5 text-xs font-bold ${
                            r.finish_position === 1 ? 'bg-brand-gold text-brand-bg' : 'bg-brand-bg text-brand-muted'
                          }`}
                        >
                          {r.finish_position}
                        </span>
                      ) : (
                        <span className="text-brand-muted">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>
    </div>
  )
}

export default HorseReviewSummary
