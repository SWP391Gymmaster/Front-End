import assert from 'node:assert/strict'
import { createApiClient, createControllerApi, mapPackage, packagePayload, mapSession } from '../src/services/api.js'
import { createBackendStore, validSession } from '../src/services/backendStore.js'

const memory = () => { const data = new Map(); return { getItem: k => data.get(k) ?? null, setItem: (k, v) => data.set(k, v), removeItem: k => data.delete(k), data } }
const token = (seconds = 3600) => 'header.' + btoa(JSON.stringify({ exp: Date.now() / 1000 + seconds })).replace(/=/g, '') + '.signature'
const jwt = token()
const session = memory(), local = memory()
const calls = []
const catalog = [{ id: 11, name: 'Plan', description: 'Benefits', price: 500000, durationDays: 30, active: true }]
const classes = [{ id: 22, name: 'Yoga', subject: 'Yoga', capacity: 10, coachId: 33 }]
const rooms = [{ id: 44, name: 'Room', capacity: 20 }]
const schedules = [{ id: 55, classId: 22, coachId: 33, roomId: 44, startTime: '2099-10-07T18:00:00', endTime: '2099-10-07T19:00:00' }]
const coaches = [{ id: 33, fullName: 'Trainer', email: 'coach@example.com', role: 'COACH' }]
let enrollments = []
let forbidden = false
let forceError = null
let nextId = 100
const json = (body, status = 200) => new Response(status === 204 ? null : JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })
async function backend(url, options) {
  const path = url.replace('/backend', '')
  const body = options.body ? JSON.parse(options.body) : undefined
  calls.push({ path, options, body })
  if (forceError) return json(forceError.body, forceError.status)
  if (path === '/api/test') return new Response('Backend is running!')
  if (path === '/auth/login' || path === '/auth/register') {
    if (body.password === 'wrong') return json({ message: 'Invalid email or password' }, 401)
    const role = body.email.startsWith('coach') ? 'COACH' : body.email.startsWith('member') || path === '/auth/register' ? 'MEMBER' : 'MANAGER'
    return json({ token: jwt, email: body.email, role, fullName: body.fullName || 'Test User', userId: role === 'MEMBER' ? 2 : role === 'COACH' ? 33 : 1 })
  }
  assert.equal(options.headers.Authorization, `Bearer ${jwt}`, 'authenticated request carries JWT')
  if (forbidden) return json({ message: 'Access denied' }, 403)
  if (path.endsWith('/dashboard')) return new Response('Hello User')
  if (path === '/api/coaches') return json(coaches)
  if (path === '/api/membership-packages/active') return json(catalog.filter(p => p.active))
  if (path.startsWith('/api/membership-packages/by-code/')) return json(catalog.find(p => p.packageCode === decodeURIComponent(path.split('/').at(-1))))
  const packageState = path.match(/^\/api\/membership-packages\/(\d+)\/(suspend|activate)$/)
  if (packageState) {
    const pkg = catalog.find(p => p.id === Number(packageState[1])) || { id: Number(packageState[1]) }
    if (!catalog.includes(pkg)) catalog.push(pkg)
    const active = packageState[2] === 'activate'
    Object.assign(pkg, { active, status: active ? 'ACTIVE' : 'SUSPENDED' })
    return json(pkg)
  }
  if (/^\/api\/rooms\/\d+\/schedules$/.test(path)) return json(schedules.filter(s => s.roomId === Number(path.split('/')[3])))
  if (path.startsWith('/api/admin/users?')) return json({ content: [], page: 0, size: 20, totalElements: 0, totalPages: 0 })
  if (path === '/api/admin/users' && options.method === 'POST') return json({ user: { id: 88, ...body }, verificationEmailStatus: 'SENT' }, 201)
  if (/^\/api\/admin\/users\/\d+\/status$/.test(path)) return json({ id: Number(path.split('/')[4]), enabled: body.enabled })
  if (/^\/api\/admin\/users\/\d+\/verification-email$/.test(path)) return json({ verificationEmailStatus: 'SENT' }, 202)
  if (/^\/api\/admin\/users\/\d+$/.test(path) && options.method === 'GET') return json({ id: Number(path.split('/').at(-1)), userName: 'managed' })
  if (/^\/api\/admin\/users\/\d+$/.test(path) && options.method === 'PATCH') return json({ user: { id: Number(path.split('/').at(-1)), ...body }, verificationEmailStatus: 'NOT_REQUIRED' })
  if (/^\/api\/admin\/users\/\d+$/.test(path) && options.method === 'DELETE') return json(null, 204)
  if (path === '/api/vnpay/create-payment-url') return json({ paymentUrl: 'https://sandbox.vnpayment.vn/demo' })
  if (path.startsWith('/api/vnpay/mock-success/')) return json({ paymentCode: path.split('/').at(-1), status: 'COMPLETED' })
  if (path === '/api/member/memberships') return json([])
  if (path === '/api/member/class-sessions/available') return json([{ scheduleId: 55, classId: 22, className: 'Yoga', subject: 'Yoga', coachId: 33, roomId: 44, startTime: schedules[0].startTime, endTime: schedules[0].endTime, capacity: 10, registeredCount: enrollments.length, remainingSlots: 10 - enrollments.length, registeredByMe: enrollments.length > 0 }])
  if (path === '/api/member/class-enrollments') return json(enrollments)
  if (path === '/api/member/class-sessions/55/enrollment') {
    if (options.method === 'DELETE') { enrollments = []; return json(null, 204) }
    const row = { enrollmentId: 66, scheduleId: 55, classId: 22, className: 'Yoga', startTime: schedules[0].startTime, endTime: schedules[0].endTime, enrolledAt: new Date().toISOString() }
    enrollments = [row]
    return json(row, 201)
  }
  const collection = path.startsWith('/api/membership-packages') ? catalog : path.startsWith('/api/rooms') ? rooms : path.startsWith('/api/classes') ? classes : path.startsWith('/api/schedules') ? schedules : null
  assert(collection, 'unexpected route ' + path)
  const id = Number(path.split('?')[0].split('/').pop())
  if (options.method === 'DELETE') return json(null, 204)
  if (options.method === 'POST' || options.method === 'PUT') return json({ id: id || ++nextId, ...body }, options.method === 'POST' ? 201 : 200)
  return json(id ? collection.find(x => x.id === id) : collection)
}
const store = createBackendStore({ sessionStorage: session, localStorage: local, fetchImpl: backend })
assert.equal(store.getSnapshot().currentUser, null, 'no demo identity loaded')
await assert.rejects(store.login('manager@example.com', 'wrong'), /Email/)
assert.equal(store.getSnapshot().currentUser, null)
await store.login('manager@example.com', 'password123')
await store.refresh()
assert.equal(store.getSnapshot().currentUser.role, 'manager')
assert.equal(store.getSnapshot().packages[0].days, 30)
assert.equal(store.getSnapshot().schedules[0].id, 55)
assert.equal(store.getSnapshot().memberships.length, 0)
assert(session.getItem('gymmaster-api-session-v1').includes(jwt))
assert(!session.getItem('gymmaster-api-session-v1').includes('password123'), 'passwords are never stored')
assert(validSession({ token: jwt, user: store.getSnapshot().currentUser }))
assert(!validSession({ token: token(-1), user: store.getSnapshot().currentUser }))
const restored = createBackendStore({ sessionStorage: session, localStorage: local, fetchImpl: backend })
assert.equal(restored.getSnapshot().currentUser.id, 1)

