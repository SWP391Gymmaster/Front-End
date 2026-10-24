import assert from 'node:assert/strict'
import test from 'node:test'
import { validateClass, validateSchedule } from '../src/validation/classRules.js'

const cls = { classCode: 'CLS-YOGA-AM', name: 'Yoga sáng', subject: 'Yoga', capacity: 15 }
const yoga = { id: 1, name: 'Phòng Yoga', capacity: 20, type: 'YOGA' }
const box = { id: 2, name: 'Võ đài', capacity: 30, type: 'BOXING' }
const slot = { startTime: '2026-11-01T07:00', endTime: '2026-11-01T08:00' }

test('lớp hợp lệ', () => assert.deepEqual(validateClass(cls, [yoga]), []))

test('mã lớp, tên, sĩ số bắt buộc', () => {
  assert.equal(validateClass({ ...cls, classCode: 'x' }).length, 1)
  assert.equal(validateClass({ ...cls, name: '' }).length, 1)
  assert.equal(validateClass({ ...cls, capacity: 0 }).length, 1)
})

test('sĩ số không được vượt sức chứa phòng lớp đang dùng', () => {
  assert.equal(validateClass({ ...cls, capacity: 25 }, [yoga]).length, 1)
})

test('đổi bộ môn không khớp phòng đang dùng bị chặn', () => {
  assert.equal(validateClass({ ...cls, subject: 'Boxing' }, [yoga]).length, 1)
})

test('buổi học hợp lệ', () => assert.deepEqual(validateSchedule(slot, cls, yoga), []))

test('giờ kết thúc phải sau giờ bắt đầu', () => {
  assert.equal(validateSchedule({ ...slot, endTime: slot.startTime }, cls, yoga).length, 1)
  assert.equal(validateSchedule({ ...slot, endTime: '2026-11-01T06:00' }, cls, yoga).length, 1)
})

test('sĩ số lớp vượt sức chứa phòng bị chặn', () => {
  assert.equal(validateSchedule(slot, { ...cls, capacity: 25 }, yoga).length, 1)
})

test('phòng không phù hợp bộ môn bị chặn', () => {
  assert.equal(validateSchedule(slot, cls, box).length, 1)
})

test('thiếu lớp hoặc phòng', () => {
  assert.equal(validateSchedule(slot, undefined, undefined).length, 2)
})