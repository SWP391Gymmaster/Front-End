import { useState } from 'react'
import Invoice from '../../components/Invoice'
import Modal from '../../components/Modal'
import { ErrorBox, Loading } from '../../components/Status'
import { invoiceApi, packageApi, paymentApi } from '../../api/services'
import useApi from '../../api/useApi'
import { completedPayments, formatDateTime, formatMoney, printSection, sumAmount } from '../../store/utils'

export default function MemberSearch() {
  const { data, loading, error, reload } = useApi(() =>
    Promise.all([paymentApi.list(), packageApi.list()]).then(([payments, packages]) => ({ payments, packages })),
  )

  const [q, setQ] = useState('')
  const [renewing, setRenewing] = useState(null)
  const [pkgId, setPkgId] = useState('')
  const [saving, setSaving] = useState(false)
  const [actionError, setActionError] = useState('')
  const [result, setResult] = useState(null)

  // Nhóm các giao dịch thành công theo hội viên
  const members = new Map()
  completedPayments(data?.payments).forEach((p) => {
    const m = members.get(p.memberId) || { memberId: p.memberId, name: p.memberName, payments: [] }
    m.payments.push(p)
    members.set(p.memberId, m)
  })

  const list = [...members.values()]
    .map((m) => {
      const last = [...m.payments].sort((a, b) => String(b.completedAt).localeCompare(String(a.completedAt)))[0]
      return { ...m, last, total: sumAmount(m.payments) }
    })
    .filter((m) => [m.name, '#' + m.memberId].join(' ').toLowerCase().includes(q.trim().toLowerCase()))
    .sort((a, b) => String(b.last.completedAt).localeCompare(String(a.last.completedAt)))

  const active = (data?.packages || []).filter((p) => p.active !== false)

  const confirm = async () => {
    if (!renewing?.memberId || !pkgId) return
    setSaving(true)
    setActionError('')
    try {
      const payment = await paymentApi.cashCheckout({ 
        memberId: renewing.memberId, 
        packageId: Number(pkgId),
        note: `Thu tiền gia hạn tại quầy`
      })
      const invoice = await invoiceApi.get(payment.invoiceId)
      setResult({ payment, invoice })
      reload()
    } catch (err) {
      setActionError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const close = () => {
    setRenewing(null)
    setResult(null)
    setPkgId('')
    setActionError('')
  }

  return (
    <div className="stack">
      <div className="alert alert-info small">
        Danh sách gồm các hội viên <strong>đã từng thanh toán</strong>. Danh sách đầy đủ và trạng thái gói của từng
        hội viên sẽ có khi Back-End bổ sung API hội viên. Hội viên mới chưa thanh toán: dùng "Đăng ký tại quầy".
      </div>
      
      <input 
        className="search" 
        placeholder="🔎 Tìm theo tên hoặc mã hội viên..." 
        value={q} 
        onChange={(e) => setQ(e.target.value)} 
      />
      
      <div className="card">
        <ErrorBox error={error} onRetry={reload} />
        {loading && !data && <Loading />}
        
        <table className="table">
          <thead>
            <tr>
              <th>Hội viên</th>
              <th>Gói mua gần nhất</th>
              <th>Lần thu gần nhất</th>
              <th>Số lần</th>
              <th className="right">Tổng đã trả</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {list.map((m) => (
              <tr key={m.memberId}>
                <td><strong>{m.name}</strong><div className="small muted">#{m.memberId}</div></td>
                <td>{m.last?.packageName || '—'}</td>
                <td>{formatDateTime(m.last?.completedAt)}</td>
                <td>{m.payments.length}</td>
                <td className="right">{formatMoney(m.total)}</td>
                <td className="right">
                  <button className="btn btn-sm" onClick={() => { setRenewing(m); setResult(null); setPkgId(''); setActionError('') }}>
                    Gia hạn
                  </button>
                </td>
              </tr>
            ))}
            {data && list.length === 0 && (
              <tr><td colSpan="6" className="center muted">Không tìm thấy hội viên</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {renewing && (
        <Modal title={result ? 'Gia hạn thành công' : `Gia hạn gói · ${renewing.name}`} onClose={() => !saving && close()}>
          {result ? (
            <div className="stack" id="invoice">
              <Invoice invoice={result.invoice} payment={result.payment} />
              <p className="center muted">Thời hạn mới được cộng nối tiếp sau gói hiện tại (nếu còn hạn).</p>
              <div className="form-actions">
                <button className="btn btn-ghost" onClick={() => printSection('invoice')}>In hóa đơn</button>
                <button className="btn btn-primary" onClick={close}>Xong</button>
              </div>
            </div>
          ) : (
            <div className="form">
              <label>
                Gói tập
                <select value={pkgId} onChange={(e) => setPkgId(e.target.value)}>
                  <option value="">-- Chọn gói --</option>
                  {active.map((p) => (
                    <option key={p.id} value={p.id}>{p.name} · {formatMoney(p.price)}</option>
                  ))}
                </select>
              </label>

              <label>
                Hình thức thanh toán
                <select disabled value="CASH"><option value="CASH">Tiền mặt</option></select>
              </label>

              <div className="alert alert-info small">Thanh toán tại quầy bằng tiền mặt; gói được kích hoạt sau khi khoản thu được ghi nhận.</div>
              
              {actionError && <div className="alert alert-error">{actionError}</div>}
              
              <div className="form-actions">
                <button className="btn btn-ghost" onClick={close} disabled={saving}>Hủy</button>
                <button className="btn btn-primary" disabled={!pkgId || saving} onClick={confirm}>
                  {saving ? 'Đang xử lý...' : 'Xác nhận thu tiền'}
                </button>
              </div>
            </div>
          )}
        </Modal>
      )}
    </div>
  )
}