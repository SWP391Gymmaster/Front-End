import assert from 'node:assert/strict'
import { createPublicService, validateRegistration } from '../src/services/publicService.js'

const good = { fullName: 'Lại Anh Đức', userName: 'anhduc', email: 'duc@example.com', phone: '0912345678', password: 'Strong123!', confirm: 'Strong123!' }
assert.deepEqual(validateRegistration(good), {})
for (const field of ['fullName', 'userName', 'email', 'phone', 'password', 'confirm']) assert(validateRegistration({ ...good, [field]: '' })[field])
for (const password of ['password123', 'PASSWORD123!', 'StrongPass!', 'Strong123', ' Strong123!', 'a'.repeat(73)]) assert(validateRegistration({ ...good, password, confirm: password }).password)
assert(validateRegistration({ ...good, userName: 'Lại Anh Đức' }).userName)
const calls = []
let response = { userId: 7, email: good.email, verificationRequired: true, verificationEmailStatus: 'SENT' }, httpStatus = 201
const service = createPublicService({ fetchImpl: async (url, options) => {
  calls.push({ url, options })
  return new Response(JSON.stringify(response), { status: httpStatus })
} })
assert.deepEqual(await service.register(good), { email: good.email, verificationEmailStatus: 'SENT' })
const body = JSON.parse(calls.at(-1).options.body)
assert.equal(body.fullName, good.fullName)
assert(!('confirm' in body) && !('role' in body) && !('packageId' in body))
assert(!calls.at(-1).options.headers.Authorization)
response = [{ id: 1, active: true }, { id: 2, active: false }]
assert.deepEqual(await service.packages(), [{ id: 1, active: true }])
response = { message: 'Email verified. You can now log in.' }
assert.equal((await service.verifyEmail('one-time-token')).message, response.message)
assert.equal(calls.at(-1).url.endsWith('/auth/verify-email'), true)
assert.deepEqual(JSON.parse(calls.at(-1).options.body), { token: 'one-time-token' })
response = { message: 'If the account can be verified, a verification email will be sent.' }
assert.equal((await service.resendVerification(good.email)).message, response.message)
assert.equal(calls.at(-1).url.endsWith('/auth/resend-verification'), true)
assert.deepEqual(JSON.parse(calls.at(-1).options.body), { email: good.email })
await assert.rejects(service.verifyEmail(''), /không có token/)
response = {}
await assert.rejects(service.resendVerification(good.email), /không hợp lệ/)
httpStatus = 409; response = { message: 'Email already exists' }
await assert.rejects(service.register(good), /Email/)
console.log('PASS: registration, link-token email verification, resend, validation and backend errors.')
