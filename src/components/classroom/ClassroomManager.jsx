import { useState } from 'react'
import Modal from '../MemberModal'
import WeekTimetable from '../WeekTimetable'
import { ErrorBox, Loading } from '../Status'
import Field from './Field'
import ClassroomEditor from './ClassroomEditor'
import { classApi, roomApi, scheduleApi, coachApi } from '../../api/services'
import useApi from '../../api/useApi'
import { normalize, filterClasses, ROOM_TYPES, TYPE_LABELS } from '../../services/classroom'
import { formatDate, formatTime } from '../../store/utils'

const EMPTY = { q: '', subject: '', coachId: '', date: '', time: '', onlyAvailable: false }
export default function ClassroomManager({ resource }) {
  const isRoom = resource === 'room'
  const { data, loading, error, reload } = useApi(() => Promise.all([roomApi.list(), classApi.list(), scheduleApi.list(), coachApi.list()]).then(([rooms, classes, schedules, coaches]) => ({ rooms, classes, schedules, coaches })))
  const [filters, setFilters] = useState({ ...EMPTY })
  const [type, setType] = useState('')
  const [detail, setDetail] = useState(null)
  const [editor, setEditor] = useState(null)
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState('')
  const [actionError, setActionError] = useState('')
  const context = data || { rooms: [], classes: [], schedules: [], coaches: [] }
  const { rooms, classes, schedules, coaches } = context
  const disabled = loading || busy || !!error
  const items = isRoom ? rooms.filter(r => (!filters.q || normalize(`${r.name} ${r.roomCode || ''}`).includes(normalize(filters.q))) && (!type || r.type === type)) : filterClasses(classes, schedules, [], filters)
  const selected = (isRoom ? rooms : classes).find(item => item.id === detail)
  const coachName = id => coaches.find(c => c.id === id)?.fullName || 'Chưa phân công'
  const roomName = id => rooms.find(r => r.id === id)?.name || '—'
  const setFilter = key => event => setFilters({ ...filters, [key]: event.target.value })
  const open = (kind, initial = {}) => { setDetail(null); setEditor({ kind, initial }); setActionError(''); setNotice('') }
  async function remove(kind, item) {
    if (disabled) return
    if (kind === 'class' && schedules.some(s => s.classId === item.id)) { setActionError('Lớp còn lịch học. Hãy kiểm tra và xóa từng buổi trước khi xóa lớp.'); return }
    if (!window.confirm(`Xóa ${kind === 'schedule' ? 'buổi học này' : `“${item.name}”`}? Thao tác không thể hoàn tác.`)) return
    setBusy(true); setActionError(''); setNotice('')
    try { await ({ room: roomApi, class: classApi, schedule: scheduleApi })[kind].remove(item.id); setNotice('Đã xóa thành công.'); if (kind === resource) setDetail(null); await reload() }
    catch (err) { setActionError(err.message); await reload() }
    finally { setBusy(false) }
  }
  const messages = <>{notice && <div className="alert alert-success" role="status">{notice}</div>}{actionError && <div className="alert alert-error" role="alert">{actionError}</div>}</>
  const ownSchedules = item => schedules.filter(s => isRoom ? s.roomId === item.id : s.classId === item.id)
  return <div className="stack fe2-page">
    {messages}<div className="toolbar fe2-toolbar"><p className="muted">{isRoom ? 'Quản lý mã phòng, sức chứa và lịch sử dụng.' : 'Tạo lớp trước, sau đó xếp phòng và thời gian cho từng buổi học.'}</p><div className="quick"><button className="btn" disabled={loading || busy} onClick={reload}>Làm mới</button><button className="btn btn-primary" disabled={!data || disabled} onClick={() => open(resource)}>{isRoom ? '+ Thêm phòng' : '+ Tạo lớp mới'}</button>{!isRoom && <button className="btn" disabled={!classes.length || disabled} onClick={() => open('schedule')}>+ Thêm buổi học</button>}</div></div>
    <ErrorBox error={error} onRetry={reload} />{loading && <Loading />}
    <section className="card form"><div className="row-between"><h3>Bộ lọc {isRoom ? 'phòng' : 'lớp'}</h3><button className="btn btn-ghost btn-sm" onClick={() => { setFilters({ ...EMPTY }); setType('') }}>Xóa bộ lọc</button></div><div className="fe2-filter-grid">
      <Field label="Tìm kiếm"><input value={filters.q} onChange={setFilter('q')} placeholder="Mã, tên, mô tả…" /></Field>
      {isRoom ? <Field label="Loại phòng"><select value={type} onChange={e => setType(e.target.value)}><option value="">Tất cả loại phòng</option>{ROOM_TYPES.map(t => <option key={t} value={t}>{TYPE_LABELS[t]}</option>)}</select></Field> : <>
        <Field label="Bộ môn"><select value={filters.subject} onChange={setFilter('subject')}><option value="">Tất cả bộ môn</option>{[...new Set(classes.map(c => c.subject).filter(Boolean))].map(s => <option key={s}>{s}</option>)}</select></Field>
        <Field label="Huấn luyện viên"><select value={filters.coachId} onChange={setFilter('coachId')}><option value="">Tất cả Coach</option>{coaches.map(c => <option key={c.id} value={c.id}>{c.fullName}</option>)}</select></Field>
        <Field label="Ngày bắt đầu buổi"><input type="date" value={filters.date} onChange={setFilter('date')} /></Field><Field label="Giờ học"><input type="time" value={filters.time} onChange={setFilter('time')} /></Field>
      </>}
    </div>{!isRoom && <p className="small muted">Chưa hỗ trợ lọc cấp độ và trạng thái mở/đóng.</p>}</section>
    {!isRoom && <div className="card"><div className="card-head"><h3>Lịch hoạt động</h3></div><WeekTimetable items={schedules.filter(s => items.some(c => c.id === s.classId)).map(s => ({ ...s, subject: classes.find(c => c.id === s.classId)?.subject, title: classes.find(c => c.id === s.classId)?.name || 'Lớp học', lines: [coachName(s.coachId), roomName(s.roomId)] }))} /></div>}
    <section className="card"><div className="card-head"><h3>Danh sách {isRoom ? 'phòng' : 'lớp'} ({items.length})</h3></div><div className="fe2-table"><table className="table"><thead><tr><th>Mã / Tên</th><th>{isRoom ? 'Loại phòng' : 'Bộ môn'}</th><th>{isRoom ? 'Sức chứa' : 'Coach / Sĩ số'}</th><th>Số buổi</th><th>Thao tác</th></tr></thead><tbody>{items.map(item => <tr key={item.id}><td><strong>{item.name}</strong><div className="small muted">{(isRoom ? item.roomCode : item.classCode) || 'API chưa trả mã'}</div></td><td>{isRoom ? TYPE_LABELS[item.type] || item.type : item.subject}</td><td>{!isRoom && <div>{coachName(item.coachId)}</div>}{item.capacity} người</td><td>{ownSchedules(item).length}</td><td><div className="quick"><button className="btn btn-sm" onClick={() => { setDetail(item.id); setActionError('') }}>{isRoom ? 'Xem lịch' : 'Chi tiết'}</button><button className="btn btn-sm" disabled={disabled} onClick={() => open(resource, item)}>{isRoom ? 'Sửa phòng' : 'Sửa lớp'}</button><button className="btn btn-sm btn-ghost fe2-error" disabled={disabled} onClick={() => remove(resource, item)}>{isRoom ? 'Xóa phòng' : 'Xóa lớp'}</button></div></td></tr>)}</tbody></table></div>{!items.length && !loading && <p className="fe2-empty muted">Không có dữ liệu phù hợp. Thử xóa bộ lọc.</p>}</section>
    {selected && <Modal title={isRoom ? `Lịch phòng ${selected.name}` : selected.name} width={850} onClose={() => setDetail(null)}><div className="stack">{messages}{!isRoom && <><p>{selected.description || 'Chưa có mô tả.'}</p><p className="small muted">{selected.classCode} · {selected.subject} · Tối đa {selected.capacity} người</p><button className="btn btn-primary" disabled={disabled} onClick={() => open('schedule', { classId: selected.id })}>+ Thêm buổi học</button></>}
      {!ownSchedules(selected).length && <p className="muted">Chưa có buổi học.</p>}
      {[...ownSchedules(selected)].sort((a, b) => a.startTime.localeCompare(b.startTime)).map(s => <article key={s.id} className="fe2-session"><div><strong>{classes.find(c => c.id === s.classId)?.name}</strong><p>{formatDate(s.startTime)} · {formatTime(s.startTime)}–{formatTime(s.endTime)}</p><p className="small muted">{roomName(s.roomId)} · {coachName(s.coachId)}</p><span className="badge badge-gray">Chưa có dữ liệu chỗ trống</span></div><div className="quick"><button className="btn btn-sm" disabled={disabled} onClick={() => open('schedule', s)}>Sửa buổi</button><button className="btn btn-sm fe2-error" disabled={disabled} onClick={() => remove('schedule', s)}>Xóa buổi</button></div></article>)}
    </div></Modal>}
    {editor && <ClassroomEditor key={`${editor.kind}-${editor.initial.id || 'new'}`} {...editor} data={context} onClose={() => setEditor(null)} onSaved={message => { setEditor(null); setNotice(message); void reload() }} />}
  </div>
}
