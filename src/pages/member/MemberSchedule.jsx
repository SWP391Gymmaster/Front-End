import { useRef, useState } from 'react'
import { classEnrollmentApi, classApi, coachApi, paymentApi, roomApi, scheduleApi } from '../../api/services'
import { ErrorBox, Loading } from '../../components/Status'
import WeekTimetable from '../../components/WeekTimetable'
import useApi from '../../api/useApi'
import { useStore } from '../../store/context'
import { formatDate, formatTime, todayISO } from '../../store/utils'

const hasOverlap = (a, b) => a.startTime < b.endTime && b.startTime < a.endTime

export default function MemberSchedule({ goTo }) {
  const { session } = useStore()
  const { data, loading, error, reload } = useApi(() =>
    Promise.all([
      classEnrollmentApi.available(),
      classEnrollmentApi.mine(),
      scheduleApi.list(),
      classApi.list(),
      roomApi.list(),
      coachApi.list(),
      paymentApi.myMemberships(),
    ]).then(([available, enrollments, schedules, classes, rooms, coaches, memberships]) => ({
      available,
      enrollments,
      schedules,
      classes,
      rooms,
      coaches,
      memberships,
    })),
  )
  const [tab, setTab] = useState('available')
  const [busyId, setBusyId] = useState(null)
  const busyIds = useRef(new Set())
  const [notice, setNotice] = useState('')
  const [actionError, setActionError] = useState('')
  const [search, setSearch] = useState('')
  const [expandedClassId, setExpandedClassId] = useState(null)

  const availableById = new Map((data?.available || []).map((item) => [String(item.scheduleId), item]))
  const enrollmentById = new Map((data?.enrollments || []).map((item) => [String(item.scheduleId), item]))
  const now = new Date()
  const sessions = (data?.schedules || [])
    .filter((item) => new Date(item.startTime) > now)
    .sort((a, b) => a.startTime.localeCompare(b.startTime))
    .map((schedule) => {
      const gymClass = data.classes.find((item) => String(item.id) === String(schedule.classId))
      const enrolled = enrollmentById.has(String(schedule.id))
      const availability = availableById.get(String(schedule.id))
      const capacity = Number(gymClass?.capacity || availability?.capacity || 0)
      const remaining = availability ? Number(availability.remainingSlots) : enrolled ? 0 : 0
      const coachId = schedule.coachId ?? gymClass?.coachId
      return {
        ...schedule,
        className: gymClass?.name || availability?.className || `Lớp #${schedule.classId}`,
        subject: gymClass?.subject || availability?.subject,
        capacity,
        remaining,
        enrolled,
        coach: data.coaches.find((item) => String(item.id) === String(coachId))?.fullName || 'Chưa phân công',
        room: data.rooms.find((item) => String(item.id) === String(schedule.roomId))?.name || 'Chưa có phòng',
      }
    })

  const myEnrollmentRecords = data?.enrollments || []
  const myScheduleItems = myEnrollmentRecords.map((enrollment) => {
    const schedule = sessions.find((item) => String(item.id) === String(enrollment.scheduleId))
    const original = (data?.schedules || []).find((item) => String(item.id) === String(enrollment.scheduleId))
    const gymClass = data?.classes.find((item) => String(item.id) === String(enrollment.classId))
    const coachId = schedule?.coachId ?? original?.coachId ?? gymClass?.coachId
    return {
      id: enrollment.scheduleId,
      startTime: enrollment.startTime,
      endTime: enrollment.endTime,
      subject: schedule?.subject || gymClass?.subject,
      title: enrollment.className || schedule?.className || `Lớp #${enrollment.classId}`,
      lines: [
        'HLV ' + (schedule?.coach || data?.coaches.find((item) => String(item.id) === String(coachId))?.fullName || '—'),
        schedule?.room || data?.rooms.find((item) => String(item.id) === String(original?.roomId))?.name || '',
      ],
    }
  })

  const classGroups = [...(data?.classes || [])]
    .map((gymClass) => ({
      id: String(gymClass.id),
      name: gymClass.name,
      subject: gymClass.subject,
      sessions: sessions.filter((item) => String(item.classId) === String(gymClass.id)),
    }))
    .filter((group) => group.sessions.length > 0)
    .filter((group) => group.name.toLocaleLowerCase('vi').includes(search.trim().toLocaleLowerCase('vi')))
    .sort((a, b) => a.name.localeCompare(b.name, 'vi'))

  const membershipCovers = (sessionDate) =>
    (data?.memberships || []).some(
      (membership) => membership.startDate <= todayISO() && membership.endDate >= sessionDate,
    )

  const overlapFor = (selected) =>
    myEnrollmentRecords.find(
      (enrollment) =>
        String(enrollment.scheduleId) !== String(selected.id) &&
        hasOverlap(selected, enrollment),
    )

  const handleEnrollment = async (selected) => {
    const id = String(selected.id)
    if (busyIds.current.has(id)) return
    busyIds.current.add(id)
    setBusyId(id)
    setNotice('')
    setActionError('')

    try {
      if (!membershipCovers(selected.startTime.slice(0, 10))) {
        throw new Error('Gói tập đã hết hạn hoặc không có hiệu lực vào ngày học. Vui lòng gia hạn trước khi đăng ký')
      }
      const conflict = overlapFor(selected)
      if (conflict) {
        throw new Error(`Lịch học bị trùng với ${conflict.className} (${formatTime(conflict.startTime)}–${formatTime(conflict.endTime)})`)
      }
      await classEnrollmentApi.enroll(selected.id)
      setNotice(`Đã đăng ký ${selected.className} · ${formatDate(selected.startTime)} ${formatTime(selected.startTime)}.`)
      await reload()
    } catch (err) {
      if (err.message !== 'Gói tập đã hết hạn hoặc không có hiệu lực vào ngày học. Vui lòng gia hạn trước khi đăng ký' &&
          !err.message.startsWith('Lịch học bị trùng')) {
        try {
          const latestEnrollments = await classEnrollmentApi.mine()
          if (latestEnrollments.some((item) => String(item.scheduleId) === id)) {
            setNotice(`Yêu cầu đã được ghi nhận trước đó: ${selected.className} · ${formatDate(selected.startTime)} ${formatTime(selected.startTime)}.`)
            await reload()
            return
          }
        } catch {
          // Keep the original booking error if the reconciliation request also fails.
        }
      }
      setActionError(err.message)
      await reload()
    } finally {
      busyIds.current.delete(id)
      setBusyId(null)
    }
  }

  const handleCancel = async (selected) => {
    const id = String(selected.id)
    if (busyIds.current.has(id)) return
    busyIds.current.add(id)
    setBusyId(id)
    setNotice('')
    setActionError('')
    try {
      await classEnrollmentApi.cancel(selected.id)
      setNotice(`Đã hủy đăng ký ${selected.className}.`)
      await reload()
    } catch (err) {
      try {
        const latestEnrollments = await classEnrollmentApi.mine()
        if (!latestEnrollments.some((item) => String(item.scheduleId) === id)) {
          setNotice(`Đăng ký ${selected.className} đã được hủy.`)
          await reload()
          return
        }
      } catch {
        // Keep the original cancellation error if reconciliation is unavailable.
      }
      setActionError(err.message)
      await reload()
    } finally {
      busyIds.current.delete(id)
      setBusyId(null)
    }
  }

  const getRegistrationState = (item) => {
    if (item.enrolled) return 'Đã đăng ký'
    if (!membershipCovers(item.startTime.slice(0, 10))) return 'Gói tập không có hiệu lực vào ngày học'
    if (overlapFor(item)) return 'Buổi học trùng với lịch đã đăng ký'
    if (!item.remaining) return 'Lớp đã đủ chỗ'
    return ''
  }

  if (loading && !data) return <Loading />

  return (
    <div className="stack">
      <div className="card">
        <div className="card-head">
          <h3>Lớp học & lịch tập</h3>
          <p className="muted small">Chỉ xác nhận khi gói còn hiệu lực, lịch không trùng và buổi học còn chỗ.</p>
        </div>
        {!data?.memberships.some((membership) => membership.startDate <= todayISO() && membership.endDate >= todayISO()) && (
          <div className="alert alert-info">
            Gói tập của bạn chưa có hiệu lực hoặc đã hết hạn.{' '}
            <button className="link" onClick={() => goTo('buy')}>Chọn/gia hạn gói tập →</button>
          </div>
        )}
        {notice && <div className="alert alert-success">{notice}</div>}
        {actionError && <div className="alert alert-error">{actionError}</div>}
        <ErrorBox error={error} onRetry={reload} />
        <div className="quick schedule-tabs">
          <button className={'btn' + (tab === 'available' ? ' btn-primary' : '')} onClick={() => setTab('available')}>
            Lớp có thể đăng ký ({classGroups.length})
          </button>
          <button className={'btn' + (tab === 'mine' ? ' btn-primary' : '')} onClick={() => setTab('mine')}>
            Lịch của tôi ({myEnrollmentRecords.length})
          </button>
        </div>
      </div>

      {tab === 'available' ? (
        <div className="stack">
          <label className="field class-search">
            <span>Tìm lớp học</span>
            <input
              className="search"
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Nhập tên lớp, ví dụ: Yoga"
              aria-label="Tìm lớp theo tên"
            />
          </label>
          <div className="session-list">
            {classGroups.map((group) => {
              const expanded = expandedClassId === group.id
              const bookable = group.sessions.filter((item) =>
                !item.enrolled &&
                membershipCovers(item.startTime.slice(0, 10)) &&
                !overlapFor(item) &&
                item.remaining > 0,
              ).length
              const enrolledCount = group.sessions.filter((item) => item.enrolled).length
              return (
                <article className="card class-booking-card" key={group.id}>
                  <div className="class-booking-summary">
                    <div>
                      <div className="session-title">
                        <h3>{group.name}</h3>
                        <span className="badge badge-green">{group.subject || 'Lớp tập'}</span>
                      </div>
                      <p className="muted small">
                        {group.sessions[0].coach} · {group.sessions[0].room}
                      </p>
                    </div>
                    <div className="class-booking-meta">
                      <span>{bookable} buổi còn chỗ</span>
                      {enrolledCount > 0 && <span>{enrolledCount} buổi đã đăng ký</span>}
                    </div>
                  </div>
                  <button
                    className="btn"
                    type="button"
                    aria-expanded={expanded}
                    onClick={() => setExpandedClassId(expanded ? null : group.id)}
                  >
                    {expanded ? 'Ẩn lịch' : 'Chọn lịch đăng ký'}
                  </button>
                  {expanded && (
                    <div className="class-session-options">
                      {group.sessions.map((item) => {
                        const canEnroll = !item.enrolled &&
                          membershipCovers(item.startTime.slice(0, 10)) &&
                          !overlapFor(item) &&
                          item.remaining > 0
                        const restriction = getRegistrationState(item)
                        return (
                          <div className="class-session-option" key={item.id}>
                            <div className="session-info">
                              <strong>{formatDate(item.startTime)} · {formatTime(item.startTime)}–{formatTime(item.endTime)}</strong>
                              <span className="small muted">{item.coach} · {item.room}</span>
                              <span className={'badge ' + (item.enrolled ? 'badge-green' : item.remaining ? 'badge-gray' : 'badge-red')}>
                                {item.enrolled ? 'Đã giữ chỗ' : item.remaining ? `${item.remaining}/${item.capacity} chỗ trống` : 'Lớp đã đầy'}
                              </span>
                              {!item.enrolled && restriction && <span className="small muted">{restriction}</span>}
                            </div>
                            {item.enrolled ? (
                              <button className="btn" onClick={() => handleCancel(item)} disabled={busyId === String(item.id)}>
                                {busyId === String(item.id) ? 'Đang xử lý...' : 'Hủy đăng ký'}
                              </button>
                            ) : !membershipCovers(item.startTime.slice(0, 10)) ? (
                              <button className="btn" onClick={() => goTo('buy')}>Gia hạn gói</button>
                            ) : (
                              <button className="btn btn-primary" onClick={() => handleEnrollment(item)} disabled={!canEnroll || busyId !== null}>
                                {busyId === String(item.id)
                                  ? 'Đang xác nhận...'
                                  : item.remaining === 0
                                    ? 'Lớp đã đầy'
                                    : overlapFor(item)
                                      ? 'Trùng lịch'
                                      : 'Đăng ký buổi này'}
                              </button>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </article>
              )
            })}
            {classGroups.length === 0 && (
              <div className="card center muted">
                {search ? 'Không tìm thấy lớp phù hợp.' : 'Hiện chưa có lớp học sắp tới.'}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="card">
          <div className="card-head"><h3>Lịch tập cá nhân của {session.name}</h3></div>
          {myScheduleItems.length ? (
            <WeekTimetable items={myScheduleItems} emptyText="Không có buổi đã đăng ký" />
          ) : (
            <p className="muted">Bạn chưa đăng ký buổi học nào.</p>
          )}
        </div>
      )}
import { useState } from 'react'
import { usePreferences } from '../../preferences/context'
import { useMemberPortal } from '../../services/useMemberPortal'
import { formatDate } from '../../store/utils'
import MembershipNotice from '../../components/MembershipNotice'
import MemberDataState from '../../components/MemberDataState'
import Modal from '../../components/MemberModal'
import Icon from '../../components/Icon'
import WeekTimetable from '../../components/WeekTimetable'

export default function MemberSchedule({ goTo }) {
  const { t } = usePreferences()
  const { data, error, loading, retry, memberService } = useMemberPortal()
  const [tab, setTab] = useState('mine')
  const [subject, setSubject] = useState('all')
  const [date, setDate] = useState('')
  const [selected, setSelected] = useState(null)
  const [busy, setBusy] = useState(false)
  const [actionError, setActionError] = useState('')
  const [notice, setNotice] = useState('')
  if (!data || error) return <MemberDataState error={error} retry={retry} />
  const { sessions, enrollments, status } = data
  const now = new Date()
  const upcoming = enrollments.filter((e) => new Date(e.session.endTime) > now)
  const records = tab === 'available' ? sessions : (tab === 'past' ? enrollments.filter((e) => new Date(e.session.endTime) <= now) : upcoming).map((e) => e.session)
  const visible = records.filter((s) => (subject === 'all' || s.subject === subject) && (!date || s.date === date)).sort((a, b) => a.startTime.localeCompare(b.startTime))
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
      <div className="session-filters form"><label>{t('Bộ môn')}<select value={subject} onChange={(e) => setSubject(e.target.value)}><option value="all">{t('Tất cả bộ môn')}</option>{subjects.map((s) => <option key={s} value={s}>{s}</option>)}</select></label><label>{t('Ngày tập')}<input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></label><button className="btn btn-ghost" onClick={() => { setSubject('all'); setDate('') }}>{t('Xóa bộ lọc')}</button></div>
      {tab === 'available' && <p className="small muted">{t('Các buổi học còn chỗ do máy chủ cung cấp. Điều kiện gói được kiểm tra khi xác nhận.')}</p>}
      {loading && <p className="small muted" role="status">{t('Đang tải dữ liệu…')}</p>}
      {!visible.length ? <div className="member-empty"><Icon name="calendar" size={36} /><h3>{t(tab === 'mine' && !upcoming.length ? 'Bạn chưa có buổi học nào sắp tới.' : 'Không có buổi học phù hợp.')}</h3><p>{t('Thử đổi bộ lọc hoặc khám phá các buổi học đang mở.')}</p>{tab === 'mine' && <button className="btn btn-primary" onClick={() => { setTab('available'); setDate(''); setSubject('all') }}>{t('Khám phá buổi học')} →</button>}</div> : <div className="session-grid">
        {visible.map((session) => {
          const registered = enrollments.some((e) => e.sessionId === session.id)
          const started = new Date(session.startTime) <= now
          return <article className="session-card" key={session.id}>
            <div className="session-card-top"><span className="badge badge-green">{session.subject}</span><span className="small muted">{formatDate(session.date)}</span></div>
            <h3>{session.name}</h3><div className="session-time"><Icon name="calendar" size={17} />{session.time}</div>
            <p><Icon name="user" size={15} />{session.coachName}</p><p><Icon name="room" size={15} />{session.roomName}</p>
            {tab === 'available' && <p className="small">{t('Chỗ còn lại: ')}<strong>{Math.max(0, session.capacity - session.registeredCount)} / {session.capacity}</strong></p>}
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
