import { usePreferences } from '../../preferences/context'
import { useStore } from '../../store/context'
import { formatDate, formatMoney, getMembershipStatus } from '../../store/utils'

export default function MemberHome({ goTo }) {
  const { t } = usePreferences()
  const { currentUser, memberships, packages, payments } = useStore()
  const status = getMembershipStatus(currentUser.id, memberships)
  const pkg = status.membership && packages.find((p) => p.id === status.membership.packageId)
  const myPayments = payments.filter((p) => p.userId === currentUser.id).reverse()

  return (
    <div className="stack">
      <div className={'membership-card status-' + status.status}>
        <div>
          <div className="muted small">{t("Thẻ hội viên")}</div>
          <h2>{currentUser.name}</h2>
          <div className="small">{currentUser.phone}{t(" · Mục tiêu: ")}{t(currentUser.goal || '—')}</div>
        </div>
        <div className="right">
          <span className="badge">{t(status.label)}</span>
          {pkg && <div className="mc-pkg">{pkg.name}</div>}
          {status.status === 'active' && (
            <div className="small">{t("Hết hạn ")}{formatDate(status.membership.endDate)}{t(" · còn ")}{status.daysLeft}{t(" ngày")}</div>
          )}
        </div>
      </div>

      {status.status !== 'active' && (
        <div className="alert alert-info">{t("Bạn chưa có gói tập đang hoạt động.")}{' '}
          <button className="link" onClick={() => goTo('buy')}>{t("Chọn gói ngay →")}</button>
        </div>
      )}

      <div className="card">
        <div className="card-head"><h3>{t("Lịch sử thanh toán")}</h3></div>
        {myPayments.length === 0 ? (
          <p className="muted">{t("Chưa có giao dịch.")}</p>
        ) : (
          <div className="table-scroll"><table className="table">
            <thead><tr><th>{t("Số HĐ")}</th><th>{t("Gói")}</th><th>{t("Hình thức")}</th><th>{t("Ngày")}</th><th className="right">{t("Số tiền")}</th></tr></thead>
            <tbody>
              {myPayments.map((p) => (
                <tr key={p.id}>
                  <td>{p.invoiceNo}</td>
                  <td>{packages.find((x) => x.id === p.packageId)?.name}</td>
                  <td>{t(p.method)} ({t(p.channel)})</td>
                  <td>{formatDate(p.date)}</td>
                  <td className="right">{formatMoney(p.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table></div>
        )}
      </div>
    </div>
  )
}
