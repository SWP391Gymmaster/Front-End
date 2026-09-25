export const formatMoney = (n) => Number(n).toLocaleString('vi-VN') + ' đ'

export const formatDate = (iso) => {
  if (!iso) return ''
  const [y, m, d] = iso.slice(0, 10).split('-')
  return `${d}/${m}/${y}`
}

export const todayISO = () => new Date().toISOString().slice(0, 10)

export const addDays = (iso, days) => {
  const d = new Date(iso)
  d.setDate(d.getDate() + days)
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
export const getMembershipStatus = (userId, memberships) => {
  const list = memberships
    .filter((m) => m.userId === userId)
    .sort((a, b) => b.endDate.localeCompare(a.endDate))
  const latest = list[0]
  if (!latest) return { status: 'none', label: 'Chưa có gói', membership: null }
  const today = todayISO()
  if (latest.endDate < today) return { status: 'expired', label: 'Hết hạn', membership: latest }
  const daysLeft = Math.ceil((new Date(latest.endDate) - new Date(today)) / 86400000)
  return { status: 'active', label: 'Đang hoạt động', membership: latest, daysLeft }
}
