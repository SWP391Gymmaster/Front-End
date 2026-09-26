import { useState } from 'react'
import Invoice from '../../components/Invoice'
import Modal from '../../components/Modal'
import { MockBadge } from '../../components/Status'
import { packageApi } from '../../api/services'
import useApi from '../../api/useApi'
import { useStore } from '../../store/context'
import { formatDate, formatMoney, getMembershipStatus } from '../../store/utils'

export default function MemberSearch() {
  const { members, memberships, session, purchase } = useStore()
  const { data: packages } = useApi(() => packageApi.list())
  const [q, setQ] = useState('')
  const [renewing, setRenewing] = useState(null)
  const [pkgId, setPkgId] = useState('')
  const [method, setMethod] = useState('Tiền mặt')
  const [result, setResult] = useState(null)

  const list = members.filter((m) =>
    [m.fullName, m.phone, m.email].join(' ').toLowerCase().includes(q.toLowerCase()),
  )
  const active = (packages || []).filter((p) => p.active)
  const badge = { active: 'badge-green', expired: 'badge-red', none: 'badge-gray' }

  const confirmPay = () => {
    const pkg = active.find((p) => String(p.id) === pkgId)
    setResult(purchase({ email: renewing.email, pkg, method, channel: 'Tại quầy', staffName: session.name }))
  }

  const close = () => { setRenewing(null); setResult(null); setPkgId('') }

  return (
    <div className="stack">
      <div className="alert alert-info small">
        <MockBadge /> Back-End chưa có API danh sách hội viên, nên đây là các hội viên đã đăng ký / đăng nhập trên trình duyệt này.
      </div>
      <input className="search" placeholder="🔎 Tìm theo tên, số điện thoại hoặc email..." value={q} onChange={(e) => setQ(e.target.value)} />
      <div className="card">
        <table className="table">
          <thead><tr><th>Hội viên</th><th>Liên hệ</th><th>Gói hiện tại</th><th>Hạn sử dụng</th><th>Trạng thái</th><th></th></tr></thead>
          <tbody>
            {list.map((m) => {
              const s = getMembershipStatus(m.email, memberships)
              return (
                <tr key={m.email}>
                  <td><strong>{m.fullName}</strong></td>
                  <td>{m.phone || '—'}<div className="small muted">{m.email}</div></td>
                  <td>{s.membership?.packageName || '—'}</td>
                  <td>{s.membership ? formatDate(s.membership.endDate) : '—'}{s.daysLeft ? <div className="small muted">còn {s.daysLeft} ngày</div> : null}</td>
                  <td><span className={'badge ' + badge[s.status]}>{s.label}</span></td>
                  <td className="right"><button className="btn btn-sm" onClick={() => setRenewing(m)}>{s.status === 'none' ? 'Đăng ký gói' : 'Gia hạn'}</button></td>
                </tr>
              )
            })}
            {list.length === 0 && <tr><td colSpan="6" className="center muted">Không tìm thấy hội viên</td></tr>}
          </tbody>
        </table>
      </div>

      {renewing && (
        <Modal title={result ? 'Thanh toán thành công' : `Đăng ký / gia hạn gói · ${renewing.fullName}`} onClose={close}>
          {result ? (
            <div className="stack">
              <Invoice payment={result.payment} />
              <div className="form-actions">
                <button className="btn btn-ghost" onClick={() => window.print()}>In hóa đơn</button>
                <button className="btn btn-primary" onClick={close}>Xong</button>
              </div>
            </div>
          ) : (
            <div className="form">
              <label>
                Gói tập
                <select value={pkgId} onChange={(e) => setPkgId(e.target.value)}>
                  <option value="">-- Chọn gói --</option>
                  {active.map((p) => <option key={p.id} value={p.id}>{p.name} · {formatMoney(p.price)}</option>)}
                </select>
              </label>
              <label>
                Hình thức thanh toán
                <select value={method} onChange={(e) => setMethod(e.target.value)}><option>Tiền mặt</option><option>Chuyển khoản</option><option>Quẹt thẻ</option></select>
              </label>
              <div className="form-actions">
                <button className="btn btn-ghost" onClick={close}>Hủy</button>
                <button className="btn btn-primary" disabled={!pkgId} onClick={confirmPay}>Xác nhận thu tiền</button>
              </div>
            </div>
          )}
        </Modal>
      )}
    </div>
  )
}
