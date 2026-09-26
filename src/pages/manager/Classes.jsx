import { useState } from 'react'
import Modal from '../../components/Modal'
import { ErrorBox, Loading } from '../../components/Status'
import WeekTimetable from '../../components/WeekTimetable'
import { classApi, coachApi, roomApi, scheduleApi } from '../../api/services'
import useApi from '../../api/useApi'
import { addDays, DAYS, dayOf, formatDate, formatTime, todayISO } from '../../store/utils'

const SUBJECTS = ['Gym', 'Yoga', 'Boxing', 'Cardio', 'Zumba', 'Pilates']

const EMPTY = {
  name: '',
  subject: 'Gym',
  capacity: 15,
  roomId: '',
  coachId: '',
  days: [],
  start: '17:00',
  end: '18:00',
  fromDate: todayISO(),
  weeks: 4,
}

const buildSessions = (f) => {
  if (!f.days.length || f.start >= f.end || !f.fromDate) return []
  const sessions = []
  for (let i = 0; i < Number(f.weeks) * 7; i++) {
    const date = addDays(f.fromDate, i)
    if (f.days.includes(dayOf(date))) {
      sessions.push({ startTime: `${date}T${f.start}:00`, endTime: `${date}T${f.end}:00` })
    }
  }
  return sessions
}

const overlaps = (a, b) => a.startTime < b.endTime && b.startTime < a.endTime

