const pad = (value) => String(value).padStart(2, '0')

export const formatMoney = (value) => Number(value || 0).toLocaleString('vi-VN') + ' đ'
export const formatMoneyShort = (value) => {
  const amount = Number(value || 0)
  if (amount >= 1e9) return (amount / 1e9).toLocaleString('vi-VN', { maximumFractionDigits: 1 }) + ' tỷ'
  if (amount >= 1e6) return (amount / 1e6).toLocaleString('vi-VN', { maximumFractionDigits: 1 }) + ' tr'
  if (amount >= 1e3) return (amount / 1e3).toLocaleString('vi-VN', { maximumFractionDigits: 0 }) + 'k'
  return String(amount)
}

export const toISODate = (date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
export const todayISO = (date = new Date()) => new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Ho_Chi_Minh', year: 'numeric', month: '2-digit', day: '2-digit',
}).format(date)
export const addDays = (isoDate, days) => {
  const date = new Date(`${isoDate.slice(0, 10)}T00:00:00Z`)
  date.setUTCDate(date.getUTCDate() + days)
  return date.toISOString().slice(0, 10)
}
export const formatDate = (value) => {
  if (!value) return ''
  const [year, month, day] = String(value).slice(0, 10).split('-')
  return `${day}/${month}/${year}`
}
export const formatTime = (value) => String(value || '').slice(11, 16)

const VN_TZ = 'Asia/Ho_Chi_Minh'
const vnParts = new Intl.DateTimeFormat('en-CA', {
  timeZone: VN_TZ, year: 'numeric', month: '2-digit', day: '2-digit',
  hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23',
})
const toDate = (value) => {
  if (value == null) return null
  if (typeof value === 'number') return new Date(value > 1e12 ? value : value * 1000)
  return new Date(value)
}
export const vnDateTime = (value) => {
  const date = toDate(value)
  if (!date || Number.isNaN(date.getTime())) return ''
  const parts = Object.fromEntries(vnParts.formatToParts(date).map(({ type, value: part }) => [type, part]))
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}:${parts.second}`
}
export const vnDate = (value) => vnDateTime(value).slice(0, 10)
export const vnMonth = (value) => vnDateTime(value).slice(0, 7)
export const nowVN = () => vnDateTime(new Date())
export const formatDateTime = (value) => {
  const datetime = vnDateTime(value)
  return datetime ? `${formatDate(datetime)} ${datetime.slice(11, 16)}` : ''
}

export const addMonths = (yearMonth, amount) => {
  const date = new Date(Number(yearMonth.slice(0, 4)), Number(yearMonth.slice(5, 7)) - 1 + amount, 1)
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}`
}
export const daysInMonth = (yearMonth) => new Date(Number(yearMonth.slice(0, 4)), Number(yearMonth.slice(5, 7)), 0).getDate()
export const monthLabel = (yearMonth) => `Tháng ${Number(yearMonth.slice(5, 7))}/${yearMonth.slice(0, 4)}`

export const PAYMENT_METHOD = {
  CASH: 'Tiền mặt', BANK_TRANSFER: 'Chuyển khoản', VNPAY: 'VNPay', MOMO: 'Ví MoMo', CREDIT_CARD: 'Thẻ tín dụng',
}
export const PAYMENT_STATUS = {
  PENDING: { label: 'Chờ thanh toán', badge: 'badge-amber' },
  COMPLETED: { label: 'Đã thu', badge: 'badge-green' },
  FAILED: { label: 'Thất bại', badge: 'badge-red' },
  CANCELLED: { label: 'Đã hủy', badge: 'badge-gray' },
}
export const INVOICE_STATUS = {
  PENDING: { label: 'Chưa thanh toán', badge: 'badge-amber' },
  PAID: { label: 'Đã thanh toán', badge: 'badge-green' },
  CANCELLED: { label: 'Đã hủy', badge: 'badge-gray' },
}

export const completedPayments = (payments) => (payments || []).filter((payment) => payment.status === 'COMPLETED' && payment.completedAt)
export const sumAmount = (items) => (items || []).reduce((total, item) => total + Number(item.amount || 0), 0)
export const groupSum = (items, keyFor) => {
  const groups = new Map()
  for (const item of items) {
    const key = keyFor(item) || 'Khác'
    const group = groups.get(key) || { key, amount: 0, count: 0 }
    group.amount += Number(item.amount || 0)
    group.count += 1
    groups.set(key, group)
  }
  return [...groups.values()].sort((a, b) => b.amount - a.amount)
}
export const nextStartDate = (memberships) => {
  const today = todayISO()
  const endDates = (memberships || []).map((item) => item.endDate).filter((date) => date && date >= today).sort()
  return endDates.length ? addDays(endDates[endDates.length - 1], 1) : today
}
export const percentChange = (current, previous) => previous ? ((current - previous) / previous) * 100 : null

export const DAYS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN']
export const dayLabel = (day) => day === 'CN' ? 'Chủ nhật' : `Thứ ${day.slice(1)}`
export const dayOf = (value) => DAYS[(new Date(`${String(value).slice(0, 10)}T00:00:00`).getDay() + 6) % 7]
export const mondayOf = (isoDate) => {
  const date = new Date(`${isoDate.slice(0, 10)}T00:00:00`)
  date.setDate(date.getDate() - ((date.getDay() + 6) % 7))
  return toISODate(date)
}
export const sessionHours = (schedule) => (new Date(schedule.endTime) - new Date(schedule.startTime)) / 3600000
export const newId = (prefix) => prefix + Date.now().toString(36) + Math.random().toString(36).slice(2, 5)

export const getMembershipStatus = (userId, memberships, today = todayISO()) => {
  const list = (memberships || []).filter((item) => item.userId === userId).sort((a, b) => b.endDate.localeCompare(a.endDate))
  const active = list.filter((item) => item.startDate <= today && today <= item.endDate)
  const future = list.filter((item) => item.startDate > today).sort((a, b) => a.startDate.localeCompare(b.startDate))
  const latest = active[0] || future[0] || list[0]
  if (!latest) return { status: 'none', label: 'Chưa có gói', membership: null }
  if (latest.startDate > today) return { status: 'upcoming', label: 'Chưa đến ngày hiệu lực', membership: latest, daysLeft: 0 }
  if (latest.endDate < today) return { status: 'expired', label: 'Hết hạn', membership: latest }
  const daysLeft = Math.ceil((new Date(latest.endDate) - new Date(today)) / 86400000)
  return { status: 'active', label: 'Đang hoạt động', membership: latest, daysLeft, expiringSoon: daysLeft <= 7 }
}
export const nextMembershipStart = (userId, memberships, today = todayISO()) => {
  const latest = (memberships || []).filter((item) => item.userId === userId && item.endDate >= today)
    .sort((a, b) => b.endDate.localeCompare(a.endDate))[0]
  return latest ? addDays(latest.endDate, 1) : today
}

export const printSection = (kind) => {
  document.body.dataset.print = kind
  const cleanup = () => {
    delete document.body.dataset.print
    window.removeEventListener('afterprint', cleanup)
  }
  window.addEventListener('afterprint', cleanup)
  window.print()
}
export const downloadCsv = (filename, rows) => {
  const escape = (value) => {
    const text = value == null ? '' : String(value)
    return /[",\n;]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
  }
  const csv = '\uFEFF' + rows.map((row) => row.map(escape).join(',')).join('\r\n')
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}
