import assert from 'node:assert/strict'
import test from 'node:test'
import { defaultRoomId } from '../src/validation/sessionDefaults.js'

const schedules = [
  { id: 1, classId: 5, roomId: 10, startTime: '2026-11-03T07:00' },
  { id: 2, classId: 5, roomId: 12, startTime: '2026-11-10T07:00' },
  { id: 3, classId: 5, roomId: 11, startTime: '2026-11-06T07:00' },
  { id: 4, classId: 6, roomId: 20, startTime: '2026-12-01T07:00' },
]

test('lớp có nhiều buổi: lấy phòng của buổi gần nhất theo startTime', () => {
  assert.equal(defaultRoomId(5, schedules), 12)
  assert.equal(defaultRoomId('5', schedules), 12)
})

test('không lẫn buổi của lớp khác', () => assert.equal(defaultRoomId(6, schedules), 20))

test('lớp chưa có buổi nào trả về rỗng', () => {
  assert.equal(defaultRoomId(7, schedules), '')
  assert.equal(defaultRoomId(5, []), '')
})

test('bỏ qua buổi không có phòng', () => {
  assert.equal(defaultRoomId(5, [...schedules, { id: 9, classId: 5, roomId: null, startTime: '2026-12-31T07:00' }]), 12)
})
