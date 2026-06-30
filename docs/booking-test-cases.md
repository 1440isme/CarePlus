# DANH SÁCH TEST CASE CHI TIẾT - CHỨC NĂNG ĐẶT LỊCH KHÁM BỆNH NHÂN (PATIENT BOOKING WIZARD)

Tài liệu này chứa danh sách mở rộng toàn bộ các Test Case cho luồng đặt lịch khám của bệnh nhân (Patient Portal - `/dat-lich`) và Lễ tân đặt lịch hộ (`/le-tan/dat-lich`) trên hệ thống CarePlus.

---

## PHẦN 1: LUỒNG ĐĂNG NHẬP / CHUYỂN HƯỚNG (AUTHENTICATION & REDIRECT)

### **Test Case 1: Chưa đăng nhập - Đặt lịch và tự động chuyển hướng đăng nhập**
*   **Test Case ID:** TC_BOOK_001
*   **Test Case Description:** Người dùng chưa đăng nhập hệ thống vẫn có thể chọn chuyên khoa, bác sĩ và slot khám. Hệ thống tự động chuyển hướng đăng nhập ở Bước 3 và quay trở lại luồng sau khi đăng nhập thành công.

| S # | Prerequisites (Điều kiện tiên quyết) |
|---|---|
| 1 | Người dùng chưa đăng nhập tài khoản (hoặc đã đăng xuất) |
| 2 | Hệ thống hoạt động bình thường, thiết bị có kết nối Internet |

| S # | Test Data (Dữ liệu kiểm thử) |
|---|---|
| 1 | Tài khoản đăng nhập hợp lệ: `ninhhanh20112005@gmail.com` / `hanh123` |
| 2 | Chuyên khoa: `Nhi khoa` \| Bác sĩ: `Nguyễn Văn A` \| Khung giờ: `09:00 - 09:30` |

| Step # | Step Details (Các bước thực hiện) | Expected Results (Kết quả mong đợi) | Actual Results (Kết quả thực tế) |
|---|---|---|---|
| **1** | Truy cập trang `/dat-lich` khi chưa đăng nhập. | Trang Chọn chuyên khoa (Bước 1) hiển thị thành công. | Như mong đợi (As Expected) |
| **2** | Chọn chuyên khoa **"Nhi khoa"**, sau đó chọn bác sĩ **"Nguyễn Văn A"** và slot **"09:00 - 09:30"**. | Cho phép chọn chuyên khoa, bác sĩ, ngày và slot khám bình thường ở Bước 1 & Bước 2. | Như mong đợi (As Expected) |
| **3** | Click chọn slot để chuyển sang Bước 3. | Hệ thống không hiển thị form nhập thông tin mà tự động chuyển hướng (redirect) về trang Đăng nhập (`/login?redirect=/dat-lich`). | Như mong đợi (As Expected) |
| **4** | Nhập tài khoản `ninhhanh20112005@gmail.com` / `hanh123` và nhấn Đăng nhập. | Đăng nhập thành công, hệ thống tự động quay trở lại Bước 3 của trang đặt lịch (`/dat-lich`). Thông tin chuyên khoa, bác sĩ và slot khám đã chọn trước đó được giữ nguyên. Form hiển thị thông tin người khám mặc định là "Bản thân". | Như mong đợi (As Expected) |

---

## PHẦN 2: LUỒNG ĐẶT LỊCH THÀNH CÔNG (SUCCESS FLOWS)

### **Test Case 2: Đặt lịch khám cho Bản thân thành công**
*   **Test Case ID:** TC_BOOK_002
*   **Test Case Description:** Người dùng đặt lịch khám cho bản thân thành công qua 5 bước của Booking Wizard.

| S # | Prerequisites (Điều kiện tiên quyết) |
|---|---|
| 1 | Người dùng đã đăng nhập hợp lệ và email đã được xác minh |
| 2 | Tài khoản không bị khóa đặt lịch online |

