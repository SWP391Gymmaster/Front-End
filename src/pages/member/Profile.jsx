import { usePreferences } from '../../preferences/context'
import { useState } from 'react'
import { useStore } from '../../store/context'

export default function Profile() {
  const { t } = usePreferences()
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
      <div className="card-head"><h3>{t("Thông tin cá nhân")}</h3></div>
      <form className="form" onSubmit={submit}>
        <label>{t("Email")}<input value={currentUser.email} disabled /></label>
        <label>{t("Họ và tên")}<input value={form.name} onChange={set('name')} required /></label>
        <label>{t("Số điện thoại")}<input value={form.phone} onChange={set('phone')} required /></label>
        <div className="row-2">
          <label>{t("Giới tính")}<select value={form.gender} onChange={set('gender')}><option value="Nam">{t("Nam")}</option><option value="Nữ">{t("Nữ")}</option><option value="Khác">{t("Khác")}</option></select>
          </label>
          <label>{t("Mục tiêu")}<select value={form.goal} onChange={set('goal')}>
              <option value="Giảm cân">{t("Giảm cân")}</option><option value="Tăng cơ">{t("Tăng cơ")}</option><option value="Giữ dáng">{t("Giữ dáng")}</option><option value="Cải thiện sức khỏe">{t("Cải thiện sức khỏe")}</option>
            </select>
          </label>
        </div>
        {saved && <div className="alert alert-success">{t("✔ Đã cập nhật thông tin")}</div>}
        <button className="btn btn-primary" type="submit">{t("Lưu thay đổi")}</button>
      </form>
    </div>
  )
}
