import { usePreferences } from '../../preferences/context'
import { useMemberPortal } from '../../services/useMemberPortal'
import MemberDataState from '../../components/MemberDataState'
import MembershipNotice from '../../components/MembershipNotice'
import Icon from '../../components/Icon'
import { formatDate } from '../../store/utils'

export default function MemberHome({ goTo }) {
  const { t } = usePreferences()
  const { data, error, retry } = useMemberPortal()

  if (!data || error) {
    return <MemberDataState error={error} retry={retry} />
  }

  const { user, enrollments, status, memberships } = data

  const upcoming = [...enrollments]
    .filter((e) => new Date(e.session.endTime) > new Date())
    .sort((a, b) => a.session.startTime.localeCompare(b.session.startTime))

  const activeMembership = memberships.find((m) => m.active)
  const latestMembership = [...memberships].sort((a, b) => b.endDate.localeCompare(a.endDate))[0]

  const statusLabel = {
    active: t('Đang hoạt động'),
    expired: t('Hết hạn'),
    none: t('Chưa có gói'),
  }[status] || t('Chưa có gói')

  const getMembershipBadgeText = (membership) => {
    if (membership.active) return t('Đang có hiệu lực')
    const today = new Date().toLocaleDateString('en-CA', {
      timeZone: 'Asia/Ho_Chi_Minh',
    })
    return t(membership.startDate > today ? 'Chưa có hiệu lực' : 'Đã hết hạn')
  }

  return (
    <div className="stack">
      <div className={'membership-card status-' + status}>
        <div>
          <div className="muted small">{t('Hội viên')}</div>
          <h2>{user.name}</h2>
          <div className="small">{user.email}</div>
        </div>

        <div className="right">
          <span className="badge">{statusLabel}</span>
          {latestMembership && <div className="mc-pkg">{latestMembership.packageName}</div>}
          {activeMembership && (
            <div className="small">
              {t('Hết hạn')} {formatDate(activeMembership.endDate)} · {activeMembership.daysRemaining} {t('ngày còn lại')}
            </div>
          )}
        </div>
      </div>

      <MembershipNotice status={status} goTo={goTo} />

      <div className="two-col wide-left">
        <section className="card">
          <div className="toolbar card-head">
            <h3>{t('Buổi học sắp tới')}</h3>
            <button className="link small" onClick={() => goTo('schedule')}>
              {t('Xem tất cả')} →
            </button>
          </div>

          {!upcoming.length ? (
            <div className="member-empty">
              <Icon name="calendar" size={32} />
              <p>{t('Bạn chưa có buổi học nào sắp tới.')}</p>
              <button className="btn" onClick={() => goTo('schedule')}>
                {t('Khám phá buổi học')}
              </button>
            </div>
          ) : (
            upcoming.slice(0, 3).map(({ id, session }) => (
              <div className="upcoming-row" key={id}>
                <div className="session-date">
                  <strong>{session.date.slice(8)}</strong>
                  <span>
                    {session.date.slice(5, 7)} / {session.date.slice(0, 4)}
                  </span>
                </div>

                <div>
                  <strong>{session.name}</strong>
                  <p>
                    {session.time} · {session.roomName}
                  </p>
                  <span className="small muted">{session.coachName}</span>
                </div>
              </div>
            ))
          )}
        </section>

        <section className="card stack">
          <h3>{t('Gói tập của tôi')}</h3>

          {!memberships.length && (
            <p className="muted small">{t('Bạn chưa có gói tập đã kích hoạt.')}</p>
          )}

          {memberships.map((membership) => (
            <div className="summary" key={membership.id}>
              <h4>{membership.packageName}</h4>
              <p>
                {formatDate(membership.startDate)} – {formatDate(membership.endDate)}
              </p>
              <span className="badge">{getMembershipBadgeText(membership)}</span>

              {membership.active && (
                <p className="small muted">
                  {membership.daysRemaining} {t('ngày còn lại')}
                </p>
              )}
            </div>
          ))}

          <div className="form-actions" style={{ flexDirection: 'column', gap: '8px' }}>
            <button className="btn btn-primary full" onClick={() => goTo('buy')}>
              {t('Xem các gói tập')}
            </button>
            <button className="btn full" onClick={() => goTo('payments')}>
              {t('Thanh toán & Hóa đơn')}
            </button>
          </div>
        </section>
      </div>
    </div>
  )
}