| S # | Test Data (Dữ liệu kiểm thử) |
|---|---|
| 1 | Email: `ninhhanh20112005@gmail.com` \| Chuyên khoa: `Nhi khoa` \| Bác sĩ: `Nguyễn Văn A` \| Slot: `09:00 - 09:30` \| Lý do: `Khám tổng quát` |

| Step # | Step Details (Các bước thực hiện) | Expected Results (Kết quả mong đợi) | Actual Results (Kết quả thực tế) |
|---|---|---|---|
| **1** | Vào trang `/dat-lich`, chọn chuyên khoa **"Nhi khoa"**. | Chuyển sang Bước 2 thành công. | Như mong đợi (As Expected) |
| **2** | Chọn bác sĩ **"Nguyễn Văn A"**, chọn slot **"09:00 - 09:30"** (nền chuyển cyan). | Chuyển sang Bước 3 thành công. | Như mong đợi (As Expected) |
| **3** | Ở Bước 3, chọn đối tượng **"Bản thân"**, kiểm tra thông tin tự điền, nhập lý do khám **"Khám tổng quát"** và nhấn **Tiếp tục**. | Form tự động điền đúng thông tin cá nhân. Chuyển sang Bước 4 (Xác nhận) hiển thị tóm tắt chính xác. | Như mong đợi (As Expected) |
| **4** | Nhấn **"Xác nhận đặt lịch"** ở Bước 4. | Chuyển sang Bước 5 (Hoàn tất), hiển thị Mã lịch hẹn, trạng thái **CONFIRMED**, thông báo gửi email xác nhận. | Như mong đợi (As Expected) |

---

### **Test Case 3: Đặt lịch khám cho Người thân thành công**
*   **Test Case ID:** TC_BOOK_003
*   **Test Case Description:** Đặt lịch khám thành công cho người thân có sẵn hoặc thêm mới trực tiếp trong luồng.

| S # | Prerequisites (Điều kiện tiên quyết) |
|---|---|
| 1 | Người dùng đã đăng nhập hợp lệ và email đã được xác minh |

| S # | Test Data (Dữ liệu kiểm thử) |
|---|---|
| 1 | Người thân: `Nguyễn Văn C` (Con), SĐT: `0987654321`, Ngày sinh: `10/10/2015`, Giới tính: `Nam` |

| Step # | Step Details (Các bước thực hiện) | Expected Results (Kết quả mong đợi) | Actual Results (Kết quả thực tế) |
|---|---|---|---|
| **1** | Thực hiện Bước 1 & Bước 2 (chọn chuyên khoa, bác sĩ, slot). | Chuyển sang Bước 3 thành công. | Như mong đợi (As Expected) |
| **2** | Tại Bước 3, click **"Đổi người khám"** $\rightarrow$ chọn hồ sơ người thân **"Nguyễn Văn C"** (hoặc chọn "Thêm người thân" nhập dữ liệu và Lưu). Nhập lý do khám và nhấn **Tiếp tục**. | Form tự động cập nhật chính xác thông tin của người thân. Chuyển sang Bước 4 hiển thị thông tin người thân Nguyễn Văn C. | Như mong đợi (As Expected) |
| **3** | Nhấn **"Xác nhận đặt lịch"**. | Đặt lịch thành công, hiển thị trang thành công kèm thông tin người khám là Nguyễn Văn C. | Như mong đợi (As Expected) |

---

## PHẦN 3: HẠN CHẾ VÀ RÀNG BUỘC HỆ THỐNG (SYSTEM CONSTRAINTS)

### **Test Case 4: Đặt lịch thất bại do tài khoản bị khóa đặt lịch online**
*   **Test Case ID:** TC_BOOK_004
*   **Test Case Description:** Người dùng có số lần vắng mặt không lý do (no-show) $\ge$ 3 bị khóa tính năng đặt lịch online.

| S # | Prerequisites (Điều kiện tiên quyết) |
|---|---|
| 1 | Tài khoản có `noShowCount >= 3` |

