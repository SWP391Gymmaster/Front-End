export const formatMoney = (n) => Number(n).toLocaleString('vi-VN') + ' đ'

export const formatDate = (iso) => {
  if (!iso) return ''
  const [y, m, d] = iso.slice(0, 10).split('-')
  return `${d}/${m}/${y}`
}

export const todayISO = (date = new Date()) => new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Ho_Chi_Minh', year: 'numeric', month: '2-digit', day: '2-digit',
}).format(date)

export const addDays = (iso, days) => {
  const d = new Date(iso)
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}

export const newId = (prefix) => prefix + Date.now().toString(36) + Math.random().toString(36).slice(2, 5)

const toMinutes = (t) => {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}

const overlap = (a, b) =>
  a.days.some((d) => b.days.includes(d)) &&
  toMinutes(a.start) < toMinutes(b.end) &&
  toMinutes(b.start) < toMinutes(a.end)

// Kiểm tra trùng lịch: cùng Coach hoặc cùng phòng, trùng ngày và giao nhau về giờ
export const findConflicts = (candidate, classes) => {
  const conflicts = []
  classes
    .filter((c) => c.id !== candidate.id)
    .forEach((c) => {
      if (!overlap(candidate, c)) return
      if (c.coachId === candidate.coachId) conflicts.push({ type: 'coach', cls: c })
      if (c.roomId === candidate.roomId) conflicts.push({ type: 'room', cls: c })
    })
  return conflicts
}

// Trạng thái gói tập hiện tại của hội viên
export const getMembershipStatus = (userId, memberships, today = todayISO()) => {
  const list = memberships
    .filter((m) => m.userId === userId)
    .sort((a, b) => b.endDate.localeCompare(a.endDate))
  const active = list.filter((m) => m.startDate <= today && today <= m.endDate)
  const future = list.filter((m) => m.startDate > today).sort((a, b) => a.startDate.localeCompare(b.startDate))
  const latest = active[0] || future[0] || list[0]
  if (!latest) return { status: 'none', label: 'Chưa có gói', membership: null }
  if (latest.startDate > today) return { status: 'upcoming', label: 'Chưa đến ngày hiệu lực', membership: latest, daysLeft: 0 }
  if (latest.endDate < today) return { status: 'expired', label: 'Hết hạn', membership: latest }
  const daysLeft = Math.ceil((new Date(latest.endDate) - new Date(today)) / 86400000)
  return { status: 'active', label: 'Đang hoạt động', membership: latest, daysLeft, expiringSoon: daysLeft <= 7 }
}

// Queue renewals after the last purchased period, not only the currently active one.
export const nextMembershipStart = (userId, memberships, today = todayISO()) => {
  const last = memberships.filter((m) => m.userId === userId && m.endDate >= today)
    .sort((a, b) => b.endDate.localeCompare(a.endDate))[0]
  return last ? addDays(last.endDate, 1) : today
}
