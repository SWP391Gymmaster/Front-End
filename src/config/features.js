// Bật/tắt tính năng phụ thuộc BE. Chỉ đổi sang true khi BE đã làm xong phần tương ứng.
export const FEATURES = {
  // BE đã có 4 trường ngày trong GymClass (startDate, endDate, registrationOpenAt, registrationCloseAt).
  classDates: true,
  // true: mở/kết thúc đăng ký sớm có cả giờ (BE đổi 2 trường registrationOpenAt/registrationCloseAt sang LocalDateTime).
  // false: chỉ nhập ngày (BE hiện tại, kiểu LocalDate); giờ mặc định mở 00:00 và đóng hết ngày.
  registrationTimes: false,
  // true: hội viên đăng ký LỚP trước, rồi mới đăng ký được buổi học của lớp đó (BE cần API đăng ký lớp, xem trang yêu cầu BE).
  classRegistration: false,
}