| Step # | Step Details (Các bước thực hiện) | Expected Results (Kết quả mong đợi) | Actual Results (Kết quả thực tế) |
|---|---|---|---|
| **1** | Đăng nhập tài khoản bị khóa, truy cập `/dat-lich` và tiến hành các bước chọn chuyên khoa, bác sĩ, slot. | Các bước 1, 2, 3 hoạt động bình thường, cho phép điền thông tin và xác nhận. | Như mong đợi (As Expected) |
| **2** | Nhấn **"Xác nhận đặt lịch"** ở Bước 4. | Hệ thống chặn tạo lịch, hiển thị thông báo lỗi: **"Tài khoản của bạn đã bị khóa chức năng đặt lịch online do vắng mặt quá số lần quy định. Vui lòng liên hệ quầy lễ tân."** (Lỗi `account_locked`). Lịch hẹn không được lưu. | Như mong đợi (As Expected) |

---

### **Test Case 5: Đặt lịch thất bại do Email chưa xác minh**
*   **Test Case ID:** TC_BOOK_005
*   **Test Case Description:** Người dùng đăng nhập tài khoản chưa xác minh email không thể hoàn tất đặt lịch.

| S # | Prerequisites (Điều kiện tiên quyết) |
|---|---|
| 1 | Tài khoản chưa click link kích hoạt xác minh email |

| Step # | Step Details (Các bước thực hiện) | Expected Results (Kết quả mong đợi) | Actual Results (Kết quả thực tế) |
|---|---|---|---|
| **1** | Đăng nhập, truy cập `/dat-lich`, thực hiện chọn chuyên khoa, bác sĩ, slot và điền thông tin người khám. | Cho phép thao tác đến Bước 4. | Như mong đợi (As Expected) |
| **2** | Nhấn **"Xác nhận đặt lịch"** ở Bước 4. | Hệ thống từ chối tạo lịch, hiển thị thông báo lỗi: **"Vui lòng xác minh địa chỉ email của bạn trước khi thực hiện đặt lịch khám."** (Lỗi `email_unverified`). | Như mong đợi (As Expected) |

---

### **Test Case 6: Đặt lịch thất bại do trùng lịch active trong cùng một ngày**
*   **Test Case ID:** TC_BOOK_006
*   **Test Case Description:** Mỗi người khám chỉ được phép có 1 lịch hẹn active trong một ngày.

| S # | Prerequisites (Điều kiện tiên quyết) |
|---|---|
| 1 | Người đi khám đã có một lịch hẹn ở trạng thái `CONFIRMED` hoặc `CHECKED_IN` vào ngày đã chọn |

| Step # | Step Details (Các bước thực hiện) | Expected Results (Kết quả mong đợi) | Actual Results (Kết quả thực tế) |
|---|---|---|---|
| **1** | Thực hiện đặt thêm một lịch hẹn thứ 2 cho **cùng người khám đó** vào **cùng ngày** đã có lịch. Nhấn **Xác nhận đặt lịch** ở Bước 4. | Hệ thống báo lỗi trùng lịch cùng ngày: **"Người khám này đã có lịch hẹn active trong ngày hôm nay. Mỗi người khám chỉ được đặt 1 lịch hẹn active/ngày."** (Lỗi `same_day`). | Như mong đợi (As Expected) |

---

### **Test Case 7: Đặt lịch thất bại do trùng lịch active với cùng một bác sĩ**
*   **Test Case ID:** TC_BOOK_007
*   **Test Case Description:** Một người khám không được đặt thêm lịch hẹn active mới với cùng một bác sĩ khi lịch hẹn cũ chưa hoàn thành.

| S # | Prerequisites (Điều kiện tiên quyết) |
|---|---|
| 1 | Người khám đã có lịch hẹn active với Bác sĩ A vào ngày mai |

