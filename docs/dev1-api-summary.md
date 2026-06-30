# Dev 1 API Summary

Tài liệu này chỉ mô tả API trong phạm vi Dev 1. Mọi module ngoài scope như `appointment`, `schedule`, `timeslot`, `review`, `approval request`, `chat` không được xem là feature chính trong file này.

Ghi chú cập nhật:

- Tài liệu này đã được đối chiếu lại với code backend hiện tại.
- Trong scope Dev 1 hiện có thêm `specialties` và `ai-assistant` đang được mount trong app.

Base URL mặc định:

```text
http://localhost:5000/api/v1
```

Envelope chuẩn:

Success:

```json
{
  "success": true,
  "data": {}
}
```

Error:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Dữ liệu không hợp lệ",
    "details": []
  }
}
```

## Auth

### POST `/auth/register`

- Auth required: No
- Role required: None
- Request body:

```json
{
  "name": "Nguyen Van A",
  "email": "patient@example.com",
  "phone": "0901234567",
  "password": "Password123"
}
```

- Success response: tạo user PATIENT, trả `user` và `verification.expiresInSeconds`
- Error codes: `VALIDATION_ERROR`, `EMAIL_ALREADY_EXISTS`, `REDIS_CONNECTION_ERROR`, `SEND_VERIFICATION_EMAIL_FAILED`, `REGISTER_FAILED`
- Notes:
  - Validation dùng Zod strict.
  - Không nhận field lạ như `role`, `status`, `passwordHash`.
  - Không trả `passwordHash`.
  - OTP xác minh email có TTL theo `AUTH_OTP_CONFIG.EMAIL_VERIFICATION_TTL_SECONDS`.

### POST `/auth/verify-email`

- Auth required: No
- Role required: None
- Request body:

```json
{
  "email": "patient@example.com",
  "otp": "123456"
}
```

- Success response: trả `message` và `user.emailVerified = true`
- Error codes: `VALIDATION_ERROR`, `USER_NOT_FOUND`, `EMAIL_ALREADY_VERIFIED`, `OTP_EXPIRED_OR_NOT_FOUND`, `INVALID_OTP`, `VERIFY_EMAIL_FAILED`
- Notes:
  - OTP hiện là numeric string 6 ký tự.
  - Không log hoặc trả OTP raw.

### POST `/auth/resend-verification-otp`

- Auth required: No
- Role required: None
- Request body:

```json
{
  "email": "patient@example.com"
}
```

- Success response: trả `verification.required` và `verification.expiresInSeconds`
- Error codes: `VALIDATION_ERROR`, `USER_NOT_FOUND`, `EMAIL_ALREADY_VERIFIED`, `TOO_MANY_OTP_REQUESTS`, `TOO_MANY_REQUESTS`, `REDIS_CONNECTION_ERROR`, `SEND_VERIFICATION_EMAIL_FAILED`, `RESEND_OTP_FAILED`
- Notes:
  - Route thực tế là `/auth/resend-verification-otp`, không phải `/auth/resend-otp`.
  - Có rate limit Redis ở cả middleware và service.

### POST `/auth/login`

- Auth required: No
- Role required: None
- Request body:

```json
{
  "email": "patient@example.com",
  "password": "Password123",
  "rememberMe": false
}
```

- Success response: trả `user` và `accessToken`
- Error codes: `VALIDATION_ERROR`, `INVALID_CREDENTIALS`, `ACCOUNT_LOCKED`, `JWT_SECRET_MISSING`, `LOGIN_FAILED`
- Notes:
  - Refresh token nằm trong `httpOnly cookie`, không nằm trong response body.
  - JWT payload chỉ gồm `userId`, `role`, `jti`.
  - Không trả `passwordHash`.

### POST `/auth/refresh`

- Auth required: Refresh cookie
- Role required: None
- Request body:

```json
{}
```
- Success response: trả `accessToken` và `user`
- Error codes: `VALIDATION_ERROR`, `REFRESH_TOKEN_MISSING`, `INVALID_REFRESH_TOKEN`, `REFRESH_TOKEN_EXPIRED`, `REFRESH_TOKEN_REVOKED`, `USER_NOT_FOUND`, `ACCOUNT_LOCKED`, `JWT_REFRESH_SECRET_MISSING`, `JWT_SECRET_MISSING`, `REDIS_CONNECTION_ERROR`, `REFRESH_TOKEN_FAILED`
- Notes:
  - Không gửi refresh token qua body.
  - Validator hiện dùng strict empty body, nên Postman nên gửi raw JSON `{}` để tránh lệch parser giữa các môi trường.

### POST `/auth/logout`

- Auth required: Refresh cookie
- Role required: None
- Request body:

```json
{}
```
- Success response:

```json
{
  "success": true,
  "data": {
    "message": "Đăng xuất thành công"
  }
}
```

- Error codes: `VALIDATION_ERROR`, `JWT_REFRESH_SECRET_MISSING`, `REDIS_CONNECTION_ERROR`, `LOGOUT_FAILED`
- Notes:
  - Clear `refreshToken` cookie.
  - Validator hiện dùng strict empty body, nên Postman nên gửi raw JSON `{}` để tránh lệch parser giữa các môi trường.
  - Không đổi flow revoke hiện tại.

### POST `/auth/forgot-password`

- Auth required: No
- Role required: None
- Request body:

```json
{
  "email": "patient@example.com"
}
```

- Success response: trả `reset.expiresInSeconds`
- Error codes: `VALIDATION_ERROR`, `REDIS_CONNECTION_ERROR`, `SEND_PASSWORD_RESET_EMAIL_FAILED`, `FORGOT_PASSWORD_FAILED`
- Notes:
  - Không tiết lộ email có tồn tại hay không.
  - Reset token có TTL theo `AUTH_OTP_CONFIG.PASSWORD_RESET_TTL_SECONDS`.

### POST `/auth/reset-password`

- Auth required: No
- Role required: None
- Request body:

```json
{
  "email": "patient@example.com",
  "token": "reset-token-from-email-link",
  "newPassword": "NewPassword123",
  "confirmPassword": "NewPassword123"
}
```

- Success response: trả `message`
- Error codes: `VALIDATION_ERROR`, `INVALID_RESET_TOKEN`, `RESET_TOKEN_EXPIRED_OR_NOT_FOUND`, `REDIS_CONNECTION_ERROR`, `RESET_PASSWORD_FAILED`
- Notes:
  - Flow hiện tại dùng `email + token`, không dùng OTP.
  - `confirmPassword` được validator hỗ trợ nếu client gửi.
  - Không log hoặc trả reset token raw.

## User - Self

### GET `/users/me`

- Auth required: Yes
- Role required: Any authenticated user
- Request body: none
- Success response: trả user profile hiện tại
- Error codes: `AUTH_TOKEN_MISSING`, `INVALID_AUTH_HEADER`, `ACCESS_TOKEN_EXPIRED`, `INVALID_ACCESS_TOKEN`, `USER_NOT_FOUND`, `GET_ME_FAILED`
- Notes:
  - Email readonly ở UI hiện tại.
  - Theo code hiện tại, middleware `authenticate` không check Redis blacklist cho access token; access token sẽ hết hạn tự nhiên theo TTL JWT.

### PATCH `/users/me`

- Auth required: Yes
- Role required: Any authenticated user
- Request body:

```json
{
  "name": "Nguyen Van A",
  "phone": "0901234567",
  "gender": "MALE",
  "dateOfBirth": "1990-05-15",
  "address": "123 Nguyen Trai"
}
```

- Success response: trả `message` và `user`
- Error codes: `VALIDATION_ERROR`, `USER_NOT_FOUND`, `UPDATE_ME_FAILED`
- Notes:
  - Không cho tự sửa `role`, `status`, `noShowCount`, `passwordHash`.
  - `dateOfBirth` của User APIs hiện dùng format `YYYY-MM-DD`.

### PATCH `/users/me/password`

- Auth required: Yes
- Role required: Any authenticated user
- Request body:

```json
{
  "currentPassword": "Password123",
  "newPassword": "NewPassword456",
  "confirmPassword": "NewPassword456"
}
```

- Success response: trả `message`
- Error codes: `VALIDATION_ERROR`, `USER_NOT_FOUND`, `CURRENT_PASSWORD_INCORRECT`, `NEW_PASSWORD_SAME_AS_OLD`, `CHANGE_PASSWORD_FAILED`
- Notes:
  - Validator ở user module đã dùng Zod strict.

### PATCH `/users/me/avatar`

- Auth required: Yes
- Role required: Any authenticated user
- Request body: `multipart/form-data`, field `avatar`
- Success response: trả `message` và `user`
- Error codes: `AVATAR_FILE_REQUIRED`, `INVALID_FILE_TYPE`, `FILE_TOO_LARGE`, `CLOUDINARY_UPLOAD_FAILED`, `UPDATE_AVATAR_FAILED`
- Notes:
  - Avatar upload lưu URL Cloudinary, không lưu base64.

## Admin - Users

### GET `/users`

- Auth required: Yes
- Role required: `ADMIN`
- Query params:

```text
search, role, status, createdFrom, createdTo, page, limit
```

- Success response: trả `data[]` và `meta`
- Error codes: `VALIDATION_ERROR`, `LIST_USERS_FAILED`
- Notes:
  - Search/filter/pagination nằm ở endpoint này.
  - Khi `search` có giá trị và Elasticsearch đang bật/khả dụng, backend ưu tiên Elasticsearch để lấy kết quả tìm kiếm rồi đối chiếu lại dữ liệu từ MySQL.
  - Nếu Elasticsearch tắt, lỗi hoặc chưa chạy, backend fallback an toàn về Prisma/MySQL search cũ.

### GET `/users/:id`

- Auth required: Yes
- Role required: `ADMIN`
- Request body: none
- Success response: trả chi tiết user
- Error codes: `VALIDATION_ERROR`, `USER_NOT_FOUND`, `GET_USER_DETAIL_FAILED`

### PATCH `/users/:id`

- Auth required: Yes
- Role required: `ADMIN`
- Request body:

```json
{
  "name": "Updated Name",
  "phone": "0901234567",
  "gender": "FEMALE",
  "dateOfBirth": "1990-05-15",
  "address": "456 Le Loi"
}
```

- Success response: trả `message` và `user`
- Error codes: `VALIDATION_ERROR`, `USER_NOT_FOUND`, `ADMIN_UPDATE_USER_FAILED`
- Notes:
  - Không dùng endpoint này để sửa password, role, status, noShowCount.
  - `dateOfBirth` của User APIs hiện dùng format `YYYY-MM-DD`.

### PATCH `/users/:id/status`

- Auth required: Yes
- Role required: `ADMIN`
- Request body:

```json
{
  "status": "LOCKED"
}
```

- Success response: trả `message` và `user`
- Error codes: `VALIDATION_ERROR`, `INVALID_USER_STATUS`, `CANNOT_UPDATE_OWN_STATUS`, `USER_NOT_FOUND`, `UPDATE_USER_STATUS_FAILED`
- Notes:
  - Lock/unlock dùng endpoint riêng.

### PATCH `/users/:id/reset-no-show`

- Auth required: Yes
- Role required: `ADMIN`
- Request body: none
- Success response: trả `message` và `user`
- Error codes: `VALIDATION_ERROR`, `CANNOT_RESET_OWN_NO_SHOW`, `USER_NOT_FOUND`, `RESET_NO_SHOW_FAILED`
- Notes:
  - Reset no-show dùng endpoint riêng.

### PATCH `/users/:id/reset-password`

- Auth required: Yes
- Role required: `ADMIN`
- Request body:

```json
{}
```

- Success response: trả `message`
- Error codes: `VALIDATION_ERROR`, `USER_NOT_FOUND`, `USER_EMAIL_NOT_FOUND`, `CANNOT_RESET_OWN_PASSWORD`, `SEND_RESET_PASSWORD_EMAIL_FAILED`, `RESET_USER_PASSWORD_FAILED`
- Notes:
  - Backend tự sinh mật khẩu tạm thời.
  - API không trả mật khẩu mới.
  - Mật khẩu mới được gửi qua email của người dùng.
  - Không log mật khẩu mới hoặc `passwordHash`.
  - Task này chưa revoke toàn bộ session/token hiện có sau khi reset mật khẩu.

### POST `/users/staff`

- Auth required: Yes
- Role required: `ADMIN`
- Request body:

```json
{
  "name": "Le Tan A",
  "email": "staff@example.com",
  "phone": "0901234567",
  "password": "Password123",
  "role": "RECEPTIONIST",
  "status": "ACTIVE"
}
```

- Request body nếu role = `DOCTOR`:

```json
{
  "name": "Doctor User",
  "email": "doctor@example.com",
  "phone": "0901234567",
  "password": "Password123",
  "role": "DOCTOR",
  "status": "ACTIVE",
  "doctorName": "BS Nguyen Van B",
  "specialtyId": "specialty-id",
  "academicTitle": "BS.CKI",
  "yearsOfExperience": 8,
  "consultationFee": 300000,
  "avatarUrl": ""
}
```

- Success response: trả `message` và `user`
- Error codes: `VALIDATION_ERROR`, `EMAIL_ALREADY_EXISTS`, `INVALID_STAFF_ROLE`, `CREATE_STAFF_USER_FAILED`
- Notes:
  - Chỉ tạo `DOCTOR`, `RECEPTIONIST`, `ADMIN`.
  - Không tạo `PATIENT`.
  - `academicTitle` canonical: `BS.CKI`, `BS.CKII`, `ThS.BS`, `TS.BS`.
  - Backend hiện có normalize legacy underscore value.
  - Nếu role = `DOCTOR` thì `doctorName`, `specialtyId`, `academicTitle` là bắt buộc.
  - `specialtyId` phải tham chiếu tới chuyên khoa đang active.

## Patient Profiles

### GET `/patient-profiles`

- Auth required: Yes
- Role required: `PATIENT`
- Query params:

```text
search, page, limit
```

- Success response: trả `data[]` và `meta`
- Error codes: `VALIDATION_ERROR`, `LIST_PATIENT_PROFILES_FAILED`
- Notes:
  - Không giới hạn số hồ sơ người thân.

### POST `/patient-profiles`

- Auth required: Yes
- Role required: `PATIENT`
- Request body:

```json
{
  "fullName": "Tran Thi C",
  "phone": "0901234567",
  "email": "relative@example.com",
  "gender": "FEMALE",
  "dateOfBirth": "1995-05-15",
  "address": "123 Nguyen Hue",
  "relationship": "ME"
}
```

- Success response: trả `message` và `profile`
- Error codes: `VALIDATION_ERROR`, `CREATE_PATIENT_PROFILE_FAILED`
- Notes:
  - Không nhận `userId`, `isActive`, `isDefault`.
  - Tạo mới luôn đặt `isActive = true` ở backend.
  - `dateOfBirth` format chuẩn trong Dev 1 APIs là `YYYY-MM-DD`.
  - Nếu UI muốn hiển thị `DD/MM/YYYY` thì chỉ format ở layer hiển thị, không dùng làm request payload.
  - `relationship` hiện theo enum backend: `SELF`, `CHA`, `ME`, `CON`, `VO`, `CHONG`, `ANH`, `CHI`, `EM`, `ONG`, `BA`, `KHAC`.

### PATCH `/patient-profiles/:id`

- Auth required: Yes
- Role required: `PATIENT`
- Request body: các field của profile, cập nhật từng phần
- Success response: trả `message` và `profile`
- Error codes: `VALIDATION_ERROR`, `PATIENT_PROFILE_NOT_FOUND`, `PATIENT_PROFILE_INACTIVE`, `UPDATE_PATIENT_PROFILE_FAILED`

### GET `/patient-profiles/:id`

- Auth required: Yes
- Role required: `PATIENT`
- Request body: none
- Success response: trả chi tiết một hồ sơ của chính user hiện tại
- Error codes: `VALIDATION_ERROR`, `PATIENT_PROFILE_NOT_FOUND`, `PATIENT_PROFILE_INACTIVE`, `GET_PATIENT_PROFILE_FAILED`

### DELETE `/patient-profiles/:id`

- Auth required: Yes
- Role required: `PATIENT`
- Request body: none
- Success response: trả `message` và `profile`
- Error codes: `VALIDATION_ERROR`, `PATIENT_PROFILE_NOT_FOUND`, `PROFILE_HAS_ACTIVE_APPOINTMENT`, `DELETE_PATIENT_PROFILE_FAILED`
- Notes:
  - Soft delete bằng `isActive = false`.
  - Không xóa nếu hồ sơ còn lịch hẹn active.

### PATCH `/patient-profiles/:id/default`

- Auth required: Yes
- Role required: `PATIENT`
- Request body: none
- Success response: trả `message` và `profile`
- Error codes: `VALIDATION_ERROR`, `PATIENT_PROFILE_NOT_FOUND`, `PATIENT_PROFILE_INACTIVE`, `SET_DEFAULT_PROFILE_FAILED`
- Notes:
  - Route legacy.
  - Không phải flow chính của UI/booking hiện tại.

## Clinic Settings

### GET `/clinic-settings/clinic-info`

- Auth required: No
- Role required: None
- Request body: none
- Success response: trả public clinic info DTO
- Error codes: `GET_CLINIC_INFO_FAILED`

### PATCH `/clinic-settings/clinic-info`

- Auth required: Yes
- Role required: `ADMIN`
- Request body:

```json
{
  "name": "CarePlus Clinic",
  "address": "123 Nguyen Trai",
  "hotline": "19001234",
  "email": "clinic@example.com",
  "workingHours": "08:00-17:00",
  "description": "Phong kham da khoa"
}
```

- Success response: trả `message` và `clinicInfo`
- Error codes: `VALIDATION_ERROR`, `UPDATE_CLINIC_INFO_FAILED`

### GET `/clinic-settings/system`

- Auth required: Yes
- Role required: `ADMIN`
- Request body: none
- Success response: trả system setting DTO
- Error codes: `GET_SYSTEM_SETTING_FAILED`

### PATCH `/clinic-settings/system`

- Auth required: Yes
- Role required: `ADMIN`
- Request body:

```json
{
  "maxBookingDaysAhead": 7,
  "slotDurationMinutes": 30,
  "cancelBeforeHours": 2,
  "maxNoShowBeforeLock": 3,
  "maxActiveAppointmentsPerUser": 5,
  "morningShiftStart": "08:00",
  "morningShiftEnd": "11:30",
  "afternoonShiftStart": "13:30",
  "afternoonShiftEnd": "17:00"
}
```

- Success response: trả `message` và `systemSetting`
- Error codes: `VALIDATION_ERROR`, `UPDATE_SYSTEM_SETTING_FAILED`
- Notes:
  - Admin System Settings không có Token TTL.

### GET `/clinic-settings/booking-rules`

- Auth required: No
- Role required: None
- Request body: none
- Success response: trả public DTO gọn cho booking UI
- Error codes: `GET_BOOKING_RULES_FAILED`

### GET `/clinic-settings/system/public`

- Auth required: No
- Role required: None
- Request body: none
- Success response: alias sang booking rules DTO
- Error codes: `GET_BOOKING_RULES_FAILED`
- Notes:
  - Deprecated alias.

### Notes

- `GET /clinic-settings/stats/public` đang tồn tại và được mount public trong code hiện tại, nhưng đây là endpoint hỗ trợ thống kê public, không phải flow cốt lõi của Dev 1.
- `clinicInfo` và `systemSetting` hiện được xử lý theo singleton flow ở backend.

## Specialties

### GET `/specialties`

- Auth required: No
- Role required: None
- Query params:

```text
search, page, limit
```

- Success response: trả public list `data[]` và `meta`
- Error codes: `VALIDATION_ERROR`, `LIST_SPECIALTIES_FAILED`
- Notes:
  - Public GET chỉ trả active specialties.

### GET `/specialties/admin`

- Auth required: Yes
- Role required: `ADMIN`
- Query params:

```text
search, page, limit
```

- Success response: trả admin list `data[]` và `meta`
- Error codes: `VALIDATION_ERROR`, `LIST_SPECIALTIES_FAILED`
- Notes:
  - Route admin list thực tế là `/specialties/admin`, không phải `GET /specialties` có role admin.
  - Khi `search` có giá trị và Elasticsearch đang bật/khả dụng, backend ưu tiên Elasticsearch cho search admin rồi đọc lại dữ liệu từ MySQL.
  - Nếu Elasticsearch tắt, lỗi hoặc chưa chạy, backend fallback an toàn về Prisma/MySQL search cũ.

### GET `/specialties/:id`

- Auth required: No
- Role required: None
- Request body: none
- Success response: trả chi tiết chuyên khoa active theo `id`
- Error codes: `VALIDATION_ERROR`, `SPECIALTY_NOT_FOUND`, `GET_SPECIALTY_FAILED`
- Notes:
  - Public detail chỉ trả chuyên khoa active.

### POST `/specialties`

- Auth required: Yes
- Role required: `ADMIN`
- Request body:

```json
{
  "name": "Tim mach",
  "description": "Chuyen khoa tim mach",
  "active": true
}
```

- Success response: trả `message` và `specialty`
- Error codes: `VALIDATION_ERROR`, `SPECIALTY_ALREADY_EXISTS`, `SPECIALTY_SLUG_ALREADY_EXISTS`, `CREATE_SPECIALTY_FAILED`
- Notes:
  - Backend tự sinh `slug` từ `name` nếu admin không gửi.
  - Backend cũng cho phép client gửi `slug` hợp lệ nếu cần override.
  - `icon` optional, hiện chưa có icon picker/upload ở Admin FE.

### PATCH `/specialties/:id`

- Auth required: Yes
- Role required: `ADMIN`
- Request body:

```json
{
  "name": "Tim mach cap nhat",
  "description": "Mo ta moi",
  "active": true
}
```

- Success response: trả `message` và `specialty`
- Error codes: `VALIDATION_ERROR`, `SPECIALTY_NOT_FOUND`, `SPECIALTY_ALREADY_EXISTS`, `SPECIALTY_SLUG_ALREADY_EXISTS`, `UPDATE_SPECIALTY_FAILED`
- Notes:
  - Nếu không gửi `slug` nhưng có đổi `name`, backend sẽ tự regenerate `slug` từ tên mới.

### DELETE `/specialties/:id`

- Auth required: Yes
- Role required: `ADMIN`
- Request body: none
- Success response: trả `message` và `specialty`
- Error codes: `VALIDATION_ERROR`, `SPECIALTY_NOT_FOUND`, `SPECIALTY_IN_USE`, `DELETE_SPECIALTY_FAILED`
- Notes:
  - Tài liệu hệ thống hiện coi đây là soft delete theo `active=false`. QA nên xác nhận hành vi thực tế cùng backend nếu cần regression test sâu.

## AI Assistant

### POST `/ai-assistant/chat`

- Auth required: No
- Role required: None
- Request body:

```json
{
  "message": "CarePlus có chuyên khoa tim mạch không?"
}
```

- Request body có thể hỗ trợ thêm `history`:

```json
{
  "message": "CarePlus có chuyên khoa tim mạch không?",
  "history": [
    {
      "role": "user",
      "content": "CarePlus có những chuyên khoa nào?"
    },
    {
      "role": "assistant",
      "content": "CarePlus hiện có các chuyên khoa công khai như..."
    }
  ]
}
```

- Success response:

```json
{
  "success": true,
  "data": {
    "reply": "CarePlus hiện có chuyên khoa Tim mạch..."
  }
}
```

- Error codes: `VALIDATION_ERROR`, `AI_ASSISTANT_CONTEXT_UNAVAILABLE`, `AI_ASSISTANT_FAILED`, `GEMINI_UNAVAILABLE`
- Notes:
  - Endpoint public để chatbox góc giao diện có thể hoạt động cho guest.
  - Request body dùng Zod strict, không nhận field lạ.
  - `message` giới hạn `1-1000` ký tự.
  - `history` là optional, tối đa `10` item, mỗi item chỉ nhận `role = user|assistant` và `content <= 1000`.
  - Có rate limit cơ bản theo IP qua Redis middleware.
  - Backend chỉ gửi public/safe context sang Gemini: clinic info, booking rules public, specialty active, doctor public, blog published.
  - Không gửi password, OTP, token, email người dùng khác, hồ sơ bệnh nhân cá nhân, lịch hẹn cá nhân, admin-only data.
  - Câu hỏi ngoài scope CarePlus hoặc đòi dữ liệu nhạy cảm sẽ bị từ chối lịch sự mà không cần truy xuất dữ liệu riêng tư.
  - AI không chẩn đoán bệnh hoặc kê đơn. Với triệu chứng nghiêm trọng, response phải khuyên người dùng liên hệ bác sĩ hoặc cơ sở y tế gần nhất.
  - `GEMINI_API_KEY` chỉ nằm ở backend env; frontend không truy cập trực tiếp Gemini.
  - Model khuyến nghị hiện tại cho flow `generateContent` là `gemini-2.5-flash`.
  - Nếu `AI_ASSISTANT_ENABLED=false`, backend trả fallback reply: `CarePlus AI hiện chưa được bật. Vui lòng thử lại sau.`
