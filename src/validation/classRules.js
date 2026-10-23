import { codeProblem, roomMatchesSubject, roomTypeLabel } from './roomRules.js'

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
  return errors
}

export function validateSchedule(form, cls, room) {
  const errors = []
  if (!cls) errors.push('Vui lòng chọn lớp.')
  if (!room) errors.push('Vui lòng chọn phòng.')
  if (!form.startTime || !form.endTime) errors.push('Vui lòng nhập giờ bắt đầu và giờ kết thúc.')
  else if (form.endTime <= form.startTime) errors.push('Giờ kết thúc phải sau giờ bắt đầu.')
  if (cls && room) {
    if (Number(cls.capacity) > Number(room.capacity)) errors.push(`Sĩ số lớp (${cls.capacity}) vượt sức chứa phòng "${room.name}" (${room.capacity}).`)
    if (!roomMatchesSubject(room, cls.subject)) errors.push(`Phòng "${room.name}" (${roomTypeLabel(room.type)}) không phù hợp với bộ môn ${cls.subject}.`)
  }
  return errors
}