| Step # | Step Details (Các bước thực hiện) | Expected Results (Kết quả mong đợi) | Actual Results (Kết quả thực tế) |
|---|---|---|---|
| **1** | Tiến hành đặt lịch hẹn mới cho người khám đó với **Bác sĩ A** vào một ngày khác (ví dụ: ngày kia). Nhấn **Xác nhận đặt lịch** ở Bước 4. | Hệ thống báo lỗi trùng bác sĩ: **"Bệnh nhân đã có lịch hẹn chưa khám với bác sĩ này. Vui lòng hoàn thành lịch khám cũ trước khi đặt lịch mới."** (Lỗi `same_doctor`). | Như mong đợi (As Expected) |

---

### **Test Case 8: Đặt lịch thất bại do vượt quá số lịch hẹn active tối đa của tài khoản**
*   **Test Case ID:** TC_BOOK_008
*   **Test Case Description:** Giới hạn số lượng lịch hẹn active của một tài khoản theo cấu hình `maxActiveAppointmentsPerUser` (ví dụ: tối đa 3 lịch active).

| S # | Prerequisites (Điều kiện tiên quyết) |
|---|---|
| 1 | Tài khoản đã có 3 lịch hẹn active (cho bản thân hoặc người thân) |
| 2 | Cấu hình hệ thống `maxActiveAppointmentsPerUser` = 3 |

| Step # | Step Details (Các bước thực hiện) | Expected Results (Kết quả mong đợi) | Actual Results (Kết quả thực tế) |
|---|---|---|---|
| **1** | Tiến hành đặt lịch hẹn thứ 4 (cho bất kỳ ai thuộc tài khoản). Nhấn **Xác nhận đặt lịch** ở Bước 4. | Hệ thống từ chối và báo lỗi: **"Tài khoản của bạn đã đạt số lượng lịch hẹn active tối đa cho phép. Vui lòng hoàn tất hoặc hủy lịch cũ trước khi đặt lịch mới."** | Như mong đợi (As Expected) |

---

### **Test Case 9: Giới hạn ngày đặt lịch trước (maxBookingDaysAhead)**
*   **Test Case ID:** TC_BOOK_009
*   **Test Case Description:** Hệ thống không cho phép người dùng chọn lịch vượt quá số ngày đặt trước tối đa (ví dụ: 30 ngày).

| S # | Prerequisites (Điều kiện tiên quyết) |
|---|---|
| 1 | Cấu hình `maxBookingDaysAhead` = 30 |

| Step # | Step Details (Các bước thực hiện) | Expected Results (Kết quả mong đợi) | Actual Results (Kết quả thực tế) |
|---|---|---|---|
| **1** | Tại Bước 2 (Chọn bác sĩ & Lịch), kiểm tra thanh chọn ngày (Date Bar). | Thanh chọn ngày chỉ hiển thị tối đa 30 ngày tính từ ngày hiện tại. Các ngày xa hơn không hiển thị hoặc bị vô hiệu hóa (disabled), người dùng không thể nhấp chọn. | Như mong đợi (As Expected) |

---

## PHẦN 4: XUNG ĐỘT THỜI GIAN & ĐỒNG THỜI (CONCURRENCY)

### **Test Case 10: Trùng slot do người khác đặt trước trong lúc thao tác (slot_taken)**
*   **Test Case ID:** TC_BOOK_010
*   **Test Case Description:** Slot khám bị người dùng khác thanh toán/xác nhận trước khi người dùng hiện tại nhấn Xác nhận.

| Step # | Step Details (Các bước thực hiện) | Expected Results (Kết quả mong đợi) | Actual Results (Kết quả thực tế) |
|---|---|---|---|
| **1** | Người dùng A và Người dùng B cùng mở giao diện chọn slot `09:00 - 09:30` của Bác sĩ A. | Cả hai đều thấy slot hiển thị trống và chọn được slot này. | Như mong đợi (As Expected) |
| **2** | Người dùng A đi nhanh hơn và hoàn tất Bước 4 trước. | Người dùng A đặt lịch thành công, slot chuyển sang trạng thái đã đặt trên hệ thống. | Như mong đợi (As Expected) |
| **3** | Người dùng B nhấn "Xác nhận đặt lịch" chậm hơn vài giây. | Hệ thống kiểm tra real-time, từ chối tạo lịch cho Người dùng B và hiển thị lỗi: **"Khung giờ này vừa được đặt bởi người khác. Vui lòng chọn khung giờ khác."** (Lỗi `slot_taken`). Người dùng B được đưa lại Bước 2 để chọn lại slot. | Như mong đợi (As Expected) |

