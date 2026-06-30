# DANH SÁCH TEST CASE - QUẢN LÝ VÀ THAO TÁC LỊCH HẸN (APPOINTMENT MANAGEMENT)

Tài liệu này chứa các Test Case chi tiết cho luồng quản lý trạng thái, hủy lịch, duyệt hủy sát giờ, bộ lọc và đánh giá bác sĩ đối với Lịch hẹn (Appointment) trên hệ thống CarePlus.

---

## PHẦN 1: LUỒNG CHUYỂN TRẠNG THÁI LỊCH HẸN (STATUS TRANSITIONS)

### **Test Case 1: Lễ tân thực hiện Check-in lịch hẹn**
*   **Test Case ID:** TC_APT_001
*   **Test Case Description:** Lễ tân thực hiện check-in cho bệnh nhân đã đến phòng khám đúng hẹn. Lịch hẹn chuyển từ `CONFIRMED` sang `CHECKED_IN`.

| S # | Prerequisites (Điều kiện tiên quyết) |
|---|---|
| 1 | Lễ tân đã đăng nhập hợp lệ và truy cập màn hình `/portal/le-tan/lich-hen` |
| 2 | Đang có ít nhất một lịch hẹn ở trạng thái `CONFIRMED` trong ngày hôm nay |

| S # | Test Data (Dữ liệu kiểm thử) |
|---|---|
| 1 | Mã lịch hẹn: `APT-123456` (Trạng thái hiện tại: `CONFIRMED`) |

| Step # | Step Details (Các bước thực hiện) | Expected Results (Kết quả mong đợi) | Actual Results (Kết quả thực tế) |
|---|---|---|---|
| **1** | Tại bảng danh sách lịch hẹn hôm nay, tìm lịch hẹn `APT-123456`. Click vào nút **"Check-in"** trực tiếp trên dòng hoặc trong Drawer chi tiết. | Hiển thị Modal xác nhận Check-in: "Xác nhận bệnh nhân đã đến phòng khám?". | Như mong đợi (As Expected) |
| **2** | Nhấn **"Xác nhận"** trên modal. | Hệ thống cập nhật trạng thái lịch hẹn thành `CHECKED_IN`. Thẻ KPI "Đã check-in" và "Chờ khám" tăng thêm 1. Toast thông báo check-in thành công hiển thị. | Như mong đợi (As Expected) |

---

### **Test Case 2: Lễ tân đánh dấu Bệnh nhân vắng mặt (No-Show)**
*   **Test Case ID:** TC_APT_002
*   **Test Case Description:** Lễ tân đánh dấu vắng mặt cho lịch hẹn khi bệnh nhân không đến khám đúng hẹn. Lịch chuyển từ `CONFIRMED` sang `NO_SHOW`.

| S # | Prerequisites (Điều kiện tiên quyết) |
|---|---|
| 1 | Lễ tân đã đăng nhập hợp lệ và truy cập màn hình `/portal/le-tan/lich-hen` |
| 2 | Lịch hẹn ở trạng thái `CONFIRMED` đã quá giờ khám quy định mà bệnh nhân không đến |

| S # | Test Data (Dữ liệu kiểm thử) |
|---|---|
| 1 | Mã lịch hẹn: `APT-654321` (Trạng thái: `CONFIRMED`) \| Ghi chú: `Gọi điện không nhấc máy` |

| Step # | Step Details (Các bước thực hiện) | Expected Results (Kết quả mong đợi) | Actual Results (Kết quả thực tế) |
|---|---|---|---|
| **1** | Mở Drawer chi tiết lịch hẹn `APT-654321`. Click vào nút **"Vắng mặt"** (chỉ hiển thị khi trạng thái là `CONFIRMED`). | Hiển thị Modal báo vắng mặt với trường Ghi chú (không bắt buộc). | Như mong đợi (As Expected) |
| **2** | Nhập ghi chú **"Gọi điện không nhấc máy"** và nhấn **Xác nhận**. | Trạng thái lịch hẹn chuyển sang `NO_SHOW`. Chỉ số vắng mặt (noShowCount) của tài khoản bệnh nhân tăng thêm 1. Nếu số lần vắng mặt đạt $\ge 3$, hệ thống tự động gửi email cảnh báo khóa tài khoản đặt lịch online. | Như mong đợi (As Expected) |

