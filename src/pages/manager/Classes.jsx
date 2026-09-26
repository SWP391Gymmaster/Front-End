import { usePreferences } from '../../preferences/context'
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
  const { t } = usePreferences()
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
      {notice && <div className="alert alert-success">✔ {t(notice)}</div>}
      <div className="toolbar">
        <p className="muted">{t("Tạo lớp, xếp lịch và phân công Coach. Hệ thống tự kiểm tra trùng lịch Coach và phòng tập.")}</p>
        <button className="btn btn-primary" onClick={() => { setEditing(EMPTY); setNotice('') }}>{t("+ Tạo lớp mới")}</button>
      </div>

      <div className="card">
        <div className="card-head"><h3>{t("Lịch hoạt động trong tuần")}</h3></div>
        <div className="timetable">
          {DAYS.map((d) => (
            <div key={d} className="tt-col">
              <div className="tt-day">{t(d === 'CN' ? 'Chủ nhật' : 'Thứ ' + d.slice(1))}</div>
              {byDay(d).map((c) => (
                <div key={c.id} className={'tt-item subj-' + c.subject.toLowerCase()}>
                  <strong>{t(c.start)}–{t(c.end)}</strong>
                  <span>{c.name}</span>
                  <em>{coachName(c.coachId)}</em>
                  <em>{roomName(c.roomId)}</em>
                </div>
              ))}
              {byDay(d).length === 0 && <div className="tt-empty">{t("Trống")}</div>}
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <div className="card-head"><h3>{t("Danh sách lớp (")}{classes.length})</h3></div>
        <div className="table-scroll"><table className="table">
          <thead>
            <tr><th>{t("Lớp")}</th><th>{t("Bộ môn")}</th><th>{t("Coach")}</th><th>{t("Phòng")}</th><th>{t("Lịch")}</th><th>{t("Sĩ số tối đa")}</th><th></th></tr>
          </thead>
          <tbody>
            {classes.map((c) => (
              <tr key={c.id}>
                <td><strong>{c.name}</strong></td>
                <td>{t(c.subject)}</td>
                <td>{coachName(c.coachId)}</td>
                <td>{roomName(c.roomId)}</td>
                <td>{t(c.days.join(', '))} · {t(c.start)}–{t(c.end)}</td>
                <td>{c.capacity}</td>
                <td className="right nowrap">
                  <button className="btn btn-sm" onClick={() => { setEditing(c); setNotice('') }}>{t("Sửa")}</button>{' '}
                  <button className="btn btn-sm btn-ghost" onClick={() => deleteClass(c.id)}>{t("Xóa")}</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table></div>
      </div>

      {editing && (
        <Modal title={editing.id ? 'Sửa lớp học' : 'Tạo lớp học & phân công Coach'} onClose={() => setEditing(null)} width={640}>
          <form className="form" onSubmit={submit}>
            <div className="row-2">
              <label>{t("Tên lớp")}<input value={form.name} onChange={set('name')} required placeholder={t("VD: Gym nâng cao tối")} />
              </label>
              <label>{t("Bộ môn")}<select value={form.subject} onChange={set('subject')}>
                  {SUBJECTS.map((s) => <option key={s} value={s}>{t(s)}</option>)}
                </select>
              </label>
            </div>

            <div className="field">
              <span>{t("Ngày trong tuần")}</span>
              <div className="day-picker">
                {DAYS.map((d) => (
                  <button type="button" key={d} className={'day' + (form.days.includes(d) ? ' on' : '')} onClick={() => toggleDay(d)}>
                    {t(d)}
                  </button>
                ))}
              </div>
            </div>

            <div className="row-3">
              <label>{t("Giờ bắt đầu")}<input type="time" value={form.start} onChange={set('start')} required />
              </label>
              <label>{t("Giờ kết thúc")}<input type="time" value={form.end} onChange={set('end')} required />
              </label>
              <label>{t("Sĩ số tối đa")}<input type="number" min="1" value={form.capacity} onChange={set('capacity')} required />
              </label>
            </div>

            <div className="row-2">
              <label>{t("Phòng tập")}<select value={form.roomId} onChange={set('roomId')} required>
                  <option value="">{t("-- Chọn phòng --")}</option>
                  {rooms.map((r) => <option key={r.id} value={r.id}>{r.name} ({r.capacity}{t(" chỗ)")}</option>)}
                </select>
              </label>
              <label>{t("Phân công Coach")}<select value={form.coachId} onChange={set('coachId')} required>
                  <option value="">{t("-- Chọn Coach --")}</option>
                  {coaches.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} · {c.specialty}{t(coachBusy(c.id) ? ' (bận khung giờ này)' : '')}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {timeInvalid && <div className="alert alert-error">{t("Giờ kết thúc phải sau giờ bắt đầu.")}</div>}
            {overCapacity && <div className="alert alert-error">{t("Sĩ số vượt sức chứa của phòng (")}{room.capacity}{t(" người).")}</div>}
            {conflicts.map((c, i) => (
              <div key={i} className="alert alert-error">{t("⚠ Trùng lịch ")}{t(c.type === 'coach' ? `Coach ${coachName(c.cls.coachId)}` : roomName(c.cls.roomId))}{t(" với lớp \"")}{c.cls.name}" ({t(c.cls.days.join(', '))} · {t(c.cls.start)}–{t(c.cls.end)})
              </div>
            ))}
            {ready && !conflicts.length && !overCapacity && (
              <div className="alert alert-success">{t("✔ Coach và phòng tập đều trống trong khung giờ này.")}</div>
            )}

            <div className="form-actions">
              <button type="button" className="btn btn-ghost" onClick={() => setEditing(null)}>{t("Hủy")}</button>
              <button className="btn btn-primary" type="submit" disabled={!ready || conflicts.length > 0 || overCapacity}>{t("Lưu lớp học")}</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
