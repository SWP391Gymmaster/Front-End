import { useState } from 'react'
import Invoice from '../../components/Invoice'
import Modal from '../../components/Modal'
import { usePreferences } from '../../preferences/context'
import { useStore } from '../../store/context'
import { formatDate, formatMoney, getMembershipStatus } from '../../store/utils'

export default function MemberSearch() {
  const { t } = usePreferences()
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
      <input className="search" placeholder={t("🔎 Tìm theo tên, số điện thoại hoặc email...")} value={q} onChange={(e) => setQ(e.target.value)} />
      <div className="card">
        <div className="table-scroll"><table className="table">
          <thead><tr><th>{t("Hội viên")}</th><th>{t("Liên hệ")}</th><th>{t("Gói hiện tại")}</th><th>{t("Hạn sử dụng")}</th><th>{t("Trạng thái")}</th><th></th></tr></thead>
          <tbody>
            {members.map((m) => {
              const s = getMembershipStatus(m.id, memberships)
              return (
                <tr key={m.id}>
                  <td><strong>{m.name}</strong><div className="small muted">{t(m.goal)}</div></td>
                  <td>{m.phone}<div className="small muted">{m.email}</div></td>
                  <td>{t(s.membership ? packages.find((p) => p.id === s.membership.packageId)?.name : '—')}</td>
                  <td>{t(s.membership ? formatDate(s.membership.endDate) : '—')}{s.daysLeft ? <div className="small muted">{t("còn ")}{s.daysLeft}{t(" ngày")}</div> : null}</td>
                  <td><span className={'badge ' + badge[s.status]}>{t(s.label)}</span></td>
                  <td className="right"><button className="btn btn-sm" onClick={() => setRenewing(m)}>{t(s.status === 'none' ? 'Đăng ký gói' : 'Gia hạn')}</button></td>
                </tr>
              )
            })}
            {members.length === 0 && <tr><td colSpan="6" className="center muted">{t("Không tìm thấy hội viên")}</td></tr>}
          </tbody>
        </table></div>
      </div>

      {renewing && (
        <Modal title={result ? 'Thanh toán thành công' : `Đăng ký / gia hạn gói · ${renewing.name}`} onClose={close}>
          {result ? (
            <div className="stack">
              <Invoice payment={result.payment} membership={result.membership} />
              <div className="form-actions">
                <button className="btn btn-ghost" onClick={() => window.print()}>{t("In hóa đơn")}</button>
                <button className="btn btn-primary" onClick={close}>{t("Xong")}</button>
              </div>
            </div>
          ) : (
            <div className="form">
              <label>{t("Gói tập")}<select value={pkgId} onChange={(e) => setPkgId(e.target.value)}>
                  <option value="">{t("-- Chọn gói --")}</option>
                  {packages.filter((p) => p.active).map((p) => <option key={p.id} value={p.id}>{p.name} · {formatMoney(p.price)}</option>)}
                </select>
              </label>
              <label>{t("Hình thức thanh toán")}<select value={method} onChange={(e) => setMethod(e.target.value)}><option value="Tiền mặt">{t("Tiền mặt")}</option><option value="Chuyển khoản">{t("Chuyển khoản")}</option><option value="Quẹt thẻ">{t("Quẹt thẻ")}</option></select>
              </label>
              <div className="form-actions">
                <button className="btn btn-ghost" onClick={close}>{t("Hủy")}</button>
                <button className="btn btn-primary" disabled={!pkgId} onClick={confirm}>{t("Xác nhận thu tiền")}</button>
              </div>
            </div>
          )}
        </Modal>
      )}
    </div>
  )
}
