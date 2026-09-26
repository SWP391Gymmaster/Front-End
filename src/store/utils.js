export const formatMoney = (n) => Number(n || 0).toLocaleString('vi-VN') + ' đ'

const pad = (n) => String(n).padStart(2, '0')

export const toISODate = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`

export const todayISO = () => toISODate(new Date())

export const addDays = (iso, days) => {
  const d = new Date(iso + 'T00:00:00')
  d.setDate(d.getDate() + days)
  return toISODate(d)
}

export const formatDate = (iso) => {
  if (!iso) return ''
  const [y, m, d] = iso.slice(0, 10).split('-')
  return `${d}/${m}/${y}`
}

export const formatTime = (dateTime) => dateTime.slice(11, 16)

export const newId = (prefix) => prefix + Date.now().toString(36) + Math.random().toString(36).slice(2, 5)

export const DAYS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN']
export const dayLabel = (d) => (d === 'CN' ? 'Chủ nhật' : 'Thứ ' + d.slice(1))
export const dayOf = (iso) => DAYS[(new Date(iso.slice(0, 10) + 'T00:00:00').getDay() + 6) % 7]

export const mondayOf = (iso) => {
  const d = new Date(iso + 'T00:00:00')
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7))
  return toISODate(d)
}

export const getMembershipStatus = (email, memberships) => {
  const latest = memberships
    .filter((m) => m.email === email)
    .sort((a, b) => b.endDate.localeCompare(a.endDate))[0]
  if (!latest) return { status: 'none', label: 'Chưa có gói', membership: null }
  const today = todayISO()
  if (latest.endDate < today) return { status: 'expired', label: 'Hết hạn', membership: latest }
  const daysLeft = Math.round((new Date(latest.endDate) - new Date(today)) / 86400000) + 1
  return { status: 'active', label: 'Đang hoạt động', membership: latest, daysLeft }
}
