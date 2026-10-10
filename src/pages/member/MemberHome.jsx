import { ErrorBox, Loading } from '../../components/Status'
import { paymentApi } from '../../api/services'
import useApi from '../../api/useApi'
import { useStore } from '../../store/context'
import { formatDate, formatMoney } from '../../store/utils'

const PAYMENT_METHODS = {
  BANK_TRANSFER: 'Chuyển khoản',
  CREDIT_CARD: 'Thẻ ngân hàng',
  MOMO: 'Ví MoMo',
  VNPAY: 'VNPay',
  CASH: 'Tiền mặt',
}

export default function MemberHome({ goTo }) {
  const { session } = useStore()
  const { data, loading, error, reload } = useApi(() =>
    Promise.all([paymentApi.myMemberships(), paymentApi.myPayments()]).then(([memberships, payments]) => ({
      memberships,
      payments,
    })),
  )
  const memberships = data?.memberships || []
  const payments = data?.payments || []
  const activeMembership = memberships.find((membership) => membership.active)
  const latestMembership = [...memberships].sort((a, b) => b.endDate.localeCompare(a.endDate))[0]
  const status = activeMembership ? 'active' : latestMembership ? 'expired' : 'none'
  const statusLabel = { active: 'Đang hoạt động', expired: 'Hết hạn', none: 'Chưa có gói' }[status]
  const recentPayments = [...payments].sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''))

  return (
    <div className="stack">
      <ErrorBox error={error} onRetry={reload} />
      <div className={'membership-card status-' + status}>
        <div>
          <div className="muted small">Thẻ hội viên</div>
          <h2>{session.name}</h2>
          <div className="small">{session.email}</div>
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

  const getMembershipBadgeText = (membership) => {
    if (membership.active) return t('Đang có hiệu lực')
    const today = new Date().toLocaleDateString('en-CA', {
      timeZone: 'Asia/Ho_Chi_Minh',
    })
    return t(membership.startDate > today ? 'Chưa có hiệu lực' : 'Đã hết hạn')
  }

  return (
    <div className="stack">
      <div className="membership-card">
        <div>
          <div className="muted small">{t('Hội viên')}</div>
          <h2>{user.name}</h2>
          <div className="small">{user.email}</div>
        </div>

        <div className="right">
          <span className="badge">{statusLabel}</span>
          {latestMembership && <div className="mc-pkg">{latestMembership.packageName}</div>}
          {activeMembership && (
            <div className="small">Hết hạn {formatDate(activeMembership.endDate)} · còn {activeMembership.daysRemaining} ngày</div>
          )}
        </div>
      </div>

      {status !== 'active' && (
        <div className="alert alert-info">
          {status === 'expired' ? 'Gói tập của bạn đã hết hạn. ' : 'Bạn chưa có gói tập đang hoạt động. '}
          <button className="link" onClick={() => goTo('buy')}>Chọn/gia hạn gói ngay →</button>
        </div>
      )}

      <div className="card">
        <div className="card-head"><h3>Lịch sử thanh toán</h3></div>
        {loading && !data ? <Loading /> : (
          <table className="table">
            <thead><tr><th>Số HĐ</th><th>Gói</th><th>Hình thức</th><th>Trạng thái</th><th>Ngày</th><th className="right">Số tiền</th></tr></thead>
            <tbody>
              {recentPayments.map((payment) => (
                <tr key={payment.paymentId}>
                  <td>{payment.invoiceCode}</td>
                  <td>{payment.packageName}</td>
                  <td>{PAYMENT_METHODS[payment.paymentMethod] || payment.paymentMethod}</td>
                  <td>{payment.status === 'COMPLETED' ? 'Đã thanh toán' : payment.status}</td>
                  <td>{formatDate(payment.completedAt || payment.createdAt)}</td>
                  <td className="right">{formatMoney(payment.amount)}</td>
                </tr>
              ))}
              {data && recentPayments.length === 0 && (
                <tr><td colSpan="6" className="center muted">Chưa có giao dịch.</td></tr>
              )}
            </tbody>
          </table>
        )}
          <span className="badge">{t('Lịch của tôi')}</span>
          <strong>
            {upcoming.length} {t('Buổi học sắp tới')}
          </strong>
        </div>
      </div>

      <MembershipNotice status={status} />

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
          {/* Hiển thị danh sách các gói tập của người dùng */}
          {memberships.map((membership) => (
            <div className="summary" key={membership.id}>
              <h4>{membership.packageName}</h4>
              <p>
                {formatDate(membership.startDate)} – {formatDate(membership.endDate)}
              </p>
              <span className="badge">{getMembershipBadgeText(membership)}</span>

              {membership.active && (
                <p>
                  {membership.daysRemaining} {t('ngày còn lại')} · {t('Bao gồm hôm nay')}
                </p>
              )}
            </div>
          ))}

          <button className="btn btn-primary" onClick={() => goTo('buy')}>
            {t('Xem các gói tập')}
          </button>
          <button className="btn" onClick={() => goTo('payments')}>
            {t('Thanh toán & Hóa đơn')}
          </button>
        </section>
      </div>
    </div>
  )
}
