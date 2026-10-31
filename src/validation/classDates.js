// Chuyển giá trị ngày/giờ nhập từ form thành dạng gửi lên BE.
// value: chuỗi từ input date ('YYYY-MM-DD') hoặc datetime-local ('YYYY-MM-DDTHH:mm').
// withTime: nếu true thì giữ nguyên phần giờ (hoặc thêm 'T00:00:00'); nếu false chỉ gửi ngày.
export function toPayloadStamp(value, withTime) {
  if (!value) return null
  const str = String(value).trim()
  if (!str) return null
  if (withTime) {
    // Đảm bảo luôn có phần giờ phút giây
    return str.length <= 10 ? `${str}T00:00:00` : str.length <= 16 ? `${str}:00` : str
  }
  // Chỉ lấy ngày YYYY-MM-DD
  return str.slice(0, 10)
}

