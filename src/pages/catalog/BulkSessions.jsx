import { useState } from 'react'
import { useStore } from '../../store/context'
import { roomMatchesSubject } from '../../validation/roomRules'
import { validateSchedule } from '../../validation/classRules'
import { DAYS, dayLabel, addDays, toISODate } from '../../store/utils'

// Tạo nhiều buổi học cho một lớp theo lịch lặp hàng tuần.
// Manager chọn khoảng ngày, các thứ trong tuần, giờ bắt đầu/kết thúc, phòng, HLV rồi tạo hàng loạt.
export default function BulkSessions({ cls }) {
  const { users, rooms, schedules, classes, saveSchedule } = useStore()
  const coaches = users.filter(u => u.role === 'coach')
  const roomList = rooms.filter(r => roomMatchesSubject(r, cls.subject))

  const [form, setForm] = useState({
    fromDate: cls.startDate || '',
    toDate: cls.endDate || '',
    days: [],          // mảng gồm 0..6 (0 = Thứ 2, 6 = CN)
    startHour: '08:00',
    endHour: '09:00',
    roomId: '',
    coachId: '',
  })
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState(null) // { created, errors }

  const set = (key, value) => setForm({ ...form, [key]: value })
  const toggleDay = index => {
    const next = form.days.includes(index) ? form.days.filter(d => d !== index) : [...form.days, index]
    setForm({ ...form, days: next })
  }

  // Sinh danh sách ngày khớp các thứ đã chọn trong khoảng fromDate..toDate
  const generateDates = () => {
    if (!form.fromDate || !form.toDate || !form.days.length) return []
    const dates = []
    let current = form.fromDate
    while (current <= form.toDate) {
      const jsDay = new Date(`${current}T00:00:00`).getDay()   // 0=CN, 1=T2, ..., 6=T7
      const dayIndex = (jsDay + 6) % 7                         // 0=T2, ..., 6=CN  (khớp DAYS)
      if (form.days.includes(dayIndex)) dates.push(current)
      current = addDays(current, 1)
    }
    return dates
  }

  const preview = generateDates()

  const submit = async () => {
    if (busy) return
    const room = rooms.find(r => String(r.id) === String(form.roomId))
    if (!room) { setResult({ created: 0, errors: ['Vui lòng chọn phòng.'] }); return }
    if (!preview.length) { setResult({ created: 0, errors: ['Không có ngày nào phù hợp. Hãy kiểm tra khoảng ngày và thứ đã chọn.'] }); return }

    setBusy(true)
    setResult(null)
    const errors = []
    let created = 0

    for (const date of preview) {
      const startTime = `${date}T${form.startHour}:00`
      const endTime = `${date}T${form.endHour}:00`
      const entry = { classId: cls.id, roomId: form.roomId, coachId: form.coachId || '', startTime, endTime }
      const problems = validateSchedule(entry, cls, room, { schedules, classes })
      if (problems.length) {
        errors.push(`${date}: ${problems.join(' ')}`)
        continue
      }
      try {
        await saveSchedule(entry)
        created++
      } catch (err) {
        errors.push(`${date}: ${err.message}`)
      }
    }

    setResult({ created, errors })
    setBusy(false)
  }

  return <div className="card form stack">
    <h4>Tạo nhiều buổi học</h4>
    <p className="small muted">Lớp: <strong>{cls.name}</strong> ({cls.subject})</p>

    <fieldset className="form api-fieldset" disabled={busy}>
      <label>Từ ngày<input type="date" required value={form.fromDate} onChange={e => set('fromDate', e.target.value)} /></label>
      <label>Đến ngày<input type="date" required value={form.toDate} onChange={e => set('toDate', e.target.value)} /></label>

      <div>
        <span className="small">Các thứ trong tuần</span>
        <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap', marginTop: '0.25rem' }}>
          {DAYS.map((d, i) => (
            <button type="button" key={d} className={`btn btn-sm${form.days.includes(i) ? ' btn-primary' : ''}`} onClick={() => toggleDay(i)}>
              {dayLabel(d)}
            </button>
          ))}
        </div>
      </div>

      <label>Giờ bắt đầu<input type="time" required value={form.startHour} onChange={e => set('startHour', e.target.value)} /></label>
      <label>Giờ kết thúc<input type="time" required value={form.endHour} onChange={e => set('endHour', e.target.value)} /></label>

      <label>Phòng (lọc theo bộ môn)
        <select required value={form.roomId} onChange={e => set('roomId', e.target.value)}>
          <option value="">-- Chọn phòng --</option>
          {roomList.map(r => <option key={r.id} value={r.id}>{r.name} ({r.capacity} chỗ)</option>)}
        </select>
      </label>

      <label>Huấn luyện viên
        <select value={form.coachId} onChange={e => set('coachId', e.target.value)}>
          <option value="">Theo huấn luyện viên của lớp</option>
          {coaches.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </label>
    </fieldset>

    <p className="small muted">Sẽ tạo <strong>{preview.length}</strong> buổi học</p>

    {result && <div className="stack">
      {result.created > 0 && <div className="alert alert-success" role="status">Đã tạo {result.created} buổi học thành công.</div>}
      {result.errors.length > 0 && <div className="alert alert-error" role="alert">
        <strong>{result.errors.length} buổi lỗi:</strong>
        <ul style={{ margin: '0.25rem 0 0', paddingLeft: '1.25rem' }}>{result.errors.map((e, i) => <li key={i}>{e}</li>)}</ul>
      </div>}
    </div>}

    <div className="form-actions">
      <button type="button" className="btn btn-primary" disabled={busy || !preview.length} onClick={submit}>
        {busy ? 'Đang tạo...' : `Tạo ${preview.length} buổi`}
      </button>
    </div>
  </div>
}

