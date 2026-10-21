import { useState } from 'react'
import { usePreferences } from '../../preferences/context'
import { useMemberPortal } from '../../services/useMemberPortal'
import { formatDate } from '../../store/utils'
import MembershipNotice from '../../components/MembershipNotice'
import MemberDataState from '../../components/MemberDataState'
import Modal from '../../components/MemberModal'
import Icon from '../../components/Icon'
import WeekTimetable from '../../components/WeekTimetable'
import { normalize } from '../../services/classroom'
import { useStore } from '../../store/context'

export default function MemberSchedule({ goTo }) {
  const { t } = usePreferences()
  const { classes = [] } = useStore()
  const { data, error, loading, retry, memberService } = useMemberPortal()
  const [tab, setTab] = useState('mine')
  const [subject, setSubject] = useState('all')
  const [date, setDate] = useState('')
  const [selected, setSelected] = useState(null)
  const [busy, setBusy] = useState(false)
  const [actionError, setActionError] = useState('')
  const [notice, setNotice] = useState('')
  const [query, setQuery] = useState('')
  const [coach, setCoach] = useState('')
  const [time, setTime] = useState('')
  if (!data || error) return <MemberDataState error={error} retry={retry} />
  const { sessions, enrollments, status } = data
  const now = new Date()
  const upcoming = enrollments.filter((e) => new Date(e.session.endTime) > now)
  const rawRecords = tab === 'available' ? sessions : (tab === 'past' ? enrollments.filter((e) => new Date(e.session.endTime) <= now) : upcoming).map((e) => e.session)
  const records = rawRecords.map(session => {
    const cls = classes.find(item => item.id === session.classId)
    return { ...session, classCode: cls?.classCode || '', description: cls?.description || '' }
  })
  const visible = records.filter((s) => (subject === 'all' || s.subject === subject) && (!date || s.date === date) && (!query || normalize(`${s.classCode} ${s.name} ${s.description}`).includes(normalize(query))) && (!coach || s.coachName === coach) && (!time || (s.startTime.slice(11, 16) <= time && s.endTime.slice(11, 16) > time))).sort((a, b) => a.startTime.localeCompare(b.startTime))
  const subjects = [...new Set([...sessions, ...enrollments.map((e) => e.session)].map((s) => s.subject))]
  const open = (session, cancel = false) => { setSelected({ session, cancel }); setActionError(''); setNotice('') }
  const confirm = async () => {
    if (busy || !selected) return
    setBusy(true)
    setActionError('')
    try {
      if (selected.cancel)
      await memberService.cancelEnrollment(selected.session.id)
      else
      await memberService.enroll(selected.session.id)
      setNotice(selected.cancel ? 'Đã hủy đăng ký buổi học.' : 'Đăng ký thành công. Buổi học đã được thêm vào lịch cá nhân.')
      setSelected(null)
      if (!selected.cancel) { setTab('mine'); setDate(''); setSubject('all') }
    } catch (err) { setActionError(err.message || 'Không thể hoàn tất yêu cầu. Vui lòng thử lại.'); retry() }
    finally { setBusy(false) }
  }
  return <div className="stack">
    <div className="section-intro"><span className="eyebrow">{t('LỊCH TẬP CỦA BẠN')}</span><h2>{t('Giữ nhịp tập luyện mỗi ngày.')}</h2><p>{t('Đăng ký từng buổi học và theo dõi lịch tập của riêng bạn.')}</p></div>
    <MembershipNotice status={status} onChoose={() => goTo('buy')} />
    {tab === 'mine' && <WeekTimetable items={enrollments.map(({ session }) => ({
      ...session, title: session.name, lines: [session.coachName, session.roomName],
    }))} />}
    {notice && <div className="alert alert-success" role="status">{t(notice)}</div>}
    <div className="card">
      <div className="member-tabs" role="group" aria-label={t('Lọc lịch tập')}>
        {[['mine', 'Lịch của tôi'], ['available', 'Khám phá buổi học'], ['past', 'Buổi học đã qua']].map(([key, label]) => <button key={key} aria-pressed={tab === key} className={tab === key ? 'selected' : ''} onClick={() => { setTab(key); setDate(''); setSubject('all') }}>{t(label)}{key === 'mine' && <span>{upcoming.length}</span>}</button>)}
      </div>
      <div className="session-filters form fe2-member-filters"><label>{t('Tìm kiếm')}<input value={query} onChange={e => setQuery(e.target.value)} placeholder="Mã hoặc tên lớp…" /></label><label>{t('Bộ môn')}<select value={subject} onChange={(e) => setSubject(e.target.value)}><option value="all">{t('Tất cả bộ môn')}</option>{subjects.map((s) => <option key={s} value={s}>{s}</option>)}</select></label><label>{t('Huấn luyện viên')}<select value={coach} onChange={e => setCoach(e.target.value)}><option value="">{t('Tất cả Coach')}</option>{[...new Set(records.map(s => s.coachName))].map(c => <option key={c}>{c}</option>)}</select></label><label>{t('Ngày tập')}<input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></label><label>{t('Giờ học')}<input type="time" value={time} onChange={e => setTime(e.target.value)} /></label><button className="btn btn-ghost" onClick={() => { setSubject('all'); setDate(''); setQuery(''); setCoach(''); setTime('') }}>{t('Xóa bộ lọc')}</button></div>
      {tab === 'available' && <p className="small muted">{t('Các buổi học còn chỗ do máy chủ cung cấp. Điều kiện gói được kiểm tra khi xác nhận.')}</p>}
      {loading && <p className="small muted" role="status">{t('Đang tải dữ liệu…')}</p>}
      {!visible.length ? <div className="member-empty"><Icon name="calendar" size={36} /><h3>{t(tab === 'mine' && !upcoming.length ? 'Bạn chưa có buổi học nào sắp tới.' : 'Không có buổi học phù hợp.')}</h3><p>{t('Thử đổi bộ lọc hoặc khám phá các buổi học đang mở.')}</p>{tab === 'mine' && <button className="btn btn-primary" onClick={() => { setTab('available'); setDate(''); setSubject('all') }}>{t('Khám phá buổi học')} →</button>}</div> : <div className="session-grid">
        {visible.map((session) => {
          const registered = enrollments.some((e) => e.sessionId === session.id)
          const started = new Date(session.startTime) <= now
          return <article className="session-card" key={session.id}>
            <div className="session-card-top"><span className="badge badge-green">{session.subject}</span><span className="small muted">{formatDate(session.date)}</span></div>
            <h3>{session.name}</h3><p className="small muted">{session.classCode}</p><p className="small muted">{session.description}</p><div className="session-time"><Icon name="calendar" size={17} />{session.time}</div>
            <p><Icon name="user" size={15} />{session.coachName}</p><p><Icon name="room" size={15} />{session.roomName}</p>
            {tab === 'available' && <p className="small">{t('Chỗ còn lại: ')}<strong>{session.remainingSlots ?? '—'} / {session.capacity}</strong></p>}
            <div className="session-action">
              {tab === 'available' ? <><button className="btn btn-primary full" disabled={loading || registered || !session.allowed} onClick={() => open(session)}>{t(registered ? 'Đã đăng ký' : 'Đăng ký buổi học')}</button>{!registered && !session.allowed && <p className="small booking-reason">{t(session.reason)}</p>}</> : tab === 'mine' ? <button className="btn full" disabled={started || loading} onClick={() => open(session, true)}>{t(started ? 'Đang diễn ra' : 'Hủy đăng ký')}</button> : <span className="badge badge-gray">{t('Buổi học đã qua')}</span>}
            </div>
          </article>
        })}
      </div>}
    </div>
    {selected && <Modal title={selected.cancel ? 'Hủy đăng ký buổi học?' : 'Xác nhận đăng ký buổi học'} onClose={() => { if (!busy) setSelected(null) }}>
      <div className="stack"><MembershipNotice status={status} />
        <div className="summary"><div><span>{t('Lớp')}</span><strong>{selected.session.name}</strong></div><div><span>{t('Ngày tập')}</span><strong>{formatDate(selected.session.date)}</strong></div><div><span>{t('Giờ học')}</span><strong>{selected.session.time}</strong></div><div><span>{t('Huấn luyện viên')}</span><strong>{selected.session.coachName}</strong></div><div><span>{t('Phòng')}</span><strong>{selected.session.roomName}</strong></div></div>
        <p className="small muted">{t(selected.cancel ? 'Buổi học sẽ được gỡ khỏi lịch cá nhân của bạn.' : 'Thời hạn gói và chỗ trống sẽ được kiểm tra lại khi xác nhận.')}</p>
        {actionError && <div className="alert alert-error" role="alert">{t(actionError)}</div>}
        <div className="form-actions"><button className="btn" disabled={busy} onClick={() => setSelected(null)}>{t('Quay lại')}</button><button className="btn btn-primary" disabled={busy} onClick={confirm}>{t(busy ? 'Đang xử lý...' : selected.cancel ? 'Xác nhận hủy' : 'Xác nhận đăng ký')}</button></div>
      </div>
    </Modal>}
  </div>
}