---

### **Test Case 3: Bác sĩ hoàn thành lịch hẹn**
*   **Test Case ID:** TC_APT_003
*   **Test Case Description:** Bác sĩ khám xong cho bệnh nhân và đánh dấu hoàn thành ca khám. Lịch chuyển từ `CHECKED_IN` sang `COMPLETED`.

| S # | Prerequisites (Điều kiện tiên quyết) |
|---|---|
| 1 | Bác sĩ đã đăng nhập vào Doctor Portal (`/portal/bac-si/lich-hen`) |
| 2 | Lịch hẹn của bệnh nhân đã được Lễ tân check-in trước đó (Trạng thái: `CHECKED_IN`) |

| S # | Test Data (Dữ liệu kiểm thử) |
|---|---|
| 1 | Mã lịch hẹn: `APT-789101` \| Ghi chú sau khám: `Viêm họng cấp, kê đơn kháng sinh 5 ngày, tái khám sau 1 tuần.` |

| Step # | Step Details (Các bước thực hiện) | Expected Results (Kết quả mong đợi) | Actual Results (Kết quả thực tế) |
|---|---|---|---|
| **1** | Bác sĩ vào tab "Đã check-in" trên danh sách lịch hẹn hôm nay. Click chọn lịch hẹn `APT-789101` để mở Drawer chi tiết và nhấn **"Hoàn thành"**. | Hiển thị Modal hoàn thành ca khám kèm ô nhập Ghi chú sau khám (không bắt buộc). | Như mong đợi (As Expected) |
| **2** | Nhập nội dung ghi chú sau khám và nhấn **Xác nhận**. | Trạng thái lịch hẹn chuyển thành `COMPLETED`. Nút "Đánh giá" được kích hoạt trên giao diện của Patient Portal đối với lịch hẹn này. Ghi chú của bác sĩ được lưu lại trong lịch sử bệnh án. | Như mong đợi (As Expected) |

---

## PHẦN 2: HỦY LỊCH HẸN & PHÊ DUYỆT (CANCELLATION & APPROVALS)

### **Test Case 4: Bệnh nhân hủy lịch trực tiếp thành công (Đúng thời hạn quy định)**
*   **Test Case ID:** TC_APT_004
*   **Test Case Description:** Bệnh nhân hủy lịch khám từ xa trước giờ hẹn $\ge 2$ tiếng (hoặc theo cấu hình `cancelBeforeHours`). Lịch hủy trực tiếp thành công mà không cần phê duyệt.

| S # | Prerequisites (Điều kiện tiên quyết) |
|---|---|
| 1 | Bệnh nhân đã đăng nhập và truy cập màn hình "Lịch hẹn của tôi" |
| 2 | Lịch hẹn có giờ khám cách thời gian hiện tại $\ge 2$ tiếng (Ví dụ: Giờ khám `15:00`, hiện tại là `11:00`) |
| 3 | Cấu hình giới hạn hủy sát giờ `cancelBeforeHours` = 2 |

| S # | Test Data (Dữ liệu kiểm thử) |
|---|---|
| 1 | Lý do hủy: `Thay đổi kế hoạch cá nhân` |

| Step # | Step Details (Các bước thực hiện) | Expected Results (Kết quả mong đợi) | Actual Results (Kết quả thực tế) |
|---|---|---|---|
| **1** | Tìm lịch hẹn ở trạng thái `CONFIRMED` thỏa mãn điều kiện thời gian. Click nút **"Hủy lịch"**. | Hiển thị Modal xác nhận hủy lịch kèm ô nhập lý do hủy (không bắt buộc). | Như mong đợi (As Expected) |
| **2** | Nhập lý do và nhấn **Xác nhận hủy**. | Lịch hẹn cập nhật trực tiếp thành trạng thái `CANCELLED` trên database. Trạng thái timeslot tương ứng chuyển từ `BOOKED` quay lại `AVAILABLE` để người khác có thể đặt. Bệnh nhân nhận được email thông báo hủy lịch thành công. | Như mong đợi (As Expected) |

