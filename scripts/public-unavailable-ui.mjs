import { chromium } from 'playwright'
import assert from 'node:assert/strict'
const browser = await chromium.launch({ channel: 'chrome', headless: true })
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })
  let calls = 0
  await page.route('**/backend/**', route => { calls++; return route.abort() })
  await page.goto('http://127.0.0.1:5188/#/classes')
  await page.getByRole('heading', { name: 'Đăng nhập để xem danh sách lớp' }).waitFor()
  await page.screenshot({ path: 'docs/screenshots/10-classes-login-required.png', fullPage: true })
  await page.goto('http://127.0.0.1:5188/#/verify?token=qa')
  await page.getByRole('heading', { name: 'Đăng ký để nhận mã OTP' }).waitFor()
  await page.screenshot({ path: 'docs/screenshots/11-verification-api-pending.png', fullPage: true })
  assert.equal(calls, 0)
  console.log('PASS: unconfigured class/email APIs show honest unavailable states and send no requests.')
} finally { await browser.close() }
