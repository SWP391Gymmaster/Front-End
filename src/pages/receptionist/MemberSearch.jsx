import { useState } from 'react'
import Invoice from '../../components/Invoice'
import Modal from '../../components/Modal'
import { useStore } from '../../store/context'
import { formatDate, formatMoney, getMembershipStatus } from '../../store/utils'

export default function MemberSearch() {
  const { users, memberships, packages, currentUser, purchase } = useStore()
  const [q, setQ] = useState('')
  const [renewing, setRenewing] = useState(null)
  const [pkgId, setPkgId] = useState('')
  const [method, setMethod] = useState('Tiền mặt')
  const [result, setResult] = useState(null)

  const members = users
    .filter((u) => u.role === 'member')
    .filter((u) => [u.name, u.phone, u.email].join(' ').toLowerCase().includes(q.toLowerCase()))

  const badge = { active: 'badge-green', expired: 'badge-red', none: 'badge-gray' }

  const confirm = () => {
    const res = purchase({ userId: renewing.id, packageId: pkgId, method, channel: 'Tại quầy', staffId: currentUser.id })
    setResult(res)
  }

  const close = () => { setRenewing(null); setResult(null); setPkgId('') }

  return (
    <div className="stack">
      <input className="search" placeholder="🔎 Tìm theo tên, số điện thoại hoặc email..." value={q} onChange={(e) => setQ(e.target.value)} />
      <div className="card">
        <table className="table">
          <thead><tr><th>Hội viên</th><th>Liên hệ</th><th>Gói hiện tại</th><th>Hạn sử dụng</th><th>Trạng thái</th><th></th></tr></thead>
          <tbody>
            {members.map((m) => {
              const s = getMembershipStatus(m.id, memberships)
              return (
                <tr key={m.id}>
                  <td><strong>{m.name}</strong><div className="small muted">{m.goal}</div></td>
                  <td>{m.phone}<div className="small muted">{m.email}</div></td>
                  <td>{s.membership ? packages.find((p) => p.id === s.membership.packageId)?.name : '—'}</td>
                  <td>{s.membership ? formatDate(s.membership.endDate) : '—'}{s.daysLeft ? <div className="small muted">còn {s.daysLeft} ngày</div> : null}</td>
                  <td><span className={'badge ' + badge[s.status]}>{s.label}</span></td>
                  <td className="right"><button className="btn btn-sm" onClick={() => setRenewing(m)}>{s.status === 'none' ? 'Đăng ký gói' : 'Gia hạn'}</button></td>
                </tr>
              )
            })}
            {members.length === 0 && <tr><td colSpan="6" className="center muted">Không tìm thấy hội viên</td></tr>}
          </tbody>
        </table>
      </div>

      {renewing && (
        <Modal title={result ? 'Thanh toán thành công' : `Đăng ký / gia hạn gói · ${renewing.name}`} onClose={close}>
          {result ? (
            <div className="stack">
              <Invoice payment={result.payment} membership={result.membership} />
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
                  {packages.filter((p) => p.active).map((p) => <option key={p.id} value={p.id}>{p.name} · {formatMoney(p.price)}</option>)}
                </select>
              </label>
              <label>
                Hình thức thanh toán
                <select value={method} onChange={(e) => setMethod(e.target.value)}><option>Tiền mặt</option><option>Chuyển khoản</option><option>Quẹt thẻ</option></select>
              </label>
              <div className="form-actions">
                <button className="btn btn-ghost" onClick={close}>Hủy</button>
                <button className="btn btn-primary" disabled={!pkgId} onClick={confirm}>Xác nhận thu tiền</button>
              </div>
            </div>
          )}
        </Modal>
      )}
    </div>
  )
}
