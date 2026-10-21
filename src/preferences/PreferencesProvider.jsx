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
  const [theme, setTheme] = useState(() => readPreference('gm-theme', window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light', ['light', 'dark']))
  useEffect(() => {
    document.documentElement.lang = 'vi'
    document.documentElement.dataset.theme = theme
    document.title = 'GymMaster | Quản lý phòng tập'
    try {
      localStorage.setItem('gm-theme', theme)
    } catch { /* Preferences still work when browser storage is unavailable. */ }
  }, [theme])
  const t = (value) => translate(value)
  return <PreferencesContext.Provider value={{ theme, setTheme, t }}>{children}</PreferencesContext.Provider>
}
