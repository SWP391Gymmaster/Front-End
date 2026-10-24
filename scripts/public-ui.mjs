// Optional browser QA: npm install --no-save --package-lock=false playwright
// All backend requests are intercepted; no accounts or emails are created.
import { chromium } from 'playwright'
import assert from 'node:assert/strict'
import { mkdir } from 'node:fs/promises'

await mkdir('docs/screenshots', { recursive: true })
const browser = await chromium.launch({ channel: 'chrome', headless: true })
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } })
  const failures = [], calls = []
  page.on('pageerror', e => failures.push(e.message))
  await page.route('**/backend/**', async route => {
    const request = route.request(), path = new URL(request.url()).pathname.replace('/backend', '')
    calls.push({ path, body: request.postDataJSON(), authorization: request.headers().authorization })
    let result = { message: 'Invalid email or password' }, status = 200
    if (path === '/api/membership-packages/active') result = [{ id: 1, name: 'QA Starter', durationDays: 30, price: 500000, active: true }, { id: 2, name: 'QA Plus', durationDays: 90, price: 1300000, active: true }]
    else if (path === '/auth/register') result = { userId: 1, email: 'qa@example.com', verificationRequired: true, verificationEmailStatus: 'SENT', message: 'Verification email sent.' }
    else if (path === '/auth/resend-verification') result = { message: 'If the account can be verified, a verification email will be sent.' }
    else if (path === '/auth/verify-email') {
      const token = request.postDataJSON()?.token
      if (token === 'verified-token') result = { message: 'Email verified. You can now log in.' }
      else { status = 400; result = { message: token === 'expired-token' ? 'Verification link has expired.' : 'Verification link is invalid.' } }
    } else if (path === '/auth/login') status = 401
    await route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(result) })
  })
  const base = process.env.PUBLIC_QA_URL || 'http://127.0.0.1:5187'
  const goto = path => page.goto(`${base}/#/${path}`)
  const shot = name => page.screenshot({ path: `docs/screenshots/${name}.png`, fullPage: true })
  await goto('home')
  await page.getByRole('heading', { name: 'QA Starter' }).waitFor()
  await page.getByRole('heading', { name: 'Gym', exact: true }).waitFor()
  await page.getByRole('heading', { name: 'Yoga', exact: true }).waitFor()
  await page.getByRole('heading', { name: 'Boxing', exact: true }).waitFor()
  assert.equal(await page.getByRole('link', { name: 'Lớp học', exact: true }).count(), 0)
  assert(!calls.some(c => /classes/.test(c.path)), 'public home must not request class list')
  await shot('01-home-desktop')
  await goto('classes')
  await page.getByRole('heading', { name: 'Đăng nhập để xem danh sách lớp' }).waitFor()
  assert(!calls.some(c => /classes/.test(c.path)), 'anonymous class route must not request class list')
  await shot('02-classes-login-required')
  await goto('register')
  await page.getByRole('button', { name: 'Tạo tài khoản', exact: true }).click()
  await page.getByRole('alert').waitFor()
  await shot('03-register-validation')
  await page.getByLabel('Họ và tên', { exact: true }).fill('QA Member')
  await page.getByLabel('Tên đăng nhập', { exact: true }).fill('qa_member')
  await page.getByLabel('Email', { exact: true }).fill('qa@example.com')
  await page.getByLabel('Số điện thoại', { exact: true }).fill('0912345678')
  await page.getByLabel('Mật khẩu', { exact: true }).fill('Strong123!')
  await page.getByLabel('Xác nhận mật khẩu', { exact: true }).fill('Strong123!')
  await page.getByRole('button', { name: 'Hiện mật khẩu', exact: true }).click()
  assert.equal(await page.getByLabel('Mật khẩu', { exact: true }).getAttribute('type'), 'text')
  await page.getByRole('button', { name: 'Ẩn mật khẩu', exact: true }).click()
  await page.getByRole('button', { name: 'Tạo tài khoản', exact: true }).click()
  await page.getByRole('heading', { name: 'Kiểm tra email' }).waitFor()
  await page.getByRole('button', { name: 'Gửi lại email xác minh' }).click()
  await page.getByRole('status').filter({ hasText: 'Đã tiếp nhận yêu cầu gửi lại' }).waitFor()
  await page.getByRole('button', { name: 'Đã hiểu' }).click()
  assert.equal(calls.find(c => c.path === '/auth/register')?.body?.email, 'qa@example.com')
  assert.equal(await page.evaluate(() => localStorage.getItem('gm-session')), null)
  assert.equal(await page.evaluate(() => sessionStorage.getItem('gymmaster-api-session-v1')), null)
  assert(!calls.some(c => /checkout|enrollment/.test(c.path)))
  await page.goto(`${base}/verify-email?token=verified-token`)
  await page.getByRole('heading', { name: 'Xác minh email thành công' }).waitFor()
  await shot('04-email-verified')
  await page.goto(`${base}/verify-email?token=expired-token`)
  await page.getByRole('heading', { name: 'Không thể xác minh email' }).waitFor()
  await page.getByText('Verification link has expired.').waitFor()
  await shot('05-email-link-expired')
  await goto('login')
  await page.getByLabel('Email', { exact: true }).fill('qa@example.com')
  await page.getByLabel('Mật khẩu', { exact: true }).fill('wrong-password')
  await page.getByRole('button', { name: 'Hiện mật khẩu', exact: true }).click()
  assert.equal(await page.getByLabel('Mật khẩu', { exact: true }).getAttribute('type'), 'text')
  await page.getByRole('button', { name: 'Ẩn mật khẩu', exact: true }).click()
  await page.getByRole('button', { name: 'Đăng nhập', exact: true }).click()
  await page.getByRole('alert').waitFor()
  await shot('06-login-error')
  await page.setViewportSize({ width: 390, height: 844 })
  await goto('register')
  await page.getByRole('heading', { name: 'Tạo tài khoản', exact: true }).waitFor()
  await shot('07-register-mobile')
  assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'mobile should not overflow')
  assert(await page.evaluate(() => document.querySelector('.fe1-form-card').getBoundingClientRect().bottom <= document.querySelector('.fe1-footer').getBoundingClientRect().top), 'form must not overlap footer')
  await page.getByRole('button', { name: 'Bật giao diện tối' }).click()
  await shot('08-register-mobile-dark')
  assert(calls.every(c => !c.authorization), 'public requests must not carry JWT')
  assert.deepEqual(failures, [], 'no browser runtime errors')
  console.log('PASS: public pages, registration, resend verification email, valid/expired link, login error and mobile layout. All backend responses are mocked.')
} finally { await browser.close() }
