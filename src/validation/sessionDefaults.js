// Giá trị có sẵn khi THÊM buổi học. Hàm thuần để test bằng node --test.

// Phòng của buổi học gần nhất (startTime lớn nhất) của lớp; lớp chưa có buổi nào thì trả ''.
export function defaultRoomId(classId, schedules = []) {
  let latest = null
  for (const s of schedules) {
    if (String(s.classId) !== String(classId) || s.roomId == null || s.roomId === '') continue
    if (!latest || String(s.startTime) > String(latest.startTime)) latest = s
  }
  return latest ? latest.roomId : ''
}
