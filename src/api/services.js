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
