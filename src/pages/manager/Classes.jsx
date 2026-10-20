import { useState } from 'react'
import { useStore } from '../../store/context'
import { usePreferences } from '../../preferences/context'
import EntityManager from '../../components/EntityManager'
import { SUBJECTS } from '../../data/seed'
import { formatDate } from '../../store/utils'

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
const sameId = (a, b) => String(a) === String(b)

export default function Classes() {
  const { t } = usePreferences()
  const { classes, schedules, rooms, users, saveClass, deleteClass, saveSchedule, deleteSchedule, api } = useStore()
  const [filter, setFilter] = useState('')
  const coaches = users.filter(u => u.role === 'coach')
  const coachOptions = [{ value: '', label: t('Chưa phân công') }, ...coaches.map(u => ({ value: u.id, label: u.name }))]
  return <div className="stack"><div className="alert alert-info">{t('Tạo lớp trước, sau đó thêm từng buổi học với ngày và giờ cụ thể.')}</div>
    <EntityManager title="Lớp học" createLabel="+ Tạo lớp mới" rows={classes} initial={{ name: '', subject: 'Gym', description: '', capacity: 15, coachId: '' }} load={api.classes.get} save={saveClass} remove={deleteClass}
      fields={[{ key: 'name', label: 'Tên lớp', required: true }, { key: 'subject', label: 'Bộ môn', options: SUBJECTS.map(s => ({ value: s, label: s })) }, { key: 'description', label: 'Mô tả', type: 'textarea' }, { key: 'capacity', label: 'Sĩ số tối đa', type: 'number', min: 1, step: 1, required: true }, { key: 'coachId', label: 'Huấn luyện viên', options: coachOptions }]}
      columns={[{ key: 'name', label: 'Lớp' }, { key: 'subject', label: 'Bộ môn' }, { key: 'coach', label: 'Huấn luyện viên', render: c => coaches.find(u => u.id === c.coachId)?.name || '—' }, { key: 'capacity', label: 'Sĩ số tối đa' }]} />
    <div className="form"><label>{t('Lọc theo lớp')}<select value={filter} onChange={e => setFilter(e.target.value)}><option value="">{t('Tất cả lớp')}</option>{classes.map(c => <option value={c.id} key={c.id}>{c.name}</option>)}</select></label></div>
    <EntityManager title="Buổi học theo ngày" createLabel="Thêm buổi học" rows={schedules.filter(s => !filter || s.classId === Number(filter)).sort((a, b) => a.startTime.localeCompare(b.startTime))} initial={{ classId: filter, roomId: '', coachId: '', startTime: '', endTime: '' }} load={api.schedules.get}
      save={s => { if (s.startTime >= s.endTime) throw new Error('Giờ kết thúc phải sau giờ bắt đầu.'); return saveSchedule(s) }} remove={deleteSchedule}
      fields={[{ key: 'classId', label: 'Lớp', required: true, options: [{ value: '', label: t('-- Chọn lớp --') }, ...classes.map(c => ({ value: c.id, label: c.name }))] }, { key: 'roomId', label: 'Phòng', required: true, options: [{ value: '', label: t('-- Chọn phòng --') }, ...rooms.map(r => ({ value: r.id, label: r.name }))] }, { key: 'coachId', label: 'Huấn luyện viên', options: [{ value: '', label: t('Theo huấn luyện viên của lớp') }, ...coachOptions.slice(1)] }, { key: 'startTime', label: 'Ngày giờ bắt đầu', type: 'datetime-local', required: true }, { key: 'endTime', label: 'Ngày giờ kết thúc', type: 'datetime-local', required: true }]}
      columns={[{ key: 'class', label: 'Lớp', render: s => classes.find(c => c.id === s.classId)?.name || `#${s.classId}` }, { key: 'time', label: 'Lịch', render: s => `${formatDate(s.startTime)} ${s.startTime.slice(11, 16)} → ${formatDate(s.endTime)} ${s.endTime.slice(11, 16)}` }, { key: 'room', label: 'Phòng', render: s => rooms.find(r => r.id === s.roomId)?.name || '—' }, { key: 'coach', label: 'Huấn luyện viên', render: s => coaches.find(u => u.id === s.coachId)?.name || '—' }]} />
  </div>
}
