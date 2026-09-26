import assert from 'node:assert/strict'
import test from 'node:test'
import { translate } from '../src/preferences/translations.js'

test('switching languages translates role names and UI without changing source values', () => {
  const gender = 'Nữ'
  assert.equal(translate(gender, 'en'), 'Female')
  assert.equal(translate(gender, 'vi'), 'Nữ')
  assert.equal(gender, 'Nữ')
  assert.equal(translate('Center Manager', 'vi'), 'Quản lý trung tâm')
  assert.equal(translate('Đăng nhập', 'en'), 'Sign in')
})

test('weekday lists translate while stored schedule codes stay stable', () => {
  const days = ['T2', 'T4', 'T6']
  assert.equal(translate(days.join(', '), 'en'), 'Mon, Wed, Fri')
  assert.deepEqual(days, ['T2', 'T4', 'T6'])
  assert.equal(translate('Chủ nhật', 'en'), 'Sunday')
})

test('dynamic messages retain names and payment amounts', () => {
  assert.equal(translate('Đã tạo gói "Gói hè" thành công', 'en'), 'Created plan "Gói hè" successfully')
  assert.equal(translate('Đã tạo lớp "Yoga" và phân công Coach Ngọc Lan', 'en'), 'Saved class "Yoga" and assigned trainer Ngọc Lan')
  assert.equal(translate('Thanh toán 500.000 đ', 'en'), 'Pay 500.000 đ')
  assert.equal(translate('Hóa đơn HD0001', 'en'), 'Invoice HD0001')
})

test('translation preserves spacing, unknown content and non-string values', () => {
  assert.equal(translate(' đang hoạt động', 'en'), ' active')
  assert.equal(translate('Võ Thị Mai', 'en'), 'Võ Thị Mai')
  assert.equal(translate(undefined, 'en'), undefined)
  assert.equal(translate(42, 'en'), 42)
  const value = { id: 'u1' }
  assert.equal(translate(value, 'en'), value)
})

test('validation and invoice messages are translated', () => {
  assert.equal(translate('Email hoặc mật khẩu không đúng', 'en'), 'Incorrect email or password')
  assert.equal(translate('Mật khẩu xác nhận không khớp', 'en'), 'Passwords do not match')
  assert.equal(translate('HÓA ĐƠN', 'en'), 'INVOICE')
})
