# FE3 – Chuẩn bị trả lời kiến thức: Phân quyền hiển thị UI vs Phân quyền Server

## 1. Phân quyền hiển thị UI (Client-side)

### Cách hoạt động
- Sử dụng **role** của `currentUser` trong React state (lấy từ JWT sau đăng nhập)
- Dựa vào role → hiển thị menu khác nhau cho từng vai trò:
  - `admin`: Dashboard, Quản lý nhân sự, Gói tập, Phòng, Lớp, Thanh toán
  - `manager`: Tổng quan, Báo cáo, Gói tập, Phòng, Lớp, Thanh toán
  - `receptionist`: Thu tiền, Tra cứu, Hóa đơn
  - `member`: Trang cá nhân, Gói tập, Thanh toán, Lịch tập, Hồ sơ
  - `coach`: Lịch dạy

### Trong Thymeleaf (nếu dùng Spring MVC + Thymeleaf)
```html
<!-- sec:authorize kiểm tra role để ẩn/hiện phần tử -->
<div sec:authorize="hasRole('ADMIN')">
    <a href="/admin/users">Quản lý tài khoản</a>
</div>
```

### Trong React (dự án hiện tại)
```jsx
// App.jsx – menu theo role
const MENUS = {
  admin: [ /* chỉ admin thấy */ ],
  manager: [ /* chỉ manager thấy */ ],
  // ...
}
// Chỉ render menu phù hợp role
const menu = MENUS[currentUser.role]
```

### Hạn chế
- **Chỉ là cosmetic** – ẩn nút/menu trên giao diện
- Người dùng vẫn có thể gửi request trực tiếp bằng Postman/curl
- **KHÔNG AN TOÀN** nếu chỉ dựa vào cách này

---

## 2. Phân quyền Server (Server-side Authorization)

### Cách hoạt động
- **Spring Security** kiểm tra quyền tại mỗi endpoint
- Token JWT chứa role; `JwtAuthenticationFilter` parse token và set `Authentication`
- `SecurityFilterChain` cấu hình URL patterns cho từng role

### Ví dụ cấu hình
```java
// SecurityConfig.java
http
  .authorizeHttpRequests(auth -> auth
    .requestMatchers("/api/admin/**").hasRole("ADMIN")
    .requestMatchers("/api/payments/cash-checkout").hasAnyRole("MANAGER", "RECEPTIONIST")
    .requestMatchers("/api/member/**").hasRole("MEMBER")
    .anyRequest().authenticated()
  )
```

### @PreAuthorize annotation
```java
@PreAuthorize("hasRole('ADMIN')")
@PostMapping("/api/admin/users")
public ResponseEntity<AdminUserWriteResponse> create(...) { ... }
```

### Kết quả khi gọi API bằng Postman với role sai
- Trả về HTTP **403 Forbidden** với body: `{"message": "Access denied"}`
- FE hiển thị: "Bạn không có quyền thực hiện thao tác này"

---

## 3. Tại sao cần CẢ HAI?

| Phân quyền UI | Phân quyền Server |
|---|---|
| UX tốt hơn: người dùng không thấy chức năng họ không có quyền | An toàn thực sự: chặn ở tầng server |
| Nhanh, không cần gọi server | Ngăn bypass bằng DevTools/Postman |
| Dễ bị bypass (sửa JS, gọi API trực tiếp) | Không thể bypass từ client |

**Kết luận:** Luôn phải có phân quyền server. Phân quyền UI chỉ để cải thiện trải nghiệm người dùng.

---

## 4. Câu hỏi mẫu và cách trả lời

**Q: Khác nhau giữa ẩn nút trên UI và chặn ở server?**
> Ẩn nút trên UI (sec:authorize trong Thymeleaf hoặc check role trong React) chỉ là cosmetic – người dùng biết code có thể bypass. Chặn ở server (@PreAuthorize hoặc SecurityFilterChain) mới thực sự an toàn vì mọi request đều phải qua filter chain của Spring Security.

**Q: Nếu gọi API bằng Postman với role sai thì kết quả?**
> Server trả về HTTP 403 Forbidden. Trong hệ thống của nhóm, JwtAuthenticationFilter parse token → lấy role → Spring Security so sánh với @PreAuthorize → reject nếu không đủ quyền.

**Q: Hệ thống có những role nào?**
> 5 role: ADMIN, MANAGER, COACH, RECEPTIONIST, MEMBER. Admin tạo tài khoản nhân sự. Manager quản lý gói/phòng/lớp. Coach xem lịch dạy. Receptionist thu tiền tại quầy. Member mua gói và đăng ký lớp.
