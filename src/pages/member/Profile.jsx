import { usePreferences } from '../../preferences/context'
import { useStore } from '../../store/context'
import AvatarEditor from '../../components/AvatarEditor'

export default function Profile() {
  const { t } = usePreferences()
  const { currentUser } = useStore()
  return <div className="card narrow stack"><AvatarEditor key={currentUser.id} /><p className="small muted">{t('Ảnh được lưu trên Cloudinary; lựa chọn avatar chỉ lưu trên trình duyệt này.')}</p><h3>{t('Thông tin cá nhân')}</h3><div className="form"><label>{t('Họ và tên')}<input value={currentUser.name} readOnly /></label><label>Email<input value={currentUser.email} readOnly /></label></div><div className="alert alert-info">{t('Chưa hỗ trợ cập nhật hồ sơ trên máy chủ.')}</div></div>
}
