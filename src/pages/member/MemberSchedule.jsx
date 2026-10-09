import { useState } from 'react'
import { ErrorBox, Loading } from '../../components/Status'
import WeekTimetable from '../../components/WeekTimetable'
import { coachApi, enrollmentApi, memberPaymentApi, roomApi, scheduleApi } from '../../api/services'
import useApi from '../../api/useApi'
import { dayLabel, dayOf, formatDate, formatTime, nowVN } from '../../store/utils'

const overlaps = (a, b) => a.startTime < b.endTime && b.startTime < a.endTime

// Member đặt lớp :
// - Back-End kiểm tra: buổi chưa bắt đầu, gói còn hiệu lực tới ngày học, chưa đăng ký, còn chỗ
// - Front-End kiểm tra thêm: không cho đăng ký 2 buổi trùng giờ (Back-End chưa kiểm tra phần này)
export default function MemberSchedule({ goTo }) {
  const { data, loading, error, reload } = useApi(() =>
    Promise.all([
      enrollmentApi.available(),
      enrollmentApi.mine(),
      scheduleApi.list(),
      roomApi.list(),
      coachApi.list(),
      memberPaymentApi.memberships(),
    ]).then(([available, mine, schedules, rooms, coaches, memberships]) => ({ available, mine, schedules, rooms, coaches, memberships })),
  )
  const [tab, setTab] = useState('enroll')
  const [subject, setSubject] = useState('ALL')
  const [busy, setBusy] = useState(null)
  const [msg, setMsg] = useState(null) 

  if (loading && !data) return <Loading />
  if (!data) return <ErrorBox error={error} onRetry={reload} />

  const now = nowVN()
  const schedule = (id) => data.schedules.find((s) => s.id === id)
  const coachName = (id) => data.coaches.find((c) => c.id === id)?.fullName || '—'
  const roomName = (id) => data.rooms.find((r) => r.id === id)?.name || '—'

  // Lịch cá nhân, bổ sung Coach / phòng từ danh sách lịch
  const mine = data.mine
    .map((e) => ({ ...e, coachId: schedule(e.scheduleId)?.coachId, roomId: schedule(e.scheduleId)?.roomId }))
    .sort((a, b) => a.startTime.localeCompare(b.startTime))
  const myUpcoming = mine.filter((e) => e.startTime > now)
  const myPast = mine.filter((e) => e.endTime <= now)

  // Buổi đã đủ chỗ bị Back-End ẩn khỏi danh sách "còn chỗ" -> thêm lại các buổi mình đã đăng ký
  const sessions = [...data.available]
  myUpcoming.forEach((e) => {
    if (!sessions.some((s) => s.scheduleId === e.scheduleId)) {
      sessions.push({ ...e, subject: '', registeredByMe: true, full: true })
    }
  })
  sessions.sort((a, b) => a.startTime.localeCompare(b.startTime))
  const subjects = [...new Set(data.available.map((s) => s.subject).filter(Boolean))]
  const shown = sessions.filter((s) => subject === 'ALL' || s.subject === subject || s.registeredByMe)
  const conflictOf = (s) => myUpcoming.find((e) => e.scheduleId !== s.scheduleId && overlaps(e, s))

  const hasValidPackage = data.memberships.some((m) => m.endDate >= now.slice(0, 10))

  const enroll = async (s) => {
    setBusy(s.scheduleId)
    setMsg(null)
    try {
      await enrollmentApi.enroll(s.scheduleId)
      setMsg({ type: 'success', text: `Đã đăng ký "${s.className}" lúc ${formatTime(s.startTime)} ngày ${formatDate(s.startTime)}.` })
      reload()
    } catch (err) {
      setMsg({ type: 'error', text: err.message })
    } finally {
      setBusy(null)
    }
  }

  const cancel = async (s) => {
    if (!confirm(`Hủy đăng ký "${s.className}" ngày ${formatDate(s.startTime)}?`)) return
    setBusy(s.scheduleId)
    setMsg(null)
    try {
      await enrollmentApi.cancel(s.scheduleId)
      setMsg({ type: 'success', text: `Đã hủy đăng ký "${s.className}" ngày ${formatDate(s.startTime)}.` })
      reload()
    } catch (err) {
      setMsg({ type: 'error', text: err.message })
    } finally {
      setBusy(null)
    }
  }

  // Gom theo ngày để dễ nhìn
  const byDate = []
  shown.forEach((s) => {
    const d = s.startTime.slice(0, 10)
    const g = byDate.find((x) => x.date === d) || byDate[byDate.push({ date: d, items: [] }) - 1]
    g.items.push(s)
  })

  return (
    <div className="stack">
      <div className="toolbar">
        <div className="tabs">
          <button className={'tab' + (tab === 'enroll' ? ' on' : '')} onClick={() => { setTab('enroll'); setMsg(null) }}>Đăng ký lớp</button>
          <button className={'tab' + (tab === 'mine' ? ' on' : '')} onClick={() => { setTab('mine'); setMsg(null) }}>
            Lịch của tôi <span className="count">{myUpcoming.length}</span>
          </button>
        </div>
        {tab === 'enroll' && subjects.length > 1 && (
          <div className="filters">
            <select value={subject} onChange={(e) => setSubject(e.target.value)}>
              <option value="ALL">Tất cả bộ môn</option>
              {subjects.map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>
        )}
      </div>

      <ErrorBox error={error} onRetry={reload} />
      {msg && <div className={'alert ' + (msg.type === 'success' ? 'alert-success' : 'alert-error')}>{msg.type === 'success' ? '✔ ' : ''}{msg.text}</div>}

      {tab === 'enroll' && (
        <>
          {!hasValidPackage && (
            <div className="alert alert-info">
              Bạn cần có gói tập còn hiệu lực vào ngày học mới đăng ký được lớp.{' '}
              <button className="link" onClick={() => goTo('buy')}>Mua gói tập →</button>
            </div>
          )}
          {byDate.length === 0 && <div className="card"><p className="muted">Hiện chưa có buổi học nào còn chỗ.</p></div>}
          {byDate.map((g) => (
            <div key={g.date} className="card">
              <div className="card-head"><h3>{dayLabel(dayOf(g.date))}, {formatDate(g.date)}</h3></div>
              <table className="table">
                <thead><tr><th>Giờ</th><th>Lớp</th><th>Huấn luyện viên</th><th>Phòng</th><th style={{ width: '20%' }}>Chỗ</th><th></th></tr></thead>
                <tbody>
                  {g.items.map((s) => {
                    const conflict = !s.registeredByMe && conflictOf(s)
                    const pct = s.capacity ? Math.min(100, (s.registeredCount / s.capacity) * 100) : 0
                    return (
                      <tr key={s.scheduleId}>
                        <td className="nowrap">{formatTime(s.startTime)}–{formatTime(s.endTime)}</td>
                        <td><strong>{s.className}</strong>{s.subject && <div className="small muted">{s.subject}</div>}</td>
                        <td>{coachName(s.coachId)}</td>
                        <td>{roomName(s.roomId)}</td>
                        <td>
                          {s.full ? (
                            <span className="small muted">Đã đủ chỗ</span>
                          ) : (
                            <>
                              <div className="progress"><div className="progress-fill" style={{ width: `${pct}%` }} /></div>
                              <span className="small muted">{s.registeredCount}/{s.capacity} · còn {s.remainingSlots} chỗ</span>
                            </>
                          )}
                        </td>
                        <td className="right nowrap">
                          {s.registeredByMe ? (
                            <>
                              <span className="badge badge-green">Đã đăng ký</span>{' '}
                              <button className="btn btn-sm btn-ghost" disabled={busy === s.scheduleId} onClick={() => cancel(s)}>Hủy</button>
                            </>
                          ) : conflict ? (
                            <span className="badge badge-amber" title={`Trùng giờ với "${conflict.className}" ${formatTime(conflict.startTime)}–${formatTime(conflict.endTime)}`}>
                              Trùng giờ với {conflict.className}
                            </span>
                          ) : (
                            <button className="btn btn-sm btn-primary" disabled={busy === s.scheduleId} onClick={() => enroll(s)}>
                              {busy === s.scheduleId ? 'Đang xử lý...' : 'Đăng ký'}
                            </button>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          ))}
        </>
      )}

      {tab === 'mine' && (
        <>
          <div className="stats three">
            <div className="stat"><span>Buổi sắp tới</span><strong>{myUpcoming.length}</strong><em>{myUpcoming[0] ? `Gần nhất ${formatDate(myUpcoming[0].startTime).slice(0, 5)} ${formatTime(myUpcoming[0].startTime)}` : 'Chưa đăng ký buổi nào'}</em></div>
            <div className="stat"><span>Buổi đã học</span><strong>{myPast.length}</strong><em>tính theo lịch đã đăng ký</em></div>
            <div className="stat"><span>Lớp tham gia</span><strong>{new Set(mine.map((e) => e.classId)).size}</strong><em>lớp khác nhau</em></div>
          </div>
          <div className="card">
            <div className="card-head"><h3>Lịch tập cá nhân</h3></div>
            <WeekTimetable
              items={mine.map((e) => ({
                id: e.enrollmentId,
                startTime: e.startTime,
                endTime: e.endTime,
                subject: data.available.find((s) => s.classId === e.classId)?.subject,
                title: e.className,
                lines: ['HLV ' + coachName(e.coachId), roomName(e.roomId)],
              }))}
              emptyText="Nghỉ"
            />
          </div>
          <div className="card">
            <div className="card-head"><h3>Buổi học sắp tới</h3></div>
            {myUpcoming.length === 0 ? (
              <p className="muted">Bạn chưa đăng ký buổi nào. <button className="link" onClick={() => setTab('enroll')}>Đăng ký lớp →</button></p>
            ) : (
              <table className="table">
                <thead><tr><th>Ngày</th><th>Giờ</th><th>Lớp</th><th>Huấn luyện viên</th><th>Phòng</th><th></th></tr></thead>
                <tbody>
                  {myUpcoming.map((e) => (
                    <tr key={e.enrollmentId}>
                      <td>{dayLabel(dayOf(e.startTime))}, {formatDate(e.startTime)}</td>
                      <td className="nowrap">{formatTime(e.startTime)}–{formatTime(e.endTime)}</td>
                      <td><strong>{e.className}</strong></td>
                      <td>{coachName(e.coachId)}</td>
                      <td>{roomName(e.roomId)}</td>
                      <td className="right"><button className="btn btn-sm btn-ghost" disabled={busy === e.scheduleId} onClick={() => cancel(e)}>Hủy</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
    </div>
  )
}
