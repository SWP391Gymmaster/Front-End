import assert from 'node:assert/strict'
import test from 'node:test'
import { planSessions, MAX_SESSIONS } from '../src/catalog/sessionPlan.js'

test('sinh buổi theo thứ trong tuần', () => {
  // 31/10/2026 là thứ 7; 2 tuần, T7 và CN
  const { sessions, problems } = planSessions({ days: [5, 6], start: '07:00', end: '08:00', from: '2026-10-31', to: '2026-11-08' })
  assert.deepEqual(problems, [])
  assert.deepEqual(sessions.map((s) => s.startTime.slice(0, 10)), ['2026-10-31', '2026-11-01', '2026-11-07', '2026-11-08'])
  assert.equal(sessions[0].startTime, '2026-10-31T07:00')
  assert.equal(sessions[0].endTime, '2026-10-31T08:00')
})

test('khoảng ngày gồm cả hai đầu, qua tháng và qua năm', () => {
  const { sessions } = planSessions({ days: [0], start: '18:00', end: '19:00', from: '2026-12-28', to: '2027-01-04' })
  assert.deepEqual(sessions.map((s) => s.startTime.slice(0, 10)), ['2026-12-28', '2027-01-04'])
})

test('báo lỗi khi thiếu thông tin hoặc giờ sai', () => {
  assert.equal(planSessions({ days: [], start: '07:00', end: '08:00', from: '2026-10-31', to: '2026-11-08' }).problems.length, 1)
  assert.equal(planSessions({ days: [1], start: '08:00', end: '07:00', from: '2026-10-31', to: '2026-11-08' }).problems.length, 1)
  assert.equal(planSessions({ days: [1], start: '07:00', end: '08:00', from: '2026-11-08', to: '2026-10-31' }).problems.length, 1)
  assert.equal(planSessions({ days: [1], start: '07:00', end: '08:00', from: '2026-10-31', to: '2026-10-31' }).problems.length, 1)
})

test('giới hạn số buổi mỗi lần', () => {
  const { sessions, problems } = planSessions({ days: [0, 1, 2, 3, 4, 5, 6], start: '07:00', end: '08:00', from: '2026-01-01', to: '2026-12-31' })
  assert.equal(sessions.length, 0)
  assert.match(problems[0], new RegExp(String(MAX_SESSIONS)))
})