
import { vietnamTime } from '../services/api.js'

export const STATUS = {
  open: { label: 'Đang mở', badge: 'badge-green' },
  full: { label: 'Đã đầy', badge: 'badge-red' },
  closed: { label: 'Đã đóng', badge: 'badge-gray' },
}

export const TIME_SLOTS = [
  { value: 'morning', label: 'Sáng (trước 12h)', from: 0, to: 12 },
  { value: 'afternoon', label: 'Chiều (12h–17h)', from: 12, to: 17 },
  { value: 'evening', label: 'Tối (từ 17h)', from: 17, to: 24 },
]

export const EMPTY_FILTERS = { subject: '', coachId: '', date: '', slot: '', status: '', hasSeats: false }

const at = (value) => new Date(vietnamTime(value))

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
    let status = 'open'
    if (!upcoming.length) status = 'closed'
    else if (hasCounts && upcoming.every((s) => s.full)) status = 'full'
    const next = upcoming.find((s) => !s.full) || upcoming[0] || null
    return { cls, sessions, upcoming, next, status, hasCounts, coachIds: [...new Set([cls.coachId, ...sessions.map((s) => s.coachId)].filter(Boolean).map(Number))] }
  })
}

const slotOf = (startTime) => {
  const hour = Number(startTime.slice(11, 13))
  return TIME_SLOTS.find((s) => hour >= s.from && hour < s.to)?.value
}

// Các điều kiện kết hợp bằng AND. Ngày/khung giờ xét trên từng buổi của lớp.
export function filterCatalog(items, f) {
  return items.filter((item) => {
    if (f.subject && item.cls.subject !== f.subject) return false
    if (f.coachId && !item.coachIds.includes(Number(f.coachId))) return false
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