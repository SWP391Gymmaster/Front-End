import assert from 'node:assert/strict'
import test from 'node:test'
import { translate } from '../src/preferences/translations.js'

test('Vietnamese interface text is passed through unchanged', () => {
  assert.equal(translate('Đăng nhập'), 'Đăng nhập')
  assert.equal(translate('Email hoặc mật khẩu không đúng'), 'Email hoặc mật khẩu không đúng')
})

test('dynamic values and non-string content are preserved', () => {
  assert.equal(translate('Đã tạo lớp "Yoga" thành công'), 'Đã tạo lớp "Yoga" thành công')
  assert.equal(translate(undefined), undefined)
  assert.equal(translate(42), 42)
  const value = { id: 'u1' }
  assert.equal(translate(value), value)
})
