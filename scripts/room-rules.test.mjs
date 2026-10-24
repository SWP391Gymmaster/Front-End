import assert from 'node:assert/strict'
import test from 'node:test'
import { validateRoom, roomMatchesSubject, normalizeCode } from '../src/validation/roomRules.js'

const ok = { roomCode: 'ROOM-GYM-A', name: 'Phòng Gym A', capacity: 40, type: 'GYM' }

test('phòng hợp lệ không có lỗi', () => assert.deepEqual(validateRoom(ok), []))

test('mã phòng sai định dạng bị từ chối', () => {
  for (const bad of ['', 'ab', 'ROOM GYM', 'ROOM--A', '-ROOM', 'ROOM_GYM']) {
    assert.ok(validateRoom({ ...ok, roomCode: bad }).some((m) => m.startsWith('Mã phòng')), bad)
  }
})

test('mã phòng chữ thường được chuẩn hóa thành in hoa', () => {
  assert.equal(normalizeCode('  room-gym-a '), 'ROOM-GYM-A')
  assert.deepEqual(validateRoom({ ...ok, roomCode: 'room-gym-a' }), [])
})

test('tên, sức chứa, loại phòng là bắt buộc', () => {
  assert.equal(validateRoom({ ...ok, name: '  ' }).length, 1)
  assert.equal(validateRoom({ ...ok, capacity: 0 }).length, 1)
  assert.equal(validateRoom({ ...ok, capacity: 2.5 }).length, 1)
  assert.equal(validateRoom({ ...ok, type: '' }).length, 1)
})

test('loại phòng phải khớp bộ môn', () => {
  assert.equal(roomMatchesSubject({ type: 'YOGA' }, 'Yoga'), true)
  assert.equal(roomMatchesSubject({ type: 'BOXING' }, 'Yoga'), false)
  assert.equal(roomMatchesSubject({ type: 'OTHER' }, 'Boxing'), true)
})