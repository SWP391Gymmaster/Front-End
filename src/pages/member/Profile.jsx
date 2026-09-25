import { useState } from 'react'
import { useStore } from '../../store/context'

export default function Profile() {
  const { currentUser, updateProfile } = useStore()
  const [form, setForm] = useState({
    name: currentUser.name,
    phone: currentUser.phone,
    gender: currentUser.gender || 'Nam',
    goal: currentUser.goal || 'Giảm cân',
  })
  const [saved, setSaved] = useState(false)
  const set = (k) => (e) => { setForm({ ...form, [k]: e.target.value }); setSaved(false) }

  const submit = (e) => {
    e.preventDefault()
    updateProfile(currentUser.id, form)
    setSaved(true)
  }

  return (
    <div className="card narrow">
      <div className="card-head"><h3>Thông tin cá nhân</h3></div>
      <form className="form" onSubmit={submit}>
        <label>Email<input value={currentUser.email} disabled /></label>
        <label>Họ và tên<input value={form.name} onChange={set('name')} required /></label>
        <label>Số điện thoại<input value={form.phone} onChange={set('phone')} required /></label>
        <div className="row-2">
          <label>
            Giới tính
            <select value={form.gender} onChange={set('gender')}><option>Nam</option><option>Nữ</option><option>Khác</option></select>
          </label>
          <label>
            Mục tiêu
            <select value={form.goal} onChange={set('goal')}>
              <option>Giảm cân</option><option>Tăng cơ</option><option>Giữ dáng</option><option>Cải thiện sức khỏe</option>
            </select>
          </label>
        </div>
        {saved && <div className="alert alert-success">✔ Đã cập nhật thông tin</div>}
        <button className="btn btn-primary" type="submit">Lưu thay đổi</button>
      </form>
    </div>
  )
}
