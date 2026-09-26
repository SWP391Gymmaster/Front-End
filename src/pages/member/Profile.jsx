import { useStore } from '../../store/context'

export default function Profile() {
  const { session, members } = useStore()
  const profile = members.find((m) => m.email === session.email)

  return (
    <div className="card narrow">
      <div className="card-head"><h3>Thông tin cá nhân</h3></div>
      <div className="form">
        <label>Họ và tên<input value={session.name} disabled /></label>
        <label>Email<input value={session.email} disabled /></label>
        <label>Số điện thoại<input value={profile?.phone || ''} disabled /></label>
        <div className="alert alert-info">
          Back-End chưa có API cập nhật thông tin cá nhân, nên hiện chỉ xem được. Khi có API
          (ví dụ <code>PUT /api/users/me</code>) sẽ mở chức năng sửa.
        </div>
      </div>
    </div>
  )
}