const pkg = await store.savePackage({ name: 'New plan', days: 90, price: 1200000, active: true, description: 'Test' })
assert.equal(pkg.days, 90)
assert.equal(calls.at(-1).body.durationDays, 90)
assert(!('days' in calls.at(-1).body))
await store.savePackage({ ...pkg, days: 60 })
assert.equal(calls.at(-1).options.method, 'PUT')
await store.togglePackage(pkg.id)
assert.equal(store.getSnapshot().packages.find(p => p.id === pkg.id).active, false)
assert.equal(calls.at(-1).path, `/api/membership-packages/${pkg.id}/suspend`)
assert.equal(calls.at(-1).options.method, 'PATCH')
await store.deletePackage(pkg.id)
assert(!store.getSnapshot().packages.some(p => p.id === pkg.id))
const room = await store.saveRoom({ name: 'Test Room', capacity: '20' })
assert.equal(calls.at(-1).body.capacity, 20)
await store.saveRoom({ ...room, capacity: 30 })
await store.deleteRoom(room.id)
assert.deepEqual(await store.api.rooms.schedules(44), schedules.filter(s => s.roomId === 44))
assert.equal(calls.at(-1).path, '/api/rooms/44/schedules')
assert.deepEqual(await store.api.packages.active(), catalog.filter(p => p.active))
assert.equal(calls.at(-1).path, '/api/membership-packages/active')
await store.api.packages.byCode('PLAN-TEST')
assert.equal(calls.at(-1).path, '/api/membership-packages/by-code/PLAN-TEST')
assert.equal((await store.api.adminUsers.list({ page: 1, size: 10, q: 'Member', role: 'MEMBER' })).page, 0)
assert(calls.at(-1).path.includes('q=Member') && calls.at(-1).path.includes('role=MEMBER'))
assert.equal((await store.api.adminUsers.create({ userName: 'new_member' })).verificationEmailStatus, 'SENT')
assert.equal(calls.at(-1).options.method, 'POST')
await store.api.adminUsers.get(88)
assert.equal(calls.at(-1).path, '/api/admin/users/88')
await store.api.adminUsers.update(88, { fullName: 'Updated' })
assert.equal(calls.at(-1).options.method, 'PATCH')
await store.api.adminUsers.setStatus(88, false)
assert.deepEqual(calls.at(-1).body, { enabled: false })
await store.api.adminUsers.deactivate(88)
assert.equal(calls.at(-1).options.method, 'DELETE')
await store.api.adminUsers.resendVerification(88)
assert(calls.at(-1).path.endsWith('/verification-email'))
assert.equal((await store.api.vnpay.createPaymentUrl({ packageId: 2 })).paymentUrl, 'https://sandbox.vnpayment.vn/demo')
assert.equal(calls.at(-1).path, '/api/vnpay/create-payment-url')
assert.equal((await store.api.vnpay.mockSuccess('PAY-X')).status, 'COMPLETED')
const cls = await store.saveClass({ name: 'Class', subject: 'Yoga', capacity: '10', coachId: '33', roomId: 44, days: ['T2'] })
assert.equal(calls.at(-1).body.coachId, 33)
assert(!('days' in calls.at(-1).body) && !('roomId' in calls.at(-1).body), 'class payload is separate from schedules')
await store.saveClass({ ...cls, capacity: 12 })
await store.deleteClass(cls.id)
const schedule = await store.saveSchedule({ classId: '22', roomId: '44', coachId: '', startTime: '2099-10-08T18:00', endTime: '2099-10-08T19:00' })
assert.equal(calls.at(-1).body.coachId, null)
assert.equal(calls.at(-1).body.classId, 22)
await store.saveSchedule({ ...schedule, coachId: '33' })
await store.deleteSchedule(schedule.id)
for (const [resource, id] of [['packages', 11], ['rooms', 44], ['classes', 22], ['schedules', 55]]) assert.equal((await store.api[resource].get(id)).id, id)
await store.api.schedules.list('?classId=22')
assert.equal(calls.at(-1).path, '/api/schedules?classId=22')
assert.equal(await store.api.health(), 'Backend is running!')
assert(!calls.at(-1).options.headers.Authorization)

