// Dữ liệu mẫu để demo (chưa kết nối Back-End)
// Mật khẩu mặc định của mọi tài khoản demo: 123456

export const ROLES = {
  admin: 'Admin',
  manager: 'Center Manager',
  receptionist: 'Receptionist',
  coach: 'Coach',
  member: 'Member',
}

export const DAYS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN']

export const SUBJECTS = ['Gym', 'Yoga', 'Boxing', 'Cardio', 'Zumba', 'Pilates', 'Group X', 'Cycling']
import { addDays, todayISO } from '../store/utils'

const today = todayISO()

export const seedData = {
  users: [
    { id: 'u0', role: 'admin', name: 'Admin System', email: 'admin@gym.vn', password: '123456', phone: '0900000000' },
    { id: 'u1', role: 'manager', name: 'Trần Quốc Bảo', email: 'manager@gym.vn', password: '123456', phone: '0901000001' },
    { id: 'u2', role: 'receptionist', name: 'Lê Thu Hà', email: 'letan@gym.vn', password: '123456', phone: '0901000002' },
    { id: 'u3', role: 'coach', name: 'Nguyễn Văn Minh', email: 'coach@gym.vn', password: '123456', phone: '0901000003', specialty: 'Gym, Boxing' },
    { id: 'u4', role: 'coach', name: 'Phạm Ngọc Lan', email: 'lan@gym.vn', password: '123456', phone: '0901000004', specialty: 'Yoga, Pilates' },
    { id: 'u5', role: 'coach', name: 'Đỗ Hoàng Nam', email: 'nam@gym.vn', password: '123456', phone: '0901000005', specialty: 'Cardio, Zumba' },
    { id: 'u6', role: 'member', name: 'Võ Thị Mai', email: 'member@gym.vn', password: '123456', phone: '0912345678', gender: 'Nữ', goal: 'Giảm cân' },
    { id: 'u7', role: 'member', name: 'Hoàng Đức Anh', email: 'anh@gym.vn', password: '123456', phone: '0987654321', gender: 'Nam', goal: 'Tăng cơ' },
  ],
  packages: [
    { id: 'p1', packageCode: 'PKG-BRONZE', name: 'Bronze', price: 900000, days: 90, description: 'Gói cơ bản 90 ngày. Tập Gym tự do, đăng ký tối đa 2 lớp nhóm cùng lúc.', active: true },
    { id: 'p2', packageCode: 'PKG-SILVER', name: 'Silver', price: 1620000, days: 180, description: 'Gói 180 ngày (giảm 10%). Tập Gym tự do, đăng ký tối đa 4 lớp nhóm cùng lúc, ưu tiên đặt chỗ sớm.', active: true },
    { id: 'p3', packageCode: 'PKG-GOLD', name: 'Gold', price: 3000000, days: 395, description: 'Gói 1 năm + 30 ngày. Không giới hạn lớp nhóm, ưu tiên đặt chỗ sớm, tập thử PT 2 buổi miễn phí.', active: true },
    { id: 'p4', packageCode: 'PKG-DIAMOND', name: 'Diamond', price: 9000000, days: 1185, description: 'Gói 3 năm + 3 tháng. Không giới hạn lớp nhóm, ưu tiên đặt chỗ VIP, tập PT 4 buổi/tháng miễn phí, tủ đồ cá nhân.', active: true },
  ],
  rooms: [
    { id: 'r1', name: 'Phòng Gym A', capacity: 40 },
    { id: 'r2', name: 'Phòng Yoga B', capacity: 20 },
    { id: 'r3', name: 'Phòng Boxing C', capacity: 15 },
  ],
  classes: [
    { id: 'c1', name: 'Yoga buổi sáng', subject: 'Yoga', roomId: 'r2', coachId: 'u4', days: ['T2', 'T4', 'T6'], start: '06:00', end: '07:00', capacity: 20 },
    { id: 'c2', name: 'Boxing cơ bản', subject: 'Boxing', roomId: 'r3', coachId: 'u3', days: ['T3', 'T5'], start: '18:00', end: '19:30', capacity: 15 },
  ],
  memberships: [
    { id: 'm1', userId: 'u7', packageId: 'p2', startDate: addDays(today, -20), endDate: addDays(today, 160) },
  ],
  payments: [
    { id: 'pay1', invoiceNo: 'HD0001', userId: 'u7', packageId: 'p2', amount: 1620000, method: 'Tiền mặt', date: addDays(today, -20), channel: 'Tại quầy', staffId: 'u2' },
  ],
}
