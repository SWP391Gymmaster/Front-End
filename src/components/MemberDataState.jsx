import { usePreferences } from '../preferences/context'

export default function MemberDataState({ error, retry }) {
  const { t } = usePreferences()
  return <div className="card member-empty" role={error ? 'alert' : 'status'}><p>{t(error || 'Đang tải dữ liệu…')}</p>{error && <button className="btn" onClick={retry}>{t('Thử lại')}</button>}</div>
}
