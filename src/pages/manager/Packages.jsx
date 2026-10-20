import { usePreferences } from '../../preferences/context'
import { useState } from 'react'
import Modal from '../../components/Modal'
import { ErrorBox, Loading } from '../../components/Status'
import { packageApi } from '../../api/services'
import useApi from '../../api/useApi'
import { formatMoney } from '../../store/utils'
import { mapPackage } from '../../services/api'
const EMPTY = { name: '', price: '', days: 30, description: '', active: true }
export default function Packages() {
  const { t } = usePreferences()
  const { packages, savePackage, togglePackage, deletePackage, api } = useStore()
  const [editing, setEditing] = useState(null)
  const [deleting, setDeleting] = useState(null)
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const perform = async task => {
    if (busy) return
    setBusy(true); setError(''); setNotice('')
    try { await task() } catch (err) { setError(err.message) } finally { setBusy(false) }
  }
  const submit = e => { e.preventDefault(); void perform(async () => { await savePackage(editing); setEditing(null); setNotice('Đã lưu thay đổi trên máy chủ.') }) }
  const set = key => e => setEditing({ ...editing, [key]: e.target.value })
  return <div className="stack"><div className="toolbar"><p className="muted">{t('Các gói thành viên hiển thị cho hội viên khi đăng ký và cho lễ tân khi bán tại quầy.')}</p><button className="btn btn-primary" disabled={busy} onClick={() => { setEditing({ ...EMPTY }); setError('') }}>{t('+ Tạo gói mới')}</button></div>
    {notice && <div className="alert alert-success" role="status">{t(notice)}</div>}{error && !editing && !deleting && <div className="alert alert-error" role="alert">{t(error)}</div>}
    <div className="grid-cards">{packages.map(p => <div key={p.id} className={'pkg-card' + (p.active ? '' : ' disabled')}><div className="pkg-top"><h3>{p.name}</h3><span className={'badge ' + (p.active ? 'badge-green' : 'badge-gray')}>{t(p.active ? 'Đang bán' : 'Tạm ngưng')}</span></div><div className="pkg-price">{formatMoney(p.price)}</div><div className="muted small">{t('Thời hạn')} {p.days} {t('ngày')}</div><p>{p.description}</p><div className="pkg-actions"><button className="btn btn-sm" disabled={busy} onClick={() => perform(async () => setEditing(mapPackage(await api.packages.get(p.id))))}>{t('Sửa')}</button><button className="btn btn-sm btn-ghost" disabled={busy} onClick={() => perform(async () => { await togglePackage(p.id); setNotice('Đã lưu thay đổi trên máy chủ.') })}>{t(p.active ? 'Tạm ngưng' : 'Mở bán')}</button><button className="btn btn-sm btn-ghost" disabled={busy} onClick={() => { setDeleting(p); setError('') }}>{t('Xóa')}</button></div></div>)}{!packages.length && <div className="card member-empty">{t('Chưa có dữ liệu.')}</div>}</div>
    {editing && <Modal title={editing.id ? 'Sửa gói thành viên' : 'Tạo gói thành viên'} onClose={() => { if (!busy) setEditing(null) }}><form className="form" onSubmit={submit}><fieldset className="form api-fieldset" disabled={busy}><label>{t('Tên gói')}<input value={editing.name} onChange={set('name')} required /></label><div className="row-2"><label>{t('Học phí (VNĐ)')}<input type="number" min="0" step="1000" value={editing.price} onChange={set('price')} required /></label><label>{t('Thời hạn (ngày)')}<input type="number" min="1" step="1" value={editing.days} onChange={set('days')} required /></label></div><label>{t('Mô tả quyền lợi')}<textarea rows="3" value={editing.description || ''} onChange={set('description')} /></label></fieldset>{error && <div className="alert alert-error" role="alert">{t(error)}</div>}<div className="form-actions"><button type="button" className="btn" disabled={busy} onClick={() => setEditing(null)}>{t('Hủy')}</button><button className="btn btn-primary" disabled={busy}>{t(busy ? 'Đang xử lý...' : 'Lưu gói')}</button></div></form></Modal>}
    {deleting && <Modal title="Xác nhận xóa" onClose={() => { if (!busy) setDeleting(null) }}><div className="stack"><p>{t('Bạn muốn xóa mục này?')} <strong>{deleting.name}</strong></p>{error && <div className="alert alert-error" role="alert">{t(error)}</div>}<div className="form-actions"><button className="btn" disabled={busy} onClick={() => setDeleting(null)}>{t('Hủy')}</button><button className="btn btn-primary" disabled={busy} onClick={() => perform(async () => { await deletePackage(deleting.id); setDeleting(null); setNotice('Đã xóa trên máy chủ.') })}>{t(busy ? 'Đang xử lý...' : 'Xóa')}</button></div></div></Modal>}
  </div>
}
