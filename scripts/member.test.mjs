import assert from 'node:assert/strict'
import { createMemberService, enrollmentEligibility } from '../src/services/memberService.js'
import { getMembershipStatus, nextMembershipStart, todayISO } from '../src/store/utils.js'

const now = new Date('2026-10-07T01:00:00Z')
const today = '2026-10-07'
const member = { id: 'm1', role: 'member', name: 'Member One', email: 'one@example.com' }
const membership = { id: 'ms1', userId: 'm1', packageId: 'p1', startDate: today, endDate: '2026-10-14' }
const session = { id: 'c1:2026-10-07', date: today, startTime: `${today}T18:00:00+07:00`, endTime: `${today}T19:00:00+07:00`, capacity: 2, registeredCount: 0 }
let state = {
  currentUserId: member.id,
  users: [member, { id: 'm2', role: 'member' }, { id: 'm3', role: 'member' }, { id: 'coach', name: 'Coach', role: 'coach' }],
  packages: [{ id: 'p1', active: true, name: '7 days', days: 7, price: 100 }, { id: 'p2', active: false, days: 7, price: 100 }],
  memberships: [membership], payments: [],
  rooms: [{ id: 'r1', name: 'Room', capacity: 2 }],
  classes: [{ id: 'c1', name: 'Class', subject: 'Yoga', days: ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'], start: '18:00', end: '19:00', capacity: 2, roomId: 'r1', coachId: 'coach' }],
  // Existing browser data may have no enrollments key.
}
const api = createMemberService({ getState: () => state, commit: patch => { state = { ...state, ...patch } }, clock: () => now })

assert.equal(todayISO(new Date('2026-10-06T17:01:00Z')), today, 'Vietnam midnight boundary')
assert.equal(getMembershipStatus('m1', [], today).status, 'none')
assert.equal(getMembershipStatus('m1', [{ ...membership, endDate: '2026-10-06' }], today).status, 'expired')
assert.equal(getMembershipStatus('m1', [{ ...membership, startDate: '2026-10-08' }], today).status, 'upcoming')
assert.equal(getMembershipStatus('m1', [membership], today).expiringSoon, true, 'warning at 7 days')
assert.equal(getMembershipStatus('m1', [{ ...membership, endDate: '2026-10-15' }], today).expiringSoon, false)
assert.equal(getMembershipStatus('m1', [{ ...membership, endDate: today }], today).status, 'active', 'expiry date is inclusive')
assert.equal(getMembershipStatus('m1', [{ ...membership, endDate: today }], today).daysLeft, 0)
assert.equal(enrollmentEligibility('m1', [], [], session, now).allowed, false)
assert.equal(enrollmentEligibility('m1', [{ ...membership, startDate: '2026-10-08' }], [], session, now).allowed, false)
assert.equal(enrollmentEligibility('m1', [membership], [], { ...session, date: '2026-10-15', startTime: '2026-10-15T18:00:00+07:00' }, now).allowed, false)
assert.equal(enrollmentEligibility('m1', [membership], [], session, new Date(session.startTime)).allowed, false)
assert.equal(enrollmentEligibility('m1', [membership], [], { ...session, registeredCount: 2 }, now).allowed, false)
const clash = { id: 'other', userId: 'm1', sessionId: 'other', session: { startTime: `${today}T18:30:00+07:00`, endTime: `${today}T19:30:00+07:00` } }
assert.equal(enrollmentEligibility('m1', [membership], [clash], session, now).allowed, false)
assert.equal(enrollmentEligibility('m1', [membership], [{ ...clash, userId: 'm2' }], session, now).allowed, true)

let overview = await api.getOverview()
assert.equal(overview.sessions.length, 28)
assert.equal(overview.enrollments.length, 0, 'old demo storage without enrollments migrates')
const attempts = await Promise.allSettled([api.enroll(session.id), api.enroll(session.id)])
assert.equal(attempts.filter(r => r.status === 'fulfilled').length, 1, 'duplicate submissions do not create duplicate bookings')
assert.equal(state.enrollments.length, 1)
assert.equal((await api.getOverview()).enrollments[0].session.date, today)
await api.cancelEnrollment(session.id)
assert.equal((await api.getOverview()).enrollments.length, 0)
await assert.rejects(api.cancelEnrollment(session.id))
await assert.rejects(api.enroll('unknown'))
state.enrollments = [{ id: 'e2', userId: 'm2', sessionId: session.id, session }, { id: 'e3', userId: 'm3', sessionId: session.id, session }]
await assert.rejects(api.enroll(session.id), /đủ chỗ/)
state.enrollments = []
state.memberships = [{ ...membership, endDate: '2026-10-06' }]
await assert.rejects(api.enroll(session.id), /hết hạn/)

const purchase = await api.purchase({ packageId: 'p1', method: 'Demo' })
assert.equal(purchase.membership.startDate, today)
assert.equal(purchase.membership.endDate, '2026-10-13')
assert.equal((await api.getOverview()).status.status, 'active')
const renewal = await api.purchase({ packageId: 'p1', method: 'Demo' })
assert.equal(renewal.membership.startDate, '2026-10-14')
assert.equal(renewal.membership.endDate, '2026-10-20')
assert.equal((await api.getOverview()).status.membership.id, purchase.membership.id, 'future renewal must not replace current membership')
assert.equal(nextMembershipStart('m1', state.memberships, today), '2026-10-21')
await assert.rejects(api.purchase({ packageId: 'p2', method: 'Demo' }), /không còn/)
await api.enroll(session.id)
assert.equal((await api.getOverview()).enrollments.length, 1)
state.currentUserId = 'm2'
assert.equal((await api.getOverview()).enrollments.length, 0, 'personal schedules are isolated by user')
await assert.rejects(api.cancelEnrollment(session.id))
state.currentUserId = 'coach'
await assert.rejects(api.enroll(session.id), /hội viên/)

const registration = { userName: 'newmember', name: 'New Member', email: 'NEW@example.com', phone: '0912345678', password: 'password123' }
await assert.rejects(api.register({ ...registration, password: '123456' }), /8/)
const result = await api.register(registration)
assert.equal(result.user.role, 'member')
assert.equal(result.user.email, 'new@example.com')
assert.equal(state.currentUserId, result.user.id)
assert.equal((await api.getOverview()).status.status, 'none')
await assert.rejects(api.register({ ...registration, userName: 'another' }), /Email/)
await assert.rejects(api.register({ ...registration, email: 'different@example.com' }), /Tên đăng nhập/)
const newPurchase = await api.purchase({ packageId: 'p1', method: 'Demo' })
assert.equal(newPurchase.membership.userId, result.user.id)
await api.enroll(session.id)
assert.equal((await api.getOverview()).enrollments.length, 1, 'complete registration -> plan -> personal booking flow')
const reloadedState = JSON.parse(JSON.stringify(state))
const reloaded = createMemberService({ getState: () => reloadedState, commit: () => {}, clock: () => now })
assert.equal((await reloaded.getOverview()).enrollments.length, 1, 'saved booking survives serialization/reload')

const broken = createMemberService({ getState: () => ({ ...state, enrollments: [] }), commit: () => { throw new Error('Storage full') }, clock: () => now })
await assert.rejects(broken.enroll(session.id), /Storage full/, 'persistence errors must propagate to the UI')
console.log('PASS: member onboarding, purchase/renewal, personal bookings, cancellation, persistence, Vietnam dates, expiry boundaries, capacity, overlap, duplicate submissions, user isolation and error handling.')
