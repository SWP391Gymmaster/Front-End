export const formatMoney = (n) => Number(n || 0).toLocaleString('vi-VN') + ' đ'

// Số tiền rút gọn cho trục biểu đồ: 1.500.000 -> "1,5 tr"
export const formatMoneyShort = (n) => {
  const v = Number(n || 0)
  if (v >= 1e9) return (v / 1e9).toLocaleString('vi-VN', { maximumFractionDigits: 1 }) + ' tỷ'
  if (v >= 1e6) return (v / 1e6).toLocaleString('vi-VN', { maximumFractionDigits: 1 }) + ' tr'
  if (v >= 1e3) return (v / 1e3).toLocaleString('vi-VN', { maximumFractionDigits: 0 }) + 'k'
  return String(v)
}

const pad = (n) => String(n).padStart(2, '0')

// Ngày theo giờ máy (không dùng toISOString để tránh lệch múi giờ)
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

const VN_TZ = 'Asia/Ho_Chi_Minh'
const vnParts = new Intl.DateTimeFormat('en-CA', {
  timeZone: VN_TZ,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hourCycle: 'h23',
})

const toDate = (v) => {
  if (v == null) return null
  if (typeof v === 'number') return new Date(v > 1e12 ? v : v * 1000) 
  return new Date(v)
}

export const vnDateTime = (v) => {
  const d = toDate(v)
  if (!d || isNaN(d)) return ''
  const p = Object.fromEntries(vnParts.formatToParts(d).map((x) => [x.type, x.value]))
  return `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}:${p.second}`
}
export const vnDate = (v) => vnDateTime(v).slice(0, 10) 
export const vnMonth = (v) => vnDateTime(v).slice(0, 7) 
export const nowVN = () => vnDateTime(new Date())
export const formatDateTime = (v) => {
  const s = vnDateTime(v)
  return s ? `${formatDate(s)} ${s.slice(11, 16)}` : ''
}

export const monthLabel = (ym) => `Tháng ${Number(ym.slice(5, 7))}/${ym.slice(0, 4)}`
export const addMonths = (ym, n) => {
  const d = new Date(Number(ym.slice(0, 4)), Number(ym.slice(5, 7)) - 1 + n, 1)
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`
}
export const daysInMonth = (ym) => new Date(Number(ym.slice(0, 4)), Number(ym.slice(5, 7)), 0).getDate()

export const PAYMENT_METHOD = {
  CASH: 'Tiền mặt',
  BANK_TRANSFER: 'Chuyển khoản',
  VNPAY: 'VNPay',
  MOMO: 'Ví MoMo',
  CREDIT_CARD: 'Thẻ tín dụng',
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

// ---------- Doanh thu thực thu ----------
export const completedPayments = (payments) =>
  (payments || []).filter((p) => p.status === 'COMPLETED' && p.completedAt)

export const sumAmount = (list) => list.reduce((s, p) => s + Number(p.amount || 0), 0)

export const groupSum = (list, keyFn) => {
  const map = new Map()
  list.forEach((p) => {
    const k = keyFn(p) || 'Khác'
    const cur = map.get(k) || { key: k, amount: 0, count: 0 }
    cur.amount += Number(p.amount || 0)
    cur.count += 1
    map.set(k, cur)
  })
  return [...map.values()].sort((a, b) => b.amount - a.amount)
}

export function getMembershipStatus(email, memberships = []) {
  const userMemberships = memberships.filter((m) => m.email === email)
  const active = userMemberships.find((m) => m.active)
  if (active) return { status: 'active', label: 'Đang hoạt động' }
  if (userMemberships.length > 0) return { status: 'expired', label: 'Hết hạn' }
  return { status: 'none', label: 'Chưa có gói' }
}

export const nextStartDate = (memberships) => {
  const today = todayISO()
  const ends = (memberships || []).map((m) => m.endDate).filter((d) => d && d >= today).sort()
  return ends.length ? addDays(ends[ends.length - 1], 1) : today
}

export const percentChange = (cur, prev) => (prev ? ((cur - prev) / prev) * 100 : null)

// ---------- Thứ trong tuần ----------
export const DAYS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN']
export const dayLabel = (d) => (d === 'CN' ? 'Chủ nhật' : 'Thứ ' + d.slice(1))
// Date.getDay(): 0 = CN, 1 = T2 ...
export const dayOf = (iso) => DAYS[(new Date(iso.slice(0, 10) + 'T00:00:00').getDay() + 6) % 7]


export const mondayOf = (iso) => {
  const d = new Date(iso + 'T00:00:00')
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7))
  return toISODate(d)
}

// Số giờ của một buổi học (startTime/endTime dạng "YYYY-MM-DDTHH:mm:ss")
export const sessionHours = (s) => (new Date(s.endTime) - new Date(s.startTime)) / 3600000

// ---------- In hóa đơn ----------
export const printSection = (kind) => {
  document.body.dataset.print = kind
  const cleanup = () => {
    delete document.body.dataset.print
    window.removeEventListener('afterprint', cleanup)
  }
  window.addEventListener('afterprint', cleanup)
  window.print()
}

// ---------- Xuất CSV (mở được bằng Excel) ----------
export const downloadCsv = (filename, rows) => {
  const esc = (v) => {
    const s = v == null ? '' : String(v)
    return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
  }
  const csv = '\uFEFF' + rows.map((r) => r.map(esc).join(',')).join('\r\n')
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
