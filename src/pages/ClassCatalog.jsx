import { useState } from 'react'
import '../catalog.css'
import { useStore } from '../store/context'
import { useMemberPortal } from '../services/useMemberPortal'
import MemberDataState from '../components/MemberDataState'
import Modal from '../components/Modal'
import { formatDate, formatTime } from '../store/utils'
import { STATUS, TIME_SLOTS, EMPTY_FILTERS, buildCatalog, filterCatalog, hasActiveFilter } from '../catalog/catalogRules'

const dmy = v => formatDate(v)
const hasDates = c => Boolean(c.startDate || c.registrationOpenAt)
const seatText = (s, capacity) => s.remaining == null ? `Sĩ số tối đa ${capacity}` : `Còn ${s.remaining}/${capacity} chỗ`

function CatalogView({ available, enrolledIds = [] }) {
  const { classes, schedules, rooms, users, currentUser, memberService } = useStore()
  const [filters, setFilters] = useState(EMPTY_FILTERS)
  const [selected, setSelected] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const coaches = users.filter(u => u.role === 'coach')
  const subjects = [...new Set(classes.map(c => c.subject).filter(Boolean))]
  const items = buildCatalog({ classes, schedules, available })
  const visible = filterCatalog(items, filters)
  const detail = selected && items.find(i => i.cls.id === selected)
  const set = (key, value) => setFilters({ ...filters, [key]: value })
  const coachName = id => coaches.find(c => Number(c.id) === Number(id))?.name || 'Chưa phân công'
  const roomName = id => rooms.find(r => r.id === id)?.name || '—'
  const isMember = currentUser.role === 'member'
  const enroll = async session => {
    if (busy) return
    setBusy(true); setError(''); setNotice('')
    try { await memberService.enroll(session.id); setNotice('Đăng ký thành công. Buổi học đã được thêm vào lịch cá nhân.') }
    catch (err) { setError(err.message) } finally { setBusy(false) }
  }
  return <div className="stack">
    <div className="card"><div className="form catalog-filters">
      <label>Bộ môn<select value={filters.subject} onChange={e => set('subject', e.target.value)}><option value="">Tất cả</option>{subjects.map(s => <option key={s}>{s}</option>)}</select></label>
      <label>Huấn luyện viên<select value={filters.coachId} onChange={e => set('coachId', e.target.value)}><option value="">Tất cả</option>{coaches.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
      <label>Ngày học<input type="date" value={filters.date} onChange={e => set('date', e.target.value)} /></label>
      <label>Khung giờ<select value={filters.slot} onChange={e => set('slot', e.target.value)}><option value="">Cả ngày</option>{TIME_SLOTS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}</select></label>
      <label>Trạng thái<select value={filters.status} onChange={e => set('status', e.target.value)}><option value="">Tất cả</option>{Object.entries(STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}</select></label>
      <label className="check"><input type="checkbox" checked={filters.hasSeats} disabled={!available} onChange={e => set('hasSeats', e.target.checked)} />Chỉ lớp còn chỗ</label>
      <button className="btn" disabled={!hasActiveFilter(filters)} onClick={() => setFilters(EMPTY_FILTERS)}>Xóa bộ lọc</button>
    </div>
    {!available && <p className="small muted">Số chỗ còn lại chỉ hiển thị với tài khoản hội viên.</p>}</div>
    {notice && <div className="alert alert-success" role="status">{notice}</div>}
    <p className="small muted">Tìm thấy {visible.length} / {items.length} lớp</p>
    {!visible.length ? <div className="card member-empty"><p>Không có lớp phù hợp bộ lọc.</p></div> : <div className="catalog-grid">
      {visible.map(({ cls, status, next }) => <article className="catalog-card" key={cls.id}>
        <div className="catalog-top"><span className="badge badge-green">{cls.subject || '—'}</span><span className={`badge ${STATUS[status].badge}`}>{STATUS[status].label}</span></div>
        <h3>{cls.name}</h3>
        <p>Mã lớp: {cls.classCode || '—'}</p>
        <p>HLV: {coachName(cls.coachId)}</p>
        {hasDates(cls)
          ? <>
            <p>Thời gian học: {dmy(cls.startDate) || '—'} – {dmy(cls.endDate) || '—'}</p>
            <p>Đăng ký: {dmy(cls.registrationOpenAt) || '—'} – {dmy(cls.registrationCloseAt) || '—'}</p>
          </>
          : <p>{next ? `Buổi tới: ${formatDate(next.startTime)} ${formatTime(next.startTime)}` : 'Chưa có buổi sắp tới'}</p>}
        <p>{next ? seatText(next, cls.capacity) : `Sĩ số tối đa ${cls.capacity}`}</p>
        <button className="btn btn-sm" onClick={() => { setSelected(cls.id); setError(''); setNotice('') }}>Xem chi tiết</button>
      </article>)}
    </div>}
    {detail && <Modal title={detail.cls.name} onClose={() => setSelected(null)} width={640}>
      <div className="stack">
        <div className="catalog-top"><span className="badge badge-green">{detail.cls.subject}</span><span className={`badge ${STATUS[detail.status].badge}`}>{STATUS[detail.status].label}</span></div>
        {detail.cls.description && <p>{detail.cls.description}</p>}
        {hasDates(detail.cls) && <div className="catalog-dates">
          <div><span>Bắt đầu lớp</span>{dmy(detail.cls.startDate) || '—'}</div>
          <div><span>Kết thúc lớp</span>{dmy(detail.cls.endDate) || '—'}</div>
          <div><span>Mở đăng ký</span>{dmy(detail.cls.registrationOpenAt) || '—'}</div>
          <div><span>Đóng đăng ký</span>{dmy(detail.cls.registrationCloseAt) || '—'}</div>
        </div>}
        <p className="small muted">Mã lớp {detail.cls.classCode} · HLV {coachName(detail.cls.coachId)} · Sĩ số tối đa {detail.cls.capacity}</p>
        {notice && <div className="alert alert-success" role="status">{notice}</div>}
        {error && <div className="alert alert-error" role="alert">{error}</div>}
        {!detail.sessions.length ? <p className="muted">Lớp chưa có lịch học.</p> : <ul className="catalog-sessions">
          {detail.sessions.map(s => {
            const mine = enrolledIds.includes(Number(s.id))
            const blocked = detail.status === 'upcoming' || detail.status === 'closed'
            const label = blocked ? STATUS[detail.status].label : s.closed ? 'Đã đóng' : s.full ? 'Đã đầy' : mine ? 'Đã đăng ký' : 'Đăng ký'
            return <li key={s.id}>
              <span><strong>{formatDate(s.startTime)}</strong> {formatTime(s.startTime)}–{formatTime(s.endTime)} · {roomName(s.roomId)}<br /><span className="muted">{s.closed ? 'Buổi học đã bắt đầu' : seatText(s, detail.cls.capacity)}</span></span>
              {isMember && <button className="btn btn-primary btn-sm" disabled={busy || blocked || s.closed || s.full || mine} onClick={() => enroll(s)}>{label}</button>}
            </li>
          })}
        </ul>}
      </div>
    </Modal>}
  </div>
}

function MemberCatalog() {
  const { data, error, retry } = useMemberPortal()
  if (!data || error) return <MemberDataState error={error} retry={retry} />
  return <CatalogView available={data.sessions} enrolledIds={data.enrollments.map(e => Number(e.sessionId))} />
}

export default function ClassCatalog() {
  const { currentUser } = useStore()
  return currentUser.role === 'member' ? <MemberCatalog /> : <CatalogView available={null} />
}