import { api } from './client'

export const authApi = {
  login: (email, password) => api('/auth/login', { method: 'POST', body: { email, password } }),
  register: (data) => api('/auth/register', { method: 'POST', body: data }),
  verifyEmail: (token) => api('/auth/verify-email', { method: 'POST', body: { token } }),
  resendVerification: (email) => api('/auth/resend-verification', { method: 'POST', body: { email } }),
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

// ---------- Thanh toán & hóa đơn ----------
export const paymentApi = {
  list: () => api('/api/payments'),
  get: (id) => api(`/api/payments/${id}`),
  cashCheckout: ({ memberId, packageId, note }) =>
    api('/api/payments/cash-checkout', { method: 'POST', body: { memberId, packageId, note } }),
  confirm: (id, { transactionReference, note } = {}) =>
    api(`/api/payments/${id}/confirm`, { method: 'POST', body: { transactionReference, note } }),
  cancel: (id, reason) => api(`/api/payments/${id}/cancel`, { method: 'POST', body: { reason } }),
}

export const invoiceApi = {
  list: () => api('/api/invoices'),
  get: (id) => api(`/api/invoices/${id}`),
}

// Member tự mua gói
export const memberPaymentApi = {
  checkout: ({ packageId, paymentMethod, note }) =>
    api('/api/member/payments/checkout', { method: 'POST', body: { packageId, paymentMethod, note } }),
  simulatePay: (paymentId) => api(`/api/member/payments/${paymentId}/simulate-pay`, { method: 'POST' }),
  payments: () => api('/api/member/payments'),
  invoice: (id) => api(`/api/member/invoices/${id}`),
  memberships: () => api('/api/member/memberships'),
}

// Member đặt lớp
export const enrollmentApi = {
  available: () => api('/api/member/class-sessions/available'),
  mine: () => api('/api/member/class-enrollments'),
  enroll: (scheduleId) => api(`/api/member/class-sessions/${scheduleId}/enrollment`, { method: 'POST' }),
  cancel: (scheduleId) => api(`/api/member/class-sessions/${scheduleId}/enrollment`, { method: 'DELETE' }),
}
