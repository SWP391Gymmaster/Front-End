import { useState } from 'react'
import InvoiceModal from '../../components/InvoiceModal'
import Modal from '../../components/Modal'
import { ErrorBox, Loading } from '../../components/Status'
import { invoiceApi, paymentApi } from '../../api/services'
import useApi from '../../api/useApi'
import { formatDateTime, formatMoney, PAYMENT_METHOD, PAYMENT_STATUS, sumAmount } from '../../store/utils'

// Lễ tân ghi nhận thanh toán:
// - "Chờ xác nhận": giao dịch PENDING (vd. hội viên mua online bằng chuyển khoản) -> Xác nhận / Hủy
// - "Lịch sử": toàn bộ giao dịch, lọc theo trạng thái
export default function Payments() {
  const { data: payments, loading, error, reload } = useApi(() => paymentApi.list())
  const [tab, setTab] = useState('pending')
  const [status, setStatus] = useState('ALL')
  const [q, setQ] = useState('')
  const [action, setAction] = useState(null) // { type: 'confirm' | 'cancel', payment }
  const [form, setForm] = useState({ ref: '', note: '', reason: '' })
  const [saving, setSaving] = useState(false)
  const [actionError, setActionError] = useState('')
  const [notice, setNotice] = useState('')
  const [viewing, setViewing] = useState(null)

  const all = payments || []
  const pending = all.filter((p) => p.status === 'PENDING')
  const match = (p) =>
    [p.memberName, p.paymentCode, p.invoiceCode, p.packageName].join(' ').toLowerCase().includes(q.trim().toLowerCase())
  const rows = (tab === 'pending' ? pending : all.filter((p) => status === 'ALL' || p.status === status)).filter(match)

  const open = (type, payment) => {
    setAction({ type, payment })
    setForm({ ref: '', note: '', reason: '' })
    setActionError('')
  }

  const submit = async (e) => {
    e.preventDefault()
    const { type, payment } = action
    setSaving(true)
    setActionError('')
    try {
      if (type === 'confirm') {
        await paymentApi.confirm(payment.paymentId, {
          transactionReference: form.ref.trim() || undefined,
          note: form.note.trim() || undefined,
        })
        setNotice(`Đã xác nhận thu ${formatMoney(payment.amount)} của ${payment.memberName}. Gói tập đã được kích hoạt.`)
      } else {
        await paymentApi.cancel(payment.paymentId, form.reason.trim())
        setNotice(`Đã hủy giao dịch ${payment.paymentCode}. Số tiền không được tính vào doanh thu.`)
      }
      setAction(null)
      reload()
    } catch (err) {
      setActionError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="stack">
      {notice && <div className="alert alert-success">✔ {notice}</div>}
      <div className="toolbar">
        <div className="tabs">
          <button className={'tab' + (tab === 'pending' ? ' on' : '')} onClick={() => setTab('pending')}>
            Chờ xác nhận <span className="count">{pending.length}</span>
          </button>
          <button className={'tab' + (tab === 'history' ? ' on' : '')} onClick={() => setTab('history')}>
            Lịch sử thanh toán
          </button>
        </div>
        <div className="filters">
          {tab === 'history' && (
            <select value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="ALL">Tất cả trạng thái</option>
              {Object.entries(PAYMENT_STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
          )}
          <input className="search sm" placeholder="Tìm tên, mã giao dịch, mã hóa đơn..." value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
      </div>

      {tab === 'pending' && pending.length > 0 && (
        <div className="alert alert-info">
          {pending.length} giao dịch đang chờ, tổng <strong>{formatMoney(sumAmount(pending))}</strong>. Chỉ khi xác nhận
          đã nhận tiền, số tiền mới được tính vào doanh thu và gói tập mới được kích hoạt.
        </div>
      )}

      <div className="card">
        <ErrorBox error={error} onRetry={reload} />
        {loading && !payments && <Loading />}
        <table className="table">
          <thead>
            <tr>
              <th>Mã giao dịch</th><th>Hội viên</th><th>Gói</th><th>Hình thức</th>
              <th>{tab === 'pending' ? 'Tạo lúc' : 'Thời điểm'}</th><th>Trạng thái</th><th className="right">Số tiền</th><th></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((p) => {
              const st = PAYMENT_STATUS[p.status] || { label: p.status, badge: 'badge-gray' }
              return (
                <tr key={p.paymentId}>
                  <td><span className="mono">{p.paymentCode}</span><div className="small muted mono">{p.invoiceCode}</div></td>
                  <td>{p.memberName || '#' + p.memberId}</td>
                  <td>{p.packageName}</td>
                  <td>{PAYMENT_METHOD[p.paymentMethod] || p.paymentMethod}</td>
                  <td>{formatDateTime(p.completedAt || p.createdAt)}</td>
                  <td><span className={'badge ' + st.badge}>{st.label}</span></td>
                  <td className="right">{formatMoney(p.amount)}</td>
                  <td className="right nowrap">
                    {p.status === 'PENDING' && (
                      <>
                        <button className="btn btn-sm btn-primary" onClick={() => open('confirm', p)}>Xác nhận</button>{' '}
                        <button className="btn btn-sm btn-ghost" onClick={() => open('cancel', p)}>Hủy</button>{' '}
                      </>
                    )}
                    <button className="btn btn-sm" onClick={() => setViewing(p)}>Hóa đơn</button>
                  </td>
                </tr>
              )
            })}
            {payments && rows.length === 0 && (
              <tr><td colSpan="8" className="center muted">{tab === 'pending' ? 'Không có giao dịch nào đang chờ' : 'Không có giao dịch'}</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {action && (
        <Modal title={action.type === 'confirm' ? 'Xác nhận đã nhận tiền' : 'Hủy giao dịch'} onClose={() => !saving && setAction(null)}>
          <form className="form" onSubmit={submit}>
            <div className="summary">
              <div><span>Hội viên</span><strong>{action.payment.memberName}</strong></div>
              <div><span>Gói</span><strong>{action.payment.packageName}</strong></div>
              <div><span>Hình thức</span><strong>{PAYMENT_METHOD[action.payment.paymentMethod]}</strong></div>
              <div className="total"><span>Số tiền</span><strong>{formatMoney(action.payment.amount)}</strong></div>
            </div>
            {action.type === 'confirm' ? (
              <>
                <label>Mã giao dịch ngân hàng / ví (nếu có)<input value={form.ref} onChange={(e) => setForm({ ...form, ref: e.target.value })} placeholder="VD: FT2610091234" /></label>
                <label>Ghi chú<input value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} /></label>
              </>
            ) : (
              <label>Lý do hủy<input value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} required placeholder="VD: Hội viên đổi ý, không chuyển khoản" /></label>
            )}
            {actionError && <div className="alert alert-error">{actionError}</div>}
            <div className="form-actions">
              <button type="button" className="btn btn-ghost" onClick={() => setAction(null)} disabled={saving}>Quay lại</button>
              <button className={'btn ' + (action.type === 'confirm' ? 'btn-primary' : 'btn-danger')} type="submit" disabled={saving}>
                {saving ? 'Đang xử lý...' : action.type === 'confirm' ? 'Xác nhận đã thu' : 'Hủy giao dịch'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {viewing && (
        <InvoiceModal invoiceId={viewing.invoiceId} payment={viewing} loadInvoice={invoiceApi.get} onClose={() => setViewing(null)} />
      )}
    </div>
  )
}
