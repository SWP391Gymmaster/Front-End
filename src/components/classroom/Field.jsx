import { cloneElement, useId } from 'react'
export default function Field({ label, error, children, hint }) {
  const id = useId()
  return <label className="fe2-field"><span id={id}>{label}</span>{cloneElement(children, { 'aria-labelledby': id, 'aria-describedby': error || hint ? `${id}-help` : undefined, 'aria-invalid': !!error })}{(error || hint) && <small id={`${id}-help`} className={error ? 'fe2-error' : 'muted'} role={error ? 'alert' : undefined}>{error || hint}</small>}</label>
}