const priorPackages = store.getSnapshot().packages
forceError = { status: 400, body: { message: 'Invalid request data', errors: { name: 'must not be blank' } } }
await assert.rejects(store.savePackage({ ...catalog[0], days: 1 }), e => e.status === 400 && e.details.name === 'must not be blank')
assert.equal(store.getSnapshot().packages, priorPackages, 'failed writes leave cached data unchanged')
forceError = null
forbidden = true
await assert.rejects(store.api.classes.list(), e => e.status === 403)
assert(store.getSnapshot().currentUser, '403 does not clear a valid session')
forbidden = false
store.updateProfile(1, { avatarUrl: 'https://res.cloudinary.com/example/photo.webp' })
assert.equal(store.getSnapshot().currentUser.avatarUrl, 'https://res.cloudinary.com/example/photo.webp')
assert.throws(() => store.updateProfile(1, { name: 'Fake saved name' }))
store.logout()
assert.equal(store.getSnapshot().packages.length, 0)
assert.equal(session.getItem('gymmaster-api-session-v1'), null)
await store.login('coach@example.com', 'password123')
await store.refresh()
assert(calls.some(c => c.path === '/api/schedules?coachId=33'))
store.logout()
await store.memberService.register({ userName: 'member1', name: 'Member Name', email: 'member@example.com', password: 'Strong123!', confirm: 'Strong123!', phone: '0912345678', gender: 'Nữ', goal: 'Giảm cân' })
await store.refresh()
assert.equal(store.getSnapshot().currentUser, null, 'registration must not sign in')
await store.login('member@example.com', 'password123')
await store.refresh()
const registration = calls.find(c => c.path === '/auth/register')
assert.equal(registration.body.fullName, 'Member Name')
assert(!('role' in registration.body) && !('gender' in registration.body))
let portal = await store.memberService.getOverview()
assert.equal(portal.status.status, 'none', 'empty membership response means no activated membership')
assert.equal(portal.sessions[0].id, 55)
assert.equal(portal.sessions[0].roomName, 'Room')
assert.equal(portal.sessions[0].coachName, 'Trainer')
assert.equal(portal.sessions[0].startTime, '2099-10-07T18:00:00+07:00')
await store.memberService.enroll(55)
portal = await store.memberService.getOverview()
assert.equal(portal.enrollments[0].sessionId, 55)
assert.equal(portal.enrollments[0].session.subject, 'Yoga')
assert.equal(portal.enrollments[0].session.roomName, 'Room')
await store.memberService.cancelEnrollment(55)
assert.equal((await store.memberService.getOverview()).enrollments.length, 0)
forceError = { status: 400, body: { message: 'Membership package is expired or does not cover this class session' } }
await assert.rejects(store.memberService.enroll(55), /Gói tập/)
forceError = { status: 401, body: { message: 'Authentication required' } }
await assert.rejects(store.api.rooms.list(), e => e.status === 401)
assert.equal(store.getSnapshot().currentUser, null)
assert.equal(store.getSnapshot().packages.length, 0)
assert(store.getSnapshot().authMessage)
forceError = null

