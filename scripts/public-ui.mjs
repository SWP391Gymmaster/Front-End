// Optional QA dependency: npm install --no-save --package-lock=false playwright
// All backend requests are intercepted; OTP responses are test-only.
// Every backend request is intercepted. No accounts, emails or payments are created.
import { chromium } from 'playwright'
import assert from 'node:assert/strict'
import { mkdir } from 'node:fs/promises'

await mkdir('docs/screenshots', { recursive: true })
const browser = await chromium.launch({ channel: 'chrome', headless: true })
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } })
  const failures = [], calls = []
  let verification = 'invalid'
  page.on('pageerror', e => failures.push(e.message))
  await page.route('**/backend/**', async route => {
    const request = route.request(), path = new URL(request.url()).pathname.replace('/backend', '')
    calls.push({ path, body: request.postDataJSON(), authorization: request.headers().authorization })
    const result = path === '/api/membership-packages' ? [{ id: 1, name: 'Gói Khởi đầu · QA', durationDays: 30, price: 500000, description: 'Dữ liệu mô phỏng cho kiểm thử giao diện.', active: true }, { id: 2, name: 'Gói Bền bỉ · QA', durationDays: 90, price: 1300000, active: true }]
      : path === '/auth/register' ? { status: 'sent', email: 'qa@example.com' }
        : path === '/auth/verify-email' ? { status: verification, email: 'qa@example.com' }
          : path === '/auth/resend-otp' ? { status: 'sent', email: 'qa@example.com' }
            : { message: 'Invalid email or password' }
    await route.fulfill({ status: path === '/auth/login' ? 401 : 200, contentType: 'application/json', body: JSON.stringify(result) })
  })
  const goto = path => page.goto(`${process.env.PUBLIC_QA_URL || 'http://127.0.0.1:5187'}/#/${path}`)
  const shot = name => page.screenshot({ path: `docs/screenshots/${name}.png`, fullPage: true })
  await goto('home')
  await page.getByRole('heading', { name: 'Gói Khởi đầu · QA' }).waitFor()
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
  await page.getByRole('heading', { name: 'Nhập mã OTP' }).waitFor()
  await page.getByLabel('Mã OTP').fill('123456')
  await page.getByRole('button', { name: 'Xác minh email' }).click()
  await page.getByRole('alert').filter({ hasText: 'Mã OTP không đúng' }).waitFor()
  verification = 'verified'
  await page.getByRole('button', { name: 'Xác minh email' }).click()
  await page.getByRole('heading', { name: 'Xác minh email thành công' }).waitFor()
  assert.equal(await page.evaluate(() => localStorage.getItem('gm-session')), null)
  assert.equal(await page.evaluate(() => sessionStorage.getItem('gymmaster-api-session-v1')), null)
  assert.equal(await page.evaluate(() => sessionStorage.getItem('gymmaster-pending-otp-email')), null)
  assert(!calls.some(c => /checkout|enrollment/.test(c.path)))
  await shot('04-otp-verified')
  await goto('login')
  await page.getByLabel('Email', { exact: true }).fill('qa@example.com')
  await page.getByLabel('Mật khẩu', { exact: true }).fill('wrong-password')
  await page.getByRole('button', { name: 'Hiện mật khẩu', exact: true }).click()
  assert.equal(await page.getByLabel('Mật khẩu', { exact: true }).getAttribute('type'), 'text')
  await page.getByRole('button', { name: 'Ẩn mật khẩu', exact: true }).click()
  await page.getByRole('button', { name: 'Đăng nhập', exact: true }).click()
  await page.getByRole('alert').waitFor()
  await shot('05-login-error')
  await goto('verify')
  await page.getByRole('heading', { name: 'Đăng ký để nhận mã OTP' }).waitFor()
  await page.setViewportSize({ width: 390, height: 844 })
  await goto('register')
  await page.getByRole('heading', { name: 'Tạo tài khoản', exact: true }).waitFor()
  await shot('08-register-mobile')
  assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'mobile should not overflow')
  assert(await page.evaluate(() => document.querySelector('.fe1-form-card').getBoundingClientRect().bottom <= document.querySelector('.fe1-footer').getBoundingClientRect().top), 'form must not overlap footer')
  await page.getByRole('button', { name: 'Bật giao diện tối' }).click()
  await shot('09-register-mobile-dark')
  assert(calls.every(c => !c.authorization), 'public requests must not carry JWT')
  assert.deepEqual(failures, [], 'no browser runtime errors')
  console.log('PASS: public home, login required for classes, registration OTP modal, invalid/verified codes, login error and mobile layout. All backend responses are mocked.')
} finally { await browser.close() }
