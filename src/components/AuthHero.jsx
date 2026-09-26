import Icon from './Icon'
import { usePreferences } from '../preferences/context'

export default function AuthHero({ register = false }) {
  const { t } = usePreferences()
  return <section className="auth-hero">
    <div className="brand big"><span className="brand-logo"><Icon name="dumbbell" size={26} /></span><span className="brand-text">Gym<span>Master</span><small>FITNESS MANAGEMENT</small></span></div>
    <div className="hero-copy">
      <div className="eyebrow"><span className="live-dot" />{t('MỘT NỀN TẢNG. MỌI KẾT NỐI.')}</div>
      <h2>{t(register ? 'Khởi đầu nhỏ.' : 'Vận hành tinh gọn.')}<br /><span>{t(register ? 'Thay đổi lớn.' : 'Bứt phá mỗi ngày.')}</span></h2>
      <p>{t(register ? 'Chọn gói tập phù hợp và bắt đầu hành trình khỏe mạnh hơn cùng GymMaster.' : 'Từ hội viên đến lịch tập, kết nối mọi hoạt động của phòng tập trong một không gian quản lý thông minh.')}</p>
      <div className="hero-features">{[['users', 'Quản lý hội viên'], ['calendar', 'Lịch tập linh hoạt'], ['trend', 'Theo dõi doanh thu']].map(([icon, label]) => <span key={icon}><Icon name={icon} size={17} />{t(label)}</span>)}</div>
    </div>
    <div className="hero-preview" aria-hidden="true">
      <div className="preview-top"><span className="preview-icon"><Icon name="trend" /></span><div><strong>{t('Mọi hoạt động. Một tầm nhìn.')}</strong><small>{t('Kết nối phòng tập của bạn')}</small></div><span className="preview-live"><span className="live-dot" />{t('Sẵn sàng')}</span></div>
      <div className="preview-flow"><span><Icon name="users" size={24} />{t('Hội viên')}</span><i /><span className="flow-center"><Icon name="dumbbell" size={28} />GymMaster</span><i /><span><Icon name="calendar" size={24} />{t('Lịch tập')}</span></div>
      <div className="preview-bottom"><Icon name="check" size={16} />{t('Đơn giản hơn để tập trung vào điều quan trọng.')}</div>
    </div>
    <div className="hero-footer"><span>GYM · YOGA · FITNESS</span><span>© {new Date().getFullYear()} GymMaster</span></div>
  </section>
}
