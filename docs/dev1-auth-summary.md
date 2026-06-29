# Dev 1 Auth & Security Summary

## 1. Tổng quan phạm vi Dev 1 đã làm

Ba nhóm đầu của Dev 1 hiện đã được triển khai ở mức backend nền tảng:

* Chuẩn hóa Prisma schema cho các model trọng tâm của Dev 1.
* Tạo và hoàn thiện module `auth` theo kiến trúc `route -> controller -> service -> repository`.
* Hoàn thiện JWT auth flow gồm register, verify email OTP, resend OTP, login, refresh, logout.
* Hoàn thiện forgot password và reset password qua Redis.
* Tạo `authenticate` middleware cho Bearer access token.
* Tạo `authorize(...roles)` middleware cho RBAC.
* Tạo Redis rate limiter cho các auth endpoints nhạy cảm.

## 2. Cấu trúc file đã tạo hoặc sửa chính

### Prisma và migration

* `backend/prisma/schema.prisma`
* `backend/prisma/migrations/20260616043538_standardize_dev1_models/migration.sql`

### Auth module

* `backend/src/modules/auth/auth.routes.js`
* `backend/src/modules/auth/auth.controller.js`
* `backend/src/modules/auth/auth.service.js`
* `backend/src/modules/auth/auth.repository.js`
* `backend/src/modules/auth/auth.dto.js`
* `backend/src/modules/auth/auth.validator.js`
* `backend/src/modules/auth/auth.types.js`

### Middleware và shared

* `backend/src/middleware/auth.middleware.js`
* `backend/src/middleware/rbac.middleware.js`
* `backend/src/middleware/rateLimiter.middleware.js`
* `backend/src/shared/constants/roles.js`

### Infrastructure và app bootstrap

* `backend/src/infrastructure/cache/redis.client.js`
* `backend/src/infrastructure/mail/mail.service.js`
* `backend/src/app.js`
* `backend/.env.example`
* `backend/package.json`
* `backend/pnpm-lock.yaml`

### Test artifact và docs

* `backend/careplus_auth.postman_collection.json`
* `docs/dev1-auth-summary.md`

## 3. Prisma schema changes

Các thay đổi chính đã thực hiện cho Dev 1:

* `User.password` đã được đổi sang `passwordHash`.
* `SystemSetting` đã được chuẩn hóa theo hướng typed config thay vì kiểu key-value rời rạc.
* Các model Dev 1 được rà lại theo scope:
  * `User`
  * `PatientProfile`
  * `Specialty`
  * `ClinicInfo` hoặc model tương đương lưu thông tin phòng khám
  * `SystemSetting`
* Migration Dev 1 đã tạo:
  * `20260616043538_standardize_dev1_models`

## 4. Auth API endpoints

| Method | Endpoint | Mục đích | Auth required |
| --- | --- | --- | --- |
| POST | `/api/v1/auth/register` | Đăng ký bệnh nhân | No |
| POST | `/api/v1/auth/verify-email` | Xác minh email OTP | No |
| POST | `/api/v1/auth/resend-verification-otp` | Gửi lại OTP xác minh email | No |
| POST | `/api/v1/auth/login` | Đăng nhập | No |
| POST | `/api/v1/auth/refresh` | Cấp access token mới | Cookie `refreshToken` |
| POST | `/api/v1/auth/logout` | Đăng xuất | Cookie `refreshToken` |
| POST | `/api/v1/auth/forgot-password` | Tạo yêu cầu quên mật khẩu | No |
| POST | `/api/v1/auth/reset-password` | Đặt lại mật khẩu | No |

## 5. Redis keys

Các key pattern hiện đang dùng:

* `otp:email-verify:{email}`
  * Dùng cho xác minh email.
  * TTL: `300` giây.
* `ratelimit:resend-otp:{email}`
  * Dùng riêng cho giới hạn resend OTP.
  * TTL: `300` giây.
* `reset:password:{email}`
  * Dùng cho forgot/reset password.
  * TTL: `900` giây.
* `blacklist:token:{jti}`
  * Dùng để revoke refresh token khi logout.
  * TTL: bằng thời gian còn lại của refresh token bị blacklist.
* `ratelimit:register:{identifier}`
  * TTL: `60` giây.
* `ratelimit:login:{identifier}`
  * TTL: `60` giây.
* `ratelimit:forgot-password:{identifier}`
  * TTL: `300` giây.
* `ratelimit:resend-otp:{identifier}`
  * TTL: `300` giây.

Ghi chú:

* `identifier` của rate limiter ưu tiên là email đã normalize lowercase.
* Nếu không có email thì fallback sang `x-forwarded-for` hoặc `req.ip`.

## 6. JWT và Cookie

