import { useEffect, useState } from 'react'
import { PreferencesContext } from './context'
import { translate } from './translations'

function readPreference(key, fallback, allowed) {
  try {
    const value = localStorage.getItem(key)
    return allowed.includes(value) ? value : fallback
  } catch { return fallback }
}

export default function PreferencesProvider({ children }) {
  const [language, setLanguage] = useState(() => readPreference('gm-language', 'vi', ['vi', 'en']))
  const [theme, setTheme] = useState(() => readPreference('gm-theme', window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light', ['light', 'dark']))
  useEffect(() => {
    document.documentElement.lang = language
    document.documentElement.dataset.theme = theme
    document.title = language === 'vi' ? 'GymMaster | Quản lý phòng tập' : 'GymMaster | Fitness management'
    try {
      localStorage.setItem('gm-language', language)
      localStorage.setItem('gm-theme', theme)
    } catch { /* Preferences still work when browser storage is unavailable. */ }
  }, [language, theme])
  const t = (value) => translate(value, language)
  return <PreferencesContext.Provider value={{ language, setLanguage, theme, setTheme, t }}>{children}</PreferencesContext.Provider>
}