---

### **Test Case 11: Khóa/Ẩn các slot trong quá khứ**
*   **Test Case ID:** TC_BOOK_011
*   **Test Case Description:** Các slot khám của ngày hôm nay có giờ bắt đầu nhỏ hơn giờ hiện tại phải bị ẩn hoặc vô hiệu hóa.

| S # | Test Data (Dữ liệu kiểm thử) |
|---|---|
| 1 | Thời gian hệ thống hiện tại: `10:15` sáng ngày hôm nay |

| Step # | Step Details (Các bước thực hiện) | Expected Results (Kết quả mong đợi) | Actual Results (Kết quả thực tế) |
|---|---|---|---|
| **1** | Chọn ngày khám là ngày hôm nay. Kiểm tra danh sách slot của ca sáng. | Các slot khám từ `08:00 - 10:00` (đã qua) hiển thị trạng thái disabled (màu xám, không click được). Chỉ các slot từ `10:30` trở đi mới có thể click chọn. | Như mong đợi (As Expected) |

---

## PHẦN 5: KIỂM THỬ DỮ LIỆU ĐẦU VÀO (INPUT VALIDATION - BƯỚC 3)

### **Test Case 12: Bỏ trống các trường bắt buộc ở Bước 3**
*   **Test Case ID:** TC_BOOK_012
*   **Test Case Description:** Hệ thống chặn và báo lỗi khi người dùng không điền các thông tin bắt buộc.

| Step # | Step Details (Các bước thực hiện) | Expected Results (Kết quả mong đợi) | Actual Results (Kết quả thực tế) |
|---|---|---|---|
| **1** | Tại Bước 3, xóa sạch các trường thông tin: Họ tên, SĐT, Ngày sinh, Lý do khám. Nhấn **Tiếp tục**. | Hệ thống không cho chuyển bước, hiển thị thông báo lỗi màu đỏ ngay dưới từng trường tương ứng: "Vui lòng nhập họ tên", "Vui lòng nhập số điện thoại", "Vui lòng nhập ngày sinh", "Vui lòng nhập lý do khám". | Như mong đợi (As Expected) |

---

### **Test Case 13: Nhập sai định dạng số điện thoại**
*   **Test Case ID:** TC_BOOK_013
*   **Test Case Description:** Số điện thoại phải tuân thủ định dạng chuẩn của Việt Nam (10 chữ số, bắt đầu bằng đầu số hợp lệ).

| S # | Test Data (Dữ liệu kiểm thử) |
|---|---|
| 1 | SĐT nhập sai: `098abc123` (chứa chữ), `0123456` (thiếu số), `1234567890` (sai đầu số) |

| Step # | Step Details (Các bước thực hiện) | Expected Results (Kết quả mong đợi) | Actual Results (Kết quả thực tế) |
|---|---|---|---|
| **1** | Nhập lần lượt các SĐT sai định dạng vào ô Số điện thoại và nhấn **Tiếp tục**. | Hệ thống chặn chuyển bước và báo lỗi: **"Số điện thoại không hợp lệ. Vui lòng nhập đúng 10 chữ số bắt đầu bằng 0."** | Như mong đợi (As Expected) |

---

### **Test Case 14: Nhập ngày sinh sai định dạng hoặc phi thực tế**
*   **Test Case ID:** TC_BOOK_014
*   **Test Case Description:** Ngày sinh phải đúng định dạng `dd/mm/yyyy` và không được nằm trong tương lai.

| S # | Test Data (Dữ liệu kiểm thử) |
|---|---|
| 1 | Ngày sinh sai: `31/02/1995` (ngày không tồn tại), `12/12/2030` (ngày tương lai), `abcd` (sai định dạng) |

