import { api } from './client'

export const authApi = {
  login: (email, password) => api('/auth/login', { method: 'POST', body: { email, password } }),
  register: (data) => api('/auth/register', { method: 'POST', body: data }),
}

const crud = (base) => ({
  list: () => api(base),
  get: (id) => api(`${base}/${id}`),
  create: (data) => api(base, { method: 'POST', body: data }),
  update: (id, data) => api(`${base}/${id}`, { method: 'PUT', body: data }),
  remove: (id) => api(`${base}/${id}`, { method: 'DELETE' }),
})

export const packageApi = crud('/api/membership-packages')
export const roomApi = crud('/api/rooms')
export const classApi = crud('/api/classes')

export const scheduleApi = {
  ...crud('/api/schedules'),
  byCoach: (coachId) => api(`/api/schedules?coachId=${coachId}`),
}

export const coachApi = {
  list: () => api('/api/coaches'),
}

export const classEnrollmentApi = {
  available: () => api('/api/member/class-sessions/available'),
  mine: () => api('/api/member/class-enrollments'),
  enroll: (scheduleId) => api(`/api/member/class-sessions/${scheduleId}/enrollment`, { method: 'POST' }),
  cancel: (scheduleId) => api(`/api/member/class-sessions/${scheduleId}/enrollment`, { method: 'DELETE' }),
}

export const paymentApi = {
  checkout: (data) => api('/api/member/payments/checkout', { method: 'POST', body: data }),
  simulatePayment: (paymentId) => api(`/api/member/payments/${paymentId}/simulate-pay`, { method: 'POST' }),
  myPayments: () => api('/api/member/payments'),
  myInvoices: () => api('/api/member/invoices'),
  myMemberships: () => api('/api/member/memberships'),
  cashCheckout: (data) => api('/api/payments/cash-checkout', { method: 'POST', body: data }),
  list: () => api('/api/payments'),
  invoices: () => api('/api/invoices'),
}
