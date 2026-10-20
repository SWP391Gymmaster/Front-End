# API được nối với Front-End

FE sử dụng controller hiện có, không bổ sung hoặc thay đổi BE. Base URL trình duyệt mặc định `/backend`; Vite bỏ prefix này khi proxy tới `http://localhost:8080`.

## Controller → UI

| Controller | Endpoint | Vị trí FE |
|---|---|---|
| AuthController | POST `/auth/register`, `/auth/login` | Đăng ký, đăng nhập JWT |
| MembershipPackageController | GET collection/detail; POST/PUT/DELETE `/api/membership-packages[/{id}]` | Danh mục gói Member; CRUD Manager |
| RoomController | GET collection/detail; POST/PUT/DELETE `/api/rooms[/{id}]` | CRUD phòng Manager; tên phòng trong lịch |
| GymClassController | GET collection/detail; POST/PUT/DELETE `/api/classes[/{id}]` | CRUD lớp Manager; dữ liệu lịch |
| ScheduleController | GET collection/detail; POST/PUT/DELETE `/api/schedules[/{id}]` | CRUD buổi học có ngày/giờ cụ thể |
| ScheduleController | GET `/api/schedules?coachId=...` | Lịch Coach theo userId hiện tại |
| ScheduleController | GET `/api/schedules?classId=...` | Có trong API adapter; bộ lọc Manager hiện lọc danh sách đã tải |
| CoachController | GET `/api/coaches` | Chọn huấn luyện viên, tra tên trong lịch |
| MemberClassEnrollmentController | GET `/api/member/class-sessions/available` | Khám phá buổi học còn chỗ |
| MemberClassEnrollmentController | GET `/api/member/class-enrollments` | Lịch cá nhân, lịch đã qua và trang chủ Member |
| MemberClassEnrollmentController | POST/DELETE `/api/member/class-sessions/{scheduleId}/enrollment` | Đặt/hủy buổi học, xử lý 201/204 |
| TestController | GET `/api/test` | Kiểm tra kết nối tại trang đăng nhập |
| TestAreaController | GET `/{manager,coach,member,receptionist}/dashboard` | Kiểm tra quyền khi tải dữ liệu vai trò |
| MemberPaymentController | POST `/api/member/payments/checkout` | Member chọn gói, tạo giao dịch PENDING |
| MemberPaymentController | POST `/api/member/payments/{id}/simulate-pay` | Xác nhận thanh toán mô phỏng online |
| MemberPaymentController | GET `/api/member/payments`, `/api/member/payments/{id}` | Danh sách/chi tiết thanh toán của Member |
| MemberPaymentController | GET `/api/member/invoices`, `/api/member/invoices/{id}` | Danh sách/chi tiết hóa đơn của Member |
| MemberPaymentController | GET `/api/member/memberships` | Các gói đã mua, thời hạn và cảnh báo hết hạn |
| PaymentController | GET `/api/payments`, `/api/payments/{id}` | Manager/Receptionist xem thanh toán |
| PaymentController | POST `/api/payments/cash-checkout` | Thu tiền mặt và kích hoạt/gia hạn ngay |
| PaymentController | POST `/api/payments/{id}/confirm`, `/api/payments/{id}/cancel` | Xác nhận đã nhận tiền / hủy giao dịch |
| InvoiceController | GET `/api/invoices`, `/api/invoices/{id}` | Manager/Receptionist xem hóa đơn |

## Module

- `api.js`: fetch, timeout, Bearer token, JSON/text/204, lỗi, toàn bộ route CRUD và mapping DTO.
- `backendStore.js`: phiên API riêng, đồng bộ cache sau request thành công, bỏ response cũ sau logout/đổi tài khoản, adapter Member.
- `StoreProvider.jsx`: khởi tạo API store, refresh sau reload, cung cấp context. Không import seedData hoặc adapter demo.
- `useMemberPortal.js`: tải lại dữ liệu Member khi đặt/hủy thành công, focus và mỗi phút; bỏ response của component đã unmount.

## Mapping dữ liệu

