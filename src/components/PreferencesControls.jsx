import { usePreferences } from '../preferences/context'
import Icon from './Icon'

export default function PreferencesControls() {
  const { language, setLanguage, theme, setTheme, t } = usePreferences()
  return <div className="preferences-controls">
    <div className="language-switch" role="group" aria-label={t('Ngôn ngữ')}>
      <button type="button" lang="vi" aria-pressed={language === 'vi'} onClick={() => setLanguage('vi')}>VI</button>
      <button type="button" lang="en" aria-pressed={language === 'en'} onClick={() => setLanguage('en')}>EN</button>
    </div>
    <button type="button" className="theme-toggle" onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')} aria-label={t(theme === 'light' ? 'Chuyển sang chế độ tối' : 'Chuyển sang chế độ sáng')} title={t(theme === 'light' ? 'Chuyển sang chế độ tối' : 'Chuyển sang chế độ sáng')}><Icon name={theme === 'light' ? 'moon' : 'sun'} /></button>
  </div>
}
