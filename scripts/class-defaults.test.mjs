import assert from 'node:assert/strict'
import test from 'node:test'
import { codePrefix, subjectDefaults, SUBJECT_DEFAULTS, MAX_CLASSES_PER_COACH } from '../src/config/classDefaults.js'
import { classCodeProblem, validateClass } from '../src/validation/classRules.js'

const SUBJECTS = ['Gym', 'Yoga', 'Boxing', 'Cardio', 'Zumba', 'Pilates', 'Group X', 'Cycling']

test('codePrefix theo bảng bộ môn', () => {
  assert.equal(codePrefix('Yoga'), 'CLS-YOGA-')
  assert.equal(codePrefix('Gym'), 'CLS-GYM-')
  assert.equal(codePrefix('Group X'), 'CLS-GROUPX-')
})

test('mọi môn trong SUBJECTS đều có giá trị mặc định', () => {
  for (const s of SUBJECTS) assert.ok(SUBJECT_DEFAULTS[s], s)
  assert.equal(subjectDefaults('Yoga').capacity, 20)
  assert.equal(subjectDefaults('Gym').capacity, 15)
  assert.equal(MAX_CLASSES_PER_COACH, 5)
})

test('môn ngoài bảng: viết HOA, bỏ dấu, bỏ khoảng trắng, sĩ số 15', () => {
  assert.equal(codePrefix('Võ cổ truyền'), 'CLS-VOCOTRUYEN-')
  assert.equal(codePrefix('Đấm bốc'), 'CLS-DAMBOC-')
  assert.equal(subjectDefaults('Võ cổ truyền').capacity, 15)
})

test('mã lớp hợp lệ khi có phần riêng sau tiền tố', () => {
  assert.equal(classCodeProblem('CLS-YOGA-AM', 'Yoga'), '')
  assert.equal(classCodeProblem('cls-yoga-am', 'Yoga'), '')
  assert.equal(classCodeProblem('YOGA1', 'Yoga'), '')
})

test('mã lớp chỉ có tiền tố bị từ chối', () => {
  assert.match(classCodeProblem('CLS-YOGA-', 'Yoga'), /phần riêng sau tiền tố CLS-YOGA-/)
  assert.match(classCodeProblem('CLS-YOGA', 'Yoga'), /phần riêng sau tiền tố/)
})

test('mã lớp kết thúc bằng gạch ngang, sai ký tự hoặc sai độ dài bị từ chối', () => {
  assert.match(classCodeProblem('CLS-YOGA-AM-', 'Yoga'), /kết thúc bằng dấu gạch ngang/)
  for (const bad of ['', 'AB', 'CLS YOGA AM', 'CLS_YOGA_AM', 'CLS-YOGÀ-AM', `CLS-YOGA-${'A'.repeat(30)}`]) {
    assert.ok(classCodeProblem(bad, 'Yoga').startsWith('Mã lớp'), bad)
  }
})

test('sửa lớp có mã "CLS-YOGA" mà không đổi mã thì lưu được', () => {
  const original = { classCode: 'CLS-YOGA', name: 'Yoga cũ', subject: 'Yoga', capacity: 20 }
  assert.deepEqual(validateClass({ ...original, name: 'Yoga mới' }, [], { original }), [])
  assert.equal(classCodeProblem('cls-yoga', 'Yoga', 'CLS-YOGA'), '')
})

test('sửa lớp đổi mã thành "CLS-YOGA-" thì bị chặn', () => {
  const original = { classCode: 'CLS-YOGA', name: 'Yoga cũ', subject: 'Yoga', capacity: 20 }
  assert.ok(validateClass({ ...original, classCode: 'CLS-YOGA-' }, [], { original }).some((m) => m.includes('tiền tố CLS-YOGA-')))
})

test('sửa lớp không đổi mã vẫn áp dụng luật cũ của codeProblem', () => {
  assert.match(classCodeProblem('AB', 'Yoga', 'AB'), /từ 3 đến 32 ký tự/)
})

test('validateClass dùng luật mã lớp mới', () => {
  const ok = { classCode: 'CLS-GYM-AM', name: 'Gym sáng', subject: 'Gym', capacity: 15 }
  assert.deepEqual(validateClass(ok), [])
  assert.ok(validateClass({ ...ok, classCode: 'CLS-GYM-' }).some((m) => m.includes('tiền tố')))
})
