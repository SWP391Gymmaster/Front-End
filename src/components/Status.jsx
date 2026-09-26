

export function Loading({ text = 'Đang tải dữ liệu...' }) {
  return <div className="muted loading">⏳ {text}</div>
}

export function ErrorBox({ error, onRetry }) {
  if (!error) return null
  return (
    <div className="alert alert-error">
      {error}{' '}
      {onRetry && (
        <button className="link" onClick={onRetry}>
          Thử lại
        </button>
      )}
    </div>
  )
}

export function MockBadge() {
  return (
    <span className="badge badge-mock" title="Back-End chưa có API cho phần này, dữ liệu đang lưu tạm trong trình duyệt">
      Dữ liệu tạm
    </span>
  )
}
