import { usePreferences } from '../../preferences/context'
import { useState } from 'react'
import { useStore } from '../../store/context'

export default function Rooms() {
  const { t } = usePreferences()
  const { rooms, classes, saveRoom } = useStore()
  const [form, setForm] = useState({ name: '', capacity: 20 })
  const [notice, setNotice] = useState('')

  const submit = (e) => {
    e.preventDefault()
    saveRoom({ name: form.name, capacity: Number(form.capacity) })
    setNotice(`Đã thêm "${form.name}"`)
    setForm({ name: '', capacity: 20 })
  }

  return (
    <div className="two-col">
      <div className="card">
        <div className="card-head"><h3>{t("Thêm phòng tập")}</h3></div>
        <form className="form" onSubmit={submit}>
          <label>{t("Tên phòng")}<input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required placeholder={t("VD: Phòng Cardio D")} />
          </label>
          <label>{t("Sức chứa (người)")}<input type="number" min="1" value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value })} required />
          </label>
          {notice && <div className="alert alert-success">✔ {t(notice)}</div>}
          <button className="btn btn-primary" type="submit">{t("Thêm phòng")}</button>
        </form>
      </div>

      <div className="card">
        <div className="card-head"><h3>{t("Danh sách phòng (")}{rooms.length})</h3></div>
        <div className="table-scroll"><table className="table">
          <thead><tr><th>{t("Tên phòng")}</th><th>{t("Sức chứa")}</th><th>{t("Số lớp đang dùng")}</th></tr></thead>
          <tbody>
            {rooms.map((r) => (
              <tr key={r.id}>
                <td>{r.name}</td>
                <td>{r.capacity}{t(" người")}</td>
                <td>{classes.filter((c) => c.roomId === r.id).length}</td>
              </tr>
            ))}
          </tbody>
        </table></div>
      </div>
    </div>
  )
}