---

### **Test Case 5: Bệnh nhân gửi yêu cầu hủy sát giờ (Cần Lễ tân/Admin duyệt)**
*   **Test Case ID:** TC_APT_005
*   **Test Case Description:** Bệnh nhân thực hiện hủy lịch sát giờ khám ($< 2$ tiếng trước giờ hẹn). Hệ thống bắt buộc nhập lý do hủy và chuyển lịch sang dạng yêu cầu chờ phê duyệt.

| S # | Prerequisites (Điều kiện tiên quyết) |
|---|---|
| 1 | Lịch hẹn cách giờ khám $< 2$ tiếng (Ví dụ: Giờ khám `10:00`, giờ hiện tại là `09:15`) |
| 2 | Cấu hình `cancelBeforeHours` = 2 |

| S # | Test Data (Dữ liệu kiểm thử) |
|---|---|
| 1 | Lý do hủy: `Có việc đột xuất không thể di chuyển đến phòng khám` |

| Step # | Step Details (Các bước thực hiện) | Expected Results (Kết quả mong đợi) | Actual Results (Kết quả thực tế) |
|---|---|---|---|
| **1** | Bệnh nhân click nút **"Hủy lịch"** của lịch hẹn sát giờ khám. | Hệ thống nhận diện thời gian sát giờ, hiển thị Modal thông báo: "Do lịch hẹn của bạn sát giờ khám (dưới 2 tiếng), yêu cầu hủy cần được lễ tân phê duyệt. Vui lòng nhập lý do hủy bắt buộc." | Như mong đợi (As Expected) |
| **2** | Bỏ trống trường lý do hủy và nhấn **Gửi yêu cầu**. | Hệ thống chặn gửi và báo lỗi đỏ: "Vui lòng nhập lý do hủy lịch." | Như mong đợi (As Expected) |
| **3** | Nhập lý do hủy và nhấn **Gửi yêu cầu**. | Hệ thống gửi yêu cầu hủy thành công. Trạng thái lịch hẹn vẫn được giữ ở `CONFIRMED`, đồng thời tạo một yêu cầu duyệt hủy (`CANCELLATION`) ở trạng thái `PENDING`. Thông báo: "Yêu cầu hủy lịch đã được gửi đến lễ tân duyệt." hiển thị. | Như mong đợi (As Expected) |

---

### **Test Case 6: Lễ tân duyệt yêu cầu hủy lịch sát giờ**
*   **Test Case ID:** TC_APT_006
*   **Test Case Description:** Lễ tân xem xét lý do và duyệt yêu cầu hủy lịch sát giờ của bệnh nhân.

| S # | Prerequisites (Điều kiện tiên quyết) |
|---|---|
| 1 | Lễ tân đã đăng nhập và truy cập màn hình Duyệt yêu cầu (`/portal/admin/duyet-yeu-cau` hoặc qua notification) |
| 2 | Đang có yêu cầu hủy lịch ở trạng thái `PENDING` |

| Step # | Step Details (Các bước thực hiện) | Expected Results (Kết quả mong đợi) | Actual Results (Kết quả thực tế) |
|---|---|---|---|
| **1** | Vào danh sách yêu cầu chờ duyệt, tab "Yêu cầu hủy lịch (CANCELLATION)". Tìm yêu cầu của bệnh nhân và nhấn **"Duyệt"**. | Hiển thị hộp thoại xác nhận phê duyệt yêu cầu hủy lịch. | Như mong đợi (As Expected) |
| **2** | Nhấn **"Xác nhận duyệt"**. | Yêu cầu hủy chuyển trạng thái thành `APPROVED`. Lịch hẹn gốc chuyển sang trạng thái `CANCELLED`. Timeslot được giải phóng trở lại trạng thái `AVAILABLE`. Hệ thống gửi email thông báo phê duyệt hủy lịch đến bệnh nhân. | Như mong đợi (As Expected) |

---

### **Test Case 7: Lễ tân từ chối yêu cầu hủy lịch sát giờ**
*   **Test Case ID:** TC_APT_007
*   **Test Case Description:** Lễ tân từ chối yêu cầu hủy sát giờ vì lý do không hợp lý. Lịch hẹn giữ nguyên trạng thái `CONFIRMED`.

