import assert from 'node:assert/strict'
import test from 'node:test'
import { findByCode, nextFreeCode, suggestClasses, MAX_SUGGESTIONS } from '../src/validation/classCode.js'

const classes = [
  { id: 1, classCode: 'CLS-YOGA-AM', name: 'Yoga sáng' },
  { id: 2, classCode: 'CLS-YOGA-PM', name: 'Yoga chiều' },
  { id: 3, classCode: 'CLS-GYM-AM', name: 'Gym buổi sáng' },
  { id: 4, classCode: 'CLS-BOX-01', name: 'Boxing cơ bản' },
]
const codes = (list) => list.map((c) => c.classCode)

test('khớp một phần mã hoặc tên', () => {
  assert.deepEqual(codes(suggestClasses('yoga-p', classes)), ['CLS-YOGA-PM'])
  assert.deepEqual(codes(suggestClasses('cơ bản', classes)), ['CLS-BOX-01'])
})

test('không phân biệt hoa thường, bỏ khoảng trắng thừa', () => {
  assert.deepEqual(codes(suggestClasses('  cls-YOGA ', classes)), ['CLS-YOGA-AM', 'CLS-YOGA-PM'])
  assert.deepEqual(codes(suggestClasses('yoga    SÁNG', classes)), ['CLS-YOGA-AM'])
})

test('dưới 2 ký tự thì không gợi ý', () => {
  assert.deepEqual(suggestClasses('c', classes), [])
  assert.deepEqual(suggestClasses('   ', classes), [])
})

test('ưu tiên khớp phần đầu', () => {
  // "AM-01" khớp đầu mã nên đứng trước "CLS-A-AM" (chỉ khớp giữa mã) dù đứng sau trong danh sách gốc
  const list = [{ id: 1, classCode: 'CLS-A-AM', name: 'Lớp am nhạc' }, { id: 2, classCode: 'AM-01', name: 'Khác' }]
  assert.deepEqual(codes(suggestClasses('am', list)), ['AM-01', 'CLS-A-AM'])
})

test('tối đa 6 gợi ý', () => {
  const many = Array.from({ length: 10 }, (_, i) => ({ id: i, classCode: `CLS-YOGA-${i}`, name: `Yoga ${i}` }))
  assert.equal(MAX_SUGGESTIONS, 6)
  assert.equal(suggestClasses('yoga', many).length, 6)
})

test('nextFreeCode: thêm -2, đã có thì -3', () => {
  assert.equal(nextFreeCode('CLS-YOGA-AM', classes), 'CLS-YOGA-AM-2')
  assert.equal(nextFreeCode('CLS-YOGA-AM', [...classes, { classCode: 'CLS-YOGA-AM-2' }]), 'CLS-YOGA-AM-3')
})

test('nextFreeCode: bỏ hậu tố -N cũ rồi tìm số trống', () => {
  const list = [...classes, { classCode: 'CLS-YOGA-AM-2' }, { classCode: 'CLS-YOGA-AM-3' }]
  assert.equal(nextFreeCode('CLS-YOGA-AM-3', list), 'CLS-YOGA-AM-4')
  assert.equal(nextFreeCode('cls-yoga-am-2', list), 'CLS-YOGA-AM-4')
})

test('nextFreeCode: mã chưa tồn tại vẫn trả mã -2', () => {
  assert.equal(nextFreeCode('CLS-PILATES-AM', classes), 'CLS-PILATES-AM-2')
})

test('findByCode tìm đúng mã đã tồn tại, không phân biệt hoa thường', () => {
  assert.equal(findByCode(' cls-yoga-am ', classes)?.id, 1)
  assert.equal(findByCode('CLS-YOGA', classes), undefined)
  assert.equal(findByCode('', classes), undefined)
})
