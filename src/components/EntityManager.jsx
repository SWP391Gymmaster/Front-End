import { useState } from 'react'
import { usePreferences } from '../preferences/context'
import Modal from './Modal'

// Shared create/edit/delete workflow for real controller resources.
export default function EntityManager({ title, createLabel, rows, columns, initial, fields, load, save, remove }) {
  const { t } = usePreferences()
  const [editing, setEditing] = useState(null)
  const [deleting, setDeleting] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const edit = async row => {
    setBusy(true); setError(''); setNotice('')
    try { setEditing(await load(row.id)) } catch (err) { setError(err.message) } finally { setBusy(false) }
  }
  const submit = async event => {
    event.preventDefault()
    if (busy) return
    setBusy(true); setError('')
    try { await save(editing); setEditing(null); setNotice('Đã lưu thay đổi trên máy chủ.') }
    catch (err) { setError(err.message) } finally { setBusy(false) }
  }
  const destroy = async () => {
    if (busy) return
    setBusy(true); setError('')
    try { await remove(deleting.id); setDeleting(null); setNotice('Đã xóa trên máy chủ.') }
    catch (err) { setError(err.message) } finally { setBusy(false) }
  }
  return <section className="card stack">
    <div className="toolbar"><h3>{t(title)} ({rows.length})</h3><button className="btn btn-primary" disabled={busy} onClick={() => { setEditing({ ...initial }); setError(''); setNotice('') }}>{t(createLabel)}</button></div>
    {error && !editing && !deleting && <div className="alert alert-error" role="alert">{t(error)}</div>}
    {notice && <div className="alert alert-success" role="status">{t(notice)}</div>}
    {busy && !editing && !deleting && <p role="status">{t('Đang tải dữ liệu…')}</p>}
    <div className="table-scroll"><table className="table"><thead><tr>{columns.map(c => <th key={c.key}>{t(c.label)}</th>)}<th>{t('Thao tác')}</th></tr></thead><tbody>
      {!rows.length && <tr><td colSpan={columns.length + 1} className="center muted">{t('Chưa có dữ liệu.')}</td></tr>}
      {rows.map(row => <tr key={row.id}>{columns.map(c => <td key={c.key}>{c.render ? c.render(row) : row[c.key]}</td>)}<td className="nowrap"><button className="btn btn-sm" disabled={busy} onClick={() => edit(row)}>{t('Sửa')}</button>{' '}<button className="btn btn-sm btn-ghost" disabled={busy} onClick={() => { setDeleting(row); setError(''); setNotice('') }}>{t('Xóa')}</button></td></tr>)}
    </tbody></table></div>
    {editing && <Modal title={editing.id ? 'Sửa thông tin' : createLabel} onClose={() => { if (!busy) setEditing(null) }} width={640}>
      <form className="form" onSubmit={submit}><fieldset className="form api-fieldset" disabled={busy}>{fields.map(field => {
        const props = { value: editing[field.key] ?? '', required: field.required, onChange: e => setEditing({ ...editing, [field.key]: e.target.value }) }
        return <label key={field.key}>{t(field.label)}{field.options ? <select {...props}>{field.options.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}</select> : field.type === 'textarea' ? <textarea {...props} rows={3} /> : <input {...props} type={field.type || 'text'} min={field.min} step={field.step} />}</label>
      })}</fieldset>{error && <div className="alert alert-error" role="alert">{t(error)}</div>}<div className="form-actions"><button type="button" className="btn" disabled={busy} onClick={() => setEditing(null)}>{t('Hủy')}</button><button type="submit" className="btn btn-primary" disabled={busy}>{t(busy ? 'Đang xử lý...' : 'Lưu thay đổi')}</button></div></form>
    </Modal>}
    {deleting && <Modal title="Xác nhận xóa" onClose={() => { if (!busy) setDeleting(null) }}><div className="stack"><p>{t('Bạn muốn xóa mục này?')} <strong>{deleting.name || `#${deleting.id}`}</strong></p>{error && <div className="alert alert-error" role="alert">{t(error)}</div>}<div className="form-actions"><button className="btn" disabled={busy} onClick={() => setDeleting(null)}>{t('Hủy')}</button><button className="btn btn-primary" disabled={busy} onClick={destroy}>{t(busy ? 'Đang xử lý...' : 'Xóa')}</button></div></div></Modal>}
  </section>
}