| Step # | Step Details (Các bước thực hiện) | Expected Results (Kết quả mong đợi) | Actual Results (Kết quả thực tế) |
|---|---|---|---|
| **1** | Trong tab duyệt yêu cầu hủy lịch, tìm yêu cầu và nhấn **"Từ chối"**. | Hiển thị hộp thoại yêu cầu nhập lý do từ chối (bắt buộc). | Như mong đợi (As Expected) |
| **2** | Nhập lý do từ chối "Lý do hủy không hợp lệ" và nhấn **Xác nhận**. | Yêu cầu chuyển sang trạng thái `REJECTED`. Lịch hẹn gốc vẫn giữ nguyên là `CONFIRMED`. Bệnh nhân nhận được email thông báo yêu cầu hủy bị từ chối và hướng dẫn đi khám đúng hẹn. | Như mong đợi (As Expected) |

---

### **Test Case 8: Cố gắng hủy lịch hẹn trong quá khứ**
*   **Test Case ID:** TC_BOOK_008
*   **Test Case Description:** Hệ thống chặn hoàn toàn mọi hành vi hủy lịch khám đã qua giờ bắt đầu trên database lẫn UI.

| S # | Prerequisites (Điều kiện tiên quyết) |
|---|---|
| 1 | Lịch hẹn có giờ khám nằm trong quá khứ (Ví dụ: Lịch hẹn lúc `08:00` sáng nay, hiện tại đã là `14:00` chiều) |

| Step # | Step Details (Các bước thực hiện) | Expected Results (Kết quả mong đợi) | Actual Results (Kết quả thực tế) |
|---|---|---|---|
| **1** | Bệnh nhân truy cập danh sách lịch hẹn và tìm lịch hẹn quá khứ nói trên. | Nút "Hủy lịch" bị ẩn hoàn toàn hoặc vô hiệu hóa (disabled). | Như mong đợi (As Expected) |
| **2** | Thực hiện gọi API hủy trực tiếp bằng công cụ ngoài (như Postman/Curl) lên route hủy của lịch hẹn này. | API trả về mã lỗi `400 Bad Request` với thông điệp: **"Không thể hủy lịch hẹn đã diễn ra hoặc đã qua giờ khám."** (Mã lỗi `CANCELLATION_LIMIT_EXCEEDED`). | Như mong đợi (As Expected) |

---

## PHẦN 3: ĐÁNH GIÁ BÁC SĨ (DOCTOR RATING)

### **Test Case 9: Đánh giá bác sĩ thành công**
*   **Test Case ID:** TC_APT_009
*   **Test Case Description:** Bệnh nhân thực hiện đánh giá bác sĩ sau khi lịch khám được hoàn thành (`COMPLETED`).

| S # | Prerequisites (Điều kiện tiên quyết) |
|---|---|
| 1 | Lịch hẹn đã ở trạng thái `COMPLETED` |
| 2 | Bệnh nhân đã đăng nhập và chưa từng đánh giá lịch hẹn này |

| S # | Test Data (Dữ liệu kiểm thử) |
|---|---|
| 1 | Số sao: `5 sao` \| Bình luận: `Bác sĩ tư vấn rất nhiệt tình và chuyên nghiệp.` (48 ký tự) |

| Step # | Step Details (Các bước thực hiện) | Expected Results (Kết quả mong đợi) | Actual Results (Kết quả thực tế) |
|---|---|---|---|
| **1** | Tại màn hình chi tiết lịch hẹn đã khám, nhấp chọn nút **"Đánh giá bác sĩ"**. | Giao diện mở ra Modal đánh giá bác sĩ gồm chọn số sao (1-5) và ô nhập bình luận. | Như mong đợi (As Expected) |
| **2** | Chọn **5 sao**, nhập bình luận và nhấn **Gửi đánh giá**. | Hệ thống lưu đánh giá thành công, hiển thị toast thông báo. Trạng thái lịch hẹn được cập nhật đã đánh giá (`isReviewed = true`). Điểm rating trung bình của Bác sĩ được cập nhật tương ứng. | Như mong đợi (As Expected) |

---