* Access token hết hạn sau `15 phút`.
* Refresh token hết hạn sau `7 ngày`.
* JWT payload chỉ gồm:
  * `userId`
  * `role`
  * `jti`
* Refresh token được lưu trong `httpOnly cookie` tên `refreshToken`.
* Response `login` chỉ trả `accessToken` và `user`, không trả refresh token trong body.
* `logout` sẽ:
  * verify refresh token từ cookie
  * ghi `blacklist:token:{jti}` vào Redis với value `revoked`
  * gắn TTL bằng thời gian sống còn lại của refresh token
  * clear cookie `refreshToken`

## 7. Middleware security

### `authenticate`

* Đọc header `Authorization: Bearer <accessToken>`.
* Verify JWT bằng `JWT_SECRET`.
* Validate payload phải có `userId`, `role`, `jti`.
* Nếu hợp lệ thì gắn:
  * `req.user.userId`
  * `req.user.role`
  * `req.user.jti`

Ghi chú:

* Theo code hiện tại, `authenticate` không còn gọi Redis để check blacklist access token.
* Access token hợp lệ sẽ dùng được đến khi tự hết hạn theo TTL JWT.
* Logout hiện tại chủ yếu revoke refresh token để chặn việc xin access token mới qua endpoint `refresh`.

### `authorize(...roles)`

* Kiểm tra `req.user` đã tồn tại chưa.
* Kiểm tra role có thuộc tập role hợp lệ hay không.
* Trả `403` nếu role không đủ quyền.

### Rate limiter

* Dùng Redis `INCR` + `EXPIRE`.
* Trả các header:
  * `X-RateLimit-Limit`
  * `X-RateLimit-Remaining`
  * `Retry-After`
* Các ngưỡng hiện tại:
  * `register`: `3` request / `60` giây
  * `login`: `5` request / `60` giây
  * `forgot-password`: `3` request / `300` giây
  * `resend-verification-otp`: `3` request / `300` giây

## 8. Cách test thủ công

Flow test khuyến nghị:

1. Gọi `register`.
2. Lấy OTP từ Redis key `otp:email-verify:{email}`.
3. Gọi `verify-email`.
4. Gọi `login`.
5. Postman tự lưu `accessToken` từ response.
6. Gọi `refresh` bằng cookie `refreshToken`.
7. Gọi `logout`.
8. Gọi lại `refresh` để xác nhận token cũ bị chặn.
9. Gọi `forgot-password`.
10. Lấy reset token từ Redis key `reset:password:{email}`.
11. Gọi `reset-password`.
12. Gọi `login` bằng mật khẩu mới.

Ví dụ kiểm tra Redis bằng Docker:

```bash
docker exec -it careplus-redis redis-cli
```

Ví dụ xem OTP:

```bash
GET otp:email-verify:test@example.com
TTL otp:email-verify:test@example.com
```

Ví dụ xem reset token:

```bash
GET reset:password:test@example.com
TTL reset:password:test@example.com
```

Ví dụ xem blacklist token:

```bash
GET blacklist:token:<jti>
TTL blacklist:token:<jti>
```

## 9. Những phần còn TODO hoặc cần Dev khác phối hợp

* Mail service hạ tầng đã được tích hợp cho verify email OTP và forgot/reset password.
* Auth hiện không còn dùng `backend/src/modules/auth/auth.email.js`; việc gửi mail đi qua `backend/src/infrastructure/mail/mail.service.js`.
* Đã có protected route thực tế đang mount `authenticate` hoặc `authorize` ở các module như `user`, `patient-profile`, `clinic-settings`, `specialty`.
* Frontend auth flow chưa nằm trong file này.
* Cần rà lại production env secrets trước khi deploy thật.

## 10. Lưu ý bảo mật

* Không commit `.env`.
* `backend/.env.example` chỉ để placeholder.
* Không log OTP, token, password hoặc `passwordHash`.
* `JWT_SECRET` và `JWT_REFRESH_SECRET` phải là chuỗi random đủ dài.
* Mọi Redis key dùng cho auth phải có TTL.
* Redis không phải source of truth cho user data.

## 11. Postman collection

Collection hiện tại nằm tại:

* `backend/careplus_auth.postman_collection.json`

Folder trong collection:

* `Auth - Register & Email Verification`
* `Auth - Login Session`
* `Auth - Password Reset`

Collection variables:

* `baseUrl`
* `accessToken`
* `email`
* `password`
* `otp`
* `resetToken`
* `newPassword`

Ghi chú:

* `accessToken` được tự động lưu bằng test script sau request `Login` và `Refresh Token`.
* `refreshToken` không được lưu vào variable vì đang ở `httpOnly cookie`.
* `otp` và `resetToken` cần lấy thủ công từ Redis để điền vào collection variable tương ứng.
