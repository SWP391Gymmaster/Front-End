// Sinh danh sách buổi học theo thứ trong tuần (dùng cho "Tạo nhiều buổi"). Hàm thuần để test.

export const WEEKDAYS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'] // chỉ số 0 = Thứ 2
export const MAX_SESSIONS = 120

const toUTC = (iso) => new Date(`${String(iso).slice(0, 10)}T00:00:00Z`)
const pad = (n) => String(n).padStart(2, '0')
const fmt = (d) => `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`

// days: mảng chỉ số thứ (0 = T2 ... 6 = CN); start/end dạng HH:mm; from/to dạng yyyy-MM-dd (gồm cả hai đầu).
export function planSessions({ days = [], start, end, from, to }) {
  const problems = []
  if (!days.length) problems.push('Chọn ít nhất một thứ trong tuần.')
  if (!start || !end) problems.push('Nhập giờ bắt đầu và giờ kết thúc.')
  else if (end <= start) problems.push('Giờ kết thúc phải sau giờ bắt đầu.')
  if (!from || !to) problems.push('Nhập khoảng ngày cần tạo buổi.')
  else if (to < from) problems.push('Ngày kết thúc phải từ ngày bắt đầu trở đi.')
  if (problems.length) return { sessions: [], problems }
  const sessions = []
  for (let d = toUTC(from); fmt(d) <= to; d.setUTCDate(d.getUTCDate() + 1)) {
    if (days.includes((d.getUTCDay() + 6) % 7)) sessions.push({ startTime: `${fmt(d)}T${start}`, endTime: `${fmt(d)}T${end}` })
    if (sessions.length > MAX_SESSIONS) return { sessions: [], problems: [`Tối đa ${MAX_SESSIONS} buổi mỗi lần. Hãy chia nhỏ khoảng ngày.`] }
  }
  if (!sessions.length) problems.push('Không có ngày nào trong khoảng đã chọn khớp với các thứ đã chọn.')
  return { sessions, problems }
}