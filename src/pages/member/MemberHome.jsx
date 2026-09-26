import { MockBadge } from '../../components/Status'
import { useStore } from '../../store/context'
import { formatDate, formatMoney, getMembershipStatus } from '../../store/utils'

export default function MemberHome({ goTo }) {
  const { session, members, memberships, payments } = useStore()
  const status = getMembershipStatus(session.email, memberships)
  const profile = members.find((m) => m.email === session.email)
  const myPayments = payments.filter((p) => p.email === session.email).reverse()

  return (
    <div className="stack">
      <div className={'membership-card status-' + status.status}>
        <div>
          <div className="muted small">Thẻ hội viên</div>
          <h2>{session.name}</h2>
          <div className="small">{session.email}{profile?.phone ? ' · ' + profile.phone : ''}</div>
        </div>
        <div className="right">
          <span className="badge">{status.label}</span>
          {status.membership && <div className="mc-pkg">{status.membership.packageName}</div>}
          {status.status === 'active' && (
            <div className="small">Hết hạn {formatDate(status.membership.endDate)} · còn {status.daysLeft} ngày</div>
          )}
        </div>
      </div>

      {status.status !== 'active' && (
        <div className="alert alert-info">
          Bạn chưa có gói tập đang hoạt động.{' '}
          <button className="link" onClick={() => goTo('buy')}>Chọn gói ngay →</button>
        </div>
      )}

      <div className="card">
        <div className="card-head"><h3>Lịch sử thanh toán <MockBadge /></h3></div>
        {myPayments.length === 0 ? (
          <p className="muted">Chưa có giao dịch.</p>
        ) : (
          <table className="table">
            <thead><tr><th>Số HĐ</th><th>Gói</th><th>Hình thức</th><th>Ngày</th><th className="right">Số tiền</th></tr></thead>
            <tbody>
              {myPayments.map((p) => (
                <tr key={p.id}>
                  <td>{p.invoiceNo}</td>
                  <td>{p.packageName}</td>
                  <td>{p.method} ({p.channel})</td>
                  <td>{formatDate(p.date)}</td>
                  <td className="right">{formatMoney(p.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
