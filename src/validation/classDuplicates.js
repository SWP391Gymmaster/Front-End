// Lớp trùng / giao nhau và số lớp của huấn luyện viên (FE thuần, BE chưa kiểm tra). Hàm thuần để test bằng node --test.
//  - Khoảng ngày [startDate, endDate] tính cả hai đầu.
//  - Bỏ qua chính lớp đang sửa (excludeId) và lớp ĐÃ ĐÓNG (endDate trước hôm nay).
//  - Lớp thiếu ngày được coi là chiếm cả khoảng chưa biết (thận trọng: vẫn tính vào số lớp của coach).
import { MAX_CLASSES_PER_COACH } from '../config/classDefaults.js'
import { vnStamp } from './classDates.js'

const ymd = (value) => (value ? String(value).slice(0, 10) : '')
const sameId = (a, b) => a != null && a !== '' && b != null && b !== '' && String(a) === String(b)
const todayOf = (today) => today || vnStamp().slice(0, 10)

// Hai khoảng ngày giao nhau (tính cả hai đầu); thiếu đầu nào thì đầu đó coi như mở.
export const rangesOverlap = (aStart, aEnd, bStart, bEnd) =>
  (!ymd(aStart) || !ymd(bEnd) || ymd(aStart) <= ymd(bEnd)) && (!ymd(bStart) || !ymd(aEnd) || ymd(bStart) <= ymd(aEnd))

export const isClosedClass = (cls, today) => Boolean(ymd(cls.endDate)) && ymd(cls.endDate) < todayOf(today)

// Các lớp khác (chưa đóng) của coach.
const otherClassesOf = (coachId, classes, { excludeId, today } = {}) => {
  const day = todayOf(today)
  return classes.filter((c) => sameId(c.coachId, coachId) && !sameId(c.id, excludeId) && !isClosedClass(c, day))
}

// Số lớp khác của coach giao với [startDate, endDate]; chưa đủ ngày thì đếm mọi lớp chưa đóng của coach.
export function coachLoad(coachId, classes = [], { startDate, endDate, excludeId, today } = {}) {
  if (coachId == null || coachId === '') return 0
  const others = otherClassesOf(coachId, classes, { excludeId, today })
  if (!ymd(startDate) || !ymd(endDate)) return others.length
  return others.filter((c) => rangesOverlap(startDate, endDate, c.startDate, c.endDate)).length
}

export const coachIsFull = (load) => load >= MAX_CLASSES_PER_COACH

// Cần có coach và đủ ngày bắt đầu/kết thúc mới kiểm tra trùng/giao.
const comparable = (form) => form.coachId != null && form.coachId !== '' && ymd(form.startDate) && ymd(form.endDate)

// TRÙNG: cùng coach, cùng ngày bắt đầu và cùng ngày kết thúc. Trả lớp trùng đầu tiên hoặc undefined.
export function findDuplicate(form, classes = [], { excludeId = form.id, today } = {}) {
  if (!comparable(form)) return undefined
  return otherClassesOf(form.coachId, classes, { excludeId, today })
    .find((c) => ymd(c.startDate) === ymd(form.startDate) && ymd(c.endDate) === ymd(form.endDate))
}

// GIAO NHAU: cùng coach, khoảng ngày giao nhau nhưng không trùng hoàn toàn.
export function findOverlaps(form, classes = [], { excludeId = form.id, today } = {}) {
  if (!comparable(form)) return []
  return otherClassesOf(form.coachId, classes, { excludeId, today })
    .filter((c) => rangesOverlap(form.startDate, form.endDate, c.startDate, c.endDate))
    .filter((c) => !(ymd(c.startDate) === ymd(form.startDate) && ymd(c.endDate) === ymd(form.endDate)))
}
