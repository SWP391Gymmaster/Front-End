import assert from 'node:assert/strict'
import test from 'node:test'
import { buildCatalog, filterCatalog, EMPTY_FILTERS } from '../src/catalog/catalogRules.js'

const now = new Date('2026-10-21T12:00:00+07:00')
const classes = [
  { id: 1, name: 'Yoga sáng', subject: 'Yoga', capacity: 10, coachId: 7 },
  { id: 2, name: 'Boxing tối', subject: 'Boxing', capacity: 5, coachId: 8 },
  { id: 3, name: 'Gym cũ', subject: 'Gym', capacity: 20, coachId: 7 },
]
const schedules = [
  { id: 11, classId: 1, coachId: 7, startTime: '2026-10-25T07:00:00', endTime: '2026-10-25T08:00:00' },
  { id: 21, classId: 2, coachId: 8, startTime: '2026-10-26T18:00:00', endTime: '2026-10-26T19:00:00' },
  { id: 31, classId: 3, coachId: 7, startTime: '2026-10-01T09:00:00', endTime: '2026-10-01T10:00:00' },
]
// BE chỉ trả buổi còn chỗ: buổi 21 (Boxing) không có trong danh sách ⇒ đã đầy.
const available = [{ id: 11, registeredCount: 4, remainingSlots: 6 }]
const items = buildCatalog({ classes, schedules, available, now })
const by = (n) => items.find((i) => i.cls.id === n)

test('trạng thái lớp: mở / đầy / đóng', () => {
  assert.equal(by(1).status, 'open')
  assert.equal(by(2).status, 'full')
  assert.equal(by(3).status, 'closed')
})

test('số chỗ còn lại của buổi sắp tới', () => {
  assert.equal(by(1).next.remaining, 6)
  assert.equal(by(1).next.registered, 4)
  assert.equal(by(2).next.remaining, 0)
})

test('không có dữ liệu sĩ số thì không kết luận đầy', () => {
  const unknown = buildCatalog({ classes, schedules, available: null, now })
  assert.equal(unknown.find((i) => i.cls.id === 2).status, 'open')
  assert.equal(unknown.find((i) => i.cls.id === 1).next.remaining, null)
})

test('lọc theo bộ môn, huấn luyện viên, trạng thái', () => {
  assert.deepEqual(filterCatalog(items, { ...EMPTY_FILTERS, subject: 'Yoga' }).map((i) => i.cls.id), [1])
  assert.deepEqual(filterCatalog(items, { ...EMPTY_FILTERS, coachId: '7' }).map((i) => i.cls.id), [1, 3])
  assert.deepEqual(filterCatalog(items, { ...EMPTY_FILTERS, status: 'full' }).map((i) => i.cls.id), [2])
})

test('lọc ngày và khung giờ', () => {
  assert.deepEqual(filterCatalog(items, { ...EMPTY_FILTERS, date: '2026-10-25' }).map((i) => i.cls.id), [1])
  assert.deepEqual(filterCatalog(items, { ...EMPTY_FILTERS, slot: 'evening' }).map((i) => i.cls.id), [2])
  assert.deepEqual(filterCatalog(items, { ...EMPTY_FILTERS, slot: 'morning' }).map((i) => i.cls.id), [1, 3])
})

test('còn chỗ + các bộ lọc khác kết hợp với nhau', () => {
  assert.deepEqual(filterCatalog(items, { ...EMPTY_FILTERS, hasSeats: true }).map((i) => i.cls.id), [1])
  assert.deepEqual(filterCatalog(items, { ...EMPTY_FILTERS, hasSeats: true, subject: 'Boxing' }), [])
})

test('bộ lọc rỗng trả về tất cả lớp', () => {
  assert.equal(filterCatalog(items, EMPTY_FILTERS).length, 3)
})

test('trạng thái theo thời hạn đăng ký: chưa mở / đang mở / đã đóng', () => {
  const dated = (extra) => buildCatalog({ classes: [{ id: 1, name: 'L', subject: 'Yoga', capacity: 5, ...extra }], schedules: [{ id: 1, classId: 1, startTime: '2026-11-02T07:00:00', endTime: '2026-11-02T08:00:00' }], available: [{ id: 1, registeredCount: 1, remainingSlots: 4 }], now })[0].status
  assert.equal(dated({ registrationOpenAt: '2026-10-24', registrationCloseAt: '2026-10-29' }), 'upcoming')
  assert.equal(dated({ registrationOpenAt: '2026-10-20', registrationCloseAt: '2026-10-29' }), 'open')
  assert.equal(dated({ registrationOpenAt: '2026-10-10', registrationCloseAt: '2026-10-20' }), 'closed')
  assert.equal(dated({ endDate: '2026-10-20' }), 'closed')
  assert.equal(dated({}), 'open')
})