import { useState } from 'react'
import { ErrorBox, Loading } from '../../components/Status'
import { roomApi, scheduleApi } from '../../api/services'
import useApi from '../../api/useApi'

export default function Rooms() {
  const { data, loading, error, reload } = useApi(() =>
    Promise.all([roomApi.list(), scheduleApi.list()]).then(([rooms, schedules]) => ({ rooms, schedules })),
  )
  const [form, setForm] = useState({ name: '', capacity: 20 })
  const [saving, setSaving] = useState(false)
  const [notice, setNotice] = useState('')
  const [formError, setFormError] = useState('')

  const submit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setFormError('')
    try {
      await roomApi.create({ name: form.name, capacity: Number(form.capacity) })
      setNotice(`Đã thêm "${form.name}"`)
      setForm({ name: '', capacity: 20 })
      reload()
    } catch (err) {
      setNotice('')
      setFormError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const remove = async (room) => {
    if (!confirm(`Xóa "${room.name}"?`)) return
    try {
      await roomApi.remove(room.id)
      setNotice(`Đã xóa "${room.name}"`)
      reload()
    } catch (err) {
      alert(err.message)
    }
  }

  const rooms = data?.rooms || []
  const sessionsOf = (id) => (data?.schedules || []).filter((s) => s.roomId === id).length

  return (
    <div className="two-col">
      <div className="card">
        <div className="card-head"><h3>Thêm phòng tập</h3></div>
        <form className="form" onSubmit={submit}>
          <label>
            Tên phòng
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required placeholder="VD: Phòng Cardio D" />
          </label>
          <label>
            Sức chứa (người)
            <input type="number" min="1" value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value })} required />
          </label>
          {notice && <div className="alert alert-success">✔ {notice}</div>}
          {formError && <div className="alert alert-error">{formError}</div>}
          <button className="btn btn-primary" type="submit" disabled={saving}>
            {saving ? 'Đang lưu...' : 'Thêm phòng'}
          </button>
        </form>
      </div>

      <div className="card">
        <div className="card-head"><h3>Danh sách phòng ({rooms.length})</h3></div>
        <ErrorBox error={error} onRetry={reload} />
        {loading && !data && <Loading />}
        <table className="table">
          <thead><tr><th>Tên phòng</th><th>Sức chứa</th><th>Số buổi đã xếp</th><th></th></tr></thead>
          <tbody>
            {rooms.map((r) => (
              <tr key={r.id}>
                <td>{r.name}</td>
                <td>{r.capacity} người</td>
                <td>{sessionsOf(r.id)}</td>
                <td className="right">
                  <button className="btn btn-sm btn-ghost" onClick={() => remove(r)}>Xóa</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