export default function Classes() {
  const { data, loading, error, reload } = useApi(() =>
    Promise.all([classApi.list(), scheduleApi.list(), roomApi.list(), coachApi.list()]).then(
      ([classes, schedules, rooms, coaches]) => ({ classes, schedules, rooms, coaches }),
    ),
  )
  const [form, setForm] = useState(null)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')
  const [notice, setNotice] = useState('')

  const classes = data?.classes || []
  const schedules = data?.schedules || []
  const rooms = data?.rooms || []
  const coaches = data?.coaches || []

  const roomName = (id) => rooms.find((r) => r.id === id)?.name || '—'
  const coachName = (id) => coaches.find((c) => c.id === id)?.fullName || '—'
  const className = (id) => classes.find((c) => c.id === id)?.name || '—'

  const sessions = form ? buildSessions(form) : []
  const timeInvalid = form && form.start >= form.end
  const coachIdNum = form && Number(form.coachId)
  const roomIdNum = form && Number(form.roomId)
  const conflicts = []
  if (form?.coachId && form?.roomId) {
    sessions.forEach((s) =>
      schedules.forEach((ex) => {
        if (!overlaps(s, ex)) return
        if (ex.coachId === coachIdNum) conflicts.push({ type: 'coach', s, ex })
        if (ex.roomId === roomIdNum) conflicts.push({ type: 'room', s, ex })
      }),
    )
  }
  const coachBusy = (id) => sessions.some((s) => schedules.some((ex) => ex.coachId === id && overlaps(s, ex)))
  const room = rooms.find((r) => r.id === roomIdNum)
  const overCapacity = room && Number(form.capacity) > room.capacity
  const ready = form && form.name && form.roomId && form.coachId && sessions.length > 0 && !timeInvalid

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })
  const toggleDay = (d) =>
    setForm({ ...form, days: form.days.includes(d) ? form.days.filter((x) => x !== d) : DAYS.filter((x) => [...form.days, d].includes(x)) })

  const submit = async (e) => {
    e.preventDefault()
    if (!ready || conflicts.length || overCapacity) return
    setSaving(true)
    setFormError('')
    let created = null
    const createdSchedules = []
    try {
      // 1. Tạo lớp + phân công Coach
      created = await classApi.create({
        name: form.name,
        subject: form.subject,
        capacity: Number(form.capacity),
        coachId: coachIdNum,
      })
      // 2. Tạo buổi học
      for (const s of sessions) {
        try {
          const sc = await scheduleApi.create({ classId: created.id, coachId: coachIdNum, roomId: roomIdNum, ...s })
          createdSchedules.push(sc)
        } catch (err) {
          throw new Error(`Buổi ${formatDate(s.startTime)} ${formatTime(s.startTime)}: ${err.message}`, { cause: err })
        }
      }
      setNotice(`Đã tạo lớp "${form.name}" (${sessions.length} buổi) và phân công Coach ${coachName(coachIdNum)}`)
      setForm(null)
      reload()
    } catch (err) {
      for (const sc of createdSchedules) await scheduleApi.remove(sc.id).catch(() => {})
      if (created) await classApi.remove(created.id).catch(() => {})
      setFormError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const removeClass = async (c) => {
    const own = schedules.filter((s) => s.classId === c.id)
    if (!confirm(`Xóa lớp "${c.name}" và ${own.length} buổi học?`)) return
    try {
      for (const s of own) await scheduleApi.remove(s.id)
      await classApi.remove(c.id)
      setNotice(`Đã xóa lớp "${c.name}"`)
      reload()
    } catch (err) {
      alert(err.message)
      reload()
    }
  }

  const summary = (c) => {
    const own = schedules.filter((s) => s.classId === c.id).sort((a, b) => a.startTime.localeCompare(b.startTime))
    const days = DAYS.filter((d) => own.some((s) => dayOf(s.startTime) === d))
    const upcoming = own.find((s) => s.startTime.slice(0, 10) >= todayISO())
    return {
      count: own.length,
      rooms: [...new Set(own.map((s) => roomName(s.roomId)))].join(', ') || '—',
      pattern: own.length ? `${days.join(', ')} · ${formatTime(own[0].startTime)}–${formatTime(own[0].endTime)}` : 'Chưa có lịch',
      next: upcoming ? formatDate(upcoming.startTime) : '—',
    }
  }

  const items = schedules.map((s) => {
    const c = classes.find((x) => x.id === s.classId)
    return {
      id: s.id,
      startTime: s.startTime,
      endTime: s.endTime,
      subject: c?.subject,
      title: c?.name || 'Lớp #' + s.classId,
      lines: [coachName(s.coachId), roomName(s.roomId)],
    }
  })

  return (
    <div className="stack">
      {notice && <div className="alert alert-success">✔ {notice}</div>}
      <div className="toolbar">
        <p className="muted">Tạo lớp, xếp lịch và phân công Coach. Hệ thống kiểm tra trùng lịch Coach và phòng tập.</p>
        <button className="btn btn-primary" onClick={() => { setForm(EMPTY); setNotice(''); setFormError('') }} disabled={!data}>
          + Tạo lớp mới
        </button>
      </div>

      <ErrorBox error={error} onRetry={reload} />
      {loading && !data && <Loading />}

      <div className="card">
        <div className="card-head"><h3>Lịch hoạt động</h3></div>
        <WeekTimetable items={items} />
      </div>

      <div className="card">
        <div className="card-head"><h3>Danh sách lớp ({classes.length})</h3></div>
        <table className="table">
          <thead>
            <tr><th>Lớp</th><th>Bộ môn</th><th>Coach</th><th>Phòng</th><th>Lịch</th><th>Số buổi</th><th>Buổi kế tiếp</th><th></th></tr>
          </thead>
          <tbody>
            {classes.map((c) => {
              const s = summary(c)
              return (
                <tr key={c.id}>
                  <td><strong>{c.name}</strong><div className="small muted">Tối đa {c.capacity ?? '—'} học viên</div></td>
                  <td>{c.subject || '—'}</td>
                  <td>{coachName(c.coachId)}</td>
                  <td>{s.rooms}</td>
                  <td>{s.pattern}</td>
                  <td>{s.count}</td>
                  <td>{s.next}</td>
                  <td className="right"><button className="btn btn-sm btn-ghost" onClick={() => removeClass(c)}>Xóa</button></td>
                </tr>
              )
            })}
            {data && classes.length === 0 && <tr><td colSpan="8" className="center muted">Chưa có lớp nào</td></tr>}
          </tbody>
        </table>
      </div>

      {form && (
        <Modal title="Tạo lớp học & phân công Coach" onClose={() => !saving && setForm(null)} width={660}>
          <form className="form" onSubmit={submit}>
            <div className="row-3">
              <label>
                Tên lớp
                <input value={form.name} onChange={set('name')} required placeholder="VD: Boxing tối" />
              </label>
              <label>
                Bộ môn
                <select value={form.subject} onChange={set('subject')}>
                  {SUBJECTS.map((s) => <option key={s}>{s}</option>)}
                </select>
              </label>
              <label>
                Sĩ số tối đa
                <input type="number" min="1" value={form.capacity} onChange={set('capacity')} required />
              </label>
            </div>

            <div className="field">
              <span>Ngày trong tuần</span>
              <div className="day-picker">
                {DAYS.map((d) => (
                  <button type="button" key={d} className={'day' + (form.days.includes(d) ? ' on' : '')} onClick={() => toggleDay(d)}>
                    {d}
                  </button>
                ))}
              </div>
            </div>

            <div className="row-4">
              <label>
                Giờ bắt đầu
                <input type="time" value={form.start} onChange={set('start')} required />
              </label>
              <label>
                Giờ kết thúc
                <input type="time" value={form.end} onChange={set('end')} required />
              </label>
              <label>
                Từ ngày
                <input type="date" value={form.fromDate} onChange={set('fromDate')} required />
              </label>
              <label>
                Số tuần
                <input type="number" min="1" max="12" value={form.weeks} onChange={set('weeks')} required />
              </label>
            </div>

            <div className="row-2">
              <label>
                Phòng tập
                <select value={form.roomId} onChange={set('roomId')} required>
                  <option value="">-- Chọn phòng --</option>
                  {rooms.map((r) => <option key={r.id} value={r.id}>{r.name} ({r.capacity} chỗ)</option>)}
                </select>
              </label>
              <label>
                Phân công Coach
                <select value={form.coachId} onChange={set('coachId')} required>
                  <option value="">-- Chọn Coach --</option>
                  {coaches.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.fullName}{coachBusy(c.id) ? ' (bận khung giờ này)' : ''}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {sessions.length > 0 && (
              <div className="muted small">
                Sẽ tạo <strong>{sessions.length} buổi</strong>, từ {formatDate(sessions[0].startTime)} đến {formatDate(sessions[sessions.length - 1].startTime)}.
              </div>
            )}
            {timeInvalid && <div className="alert alert-error">Giờ kết thúc phải sau giờ bắt đầu.</div>}
            {overCapacity && <div className="alert alert-error">Sĩ số vượt sức chứa của phòng ({room.capacity} người).</div>}
            {conflicts.slice(0, 3).map((c, i) => (
              <div key={i} className="alert alert-error">
                ⚠ Trùng lịch {c.type === 'coach' ? `Coach ${coachName(c.ex.coachId)}` : roomName(c.ex.roomId)} với lớp
                "{className(c.ex.classId)}" ngày {formatDate(c.ex.startTime)} ({formatTime(c.ex.startTime)}–{formatTime(c.ex.endTime)})
              </div>
            ))}
            {conflicts.length > 3 && <div className="alert alert-error">… và {conflicts.length - 3} buổi trùng khác</div>}
            {ready && !conflicts.length && !overCapacity && (
              <div className="alert alert-success">✔ Coach và phòng tập đều trống trong các buổi này.</div>
            )}
            {formError && <div className="alert alert-error">{formError}</div>}

            <div className="form-actions">
              <button type="button" className="btn btn-ghost" onClick={() => setForm(null)} disabled={saving}>Hủy</button>
              <button className="btn btn-primary" type="submit" disabled={!ready || conflicts.length > 0 || overCapacity || saving}>
                {saving ? 'Đang lưu...' : 'Lưu lớp học'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
