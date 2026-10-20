import { usePreferences } from '../preferences/context'
import Icon from './Icon'

export default function Unavailable({ message = 'Chức năng này chưa khả dụng. Vui lòng liên hệ lễ tân.' }) {
  const { t } = usePreferences()
  return <div className="card member-empty"><Icon name="calendar" size={32} /><h3>{t('Chưa khả dụng')}</h3><p>{t(message)}</p></div>
}
