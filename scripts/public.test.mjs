import assert from 'node:assert/strict'
import { createPublicService, validateRegistration } from '../src/services/publicService.js'

const good = { fullName: 'Lại Anh Đức', userName: 'anhduc', email: 'duc@example.com', phone: '0912345678', password: 'Strong123!', confirm: 'Strong123!' }
assert.deepEqual(validateRegistration(good), {})
for (const field of ['fullName', 'userName', 'email', 'phone', 'password', 'confirm']) assert(validateRegistration({ ...good, [field]: '' })[field])
for (const password of ['password123', 'PASSWORD123!', 'StrongPass!', 'Strong123', ' Strong123!', 'a'.repeat(73)]) assert(validateRegistration({ ...good, password, confirm: password }).password)
assert(validateRegistration({ ...good, userName: 'Lại Anh Đức' }).userName)
const calls = []
let response = { status: 'sent', email: good.email }, httpStatus = 201
const service = createPublicService({ fetchImpl: async (url, options) => {
  calls.push({ url, options })
  return new Response(JSON.stringify(response), { status: httpStatus })
} })
assert.deepEqual(await service.register(good), { email: good.email })
const body = JSON.parse(calls.at(-1).options.body)
assert.equal(body.fullName, good.fullName)
assert(!('confirm' in body) && !('role' in body) && !('packageId' in body))
assert(!calls.at(-1).options.headers.Authorization)
response = [{ id: 1, active: true }, { id: 2, active: false }]
assert.deepEqual(await service.packages(), [{ id: 1, active: true }])
for (const verificationStatus of ['verified', 'expired', 'invalid', 'locked']) {
  response = { status: verificationStatus }
  assert.equal(await service.verifyOtp(good.email, '123456'), verificationStatus)
  assert.equal(calls.at(-1).url.endsWith('/auth/verify-email'), true)
  assert.deepEqual(JSON.parse(calls.at(-1).options.body), { email: good.email, otp: '123456' })
}
response = { status: 'sent' }
assert.equal((await service.resendOtp(good.email)).status, 'sent')
response = { status: 'unknown' }
await assert.rejects(service.verifyOtp(good.email, '123456'), /không hợp lệ/)
await assert.rejects(service.resendOtp(good.email), /Chưa nhận/)
httpStatus = 409; response = { message: 'Email already exists' }
await assert.rejects(service.register(good), /Email/)
console.log('PASS: registration waits for OTP delivery, strong validation, verification statuses, resend and backend errors.')
