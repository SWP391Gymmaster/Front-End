import { useEffect, useRef, useState } from 'react'
import { useStore } from '../store/context'
import { usePreferences } from '../preferences/context'
import { uploadAvatar, validateAvatar } from '../services/avatarUpload'
import Avatar from './Avatar'

export default function AvatarEditor() {
  const { currentUser, updateProfile } = useStore()
  const { t } = usePreferences()
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState('')
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')
  const input = useRef(null)
  const controller = useRef(null)
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview) }, [preview])
  useEffect(() => () => controller.current?.abort(), [])

  function choose(event) {
    const next = event.target.files?.[0]
    event.target.value = ''
    if (!next) return
    setError('')
    try {
      validateAvatar(next)
      setPreview(URL.createObjectURL(next))
      setFile(next)
      setNotice('Ảnh xem trước. Bấm Lưu ảnh để cập nhật.')
    } catch (err) { setError(err.message); setNotice('') }
  }

  function cancel() { setFile(null); setPreview(''); setNotice(''); setError('') }

  async function save() {
    if (!file || controller.current) return
    setBusy(true)
    setError('')
    setNotice('')
    const request = new AbortController()
    controller.current = request
    let timedOut = false
    const timeout = setTimeout(() => { timedOut = true; request.abort() }, 30000)
    try {
      const avatarUrl = await uploadAvatar(file, request.signal)
      if (request.signal.aborted) return
      updateProfile(currentUser.id, { avatarUrl })
      setFile(null)
      setPreview('')
      setNotice('Đã cập nhật ảnh đại diện từ Cloudinary.')
    } catch (err) {
      if (!request.signal.aborted || timedOut) setError(timedOut ? 'Upload quá thời gian. Vui lòng thử lại.' : err instanceof TypeError ? 'Không thể kết nối dịch vụ upload. Vui lòng thử lại.' : err.message)
    } finally {
      clearTimeout(timeout)
      controller.current = null
      if (!request.signal.aborted || timedOut) setBusy(false)
    }
  }

  function remove() {
    try {
      updateProfile(currentUser.id, { avatarUrl: '' })
      cancel()
      setNotice('Đã khôi phục avatar mặc định.')
    } catch (err) { setError(err.message) }
  }

  return <section className="avatar-editor" aria-label={t('Cập nhật ảnh đại diện')} aria-busy={busy}>
    <Avatar name={currentUser.name} src={preview || currentUser.avatarUrl} className="avatar avatar-large" />
    <div className="avatar-editor-content">
      <h3>{t('Ảnh đại diện')}</h3>
      <p className="muted small">{t('JPG, PNG hoặc WebP · Tối đa 5 MB')}</p>
      <input ref={input} type="file" accept="image/jpeg,image/png,image/webp" onChange={choose} hidden disabled={busy} aria-label={t('Chọn ảnh')} />
      <div className="avatar-actions">
        <button type="button" className="btn btn-sm" disabled={busy} onClick={() => input.current.click()}>{t('Chọn ảnh')}</button>
        {file && <><button type="button" className="btn btn-primary btn-sm" disabled={busy} onClick={save}>{t(busy ? 'Đang lưu ảnh…' : 'Lưu ảnh')}</button><button type="button" className="btn btn-ghost btn-sm" disabled={busy} onClick={cancel}>{t('Hủy')}</button></>}
        {currentUser.avatarUrl && !file && <button type="button" className="btn btn-ghost btn-sm" disabled={busy} onClick={remove}>{t('Dùng ảnh mặc định')}</button>}
      </div>
      <p className="small avatar-notice" role="status">{t(busy ? 'Đang lưu ảnh…' : notice)}</p>
      {error && <p className="alert alert-error" role="alert">{t(error)}</p>}
    </div>
  </section>
}
