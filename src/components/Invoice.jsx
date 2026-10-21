import { formatDateTime, formatMoney, INVOICE_STATUS, PAYMENT_METHOD, formatDate } from '../store/utils'
import { useStore } from '../store/context'

export default function Invoice({ invoice, payment }) {
  const { members } = useStore?.() || { members: [] }
  
  // Tổng hợp dữ liệu linh hoạt từ invoice, payment hoặc store
  const targetPayment = payment || invoice?.payment || {}
  const targetInvoice = invoice || payment || {}

  const member = members.find((m) => m.email === targetPayment.email || m.memberId === targetInvoice.memberId)
  
  const invoiceNo = targetInvoice.invoiceCode || targetInvoice.invoiceNo || targetPayment.invoiceCode || '—'
  const issuedAt = targetInvoice.issuedAt || targetInvoice.createdAt || targetPayment.createdAt || targetPayment.date
  const memberName = targetInvoice.memberName || member?.fullName || targetPayment.memberName || targetPayment.email || `Hội viên #${targetInvoice.memberId || targetPayment.memberId || ''}`
  const memberId = targetInvoice.memberId || targetPayment.memberId
  const packageName = targetInvoice.packageName || targetPayment.packageName
  const paymentMethod = targetPayment.paymentMethod || targetPayment.method || targetInvoice.paymentMethod
  const channel = targetPayment.channel
  const startDate = targetPayment.startDate
  const endDate = targetPayment.endDate
  
  const statusKey = targetInvoice.status || targetPayment.status || 'COMPLETED'
  const status = INVOICE_STATUS[statusKey] || { label: statusKey === 'COMPLETED' ? 'Đã thanh toán' : statusKey, badge: 'badge-green' }
  const amount = targetInvoice.amount || targetPayment.amount || 0

  return (
    <div className="invoice print-area" id="invoice">
      <div className="invoice-head">
        <div>
          <div className="brand-text">GymMaster</div>
          <div className="muted small">Trung tâm thể hình GymMaster</div>
        </div>
        <div className="right">
          <div className="invoice-title">HÓA ĐƠN</div>
          <div className="muted small">Số: {invoiceNo}</div>
          <div className="muted small">Ngày: {issuedAt ? formatDate(issuedAt) : '—'}</div>
        </div>
      </div>

      <table className="table invoice-table">
        <tbody>
          <tr>
            <td>Hội viên</td>
            <td><strong>{memberName}</strong></td>
          </tr>
          {memberId && (
            <tr>
              <td>Mã hội viên</td>
              <td>#{memberId}</td>
            </tr>
          )}
          {member?.phone && (
            <tr>
              <td>Số điện thoại</td>
              <td>{member.phone}</td>
            </tr>
          )}
          {targetPayment.email && (
            <tr>
              <td>Email</td>
              <td>{targetPayment.email}</td>
            </tr>
          )}
          <tr>
            <td>Gói tập</td>
            <td>{packageName || '—'}</td>
          </tr>
          {startDate && endDate && (
            <tr>
              <td>Thời hạn</td>
              <td>{formatDate(startDate)} → {formatDate(endDate)}</td>
            </tr>
          )}
          <tr>
            <td>Hình thức</td>
            <td>{PAYMENT_METHOD[paymentMethod] || paymentMethod || 'Tiền mặt'}{channel ? ` (${channel})` : ''}</td>
          </tr>
          {targetPayment?.paymentCode && (
            <tr>
              <td>Mã giao dịch</td>
              <td>{targetPayment.paymentCode}</td>
            </tr>
          )}
          {targetPayment.staffName && (
            <tr>
              <td>Nhân viên thu</td>
              <td>{targetPayment.staffName}</td>
            </tr>
          )}
          <tr>
            <td>Trạng thái</td>
            <td><span className={'badge ' + (status.badge || 'badge-green')}>{status.label || 'Đã thanh toán'}</span></td>
          </tr>
          {(targetInvoice.paidAt || targetPayment.completedAt) && (
            <tr>
              <td>Thời điểm thu</td>
              <td>{formatDateTime(targetInvoice.paidAt || targetPayment.completedAt)}</td>
            </tr>
          )}
          {targetInvoice.note && (
            <tr>
              <td>Ghi chú</td>
              <td>{targetInvoice.note}</td>
            </tr>
          )}
        </tbody>
      </table>

      <div className="invoice-total">
        <span>{statusKey === 'PAID' || statusKey === 'COMPLETED' ? 'Đã thanh toán' : 'Tổng tiền'}</span>
        <strong>{formatMoney(amount)}</strong>
      </div>

      <p className="muted small center" style={{ marginTop: '16px' }}>Cảm ơn quý khách đã tin tưởng GymMaster!</p>
    </div>
  )
}