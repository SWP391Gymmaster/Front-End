// Luật nghiệp vụ cho Lớp học và Buổi học (T2.4). Hàm thuần để test bằng node --test.
import { codeProblem, roomMatchesSubject, roomTypeLabel } from './roomRules.js'

const ymd = (value) => (value ? String(value).slice(0, 10) : '')
const minute = (value) => String(value).slice(0, 16)
const hhmm = (value) => String(value).slice(11, 16)
const dm = (value) => `${String(value).slice(8, 10)}/${String(value).slice(5, 7)}`

// Ngày của lớp (chỉ kiểm tra khi có nhập): bắt đầu < kết thúc, mở < đóng đăng ký sớm, đóng đăng ký sớm ≤ ngày bắt đầu.
export function validateClassDates(form) {
  const errors = []
  const start = ymd(form.startDate)
  const end = ymd(form.endDate)
  const open = ymd(form.registrationOpenAt)
  const close = ymd(form.registrationCloseAt)
  if (start && end && end <= start) errors.push('Ngày kết thúc lớp phải sau ngày bắt đầu.')
  if (open && close && close < open) errors.push('Ngày kết thúc đăng ký sớm phải từ ngày mở đăng ký sớm trở đi.')
  if (close && start && close > start) errors.push('Đăng ký sớm phải kết thúc trước hoặc đúng ngày bắt đầu lớp.')
  return errors
}

// Lớp: mã, tên, sĩ số; khi sửa còn phải khớp với các phòng đã xếp lịch.
// usedRooms = các phòng mà lớp này đang dùng trong lịch (có thể rỗng khi tạo mới).
export function validateClass(form, usedRooms = []) {
  const errors = []
  const code = codeProblem(form.classCode, 'Mã lớp')
  if (code) errors.push(code)
  if (!String(form.name ?? '').trim()) errors.push('Tên lớp không được để trống.')
  const capacity = Number(form.capacity)
  if (!Number.isInteger(capacity) || capacity < 1) errors.push('Sĩ số phải là số nguyên lớn hơn 0.')
  else {
    const small = usedRooms.find((r) => capacity > Number(r.capacity))
    if (small) errors.push(`Sĩ số (${capacity}) vượt sức chứa phòng "${small.name}" (${small.capacity}) mà lớp đang dùng.`)
  }
  const wrong = usedRooms.find((r) => !roomMatchesSubject(r, form.subject))
  if (wrong) errors.push(`Bộ môn ${form.subject} không phù hợp với phòng "${wrong.name}" (${roomTypeLabel(wrong.type)}) mà lớp đang dùng.`)
  errors.push(...validateClassDates(form))
  return errors
}

// Tìm buổi khác trùng giờ về phòng hoặc huấn luyện viên. context = { schedules, classes }.
function conflicts(form, cls, room, { schedules = [], classes = [] }) {
  const errors = []
  const start = minute(form.startTime)
  const end = minute(form.endTime)
  const coachOf = (s) => s.coachId || classes.find((c) => String(c.id) === String(s.classId))?.coachId
  const myCoach = form.coachId || cls?.coachId
  const nameOf = (s) => classes.find((c) => String(c.id) === String(s.classId))?.name || `#${s.classId}`
  let roomDone = false
  let coachDone = false
  for (const s of schedules) {
    if (form.id && String(s.id) === String(form.id)) continue
    if (!(minute(s.startTime) < end && start < minute(s.endTime))) continue
    const when = `${hhmm(s.startTime)}–${hhmm(s.endTime)} ngày ${dm(s.startTime)}`
    if (!roomDone && room && String(s.roomId) === String(room.id)) {
      errors.push(`Phòng "${room.name}" đã có lớp "${nameOf(s)}" lúc ${when}.`)
      roomDone = true
    }
    if (!coachDone && myCoach && String(coachOf(s)) === String(myCoach)) {
      errors.push(`Huấn luyện viên đã dạy lớp "${nameOf(s)}" lúc ${when}.`)
      coachDone = true
    }
  }
  return errors
}

// Buổi học: cls và room là object đã tra cứu từ id; có thể undefined nếu chưa chọn.
export function validateSchedule(form, cls, room, context = {}) {
  const errors = []
  if (!cls) errors.push('Vui lòng chọn lớp.')
  if (!room) errors.push('Vui lòng chọn phòng.')
  if (!form.startTime || !form.endTime) errors.push('Vui lòng nhập giờ bắt đầu và giờ kết thúc.')
  else if (form.endTime <= form.startTime) errors.push('Giờ kết thúc phải sau giờ bắt đầu.')
  if (cls && room) {
    if (Number(cls.capacity) > Number(room.capacity)) errors.push(`Sĩ số lớp (${cls.capacity}) vượt sức chứa phòng "${room.name}" (${room.capacity}).`)
    if (!roomMatchesSubject(room, cls.subject)) errors.push(`Phòng "${room.name}" (${roomTypeLabel(room.type)}) không phù hợp với bộ môn ${cls.subject}.`)
  }
  if (cls && form.startTime && form.endTime && form.endTime > form.startTime) {
    const day = ymd(form.startTime)
    if (ymd(cls.startDate) && day < ymd(cls.startDate)) errors.push(`Buổi học nằm trước ngày bắt đầu lớp (${dm(cls.startDate)}).`)
    if (ymd(cls.endDate) && day > ymd(cls.endDate)) errors.push(`Buổi học nằm sau ngày kết thúc lớp (${dm(cls.endDate)}).`)
    errors.push(...conflicts(form, cls, room, context))
  }
  return errors
}