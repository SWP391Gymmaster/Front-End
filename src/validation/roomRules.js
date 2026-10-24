
export const ROOM_TYPES = [
  { value: 'GYM', label: 'Phòng Gym' },
  { value: 'YOGA', label: 'Phòng Yoga' },
  { value: 'GROUP_X', label: 'Group X / Zumba' },
  { value: 'CYCLING', label: 'Phòng Cycling' },
  { value: 'BOXING', label: 'Võ đài Boxing' },
  { value: 'CARDIO', label: 'Phòng Cardio' },
  { value: 'OTHER', label: 'Khác (dùng chung)' },
]

export const SUBJECT_ROOM_TYPES = {
  Gym: ['GYM', 'CARDIO'],
  Yoga: ['YOGA'],
  Boxing: ['BOXING'],
  Cardio: ['CARDIO', 'CYCLING'],
  Zumba: ['GROUP_X'],
  Pilates: ['YOGA', 'GROUP_X'],
  'Group X': ['GROUP_X'],
  Cycling: ['CYCLING'],
}

export const roomTypeLabel = (type) => ROOM_TYPES.find((t) => t.value === type)?.label || type || '—'

export const roomMatchesSubject = (room, subject) => {
  const allowed = SUBJECT_ROOM_TYPES[subject]
  return !allowed || room?.type === 'OTHER' || allowed.includes(room?.type)
}

export const CODE_PATTERN = /^[A-Z0-9]+(-[A-Z0-9]+)*$/
export const normalizeCode = (value) => String(value ?? '').trim().toUpperCase()

export function codeProblem(value, label) {
  const code = normalizeCode(value)
  if (!code) return `${label} không được để trống.`
  if (code.length < 3 || code.length > 32) return `${label} phải từ 3 đến 32 ký tự.`
  if (!CODE_PATTERN.test(code)) return `${label} chỉ gồm chữ in hoa, số và dấu gạch ngang (ví dụ ROOM-GYM-A).`
  return ''
}

export function validateRoom(form) {
  const errors = []
  const code = codeProblem(form.roomCode, 'Mã phòng')
  if (code) errors.push(code)
  if (!String(form.name ?? '').trim()) errors.push('Tên phòng không được để trống.')
  const capacity = Number(form.capacity)
  if (!Number.isInteger(capacity) || capacity < 1) errors.push('Sức chứa phải là số nguyên lớn hơn 0.')
  else if (capacity > 500) errors.push('Sức chứa tối đa là 500 người.')
  if (!ROOM_TYPES.some((t) => t.value === form.type)) errors.push('Vui lòng chọn loại phòng.')
  return errors
}