let release
const slowStore = createBackendStore({ sessionStorage: memory(), localStorage: memory(), fetchImpl: async (url, options) => {
  if (url.includes('/api/member/class-enrollments')) return new Promise(resolve => { release = () => resolve(json([])) })
  return backend(url, options)
} })
await slowStore.login('member@example.com', 'password123')
await slowStore.refresh()
const staleRead = slowStore.memberService.getOverview()
slowStore.logout()
await slowStore.login('manager@example.com', 'password123')
release()
await assert.rejects(staleRead, /thay đổi/)
await slowStore.refresh()
assert.equal(slowStore.getSnapshot().currentUser.role, 'manager')
assert.equal(slowStore.getSnapshot().packages.length, catalog.length)

const failingClient = createApiClient({ fetchImpl: async () => { throw new TypeError('offline') } })
await assert.rejects(failingClient('/api/test'), /Không thể kết nối/)
const htmlClient = createApiClient({ fetchImpl: async () => new Response('<!doctype html><html>fallback</html>') })
await assert.rejects(htmlClient('/api/test'), /Địa chỉ API/)
assert.equal(mapPackage(catalog[0]).days, 30)
assert.equal(packagePayload({ ...catalog[0], days: 30 }).durationDays, 30)
assert.equal(mapSession({ scheduleId: 99, classId: 22, startTime: '2099-10-07T18:00:00Z', endTime: '2099-10-07T19:00:00Z' }).startTime, '2099-10-07T18:00:00Z')
const routes = createControllerApi(async (path, options) => ({ path, options }))
assert.equal((await routes.cancel(7)).options.method, 'DELETE')
console.log('PASS: JWT login/register/session reload, all catalog CRUD DTOs, dated schedules and filters, coach data, member enrollment/cancellation, 204/text responses, 400/401/403/network errors, stale session isolation, unsupported features and local avatar separation. No real API writes performed.')
