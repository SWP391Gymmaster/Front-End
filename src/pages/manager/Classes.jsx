import { useState } from 'react'
import Modal from '../../components/Modal'
import { DAYS, SUBJECTS } from '../../data/seed'
import { useStore } from '../../store/context'
import { findConflicts } from '../../store/utils'

const EMPTY = {
  name: '',
  subject: 'Gym',
  roomId: '',
  coachId: '',
  days: [],
  start: '17:00',
  end: '18:00',
  capacity: 15,
}

export default function Classes() {
  const { classes, rooms, users, saveClass, deleteClass } = useStore()
  const coaches = users.filter((u) => u.role === 'coach')
  const [editing, setEditing] = useState(null)
  const [notice, setNotice] = useState('')

  const roomName = (id) => rooms.find((r) => r.id === id)?.name
  const coachName = (id) => users.find((u) => u.id === id)?.name

  // ---- kiểm tra khi đang nhập ----
  const form = editing
  const timeInvalid = form && form.start >= form.end
  const ready = form && form.roomId && form.coachId && form.days.length > 0 && !timeInvalid
  const conflicts = ready ? findConflicts(form, classes) : []
  const room = form && rooms.find((r) => r.id === form.roomId)
  const overCapacity = room && Number(form.capacity) > room.capacity

  const coachBusy = (coachId) =>
    form && form.days.length > 0 && !timeInvalid &&
    findConflicts({ ...form, coachId, roomId: '__none__' }, classes).length > 0

  const set = (k) => (e) => setEditing({ ...editing, [k]: e.target.value })
  const toggleDay = (d) =>
    setEditing({
      ...editing,
      days: editing.days.includes(d) ? editing.days.filter((x) => x !== d) : DAYS.filter((x) => [...editing.days, d].includes(x)),
    })

  const submit = (e) => {
    e.preventDefault()
    if (!ready || conflicts.length || overCapacity) return
    saveClass({ ...editing, capacity: Number(editing.capacity) })
    setNotice(`Đã ${editing.id ? 'cập nhật' : 'tạo'} lớp "${editing.name}" và phân công Coach ${coachName(editing.coachId)}`)
    setEditing(null)
  }

  const byDay = (d) =>
    classes.filter((c) => c.days.includes(d)).sort((a, b) => a.start.localeCompare(b.start))

  return (
    <div className="stack">
      {notice && <div className="alert alert-success">✔ {notice}</div>}
      <div className="toolbar">
        <p className="muted">Tạo lớp, xếp lịch và phân công Coach. Hệ thống tự kiểm tra trùng lịch Coach và phòng tập.</p>
        <button className="btn btn-primary" onClick={() => { setEditing(EMPTY); setNotice('') }}>
          + Tạo lớp mới
        </button>
      </div>

      <div className="card">
        <div className="card-head"><h3>Lịch hoạt động trong tuần</h3></div>
        <div className="timetable">
          {DAYS.map((d) => (
            <div key={d} className="tt-col">
              <div className="tt-day">{d === 'CN' ? 'Chủ nhật' : 'Thứ ' + d.slice(1)}</div>
              {byDay(d).map((c) => (
                <div key={c.id} className={'tt-item subj-' + c.subject.toLowerCase()}>
                  <strong>{c.start}–{c.end}</strong>
                  <span>{c.name}</span>
                  <em>{coachName(c.coachId)}</em>
                  <em>{roomName(c.roomId)}</em>
                </div>
              ))}
              {byDay(d).length === 0 && <div className="tt-empty">Trống</div>}
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <div className="card-head"><h3>Danh sách lớp ({classes.length})</h3></div>
        <table className="table">
          <thead>
            <tr><th>Lớp</th><th>Bộ môn</th><th>Coach</th><th>Phòng</th><th>Lịch</th><th>Sĩ số tối đa</th><th></th></tr>
          </thead>
          <tbody>
            {classes.map((c) => (
              <tr key={c.id}>
                <td><strong>{c.name}</strong></td>
                <td>{c.subject}</td>
                <td>{coachName(c.coachId)}</td>
                <td>{roomName(c.roomId)}</td>
                <td>{c.days.join(', ')} · {c.start}–{c.end}</td>
                <td>{c.capacity}</td>
                <td className="right nowrap">
                  <button className="btn btn-sm" onClick={() => { setEditing(c); setNotice('') }}>Sửa</button>{' '}
                  <button className="btn btn-sm btn-ghost" onClick={() => deleteClass(c.id)}>Xóa</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editing && (
        <Modal title={editing.id ? 'Sửa lớp học' : 'Tạo lớp học & phân công Coach'} onClose={() => setEditing(null)} width={640}>
          <form className="form" onSubmit={submit}>
            <div className="row-2">
              <label>
                Tên lớp
                <input value={form.name} onChange={set('name')} required placeholder="VD: Gym nâng cao tối" />
              </label>
              <label>
                Bộ môn
                <select value={form.subject} onChange={set('subject')}>
                  {SUBJECTS.map((s) => <option key={s}>{s}</option>)}
                </select>
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

            <div className="row-3">
              <label>
                Giờ bắt đầu
                <input type="time" value={form.start} onChange={set('start')} required />
              </label>
              <label>
                Giờ kết thúc
                <input type="time" value={form.end} onChange={set('end')} required />
              </label>
              <label>
                Sĩ số tối đa
                <input type="number" min="1" value={form.capacity} onChange={set('capacity')} required />
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
                      {c.name} · {c.specialty}{coachBusy(c.id) ? ' (bận khung giờ này)' : ''}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {timeInvalid && <div className="alert alert-error">Giờ kết thúc phải sau giờ bắt đầu.</div>}
            {overCapacity && <div className="alert alert-error">Sĩ số vượt sức chứa của phòng ({room.capacity} người).</div>}
            {conflicts.map((c, i) => (
              <div key={i} className="alert alert-error">
                ⚠ Trùng lịch {c.type === 'coach' ? `Coach ${coachName(c.cls.coachId)}` : roomName(c.cls.roomId)} với lớp
                "{c.cls.name}" ({c.cls.days.join(', ')} · {c.cls.start}–{c.cls.end})
              </div>
            ))}
            {ready && !conflicts.length && !overCapacity && (
              <div className="alert alert-success">✔ Coach và phòng tập đều trống trong khung giờ này.</div>
            )}

            <div className="form-actions">
              <button type="button" className="btn btn-ghost" onClick={() => setEditing(null)}>Hủy</button>
              <button className="btn btn-primary" type="submit" disabled={!ready || conflicts.length > 0 || overCapacity}>
                Lưu lớp học
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