### **Test Case 10: Đánh giá bác sĩ thất bại do không đạt validation**
*   **Test Case ID:** TC_APT_010
*   **Test Case Description:** Chặn gửi đánh giá khi thiếu sao hoặc nội dung bình luận quá ngắn/quá dài.

| S # | Test Data (Dữ liệu kiểm thử) |
|---|---|
| 1 | Dữ liệu 1: Không chọn sao, bình luận: `Khám tốt` (dưới 10 ký tự) |
| 2 | Dữ liệu 2: Chọn 4 sao, bình luận trống hoặc ngắn hơn 10 ký tự |
| 3 | Dữ liệu 3: Chọn 5 sao, bình luận trên 1000 ký tự |

| Step # | Step Details (Các bước thực hiện) | Expected Results (Kết quả mong đợi) | Actual Results (Kết quả thực tế) |
|---|---|---|---|
| **1** | Mở modal đánh giá, thử gửi dữ liệu không chọn số sao. | Hệ thống báo lỗi đỏ: "Vui lòng chọn số sao đánh giá." | Như mong đợi (As Expected) |
| **2** | Chọn sao nhưng nhập bình luận ít hơn 10 ký tự (Ví dụ: "Khám ok") và nhấn Gửi. | Hệ thống báo lỗi: "Bình luận phải có độ dài từ 10 đến 1000 ký tự." | Như mong đợi (As Expected) |
| **3** | Nhập bình luận dài vượt quá 1000 ký tự và nhấn Gửi. | Hệ thống báo lỗi tương tự và không cho gửi. | Như mong đợi (As Expected) |

---

### **Test Case 11: Không được phép đánh giá lại lần thứ hai**
*   **Test Case ID:** TC_APT_011
*   **Test Case Description:** Mỗi lịch hẹn đã hoàn thành chỉ được đánh giá duy nhất 1 lần.

| S # | Prerequisites (Điều kiện tiên quyết) |
|---|---|
| 1 | Lịch hẹn đã được đánh giá thành công trước đó (`isReviewed = true`) |

| Step # | Step Details (Các bước thực hiện) | Expected Results (Kết quả mong đợi) | Actual Results (Kết quả thực tế) |
|---|---|---|---|
| **1** | Bệnh nhân quay lại màn hình chi tiết lịch hẹn đã đánh giá. | Nút "Đánh giá bác sĩ" không còn hiển thị hoặc chuyển thành trạng thái disabled kèm nhãn "Đã đánh giá". | Như mong đợi (As Expected) |

---

## PHẦN 4: RÀNG BUỘC KHI XÓA HỒ SƠ LIÊN QUAN (DEPENDENCY CONSTRAINTS)

### **Test Case 12: Chặn xóa hồ sơ người thân khi đang có lịch hẹn active**
*   **Test Case ID:** TC_APT_012
*   **Test Case Description:** Người dùng không được phép xóa (soft delete) hồ sơ người thân nếu hồ sơ đó đang gắn liền với một lịch hẹn chưa diễn ra.

| S # | Prerequisites (Điều kiện tiên quyết) |
|---|---|
| 1 | Người thân `Nguyễn Văn C` đang có một lịch hẹn ở trạng thái `CONFIRMED` vào ngày mai |

| Step # | Step Details (Các bước thực hiện) | Expected Results (Kết quả mong đợi) | Actual Results (Kết quả thực tế) |
|---|---|---|---|
| **1** | Vào trang `/benh-nhan/nguoi-than`, tìm thẻ thông tin của người thân `Nguyễn Văn C` và nhấp nút **"Xóa"**. | Hệ thống kiểm tra và hiển thị modal cảnh báo lỗi: **"Không thể xóa hồ sơ người thân này do đang có lịch hẹn chưa khám trên hệ thống. Vui lòng hoàn thành hoặc hủy lịch hẹn trước."** | Như mong đợi (As Expected) |
| **2** | Nhấn Xác nhận xóa (nếu cố tình bỏ qua cảnh báo hoặc gọi API xóa trực tiếp). | API trả về lỗi và thuộc tính `isActive` của hồ sơ người thân vẫn giữ nguyên là `true`. | Như mong đợi (As Expected) |
