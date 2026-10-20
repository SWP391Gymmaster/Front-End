import { useId, useState } from 'react'

export default function PasswordField({ label, hint, error, ...props }) {
  const [visible, setVisible] = useState(false)
  const id = useId()
  return <div className="fe1-field">
    <label htmlFor={id}>{label}</label>
    <div className="fe1-password"><input {...props} id={id} type={visible ? 'text' : 'password'} aria-invalid={!!error} aria-describedby={hint || error ? `${id}-help` : undefined} />
      <button type="button" disabled={props.disabled} aria-label={`${visible ? 'Ẩn' : 'Hiện'} ${label.toLowerCase()}`} aria-pressed={visible} onClick={() => setVisible(v => !v)}>{visible ? 'Ẩn' : 'Hiện'}</button>
    </div>
    {(hint || error) && <small id={`${id}-help`} className={error ? 'fe1-error-text' : ''}>{error || hint}</small>}
  </div>
}
