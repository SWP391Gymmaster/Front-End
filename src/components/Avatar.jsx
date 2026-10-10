import { useState } from 'react'
import { usePreferences } from '../preferences/context'

export default function Avatar({ name = '', src, className = 'avatar' }) {
  const { t } = usePreferences()
  const [failed, setFailed] = useState(null)
  const label = `${t('Ảnh đại diện')} ${name}`
  return <span className={className} role="img" aria-label={label}>
    {src && failed !== src
      ? <img src={src} alt="" onError={() => setFailed(src)} />
      : name.trim().split(/\s+/).pop()?.[0]?.toUpperCase() || 'GM'}
  </span>
}
