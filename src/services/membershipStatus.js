const todayISO = () => new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Ho_Chi_Minh', year: 'numeric', month: '2-digit', day: '2-digit',
}).format(new Date())

// The server's active flag and inclusive daysRemaining are authoritative.
export function membershipStatus(memberships, today = todayISO()) {
  const active = memberships.filter(m => m.active).sort((a, b) => b.endDate.localeCompare(a.endDate))[0]
  if (active) return { status: 'active', membership: active, daysLeft: Math.max(0, active.daysRemaining - 1), expiringSoon: active.daysRemaining <= 7 }
  const upcoming = memberships.filter(m => m.startDate > today).sort((a, b) => a.startDate.localeCompare(b.startDate))[0]
  if (upcoming) return { status: 'upcoming', membership: upcoming }
  const expired = [...memberships].sort((a, b) => b.endDate.localeCompare(a.endDate))[0]
  return { status: expired ? 'expired' : 'none', membership: expired || null }
}
