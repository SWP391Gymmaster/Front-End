// Giá trị gợi ý khi manager TẠO lớp: phần mã theo bộ môn và sĩ số mặc định.
// Khóa trùng với SUBJECTS trong data/seed.js (không import seed để chạy được bằng node --test).
export const SUBJECT_DEFAULTS = {
  Gym: { codePart: 'GYM', capacity: 15 },
  Yoga: { codePart: 'YOGA', capacity: 20 },
  Boxing: { codePart: 'BOXING', capacity: 12 },
  Cardio: { codePart: 'CARDIO', capacity: 20 },
  Zumba: { codePart: 'ZUMBA', capacity: 30 },
  Pilates: { codePart: 'PILATES', capacity: 15 },
  'Group X': { codePart: 'GROUPX', capacity: 25 },
  Cycling: { codePart: 'CYCLING', capacity: 20 },
}

export const DEFAULT_CAPACITY = 15

// Số lớp tối đa một huấn luyện viên được phân công (dùng ở lượt sau).
export const MAX_CLASSES_PER_COACH = 5

// Môn ngoài bảng: viết HOA, bỏ dấu tiếng Việt, bỏ khoảng trắng và ký tự lạ.
const toCodePart = (subject) => String(subject ?? '')
  .normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/gi, 'D')
  .toUpperCase().replace(/[^A-Z0-9]/g, '')

export const subjectDefaults = (subject) => SUBJECT_DEFAULTS[subject] || { codePart: toCodePart(subject), capacity: DEFAULT_CAPACITY }

// Yoga → "CLS-YOGA-"
export const codePrefix = (subject) => `CLS-${subjectDefaults(subject).codePart}-`
