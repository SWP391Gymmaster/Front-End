// Luật cho trang Danh sách lớp: lọc (T2.1) và vòng đời/trạng thái lớp (T2.2). Hàm thuần để test.
import { vietnamTime } from '../services/api.js'

export const STATUS = {
  upcoming: { label: 'Chưa mở', badge: 'badge-wait' },
  open: { label: 'Đang mở', badge: 'badge-green' },
  full: { label: 'Đã đầy', badge: 'badge-red' },
  closed: { label: 'Đã đóng', badge: 'badge-gray' },
}

export const TIME_SLOTS = [
  { value: 'morning', label: 'Sáng (trước 12h)', from: 0, to: 12 },
  { value: 'afternoon', label: 'Chiều (12h–17h)', from: 12, to: 17 },
  { value: 'evening', label: 'Tối (từ 17h)', from: 17, to: 24 },
]

export const EMPTY_FILTERS = { subject: '', coachId: '', date: '', slot: '', status: '', hasSeats: false, showClosed: false }

const at = (value) => new Date(vietnamTime(value))
// Ngày không kèm giờ: mốc mở là 00:00, mốc đóng là hết ngày đó.
const dayStart = (value) => (value ? at(`${String(value).slice(0, 10)}T00:00:00`) : null)
const dayEnd = (value) => (value ? at(`${String(value).slice(0, 10)}T23:59:59`) : null)

// Vòng đời của lớp theo ngày (chỉ có tác dụng khi BE đã trả các trường ngày):
//  - Quá ngày kết thúc lớp             → closed   (Đã đóng, mặc định ẩn)
//  - Trước/trong thời gian đăng ký sớm → upcoming (Chưa mở)
//  - Sau khi đăng ký sớm kết thúc      → null     (rồi xét theo buổi học/chỗ trống: Đang mở hoặc Đã đầy)
export function windowStatus(cls, now) {
  const open = dayStart(cls.registrationOpenAt)
  const closeEnd = dayEnd(cls.registrationCloseAt)
  const end = dayEnd(cls.endDate)
  if (end && now > end) return 'closed'
  if ((open && now < open) || (closeEnd && now <= closeEnd)) return 'upcoming'
  return null
}

// Hội viên được đăng ký không: lớp đang mở thì được; lớp chưa mở chỉ được khi đã tới ngày mở đăng ký sớm.
export function canRegister(cls, status, now) {
  if (status === 'open') return true
  if (status !== 'upcoming') return false
  const open = dayStart(cls.registrationOpenAt)
  return Boolean(open && now >= open)
}

// available: danh sách buổi còn chỗ do BE trả (chỉ hội viên có); null nếu chưa biết sĩ số.
// BE chỉ trả buổi tương lai còn chỗ, nên buổi tương lai không nằm trong danh sách ⇒ đã đầy.
export function buildCatalog({ classes, schedules, available = null, now = new Date() }) {
  const free = available ? new Map(available.map((s) => [Number(s.id), s])) : null
  return classes.map((cls) => {
    const sessions = schedules
      .filter((s) => Number(s.classId) === Number(cls.id))
      .sort((a, b) => a.startTime.localeCompare(b.startTime))
      .map((s) => {
        const closed = at(s.startTime) <= now
        const row = free?.get(Number(s.id))
        let registered = null
        let remaining = null
        if (free && !closed) {
          registered = row ? Number(row.registeredCount) : cls.capacity
          remaining = row ? Number(row.remainingSlots) : 0
        }
        return { ...s, closed, registered, remaining, full: !closed && remaining === 0 }
      })
    const upcoming = sessions.filter((s) => !s.closed)
    const hasCounts = Boolean(free)
    let status = windowStatus(cls, now)
    if (!status) {
      status = 'open'
      if (!sessions.length) status = 'upcoming' // chưa xếp lịch
      else if (!upcoming.length) status = 'closed'
      else if (hasCounts && upcoming.every((s) => s.full)) status = 'full'
    }
    const next = upcoming.find((s) => !s.full) || upcoming[0] || null
    // Khoảng ngày suy ra từ các buổi học (dùng khi BE chưa có ngày bắt đầu/kết thúc của lớp)
    const range = sessions.length
      ? { firstDate: sessions[0].startTime.slice(0, 10), lastDate: sessions[sessions.length - 1].startTime.slice(0, 10), sessionCount: sessions.length }
      : { firstDate: '', lastDate: '', sessionCount: 0 }
    return {
      cls, sessions, upcoming, next, status, canRegister: canRegister(cls, status, now), hasCounts, ...range,
      coachIds: [...new Set([cls.coachId, ...sessions.map((s) => s.coachId)].filter(Boolean).map(Number))],
    }
  })
}

const slotOf = (startTime) => {
  const hour = Number(startTime.slice(11, 13))
  return TIME_SLOTS.find((s) => hour >= s.from && hour < s.to)?.value
}

// Các điều kiện kết hợp bằng AND. Lớp "Đã đóng" bị ẩn trừ khi bật showClosed hoặc chọn trạng thái Đã đóng.
export function filterCatalog(items, f) {
  return items.filter((item) => {
    if (f.subject && item.cls.subject !== f.subject) return false
    if (f.coachId && !item.coachIds.includes(Number(f.coachId))) return false
    if (item.status === 'closed' && !f.showClosed && f.status !== 'closed') return false
    if (f.status && item.status !== f.status) return false
    if (f.hasSeats && item.hasCounts && !item.upcoming.some((s) => !s.full)) return false
    if (f.date || f.slot) {
      const ok = item.sessions.some((s) => (!f.date || s.startTime.slice(0, 10) === f.date) && (!f.slot || slotOf(s.startTime) === f.slot))
      if (!ok) return false
    }
    return true
  })
}

export const hasActiveFilter = (f) => Object.keys(EMPTY_FILTERS).some((k) => f[k] !== EMPTY_FILTERS[k])