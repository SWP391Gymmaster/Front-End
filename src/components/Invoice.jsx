import { formatDateTime, formatMoney, INVOICE_STATUS, PAYMENT_METHOD } from '../store/utils'

export default function Invoice({ invoice, payment }) {
  const status = INVOICE_STATUS[invoice.status] || { label: invoice.status, badge: 'badge-gray' }

  return (
    <div className="invoice print-area">
      <div className="invoice-head">
        <div>
          <div className="brand-text">GymMaster</div>
          <div className="muted small">Trung tâm thể hình GymMaster</div>
        </div>
        <div className="right">
          <div className="invoice-title">HÓA ĐƠN</div>
          <div className="muted small">Số: {invoice.invoiceCode}</div>
          <div className="muted small">Ngày lập: {formatDateTime(invoice.issuedAt)}</div>
        </div>
      </div>
      <table className="table invoice-table">
        <tbody>
          <tr><td>Hội viên</td><td>{invoice.memberName || '#' + invoice.memberId}</td></tr>
          <tr><td>Mã hội viên</td><td>#{invoice.memberId}</td></tr>
          <tr><td>Gói tập</td><td>{invoice.packageName || '#' + invoice.packageId}</td></tr>
          {payment && <tr><td>Hình thức</td><td>{PAYMENT_METHOD[payment.paymentMethod] || payment.paymentMethod}</td></tr>}
          {payment?.paymentCode && <tr><td>Mã giao dịch</td><td>{payment.paymentCode}</td></tr>}
          <tr><td>Trạng thái</td><td><span className={'badge ' + status.badge}>{status.label}</span></td></tr>
          {invoice.paidAt && <tr><td>Thời điểm thu</td><td>{formatDateTime(invoice.paidAt)}</td></tr>}
          {invoice.note && <tr><td>Ghi chú</td><td>{invoice.note}</td></tr>}
        </tbody>
      </table>
      <div className="invoice-total">
        <span>{invoice.status === 'PAID' ? 'Đã thanh toán' : 'Tổng tiền'}</span>
        <strong>{formatMoney(invoice.amount)}</strong>
      </div>
      <p className="muted small center">Cảm ơn quý khách đã tin tưởng GymMaster!</p>
    </div>
  )
}
