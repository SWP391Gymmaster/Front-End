import { chromium } from 'playwright'
import assert from 'node:assert/strict'
const browser = await chromium.launch({ channel: 'chrome', headless: true })
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })
  let calls = 0
  await page.route('**/backend/**', route => { calls++; return route.abort() })
  await page.goto('http://127.0.0.1:5188/#/classes')
  await page.getByRole('heading', { name: 'Đăng nhập để xem danh sách lớp' }).waitFor()
  await page.screenshot({ path: 'docs/screenshots/09-classes-login-required.png', fullPage: true })
  await page.goto('http://127.0.0.1:5188/verify-email')
  await page.getByRole('heading', { name: 'Không thể xác minh email' }).waitFor()
  await page.screenshot({ path: 'docs/screenshots/10-verification-token-missing.png', fullPage: true })
  assert.equal(calls, 0)
  console.log('PASS: missing verification token and anonymous classes show the expected states without API calls.')
} finally { await browser.close() }
