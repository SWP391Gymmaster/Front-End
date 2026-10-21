export const ROOM_TYPES = ['GYM', 'YOGA', 'GROUP_X', 'CYCLING', 'BOXING', 'CARDIO', 'OTHER'];
export const TYPE_LABELS = { GYM: 'Gym', YOGA: 'Yoga', GROUP_X: 'Group X', CYCLING: 'Cycling', BOXING: 'Boxing', CARDIO: 'Cardio', OTHER: 'Khác' };
export const normalize = value => String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase().trim();
export function subjectType(subject) {
  const value = normalize(subject).replace(/[\s_-]/g, '');
  return ROOM_TYPES.find(type => type.toLowerCase().replace('_', '') === value) || null;
}
export function compatible(subject, type) {
  const required = subjectType(subject);
  return !required || type === required || type === 'OTHER';
}
export const overlap = (a, b) => Date.parse(a.startTime) < Date.parse(b.endTime) && Date.parse(a.endTime) > Date.parse(b.startTime);
function validateCode(value, key, items, errors) {
  const code = value[key]?.trim() || '';
  if (!/^[A-Za-z0-9][A-Za-z0-9_-]{0,31}$/.test(code)) errors[key] = 'Mã gồm 1–32 ký tự chữ không dấu, số, gạch ngang hoặc gạch dưới; bắt đầu bằng chữ/số.';
  else if (items.some(item => Number(item.id) !== Number(value.id) && item[key]?.toLowerCase() === code.toLowerCase())) errors[key] = 'Mã đã được sử dụng.';
}
const positiveInteger = value => Number.isSafeInteger(Number(value)) && Number(value) > 0;
export function validateRoom(value, { rooms = [], classes = [], schedules = [] } = {}) {
  const errors = {};
  validateCode(value, 'roomCode', rooms, errors);
  if (!value.name?.trim()) errors.name = 'Vui lòng nhập tên phòng.';
  if (!positiveInteger(value.capacity)) errors.capacity = 'Sức chứa phải là số nguyên dương.';
  if (!ROOM_TYPES.includes(value.type)) errors.type = 'Vui lòng chọn loại phòng.';
  const linked = schedules.filter(s => Number(s.roomId) === Number(value.id)).map(s => classes.find(c => c.id === s.classId)).filter(Boolean);
  if (linked.some(c => Number(c.capacity) > Number(value.capacity))) errors.capacity = 'Phòng phải đủ sức chứa cho các lớp đã xếp lịch.';
  if (linked.some(c => !compatible(c.subject, value.type))) errors.type = 'Loại phòng không phù hợp với lớp đã xếp lịch.';
  return errors;
}
export function validateClass(value, { classes = [], rooms = [], schedules = [] } = {}) {
  const errors = {};
  validateCode(value, 'classCode', classes, errors);
  if (!value.name?.trim()) errors.name = 'Vui lòng nhập tên lớp.';
  if (!value.subject?.trim()) errors.subject = 'Vui lòng nhập bộ môn.';
  if (!positiveInteger(value.capacity)) errors.capacity = 'Sĩ số phải là số nguyên dương.';
  const linked = schedules.filter(s => Number(s.classId) === Number(value.id)).map(s => rooms.find(r => r.id === s.roomId)).filter(Boolean);
  if (linked.some(r => Number(value.capacity) > Number(r.capacity))) errors.capacity = 'Sĩ số vượt sức chứa phòng đã xếp lịch.';
  if (linked.some(r => !compatible(value.subject, r.type))) errors.subject = 'Bộ môn không phù hợp phòng đã xếp lịch.';
  return errors;
}
export function validateSchedule(value, { classes = [], rooms = [], schedules = [] } = {}) {
  const errors = {};
  const cls = classes.find(c => c.id === Number(value.classId));
  const room = rooms.find(r => r.id === Number(value.roomId));
  if (!cls) errors.classId = 'Vui lòng chọn lớp.';
  if (!room) errors.roomId = 'Vui lòng chọn phòng.';
  const coachId = value.coachId ? Number(value.coachId) : cls?.coachId;
  if (!coachId) errors.coachId = 'Chọn Coach hoặc phân công Coach cho lớp trước.';
  if (!value.startTime || !Number.isFinite(Date.parse(value.startTime))) errors.startTime = 'Vui lòng chọn thời gian bắt đầu hợp lệ.';
  if (!value.endTime || !Number.isFinite(Date.parse(value.endTime))) errors.endTime = 'Vui lòng chọn thời gian kết thúc hợp lệ.';
  if (value.startTime && value.endTime && value.startTime >= value.endTime) errors.endTime = 'Giờ kết thúc phải sau giờ bắt đầu.';
  if (cls && room && Number(cls.capacity) > Number(room.capacity)) errors.roomId = 'Sĩ số lớp vượt sức chứa phòng.';
  if (cls && room && !compatible(cls.subject, room.type)) errors.roomId = 'Loại phòng không phù hợp bộ môn.';
  const others = schedules.filter(s => Number(s.id) !== Number(value.id) && overlap(s, value));
  if (others.some(s => Number(s.roomId) === Number(value.roomId))) errors.roomId = 'Phòng đã có lịch trong khoảng thời gian này.';
  if (others.some(s => Number(s.coachId ?? classes.find(c => c.id === s.classId)?.coachId) === Number(coachId))) errors.coachId = 'Coach đã có lịch trong khoảng thời gian này.';
  return errors;
}
// Only the member available-session endpoint supplies authoritative seat counts.
// Missing from that endpoint may mean full, started, or unavailable; do not infer FULL.
export function sessionState(schedule, available) {
  if (available) return available.remainingSlots > 0 ? 'AVAILABLE' : 'FULL';
  return 'UNKNOWN';
}
export function filterClasses(classes, schedules, available, filters) {
  return classes.filter(cls => {
    if (filters.q && !normalize(`${cls.classCode || ''} ${cls.name} ${cls.description} ${cls.subject}`).includes(normalize(filters.q))) return false;
    if (filters.subject && cls.subject !== filters.subject) return false;
    const related = schedules.filter(s => s.classId === cls.id);
    if (!filters.coachId && !filters.date && !filters.time && !filters.onlyAvailable) return true;
    // Every session criterion must match the same session, not separate sessions.
    return related.some(s => (!filters.coachId || Number(s.coachId ?? cls.coachId) === Number(filters.coachId))
      && (!filters.date || s.startTime?.slice(0, 10) === filters.date)
      && (!filters.time || (s.startTime?.slice(11, 16) <= filters.time && s.endTime?.slice(11, 16) > filters.time))
      && (!filters.onlyAvailable || available.some(a => a.scheduleId === s.id && a.remainingSlots > 0)));
  });
}
export const roomPayload = value => ({ roomCode: value.roomCode.trim(), name: value.name.trim(), capacity: Number(value.capacity), type: value.type });
export const classPayload = value => ({ classCode: value.classCode.trim(), name: value.name.trim(), subject: value.subject.trim(), description: value.description?.trim() || '', capacity: Number(value.capacity), coachId: value.coachId ? Number(value.coachId) : null });
export const schedulePayload = value => ({ classId: Number(value.classId), roomId: Number(value.roomId), coachId: value.coachId ? Number(value.coachId) : null, startTime: value.startTime.length === 16 ? `${value.startTime}:00` : value.startTime, endTime: value.endTime.length === 16 ? `${value.endTime}:00` : value.endTime });
