import { useState } from 'react'
import Modal from '../MemberModal'
import Field from './Field'
import { classApi, roomApi, scheduleApi } from '../../api/services'
import { ROOM_TYPES, TYPE_LABELS, compatible, validateRoom, validateClass, validateSchedule, roomPayload, classPayload, schedulePayload } from '../../services/classroom'

const CONFIG = {
  room: { label: 'phòng', api: roomApi, validate: validateRoom, payload: roomPayload },
  class: { label: 'lớp', api: classApi, validate: validateClass, payload: classPayload },
  schedule: { label: 'buổi học', api: scheduleApi, validate: validateSchedule, payload: schedulePayload },
}
export default function ClassroomEditor({ kind, initial = {}, data, onClose, onSaved }) {
  const [value, setValue] = useState({ roomCode: '', classCode: '', name: '', capacity: '', type: 'GYM', subject: '', description: '', coachId: '', classId: '', roomId: '', startTime: '', endTime: '', ...initial })
  const [errors, setErrors] = useState({})
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const config = CONFIG[kind]
  const change = (key, next) => { const updated = { ...value, [key]: next }; setValue(updated); if (Object.keys(errors).length) setErrors(config.validate(updated, data)) }
  const input = (key, label, type = 'text') => <Field label={label} error={errors[key]}><input name={key} type={type} min={type === 'number' ? 1 : undefined} step={type === 'number' ? 1 : undefined} maxLength={key.endsWith('Code') ? 32 : undefined} value={value[key] ?? ''} onChange={e => change(key, e.target.value)} /></Field>
  const select = (key, label, choices, placeholder = 'Chọn…') => <Field label={label} error={errors[key]}><select name={key} value={value[key] ?? ''} onChange={e => change(key, e.target.value)}><option value="">{placeholder}</option>{choices.map(([id, text]) => <option key={id} value={id}>{text}</option>)}</select></Field>
  const cls = data.classes.find(c => c.id === Number(value.classId))
  const missingRoomCode = kind === 'room' && initial.id && !initial.roomCode
  async function submit(event) {
    event.preventDefault()
    if (saving || missingRoomCode) return
    const validation = config.validate(value, data)
    setErrors(validation); setError('')
    if (Object.keys(validation).length) return
    setSaving(true)
    try {
      const body = config.payload(value)
      if (initial.id) await config.api.update(initial.id, body)
      else await config.api.create(body)
      onSaved(`Đã lưu ${config.label}.`)
    } catch (err) { setErrors(err.details || {}); setError(err.message) }
    finally { setSaving(false) }
  }
  return <Modal title={`${initial.id ? 'Chỉnh sửa' : 'Thêm'} ${config.label}`} width={620} onClose={() => { if (!saving) onClose() }}>
    <form className="form fe2-form" noValidate onSubmit={submit}><fieldset className="plain" disabled={saving}>
      {kind === 'room' && <>{input('roomCode', 'Mã phòng *')}{input('name', 'Tên phòng *')}{input('capacity', 'Sức chứa *', 'number')}{select('type', 'Loại phòng *', ROOM_TYPES.map(type => [type, TYPE_LABELS[type]]))}{missingRoomCode && <div className="alert alert-error" role="alert">Không tải được mã phòng hiện tại. Cần cập nhật API trả mã phòng trước khi chỉnh sửa.</div>}</>}
      {kind === 'class' && <>{input('classCode', 'Mã lớp *')}{input('name', 'Tên lớp *')}{input('subject', 'Bộ môn *')}{input('capacity', 'Sĩ số tối đa *', 'number')}{select('coachId', 'Huấn luyện viên', data.coaches.map(c => [c.id, c.fullName]), 'Chưa phân công')}<Field label="Mô tả"><textarea value={value.description || ''} rows={4} onChange={e => change('description', e.target.value)} /></Field><p className="small muted">Sau khi lưu lớp, chọn Chi tiết để thêm hoặc sửa từng buổi học.</p></>}
      {kind === 'schedule' && <>{select('classId', 'Lớp học *', data.classes.map(c => [c.id, `${c.name} · ${c.capacity} người`]))}{select('roomId', 'Phòng tập *', data.rooms.filter(r => !cls || compatible(cls.subject, r.type)).map(r => [r.id, `${r.name} · ${TYPE_LABELS[r.type] || r.type} · ${r.capacity} chỗ`]))}{select('coachId', 'Huấn luyện viên', data.coaches.map(c => [c.id, c.fullName]), cls?.coachId ? 'Dùng Coach của lớp' : 'Chọn Coach')}{input('startTime', 'Bắt đầu *', 'datetime-local')}{input('endTime', 'Kết thúc *', 'datetime-local')}<p className="small muted">Thời gian theo giờ địa phương của trung tâm. Phòng phải đủ sức chứa, phù hợp bộ môn và không trùng lịch.</p></>}
      {error && <div className="alert alert-error" role="alert">{error}</div>}
      <div className="form-actions"><button className="btn btn-ghost" type="button" onClick={onClose}>Hủy</button><button className="btn btn-primary" type="submit" disabled={missingRoomCode}>{saving ? 'Đang lưu…' : 'Lưu thay đổi'}</button></div>
    </fieldset></form>
  </Modal>
}