- Auth: `fullName → name`, `userId → id`, role chữ hoa → chữ thường. Session lưu token và thông tin công khai trong sessionStorage; không lưu mật khẩu.
- Đăng ký gửi `{userName, fullName, email, password, phone}`; không gửi role/gender/goal vì DTO BE không có các trường đó.
- Gói: `durationDays ↔ days`; request dùng số cho `price`, `durationDays`, boolean `active`.
- Lớp: `{name, subject, description, capacity, coachId}`. Không gửi lịch lặp/ngày trong tuần hoặc roomId vào lớp.
- Lịch: `{classId, roomId, coachId, startTime, endTime}`; ID là số, coachId để null khi dùng Coach của lớp. Ngày/giờ gửi theo LocalDateTime BE, không thêm UTC Z.
- Response ngày/giờ không có offset được diễn giải là giờ Việt Nam (+07:00). Đặt/hủy dùng `scheduleId` từ BE, không dùng ID mock `classId:date`.
- `ClassEnrollmentResponse` không có room/coach/subject; adapter ghép từ schedules/classes/coaches/rooms. `enrollmentId → id`, `scheduleId → sessionId`.

## Những API còn thiếu

Không có controller cho danh sách/tra cứu hội viên, đăng ký tài khoản tại quầy và sửa hồ sơ. Vì vậy:

- Thu tiền tại quầy yêu cầu ID hội viên đã có; không suy ra danh sách hội viên từ Coach.
- Mua/gia hạn dùng cùng checkout, chưa kích hoạt membership khi còn PENDING. BE tự nối tiếp hạn gói khi confirm/simulate-pay thành công.
- Gói đang có hiệu lực lấy theo `active`; `daysRemaining` bao gồm hôm nay. Cảnh báo 7 ngày; giá trị 1 tương ứng hết hạn hôm nay. Không nhầm gói gia hạn chưa tới ngày bắt đầu với gói hiện tại.
- Avatar Cloudinary vẫn được lưu URL riêng trong trình duyệt; sửa thông tin hồ sơ bị khóa.

BE kiểm tra membership cho cả đặt và hủy; FE không bỏ qua điều kiện đó. FE kiểm tra thêm trùng giờ trong dữ liệu đang hiển thị, nhưng BE vẫn cần kiểm soát nghiệp vụ/transaction cho các yêu cầu cạnh tranh.

## Dữ liệu mẫu MockAPI.io

**Lưu ý cập nhật:** các fixture MockAPI dưới đây chỉ là tài liệu/kiểm thử cũ. UI thanh toán và membership hiện gọi Spring Boot, không gọi MockAPI.

`mockapi-member.json` chứa dữ liệu mẫu cho các API chưa có. URL MockAPI hiện được cung cấp là resource `/Package`; response hiện chứa object fixture (các key `memberships`, `payments`, `purchaseRequest`, `purchaseResponse`), chưa phải các resource độc lập:

- `memberships`: thời hạn gói; hội viên `userId: 2` sắp hết hạn, `userId: 3` đã hết hạn và `userId: 4` có gói chưa hiệu lực.
- `payments`: dữ liệu lịch sử thanh toán.
- `purchaseRequest`/`purchaseResponse`: ví dụ contract request/response mua gói; không phải endpoint giao dịch.

`npm run test:mockapi` kiểm tra CRUD của resource `/Package` bằng cả Axios và `fetch`, sử dụng rồi xóa một bản ghi kiểm thử tạm. Lần kiểm tra gần nhất: `/Package` CRUD thành công; GET `/Membership`, `/Payment` và `/Purchase` trả HTTP 404. Cần tạo các resource tương ứng trên MockAPI.io trước khi có thể kiểm thử hoặc nối CRUD riêng cho thời hạn gói, thanh toán và mua gói.

Fixture chưa được nối vào ứng dụng và không thay thế các API Back-End hiện có. Các endpoint đăng ký, danh sách gói và lịch/đăng ký buổi học tiếp tục dùng API hiện tại.

## Kiểm thử

`npm run test:api` kiểm tra request và mapping của các controller mà không ghi dữ liệu thật. Khi test trực tiếp cần chạy BE/MySQL và seed riêng. API token hết hạn hoặc 401 sẽ xóa cache phiên; lỗi 403 giữ phiên và hiển thị thiếu quyền; lỗi mutation giữ form, không báo thành công trước response.

`npm run test:payments` kiểm tra các route Member/Manager/Receptionist, DTO checkout/cash/confirm/cancel, cập nhật membership sau xác nhận, lỗi không tăng revision và phản hồi 401 của phiên cũ. Chưa thay thế kiểm thử BE/MySQL trực tiếp.

DTO gửi lên: checkout `{packageId, paymentMethod, note}`, cash `{memberId, packageId, note}`, confirm `{transactionReference, note}`, cancel `{reason}`. Giá tiền và trạng thái do BE trả về, không nhận giá từ FE. Enum phương thức: CASH, BANK_TRANSFER, VNPAY, MOMO, CREDIT_CARD. `simulate-pay` không trừ tiền thật nhưng ghi nhận COMPLETED/PAID và kích hoạt gói trong hệ thống.
