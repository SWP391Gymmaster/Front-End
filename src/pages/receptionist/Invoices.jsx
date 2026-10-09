import { useState } from 'react'
import InvoiceModal from '../../components/InvoiceModal'
import { ErrorBox, Loading } from '../../components/Status'
import { invoiceApi, paymentApi } from '../../api/services'
import useApi from '../../api/useApi'
import { formatDateTime, formatMoney, INVOICE_STATUS, PAYMENT_METHOD } from '../../store/utils'

export default function Invoices() {
  // Hóa đơn chưa có phương thức thanh toán (G3) -> ghép từ danh sách giao dịch theo invoiceId
  const { data, loading, error, reload } = useApi(() =>
    Promise.all([invoiceApi.list(), paymentApi.list()]).then(([invoices, payments]) => ({ invoices, payments })),
  )
  const [status, setStatus] = useState('ALL')
  const [q, setQ] = useState('')
  const [viewing, setViewing] = useState(null)

  const paymentOf = (invoiceId) => {
    const list = (data?.payments || []).filter((p) => p.invoiceId === invoiceId)
    return list.find((p) => p.status === 'COMPLETED') || list[0]
  }
  const rows = (data?.invoices || [])
    .filter((i) => status === 'ALL' || i.status === status)
    .filter((i) => [i.invoiceCode, i.memberName, i.packageName].join(' ').toLowerCase().includes(q.trim().toLowerCase()))

  return (
    <div className="stack">
      <div className="toolbar">
        <p className="muted">Hóa đơn được tạo tự động khi thu tiền tại quầy hoặc khi hội viên mua gói online.</p>
        <div className="filters">
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="ALL">Tất cả trạng thái</option>
            {Object.entries(INVOICE_STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
          <input className="search sm" placeholder="Tìm mã hóa đơn, tên hội viên..." value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
      </div>
      <div className="card">
        <ErrorBox error={error} onRetry={reload} />
        {loading && !data && <Loading />}
        <table className="table">
          <thead>
            <tr><th>Số hóa đơn</th><th>Hội viên</th><th>Gói</th><th>Hình thức</th><th>Ngày lập</th><th>Trạng thái</th><th className="right">Số tiền</th><th></th></tr>
          </thead>
          <tbody>
            {rows.map((i) => {
              const st = INVOICE_STATUS[i.status] || { label: i.status, badge: 'badge-gray' }
              const pay = paymentOf(i.invoiceId)
              return (
                <tr key={i.invoiceId}>
                  <td className="mono">{i.invoiceCode}</td>
                  <td>{i.memberName || '#' + i.memberId}</td>
                  <td>{i.packageName}</td>
                  <td>{pay ? PAYMENT_METHOD[pay.paymentMethod] : '—'}</td>
                  <td>{formatDateTime(i.issuedAt)}</td>
                  <td><span className={'badge ' + st.badge}>{st.label}</span></td>
                  <td className="right">{formatMoney(i.amount)}</td>
                  <td className="right"><button className="btn btn-sm" onClick={() => setViewing(i)}>Xem / In</button></td>
                </tr>
              )
            })}
            {data && rows.length === 0 && <tr><td colSpan="8" className="center muted">Không có hóa đơn</td></tr>}
          </tbody>
        </table>
      </div>
      {viewing && (
        <InvoiceModal invoiceId={viewing.invoiceId} payment={paymentOf(viewing.invoiceId)} loadInvoice={invoiceApi.get} onClose={() => setViewing(null)} />
      )}
    </div>
  )
}
