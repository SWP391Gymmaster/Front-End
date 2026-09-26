import { usePreferences } from '../preferences/context'
import { useStore } from '../store/context'
import { formatDate, formatMoney } from '../store/utils'

export default function Invoice({ payment, membership }) {
  const { t } = usePreferences()
  const { users, packages } = useStore()
  const member = users.find((u) => u.id === payment.userId)
  const staff = users.find((u) => u.id === payment.staffId)
  const pkg = packages.find((p) => p.id === payment.packageId)

  return (
    <div className="invoice print-area">
      <div className="invoice-head">
        <div>
          <div className="brand-text">{t("GymMaster")}</div>
          <div className="muted small">{t("Trung tâm thể hình GymMaster")}</div>
        </div>
        <div className="right">
          <div className="invoice-title">{t("HÓA ĐƠN")}</div>
          <div className="muted small">{t("Số: ")}{payment.invoiceNo}</div>
          <div className="muted small">{t("Ngày: ")}{formatDate(payment.date)}</div>
        </div>
      </div>
      <table className="table invoice-table">
        <tbody>
          <tr><td>{t("Hội viên")}</td><td>{member?.name}</td></tr>
          <tr><td>{t("Số điện thoại")}</td><td>{member?.phone}</td></tr>
          <tr><td>{t("Gói tập")}</td><td>{pkg?.name}</td></tr>
          {membership && (
            <tr>
              <td>{t("Thời hạn")}</td>
              <td>{formatDate(membership.startDate)} → {formatDate(membership.endDate)}</td>
            </tr>
          )}
          <tr><td>{t("Hình thức")}</td><td>{t(payment.method)} ({t(payment.channel)})</td></tr>
          {staff && <tr><td>{t("Nhân viên thu")}</td><td>{staff.name}</td></tr>}
        </tbody>
      </table>
      <div className="invoice-total">
        <span>{t("Tổng thanh toán")}</span>
        <strong>{formatMoney(payment.amount)}</strong>
      </div>
      <p className="muted small center">{t("Cảm ơn quý khách đã tin tưởng GymMaster!")}</p>
    </div>
  )
}
