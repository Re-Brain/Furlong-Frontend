import { AlertTriangle, Heart, Mail, Users } from 'lucide-react'
import { useFarmDonations } from '../hooks/useFarmDonations'

function formatDonationDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

// The farmer dashboard's "Donations" tab: a Stripe connection banner (until
// payouts are enabled) and, once they are, a total-raised summary plus a
// table of supporters. Mirrors VisitorManagement's loading/error/retry shape.
function DonationManagement() {
  const { status, donations, loading, error, retry, connecting, connectError, connectStripe } =
    useFarmDonations()

  if (loading) return <p className="text-brand-muted text-sm">Loading…</p>

  if (error)
    return (
      <div className="flex flex-wrap items-center justify-between gap-3 bg-red-500/10 border border-red-500/40 text-red-600 rounded-lg px-4 py-3 text-sm font-medium">
        <div className="flex items-center gap-3">
          <AlertTriangle size={18} className="shrink-0" />
          <p>{error}</p>
        </div>
        <button
          onClick={retry}
          className="bg-red-500/10 text-red-600 border border-red-500/40 font-bold px-4 py-2 rounded-lg hover:bg-red-500/20 transition text-sm shrink-0"
        >
          Retry
        </button>
      </div>
    )

  const totalYen = donations.reduce((sum, d) => sum + d.amount_yen, 0)

  return (
    <div className="flex flex-col gap-6">
      {!status?.payouts_enabled && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-brand-surface border border-brand-border rounded-lg p-4 xs:p-6">
          <div className="flex items-start gap-3">
            <AlertTriangle size={20} className="text-yellow-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-brand-text">
                {status?.connected ? 'Stripe verification in progress' : 'Connect your Stripe account'}
              </p>
              <p className="text-brand-muted text-sm mt-1 max-w-md">
                {status?.connected
                  ? "You've started connecting Stripe, but verification isn't finished yet — donations can't reach you until it is."
                  : 'Visitors can only donate to your farm once you connect a Stripe account to receive the money.'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={connectStripe}
            disabled={connecting}
            className="flex items-center justify-center gap-2 w-full sm:w-auto bg-brand-gold text-white font-bold px-4 xs:px-6 py-2.5 rounded-lg hover:bg-brand-gold-light transition text-sm disabled:opacity-50 shrink-0"
          >
            {connecting ? 'Redirecting…' : status?.connected ? 'Finish setup' : 'Connect Stripe'}
          </button>
        </div>
      )}

      {connectError && (
        <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/40 text-red-600 rounded-lg px-4 py-3 text-sm font-medium">
          <AlertTriangle size={18} className="shrink-0" />
          <p>{connectError}</p>
        </div>
      )}

      {status?.payouts_enabled && (
        <div className="bg-brand-surface border border-brand-border rounded-lg p-4 xs:p-6 flex items-center gap-4">
          <span className="flex items-center justify-center w-12 h-12 rounded-full bg-brand-gold/10 text-brand-gold shrink-0">
            <Heart size={22} fill="currentColor" />
          </span>
          <div>
            <p className="text-xs font-bold text-brand-muted uppercase tracking-[0.15em]">Total raised</p>
            <p className="text-2xl font-bold text-brand-text">¥{totalYen.toLocaleString()}</p>
          </div>
        </div>
      )}

      {donations.length === 0 ? (
        <div className="bg-brand-surface border border-brand-border rounded-lg p-8 text-center flex flex-col items-center gap-3">
          <Users size={28} className="text-brand-muted" />
          <p className="text-brand-muted text-sm">No donations yet.</p>
        </div>
      ) : (
        <>
        {/* Phone: one card per donation, so nothing needs a sideways scroll. */}
        <ul className="sm:hidden flex flex-col gap-3">
          {donations.map(d => (
            <li
              key={d.id}
              className="bg-brand-surface border border-brand-border rounded-lg p-4 flex items-start justify-between gap-3"
            >
              <div className="min-w-0">
                <p className="font-bold text-brand-text truncate">{d.donor_name ?? 'Anonymous'}</p>
                {d.donor_name && d.donor_email && (
                  <p className="flex items-center gap-1.5 text-brand-muted text-xs mt-0.5 min-w-0">
                    <Mail size={12} className="shrink-0" />
                    <span className="truncate">{d.donor_email}</span>
                  </p>
                )}
                <p className="text-brand-muted text-xs mt-1">{formatDonationDate(d.created_at)}</p>
              </div>
              <p className="font-bold text-brand-text whitespace-nowrap">¥{d.amount_yen.toLocaleString()}</p>
            </li>
          ))}
        </ul>

        <div className="hidden sm:block rounded-lg border border-brand-border overflow-hidden">
          {/* Scroll lives on its own inner element, separate from the
              rounded border above (see HorseRaceRecords for why). Natural
              (non-fixed) column widths + a min-w so the table scrolls
              instead of the old table-fixed/w-1/3 approach, which squeezed
              the supporter column so hard that its own `truncate` was
              silently cutting off donor names/emails. */}
          <div className="overflow-x-auto mask-[linear-gradient(to_right,black_calc(100%-2rem),transparent)] lg:mask-none">
          <table className="w-full min-w-125 text-sm">
            <thead>
              <tr className="bg-brand-surface border-b border-brand-border text-brand-muted text-xs uppercase">
                <th className="text-left px-4 py-3 font-bold">Supporter</th>
                <th className="text-left px-4 py-3 font-bold">Amount</th>
                <th className="text-left px-4 py-3 font-bold">Date</th>
              </tr>
            </thead>
            <tbody>
              {donations.map(d => (
                <tr key={d.id} className="border-b border-brand-border last:border-0">
                  <td className="px-4 py-3">
                    <p className="font-bold text-brand-text">{d.donor_name ?? 'Anonymous'}</p>
                    {d.donor_name && d.donor_email && (
                      <p className="flex items-center gap-1.5 text-brand-muted text-xs mt-0.5">
                        <Mail size={12} className="shrink-0" />
                        {d.donor_email}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-brand-text whitespace-nowrap">¥{d.amount_yen.toLocaleString()}</td>
                  <td className="px-4 py-3 text-brand-muted whitespace-nowrap">{formatDonationDate(d.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
        </>
      )}
    </div>
  )
}

export default DonationManagement
