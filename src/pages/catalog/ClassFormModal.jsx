import { useState } from 'react'
import Modal from '../../components/Modal'
import { useStore } from '../../store/context'
import { SUBJECTS } from '../../data/seed'
import { FEATURES } from '../../config/features'
import { validateClass } from '../../validation/classRules'
import { addDays, toFormDate, toFormStamp, vnStamp } from '../../validation/classDates'

const timed = FEATURES.registrationTimes
const EMPTY = { classCode: '', name: '', subject: 'Gym', description: '', capacity: 15, coachId: '', startDate: '', endDate: '', registrationOpenAt: '', registrationCloseAt: '' }
// Giá trị BE → ô nhập: ngày thì yyyy-MM-dd, mốc đăng ký sớm có giờ thì yyyy-MM-ddTHH:mm.
const fromClass = cls => ({
  ...EMPTY, ...Object.fromEntries(Object.keys(EMPTY).map(k => [k, cls[k] ?? ''])), id: cls.id,
  startDate: toFormDate(cls.startDate), endDate: toFormDate(cls.endDate),
  registrationOpenAt: timed ? toFormStamp(cls.registrationOpenAt, 'start') : toFormDate(cls.registrationOpenAt),
  registrationCloseAt: timed ? toFormStamp(cls.registrationCloseAt, 'end') : toFormDate(cls.registrationCloseAt),
})

// Tạo mới (cls = null) hoặc sửa lớp. Kiểm tra ở FE trước, BE kiểm tra lại khi lưu.
export default function ClassFormModal({ cls, onClose }) {
  const { users, rooms, schedules, saveClass } = useStore()
  const [form, setForm] = useState(() => cls ? fromClass(cls) : EMPTY)
  const [original] = useState(() => cls ? fromClass(cls) : null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const coaches = users.filter(u => u.role === 'coach')
  const set = (key, value) => setForm({ ...form, [key]: value })
  const usedRooms = form.id ? [...new Set(schedules.filter(s => String(s.classId) === String(form.id)).map(s => s.roomId))].map(id => rooms.find(r => r.id === id)).filter(Boolean) : []
  const current = vnStamp()
  const tomorrow = addDays(current.slice(0, 10), 1)
  const submit = async event => {
    event.preventDefault()
    if (busy) return
    // Tạo mới: bắt buộc có ngày bắt đầu/kết thúc, không được ở quá khứ. Sửa: chỉ kiểm tra giá trị đã đổi.
    const problems = validateClass(form, usedRooms, FEATURES.classDates ? { now: new Date(), original, timed, requireDates: !cls } : { timed })
    if (problems.length) { setError(problems.join(' ')); return }
    setBusy(true); setError('')
    try { await saveClass(form); onClose() } catch (err) { setError(err.message) } finally { setBusy(false) }
  }
  const field = (key, label, props = {}) => <label>{label}<input value={form[key]} onChange={e => set(key, e.target.value)} {...props} /></label>
  const regType = timed ? 'datetime-local' : 'date'
  const regMin = timed ? current : current.slice(0, 10)
  return <Modal title={cls ? 'Sửa lớp học' : 'Tạo lớp mới'} onClose={() => { if (!busy) onClose() }} width={640}>
    <form className="form" onSubmit={submit} noValidate>
      <fieldset className="form api-fieldset" disabled={busy}>
        {field('classCode', 'Mã lớp (VD: CLS-YOGA-AM)', { required: true })}
        {field('name', 'Tên lớp', { required: true })}
        <label>Bộ môn<select value={form.subject} onChange={e => set('subject', e.target.value)}>{SUBJECTS.map(s => <option key={s}>{s}</option>)}</select></label>
        <label>Mô tả<textarea rows={3} value={form.description} onChange={e => set('description', e.target.value)} /></label>
        {field('capacity', 'Sĩ số tối đa', { type: 'number', min: 1, step: 1, required: true })}
        <label>Huấn luyện viên<select value={form.coachId} onChange={e => set('coachId', e.target.value)}><option value="">Chưa phân công</option>{coaches.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
        {FEATURES.classDates && <>
          <p className="small muted">Thời gian lớp. Ngày bắt đầu phải từ ngày mai trở đi. Đăng ký sớm phải bắt đầu từ bây giờ và kết thúc trước 00:00 ngày bắt đầu lớp. Khi lớp đã đóng, chỉ cần đổi các ngày này để mở kỳ mới, không cần tạo lớp trùng mã.</p>
          {field('startDate', 'Ngày bắt đầu lớp', { type: 'date', min: cls ? undefined : tomorrow, required: !cls })}
          {field('endDate', 'Ngày kết thúc lớp', { type: 'date', min: form.startDate ? addDays(form.startDate, 1) : undefined, required: !cls })}
          {field('registrationOpenAt', timed ? 'Mở đăng ký sớm từ (ngày giờ)' : 'Mở đăng ký sớm từ ngày', { type: regType, min: cls ? undefined : regMin })}
          {field('registrationCloseAt', timed ? 'Kết thúc đăng ký sớm lúc (ngày giờ)' : 'Kết thúc đăng ký sớm ngày', { type: regType, min: form.registrationOpenAt || (cls ? undefined : regMin) })}
        </>}
      </fieldset>
      {error && <div className="alert alert-error" role="alert">{error}</div>}
      <div className="form-actions"><button type="button" className="btn" disabled={busy} onClick={onClose}>Hủy</button><button type="submit" className="btn btn-primary" disabled={busy}>{busy ? 'Đang xử lý...' : 'Lưu thay đổi'}</button></div>
    </form>
  </Modal>
}