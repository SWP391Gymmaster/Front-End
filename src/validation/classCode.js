// Gợi ý mã lớp khi manager tạo lớp (kiểu tự hoàn thành của Excel). Hàm thuần để test bằng node --test.
import { normalizeCode } from './roomRules.js'

export const MAX_SUGGESTIONS = 6

const clean = (value) => String(value ?? '').trim().replace(/\s+/g, ' ').toLowerCase()

// Lớp có mã hoặc tên chứa input (không phân biệt hoa thường). Khớp phần đầu xếp trước, còn lại giữ thứ tự gốc.
export function suggestClasses(input, classes = []) {
  const query = clean(input)
  if (query.length < 2) return []
  const ranked = []
  for (const cls of classes) {
    const code = clean(cls.classCode)
    const name = clean(cls.name)
    if (code.startsWith(query) || name.startsWith(query)) ranked.push({ cls, rank: 0 })
    else if (code.includes(query) || name.includes(query)) ranked.push({ cls, rank: 1 })
  }
  return ranked.sort((a, b) => a.rank - b.rank).slice(0, MAX_SUGGESTIONS).map((r) => r.cls)
}

// Lớp đang dùng đúng mã này (so sánh sau khi chuẩn hóa in hoa), không có thì undefined.
export const findByCode = (code, classes = []) => {
  const target = normalizeCode(code)
  return target ? classes.find((c) => normalizeCode(c.classCode) === target) : undefined
}

// Mã chưa lớp nào dùng: bỏ hậu tố "-N" cuối rồi thử -2, -3, ... CLS-YOGA-AM → CLS-YOGA-AM-2.
export function nextFreeCode(code, classes = []) {
  const base = normalizeCode(code).replace(/-\d+$/, '')
  const used = new Set(classes.map((c) => normalizeCode(c.classCode)))
  let n = 2
  while (used.has(`${base}-${n}`)) n += 1
  return `${base}-${n}`
}
