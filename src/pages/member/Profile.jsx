import { useStore } from '../../store/context'

export default function Profile() {
  const { session } = useStore()

  return (
    <div className="card narrow">
      <div className="card-head"><h3>Thông tin cá nhân</h3></div>
      <div className="form">
        <label>Họ và tên<input value={session.name} disabled /></label>
        <label>Email<input value={session.email} disabled /></label>
        <label>Mã hội viên<input value={'#' + session.userId} disabled /></label>
        <div className="alert alert-info">
          Back-End chưa có API xem và cập nhật thông tin cá nhân, nên hiện chỉ xem được. Khi có API
          (ví dụ <code>GET/PUT /api/users/me</code>) sẽ mở chức năng sửa.
        </div>
      </div>
    </div>
  )
}
