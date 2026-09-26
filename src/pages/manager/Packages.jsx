import { useState } from 'react'
import Modal from '../../components/Modal'
import { ErrorBox, Loading } from '../../components/Status'
import { packageApi } from '../../api/services'
import useApi from '../../api/useApi'
import { formatMoney } from '../../store/utils'

const EMPTY = { name: '', price: '', durationDays: 30, description: '', active: true }

export default function Packages() {
  const { data: packages, loading, error, reload } = useApi(() => packageApi.list())
  const [editing, setEditing] = useState(null)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')
  const [notice, setNotice] = useState('')

  const set = (k) => (e) => setEditing({ ...editing, [k]: e.target.value })

  const submit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setFormError('')
    const body = {
      name: editing.name,
      description: editing.description,
      price: Number(editing.price),
      durationDays: Number(editing.durationDays),
      active: editing.active,
    }
    try {
      if (editing.id) await packageApi.update(editing.id, body)
      else await packageApi.create(body)
      setNotice(editing.id ? `Đã cập nhật "${body.name}"` : `Đã tạo gói "${body.name}" thành công`)
      setEditing(null)
      reload()
    } catch (err) {
      setFormError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const toggle = async (p) => {
    try {
      await packageApi.update(p.id, { ...p, active: !p.active })
      setNotice(`${p.active ? 'Đã tạm ngưng' : 'Đã mở bán'} "${p.name}"`)
      reload()
    } catch (err) {
      setNotice('')
      alert(err.message)
    }
  }

  return (
    <div className="stack">
      {notice && <div className="alert alert-success">✔ {notice}</div>}
      <div className="toolbar">
        <p className="muted">Các gói thành viên hiển thị cho hội viên khi đăng ký và cho lễ tân khi bán tại quầy.</p>
        <button className="btn btn-primary" onClick={() => { setEditing(EMPTY); setFormError('') }}>
          + Tạo gói mới
        </button>
      </div>

      <ErrorBox error={error} onRetry={reload} />
      {loading && !packages && <Loading />}

      <div className="grid-cards">
        {(packages || []).map((p) => (
          <div key={p.id} className={'pkg-card' + (p.active ? '' : ' disabled')}>
            <div className="pkg-top">
              <h3>{p.name}</h3>
              <span className={'badge ' + (p.active ? 'badge-green' : 'badge-gray')}>
                {p.active ? 'Đang bán' : 'Tạm ngưng'}
              </span>
            </div>
            <div className="pkg-price">{formatMoney(p.price)}</div>
            <div className="muted small">Thời hạn {p.durationDays} ngày</div>
            <p>{p.description}</p>
            <div className="pkg-actions">
              <button className="btn btn-sm" onClick={() => { setEditing(p); setFormError('') }}>Sửa</button>
              <button className="btn btn-sm btn-ghost" onClick={() => toggle(p)}>
                {p.active ? 'Tạm ngưng' : 'Mở bán'}
              </button>
            </div>
          </div>
        ))}
        {packages?.length === 0 && <p className="muted">Chưa có gói nào. Bấm "Tạo gói mới" để thêm.</p>}
      </div>

      {editing && (
        <Modal title={editing.id ? 'Sửa gói thành viên' : 'Tạo gói thành viên'} onClose={() => setEditing(null)}>
          <form className="form" onSubmit={submit}>
            <label>
              Tên gói
              <input value={editing.name} onChange={set('name')} required placeholder="VD: Gói 6 tháng" />
            </label>
            <div className="row-2">
              <label>
                Học phí (VNĐ)
                <input type="number" min="0" step="1000" value={editing.price} onChange={set('price')} required />
              </label>
              <label>
                Thời hạn (ngày)
                <input type="number" min="1" value={editing.durationDays} onChange={set('durationDays')} required />
              </label>
            </div>
            <label>
              Mô tả quyền lợi
              <textarea rows="3" value={editing.description || ''} onChange={set('description')} />
            </label>
            {formError && <div className="alert alert-error">{formError}</div>}
            <div className="form-actions">
              <button type="button" className="btn btn-ghost" onClick={() => setEditing(null)}>Hủy</button>
              <button className="btn btn-primary" type="submit" disabled={saving}>
                {saving ? 'Đang lưu...' : 'Lưu gói'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