| Step # | Step Details (Các bước thực hiện) | Expected Results (Kết quả mong đợi) | Actual Results (Kết quả thực tế) |
|---|---|---|---|
| **1** | Nhập lần lượt các ngày sinh sai định dạng và nhấn **Tiếp tục**. | Hệ thống báo lỗi: **"Ngày sinh không hợp lệ"** hoặc **"Ngày sinh không được lớn hơn ngày hiện tại"**. | Như mong đợi (As Expected) |

---

## PHẦN 6: LUỒNG ĐẶT LỊCH CỦA LỄ TÂN (RECEPTIONIST PORTAL - ĐẶT HỘ)

### **Test Case 15: Lễ tân đặt lịch hộ thành công cho bệnh nhân đã có hồ sơ trên hệ thống**
*   **Test Case ID:** TC_BOOK_015
*   **Test Case Description:** Lễ tân tìm kiếm thông tin, tự động điền hồ sơ và đặt lịch thành công tại quầy.

| S # | Prerequisites (Điều kiện tiên quyết) |
|---|---|
| 1 | Nhân viên Lễ tân đã đăng nhập vào Receptionist Portal (`/le-tan`) |
| 2 | Bệnh nhân `Nguyễn Văn C` đã có tài khoản/hồ sơ trên hệ thống |

| Step # | Step Details (Các bước thực hiện) | Expected Results (Kết quả mong đợi) | Actual Results (Kết quả thực tế) |
|---|---|---|---|
| **1** | Truy cập `/le-tan/dat-lich`, chọn chuyên khoa và bác sĩ/slot khám. | Chuyển sang Bước 3 (Thông tin bệnh nhân) thành công. | Như mong đợi (As Expected) |
| **2** | Nhập SĐT `0987654321` vào ô tìm kiếm bệnh nhân và nhấp Tìm kiếm. | Hệ thống trả về kết quả bệnh nhân `Nguyễn Văn C` và các thông tin liên quan. | Như mong đợi (As Expected) |
| **3** | Click chọn kết quả tìm thấy. | Toàn bộ form được điền tự động chính xác thông tin của Nguyễn Văn C. | Như mong đợi (As Expected) |
| **4** | Nhập Lý do khám, nhấn **Tiếp tục** sang Bước 4 (Xác nhận) và nhấn **"Tạo lịch hẹn"**. | Hệ thống tạo lịch thành công, chuyển sang Bước 5 (Success) hiển thị mã lịch hẹn với trạng thái **CONFIRMED**, có duy nhất nút "Tạo lịch hẹn mới". Lịch hẹn ghi nhận booking channel là `RECEPTION`. | Như mong đợi (As Expected) |

---

### **Test Case 16: Lễ tân đặt lịch khám cho bệnh nhân mới (Nhập thủ công)**
*   **Test Case ID:** TC_BOOK_016
*   **Test Case Description:** Lễ tân đặt lịch thành công cho khách hàng hoàn toàn mới chưa có thông tin trên hệ thống bằng cách nhập tay thủ công.

| Step # | Step Details (Các bước thực hiện) | Expected Results (Kết quả mong đợi) | Actual Results (Kết quả thực tế) |
|---|---|---|---|
| **1** | Tại Bước 3 (Thông tin bệnh nhân), nhập SĐT mới `0909090909` không tìm thấy kết quả. | Hệ thống hiển thị thông báo không tìm thấy kết quả và mở khóa form để nhập thủ công. | Như mong đợi (As Expected) |
| **2** | Lễ tân tự tay nhập đầy đủ: Họ tên, Giới tính, Ngày sinh, SĐT, Địa chỉ, Lý do khám và nhấn **Tiếp tục**. | Chuyển sang Bước 4 thành công hiển thị thông tin vừa nhập. | Như mong đợi (As Expected) |
| **3** | Nhấn **"Tạo lịch hẹn"**. | Đặt lịch thành công. Hệ thống đồng thời tạo mới hồ sơ bệnh nhân trên database với SĐT `0909090909`. | Như mong đợi (As Expected) |
