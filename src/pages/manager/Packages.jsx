import { usePreferences } from '../../preferences/context'
import { useState } from 'react'
import Modal from '../../components/Modal'
import { useStore } from '../../store/context'
import { formatMoney } from '../../store/utils'

const EMPTY = { name: '', price: '', days: 30, description: '', active: true }

export default function Packages() {
  const { t } = usePreferences()
  const { packages, savePackage, togglePackage } = useStore()
  const [editing, setEditing] = useState(null)
  const [notice, setNotice] = useState('')

  const submit = (e) => {
    e.preventDefault()
    savePackage({ ...editing, price: Number(editing.price), days: Number(editing.days) })
    setNotice(editing.id ? `Đã cập nhật "${editing.name}"` : `Đã tạo gói "${editing.name}" thành công`)
    setEditing(null)
  }

  const set = (k) => (e) => setEditing({ ...editing, [k]: e.target.value })

  return (
    <div className="stack">
      {notice && <div className="alert alert-success">✔ {t(notice)}</div>}
      <div className="toolbar">
        <p className="muted">{t("Các gói thành viên hiển thị cho hội viên khi đăng ký và cho lễ tân khi bán tại quầy.")}</p>
        <button className="btn btn-primary" onClick={() => setEditing(EMPTY)}>{t("+ Tạo gói mới")}</button>
      </div>

      <div className="grid-cards">
        {packages.map((p) => (
          <div key={p.id} className={'pkg-card' + (p.active ? '' : ' disabled')}>
            <div className="pkg-top">
              <h3>{p.name}</h3>
              <span className={'badge ' + (p.active ? 'badge-green' : 'badge-gray')}>
                {t(p.active ? 'Đang bán' : 'Tạm ngưng')}
              </span>
            </div>
            <div className="pkg-price">{formatMoney(p.price)}</div>
            <div className="muted small">{t("Thời hạn ")}{p.days}{t(" ngày")}</div>
            <p>{p.description}</p>
            <div className="pkg-actions">
              <button className="btn btn-sm" onClick={() => setEditing(p)}>{t("Sửa")}</button>
              <button className="btn btn-sm btn-ghost" onClick={() => togglePackage(p.id)}>
                {t(p.active ? 'Tạm ngưng' : 'Mở bán')}
              </button>
            </div>
          </div>
        ))}
      </div>

      {editing && (
        <Modal title={editing.id ? 'Sửa gói thành viên' : 'Tạo gói thành viên'} onClose={() => setEditing(null)}>
          <form className="form" onSubmit={submit}>
            <label>{t("Tên gói")}<input value={editing.name} onChange={set('name')} required placeholder={t("VD: Gói 6 tháng")} />
            </label>
            <div className="row-2">
              <label>{t("Học phí (VNĐ)")}<input type="number" min="0" step="1000" value={editing.price} onChange={set('price')} required />
              </label>
              <label>{t("Thời hạn (ngày)")}<input type="number" min="1" value={editing.days} onChange={set('days')} required />
              </label>
            </div>
            <label>{t("Mô tả quyền lợi")}<textarea rows="3" value={editing.description} onChange={set('description')} />
            </label>
            <div className="form-actions">
              <button type="button" className="btn btn-ghost" onClick={() => setEditing(null)}>{t("Hủy")}</button>
              <button className="btn btn-primary" type="submit">{t("Lưu gói")}</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
