import { usePreferences } from '../preferences/context'
import Icon from './Icon'

export default function PreferencesControls() {
  const { theme, setTheme, t } = usePreferences()
  return <div className="preferences-controls">
    <button type="button" className="theme-toggle" onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')} aria-label={t(theme === 'light' ? 'Chuyển sang chế độ tối' : 'Chuyển sang chế độ sáng')} title={t(theme === 'light' ? 'Chuyển sang chế độ tối' : 'Chuyển sang chế độ sáng')}><Icon name={theme === 'light' ? 'moon' : 'sun'} /></button>
  </div>
}
