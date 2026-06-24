**CarePlus Clinic — Tài liệu hệ thống (v54)**  
   
 *Mô tả chi tiết luồng nghiệp vụ, dữ liệu và quy tắc hệ thống theo từng role.*  
   
  *  
 | Ngày cập nhật: 2026-06-14*  
   
 ![](data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAnEAAAACCAYAAAA3pIp+AAAABmJLR0QA/wD/AP+gvaeTAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAANUlEQVR4nO3OMQ2AABAAsSNBCzpfFxNCmJHAjAU2QtIq6DIzW7UHAMBfnGt1V8fHEQAA3rsexO0F3jmX9Q8AAAAASUVORK5CYII=)  
   
 **1. Tổng quan hệ thống**  
   
 CarePlus Clinic là ứng dụng đặt lịch khám trực tuyến cho phòng khám đa khoa. Hệ thống gồm **5 portal** phục vụ   **5 nhóm người dùng** khác nhau:  
   
 | | | |  
   
 |-|-|-|  
   
 | **Portal** |  **Đối tượng** |  **URL prefix** |  
   
 | Public Website | Khách vãng lai (Guest) | / |  
   
 | Patient Portal | Bệnh nhân | /benh-nhan |  
   
| Doctor Portal | Bác sĩ | /portal/bac-si |  
   
| Receptionist Portal | Lễ tân | /portal/le-tan |  
   
| Admin Portal | Quản trị viên | /portal/admin |  
   
    
   
 **Màu chủ đạo:** Cyan #49BCE2 — Vàng #FFC10E  
   
    
   
  **Font:** Roboto, Arial, sans-serif  
   
 ![](data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAnEAAAACCAYAAAA3pIp+AAAABmJLR0QA/wD/AP+gvaeTAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAANElEQVR4nO3OQQmAABRAsad4EFMY9fewnUms4E2ELcGWmTmrKwAA/uLeqrU6vp4AAPDa/gDzYgM3ZPdzEgAAAABJRU5ErkJggg==)  
   
 **2. Mô hình dữ liệu**  
   
 **2.1 Users**  
   
 User {  
   
    id            string    PK  
   
    name          string  
   
    email         string    unique  
   
    phone         string  
   
    role          enum      PATIENT | DOCTOR | RECEPTIONIST | ADMIN  
   
    status        enum      ACTIVE | LOCKED  
   
    noShowCount   number    default 0  
   
    emailVerified boolean  
   
    createdAt     datetime  
   
  }  
   
    
   
 **Quy tắc:**  
- noShowCount >= 3 → tài khoản bị khóa đặt lịch online  
- Chỉ Admin có thể reset noShowCount và mở khóa  
- Email không thể thay đổi sau khi đăng ký  
- Mật khẩu lưu dạng hash  
 ![](data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAnEAAAACCAYAAAA3pIp+AAAABmJLR0QA/wD/AP+gvaeTAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAANklEQVR4nO3OQQmAABRAsScYxpg/kCmMYQKvNrCCNxG2BFtmZquOAAD4i3Ot7mr/egIAwGvXA4D2Bc8ZGvQ1AAAAAElFTkSuQmCC)  
 **2.2 Doctors (hồ sơ bác sĩ)**  
   
 Doctor {  
   
    id              string    PK  
   
    userId          string    FK → User  
   
    title           string    (ThS.BS | TS.BS | BS.CKI | BS.CKII | GS.TS.BS,...)  
   
    name            string  
   
    specialtyId     string    FK → Specialty  
   
    specialtyName   string    (denormalized)  
   
    experience      number    (năm kinh nghiệm)  
   
    price           number    (giá khám tham khảo, VNĐ)  
   
    rating          float     (tính từ reviews)  
   
    reviewCount     number  
   
    avatar          string    (URL)  
   
    description     string  
   
    position        string    (chức vụ)  
   
    active          boolean  
   
  }  
   
    
 **Quy tắc:**  
- Giá khám chỉ mang tính tham khảo, không xử lý thanh toán online  
- Bệnh nhân thanh toán trực tiếp tại quầy  
- Rating được tính trung bình từ toàn bộ reviews hợp lệ  
- Chỉ Admin được chỉnh sửa giá khám  
 ![](data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAnEAAAACCAYAAAA3pIp+AAAABmJLR0QA/wD/AP+gvaeTAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAANElEQVR4nO3OQQmAABRAsaeIMTwZ9EcwpEGs4E2ELcGWmTmqKwAA/uLeqr06v54AAPDa+gAtiwNEKmy7/AAAAABJRU5ErkJggg==)  
 **2.3 Specialties (chuyên khoa)**  
   
 Specialty {  
   
    id          string    PK  
   
    name        string  
   
    slug        string    unique  
   
    description string  
   
    icon        string  
   
    doctorCount number    (denormalized)  
   
    active      boolean  
   
  }  
   
    
 ![](data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAnEAAAACCAYAAAA3pIp+AAAABmJLR0QA/wD/AP+gvaeTAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAANklEQVR4nO3OMQ2AABAAsSNBACvucMH6NpGACyywEZJWQZeZ2aszAAD+4l6rrTo+jgAA8N71AL/GBEhnueqbAAAAAElFTkSuQmCC)  
 **Ghi chú Admin Specialty hiện tại:**  
- Model Specialty vẫn có `slug` và `icon`.  
- Admin Specialty form chỉ nhập: Tên, Mô tả, Trạng thái active.  
- `slug` dùng cho URL/lookup/public detail và được backend tự sinh từ `name` nếu Admin không gửi.  
- `icon` là optional string, mặc định rỗng nếu không gửi; hiện chưa có UI icon picker/upload.  
- Frontend Admin Specialty không bắt Admin nhập `slug`/`icon` trong scope hiện tại. Nếu sau này cần icon thật, tạo task riêng cho icon picker/upload.  
   
 **2.4 Schedules & TimeSlots (lịch làm việc)**  
   
 Schedule {  
   
    id          string    PK  
   
    doctorId    string    FK → Doctor  
   
    workingDate date  
   
    status      enum      WORKING | APPROVED_OFF | PENDING | CANCELLED | REJECTED  
   
    createdAt   datetime  
   
  }  
   
    
   
  TimeSlot {  
   
    id            string    PK  
   
    scheduleId    string    FK → Schedule  
   
    startTime     time      (08:00, 08:30, ...)  
   
    endTime       time  
   
    status        enum      AVAILABLE | BOOKED | LOCKED | EXPIRED  
   
    appointmentId string?   FK → Appointment (nếu đã được đặt)  
   
  }  
   
    
 **Quy tắc:**  
- Ca sáng: 08:00 – 11:30  
- Ca chiều: 13:30 – 17:00  
- Mỗi slot kéo dài 30 phút  
- Slot bị LOCKED khi bác sĩ gửi yêu cầu nghỉ đang chờ duyệt  
- Slot EXPIRED tự động sau giờ khám  
 ![](data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAnEAAAACCAYAAAA3pIp+AAAABmJLR0QA/wD/AP+gvaeTAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAANElEQVR4nO3OQQmAABRAsad4FDMY9dewnkms4E2ELcGWmTmrKwAA/uLeqrU6vp4AAPDa/gDzVgM9ibrhygAAAABJRU5ErkJggg==)  
 **2.5 Appointments (lịch hẹn)**  
   
 Appointment {  
   
    id                string    PK  
   
    code              string    unique (CP + 10 digits)  
   
    patientId         string    FK → User (tài khoản bệnh nhân)  
   
    patientProfileId  string?   FK → PatientProfile (hồ sơ người được khám)  
   
    doctorId          string    FK → Doctor  
   
    specialtyId       string    FK → Specialty  
   
    scheduleId        string    FK → Schedule  
   
    timeSlotId        string    FK → TimeSlot  
   
    appointmentDate   date  
   
    startTime         time  
   
    endTime           time  
   
    status            enum      CONFIRMED | CHECKED_IN | COMPLETED | CANCELLED | NO_SHOW  
   
    bookingChannel    enum      ONLINE | RECEPTION  
   
    bookingSource     enum      PATIENT_WEB | RECEPTIONIST  
   
    createdBy         string    FK → User (ai tạo lịch)  
   
    forSelf           boolean  
   
    relativeName      string?  
   
    consultationFee   number    (snapshot giá tại thời điểm đặt)  
   
    patientEmail      string    (snapshot email)  
   
    reason            string?   (lý do khám)  
   
    note              string?  
   
    createdAt         datetime  
   
    updatedAt         datetime  
   
  }  
   
    
 **Trạng thái lịch hẹn:**  
   
    
   
  | Trạng thái | Mô tả |  
   
    
   
  |---|---|  
   
    
   
  | CONFIRMED | Đã xác nhận, chờ đến khám |  
   
    
   
  | CHECKED_IN | Bệnh nhân đã đến, lễ tân check-in |  
   
    
   
  | COMPLETED | Đã khám xong |  
   
    
   
  | CANCELLED | Đã hủy (bởi bệnh nhân hoặc bác sĩ/admin) |  
   
    
   
  | NO_SHOW | Không đến khám, không hủy trước |  
  
**Quy tắc giới hạn lịch hẹn active theo user:**  
- Mỗi user có số lịch hẹn active tối đa được cấu hình bởi `maxActiveAppointmentsPerUser`  
- Rule này dùng để chống spam đặt lịch thay cho rule giới hạn số hồ sơ người thân  
- Khi lịch hẹn hoàn thành hoặc bị hủy, số lượng lịch active đang chiếm sẽ được giải phóng  
- Active appointment status cần được appointment module xác nhận theo enum thực tế hiện tại  
 ![](data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAnEAAAACCAYAAAA3pIp+AAAABmJLR0QA/wD/AP+gvaeTAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAAM0lEQVR4nO3OMQ0AIAwAwdJgBKdVgjecsGCAiZDcTT9+q6oRETMAAPjF6ify6QYAADdyA9Y4AyrfLLISAAAAAElFTkSuQmCC)  
 **2.6 PatientProfiles (hồ sơ người được khám)**  
   
 PatientProfile {  
   
    id           string    PK  
   
    userId       string    FK → User  
   
    fullName     string  
   
    phone        string  
   
    email        string?  
   
   gender       enum      MALE | FEMALE | OTHER  
   
    dateOfBirth  date  
   
    address      string?  
   
    relationship enum      SELF | CHA | ME | CON | VO | CHONG | ANH | CHI | EM | ONG | BA | KHAC  
   
    isDefault    boolean  
   
    isActive     boolean  
   
    createdAt    datetime  
   
  }  
   
    
 **Quy tắc:**  
- Không giới hạn số hồ sơ người thân đang hoạt động  
- Xóa hồ sơ = soft delete (isActive = false), không phải hard delete  
- Không thể xóa hồ sơ đang có lịch khám chưa hoàn tất  
- Trong nghiệp vụ hiện tại, hệ thống không sử dụng hồ sơ mặc định trong UI/flow đặt lịch  
- Khi đặt lịch, user chọn trực tiếp hồ sơ người được khám từ danh sách hồ sơ active  
- Nếu field `isDefault` còn tồn tại trong database thì không expose trên UI hiện tại  
- API create/update patient-profile không nên nhận `isDefault` từ client  
- Route set default nếu còn tồn tại thì không được frontend sử dụng trong flow hiện tại  
 ![](data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAnEAAAACCAYAAAA3pIp+AAAABmJLR0QA/wD/AP+gvaeTAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAANklEQVR4nO3OQQmAABRAsScYxpg/kCmMYQKvNrCCNxG2BFtmZquOAAD4i3Ot7mr/egIAwGvXA4D2Bc8ZGvQ1AAAAAElFTkSuQmCC)  **2.7 Reviews (đánh giá bác sĩ)**

```ts
// Shared review data store (mock)
export interface Review {
  id: string;
  appointmentId: string;
  doctorId: string;
  patientId: string;
  patientName: string;
  rating: number;
  comment: string;
  createdAt: string;
}

// Global mutable store so reviews persist across components
let reviewStore: Review[] = [
  { id: 'rv1', appointmentId: 'a1', doctorId: 'd1', patientId: 'p1', patientName: 'Nguyễn Văn A', rating: 5, comment: 'Bác sĩ rất tận tâm, giải thích rõ ràng và chi tiết. Tôi rất hài lòng với buổi khám.', createdAt: '10/06/2026' },
  { id: 'rv2', appointmentId: 'a2', doctorId: 'd1', patientId: 'p2', patientName: 'Trần Thị B', rating: 4, comment: 'Khám nhanh, chuyên nghiệp. Bác sĩ có kinh nghiệm và thái độ tốt.', createdAt: '08/06/2026' },
  { id: 'rv3', appointmentId: 'a3', doctorId: 'd1', patientId: 'p3', patientName: 'Lê Văn C', rating: 5, comment: 'Bác sĩ giỏi, chẩn đoán chính xác và tư vấn rất cụ thể. Sẽ quay lại lần sau.', createdAt: '05/06/2026' },
  { id: 'rv4', appointmentId: 'a4', doctorId: 'd1', patientId: 'p4', patientName: 'Phạm Thị D', rating: 4, comment: 'Hài lòng với dịch vụ. Chờ đợi hơi lâu nhưng bác sĩ khám kỹ.', createdAt: '03/06/2026' },
  { id: 'rv5', appointmentId: 'a5', doctorId: 'd1', patientId: 'p5', patientName: 'Hoàng Văn E', rating: 5, comment: 'Xuất sắc! Bác sĩ rất kiên nhẫn lắng nghe và đưa ra phác đồ điều trị phù hợp.', createdAt: '01/06/2026' },
  { id: 'rv6', appointmentId: 'a6', doctorId: 'd1', patientId: 'p6', patientName: 'Vũ Thị F', rating: 4, comment: 'Tốt, sẽ giới thiệu cho bạn bè. Bác sĩ có chuyên môn cao.', createdAt: '28/05/2026' },
  { id: 'rv7', appointmentId: 'a7', doctorId: 'd1', patientId: 'p7', patientName: 'Đỗ Văn G', rating: 3, comment: 'Khám ổn, tuy nhiên cần thêm thời gian giải thích cho bệnh nhân.', createdAt: '25/05/2026' },
  { id: 'rv8', appointmentId: 'a8', doctorId: 'd2', patientId: 'p1', patientName: 'Nguyễn Văn A', rating: 5, comment: 'Bác sĩ rất giỏi, tư vấn chi tiết và nhiệt tình.', createdAt: '12/06/2026' },
];

export function getReviewsByDoctor(doctorId: string): Review[] {
  return reviewStore.filter(r => r.doctorId === doctorId);
}

export function getRatingSummary(doctorId: string): { average: number; count: number } {
  const reviews = getReviewsByDoctor(doctorId);
  if (reviews.length === 0) return { average: 0, count: 0 };
  const total = reviews.reduce((sum, r) => sum + r.rating, 0);
  return { average: Math.round((total / reviews.length) * 10) / 10, count: reviews.length };
}

export function hasReviewed(appointmentId: string): boolean {
  return reviewStore.some(r => r.appointmentId === appointmentId);
}

export function addReview(review: Omit<Review, 'id' | 'createdAt'>): Review {
  const newReview: Review = {
    ...review,
    id: `rv${Date.now()}`,
    createdAt: new Date().toLocaleDateString('vi-VN'),
  };
  reviewStore = [...reviewStore, newReview];
  return newReview;
}
```
  
   
 Review {  
   
    id            string    PK  
   
    appointmentId string    FK → Appointment  
   
    doctorId      string    FK → Doctor  
   
    patientId     string    FK → User  
   
    patientName   string    (denormalized)  
   
    rating        number    (1-5)  
   
    comment       string    (10-1000 ký tự)  
   
    createdAt     datetime  
   
  }  
   
    
 **Quy tắc:**  
- Chỉ đánh giá khi lịch hẹn có trạng thái COMPLETED  
- Mỗi lịch hẹn chỉ được đánh giá **1 lần**  
- Bắt buộc chọn sao (1-5) và nhập nội dung (≥10 ký tự)  
- Rating bác sĩ = trung bình cộng tất cả reviews  
 ![](data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAnEAAAACCAYAAAA3pIp+AAAABmJLR0QA/wD/AP+gvaeTAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAANElEQVR4nO3OQQmAABRAsad4EkMY9ecwnkms4E2ELcGWmTmrKwAA/uLeqrU6vp4AAPDa/gDzXAM6/j8dDQAAAABJRU5ErkJggg==)  
 **2.8 ApprovalRequests (yêu cầu duyệt)**  
   
 ApprovalRequest {  
   
    id              string    PK  
   
    type            enum      SCHEDULE_EXCEPTION | CANCELLATION  
   
    doctorId        string    FK → Doctor  
   
    doctorName      string    (denormalized)  
   
    date            date?  
   
    exceptionType   enum?     ALL_DAY | SHIFT | TIME_RANGE  
   
    shift           enum?     MORNING | AFTERNOON  
   
    startTime       time?  
   
    endTime         time?  
   
    reason          string  
   
    appointmentCode string?   (nếu là yêu cầu hủy lịch)  
   
    status          enum      PENDING | APPROVED | REJECTED  
   
    createdAt       datetime  
   
  }  
   
    
 ![](data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAnEAAAACCAYAAAA3pIp+AAAABmJLR0QA/wD/AP+gvaeTAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAANklEQVR4nO3OMQ2AABAAsSNBACvucMH6NpGACyywEZJWQZeZ2aszAAD+4l6rrTo+jgAA8N71AL/GBEhnueqbAAAAAElFTkSuQmCC)  
 **2.9 Conversations & Messages (chat)**  
   
 Conversation {  
   
    id            string    PK  
   
    type          enum      SUPPORT | DOCTOR_CONSULTATION  
   
    patientId     string    FK → User  
   
    doctorId      string?   FK → Doctor  
   
    receptionistId string?  FK → User  
   
    status        enum      ACTIVE | CLOSED  
   
    lastMessage   string  
   
    lastMessageAt datetime  
   
  }  
   
    
   
  Message {  
   
    id            string    PK  
   
    conversationId string   FK → Conversation  
   
    senderId      string    FK → User  
   
    senderRole    enum      PATIENT | DOCTOR | RECEPTIONIST  
   
    message       string  
   
    messageType   enum      TEXT | FILE  
   
    isRead        boolean  
   
    createdAt     datetime  
   
  }  
   
    
 ![](data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAnEAAAACCAYAAAA3pIp+AAAABmJLR0QA/wD/AP+gvaeTAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAALUlEQVR4nO3OQQ0AIAwEsAMnOJ0TtOFkGngRklZBR1WtJDsAAPzizNcDAADuNcK0AyWbyd+DAAAAAElFTkSuQmCC)  
 **3. Luồng nghiệp vụ theo Role**  
 ![](data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAnEAAAACCAYAAAA3pIp+AAAABmJLR0QA/wD/AP+gvaeTAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAANUlEQVR4nO3OYQ1AABSAwY9JIIGor4V+Ikiggn9mu0twy8wc1RkAAH9xbdVa7V9PAAB47X4A9CwEJcXSxLAAAAAASUVORK5CYII=)  
 **ROLE: GUEST (Khách vãng lai)**  
 **Trang công khai có thể truy cập**  
   
 | | |  
   
 |-|-|  
   
 | **Trang** |  **URL** |  
   
 | Trang chủ | / |  
   
 | Danh sách bác sĩ | /bac-si |  
   
 | Chi tiết bác sĩ | /bac-si/:id |  
   
 | Danh sách chuyên khoa | /chuyen-khoa |  
   
 | Chi tiết chuyên khoa | /chuyen-khoa/:slug |  
   
 | Cẩm nang sức khỏe | /cam-nang |  
   
 | Chi tiết bài viết | /cam-nang/:slug |  
   
 | Về chúng tôi | /ve-chung-toi |  
   
 | Liên hệ | /lien-he |  
   
 | FAQ | /faq |  
   
 | Đặt lịch (B1-B2) | /dat-lich |  
   
 | Đăng nhập | /dang-nhap |  
   
 | Đăng ký | /dang-ky |  
   
 | Quên mật khẩu | /quen-mat-khau |  
   
    
 **Trang chủ — Sections**  
1. **Hero banner** — search chuyên khoa, slogan, CTA "Đặt lịch ngay"  
2. **Dịch vụ nhanh** — 4 service cards  
3. **Chuyên khoa** — grid 4 cột, tất cả chuyên khoa  
4. **Đội ngũ bác sĩ kinh nghiệm** — slider 4 cards, sort theo experience giảm dần  
5. **Bác sĩ được yêu thích** — slider 4 cards, sort theo rating giảm dần  
6. **Quy trình đặt lịch** — 3 bước minh họa  
7. **Lợi ích đặt lịch trước** — 4 lợi ích + hình minh họa  
8. **Cẩm nang sức khỏe** — 4 bài viết mới nhất  
- Không còn section "Sẵn sàng đặt lịch?"  
 **Trang danh sách bác sĩ (**/bac-si  **)**  
 **Layout:** Danh sách dọc, mỗi card 50/50 (trái: thông tin, phải: lịch khám)  
 **Filter bar:**  
- Search (tên bác sĩ, chuyên khoa)  
- Chuyên khoa dropdown  
- Date picker dropdown (Hôm nay, Ngày mai, các ngày trong tuần)  
 **Card bác sĩ:**  
- Avatar, tên, chuyên khoa, rating, kinh nghiệm  
- Slot sáng (4 cột) + slot chiều (4 cột)  
- Slot available: viền cyan, hover highlight  
- Slot booked: xám, disabled  
- "Tư vấn chuyên sâu" → mở chat với bác sĩ (yêu cầu đăng nhập)  
- "Xem chi tiết" → /bac-si/:mockId  
 **Quy tắc slot hiển thị:**  
- Chỉ hiển thị slot trong ngày được chọn  
- Slot AVAILABLE mới cho phép click  
- Slot BOOKED/LOCKED/EXPIRED hiển thị nhưng disabled  
 **Trang chi tiết bác sĩ (**/bac-si/:id  **)**  
 **Tabs:**  
1. **Giới thiệu** — mô tả, chứng chỉ, kinh nghiệm  
2. **Lịch khám** — date bar 7 ngày + slot grid sáng/chiều  
3. **Phòng khám** — địa chỉ, giờ làm việc  
4. **Hướng dẫn** — quy trình khám  
5. **Đánh giá** — rating summary + danh sách reviews (lazy load 5/lần)  
 **Sidebar:**  
- Giá khám tham khảo  
- "Chọn ngày khám" button → chuyển sang tab Lịch khám  
- "Nhắn tin với bác sĩ" → mở chat widget  
 **Điều hướng slot:**  
- Guest click slot → redirect /dang-nhap?redirect=/dat-lich?doctorId=...&date=...&slot=...  
- Sau login → quay lại đúng vị trí, slot được pre-select  
 **Trang chuyên khoa (**/chuyen-khoa/:slug  **)**  
 **Filter bar:**  
- Dropdown "Ngày khám" (Hôm nay / Ngày mai / Thứ X - dd/mm)  
- Chọn ngày → reload danh sách slot (không reload page)  
 **Mỗi card bác sĩ:**  
- Trái (50%): avatar, tên, rating, kinh nghiệm, mô tả đầy đủ, "Tư vấn sâu"  
- Phải (50%): slot theo ngày đã chọn (4 cột), giá khám, "Xem chi tiết"  
 ![](data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAnEAAAACCAYAAAA3pIp+AAAABmJLR0QA/wD/AP+gvaeTAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAANElEQVR4nO3OQQmAABRAsad4EkMY9ecwnkms4E2ELcGWmTmrKwAA/uLeqrU6vp4AAPDa/gDzXAM6/j8dDQAAAABJRU5ErkJggg==)  
 **ROLE: PATIENT (Bệnh nhân)**  
 **Xác thực**  
   
 | | |  
   
 |-|-|  
   
 | **Hành động** |  **Quy tắc** |  
   
 | Đăng ký | Email + mật khẩu |  
   
 | Xác minh email | Bắt buộc trước khi đặt lịch |  
   
 | Đăng nhập | Email + mật khẩu |  
   
 | Quên mật khẩu | Gửi link reset qua email |  
   
 | Sau login | Redirect về trang trước hoặc Home |  
   
    
 **Patient Portal (**/benh-nhan  **)**  
 ***3.1 Tổng quan (*** */benh-nhan* ***)***  
 **KPI cards (3 thẻ):**  
- Lịch hẹn sắp tới (status=CONFIRMED)  
- Đã hoàn thành (status=COMPLETED)  
- Hồ sơ người thân (count active)  
 **Section "Lịch hẹn sắp tới":**  
- Chỉ hiển thị status = CONFIRMED  
- Tối đa 5 lịch  
- Mỗi row clickable → xem chi tiết  
- Bên phải: tên người khám + quan hệ  
- Không hiển thị status badge  
- Empty state: "Chưa có lịch hẹn sắp tới"  
 **Section "Tần suất khám":**  
- Bar chart (số lượt khám theo tháng)  
- Horizontal bar breakdown (lịch theo chuyên khoa)  
 ***3.2 Lịch hẹn (*** */benh-nhan/lich-hen* ***)***  
 **Filter bar (1 hàng):**  
- Search: mã lịch, tên bác sĩ, chuyên khoa, người khám  
- Quick date: Hôm nay | Ngày mai | Tuần này | Tháng này | Tùy chọn  
- (Tùy chọn: from date + to date)  
- Shift: Tất cả ca | Ca sáng | Ca chiều  
- Sort: Giờ tăng/giảm dần | Mới/Cũ nhất  
- "Áp dụng" / "Xóa lọc"  
 **Status tabs:** Tất cả | Đã xác nhận | Check-in | Hoàn thành | Đã hủy | No-show  
 **Desktop:** Table với cột: Mã lịch, Ngày giờ, Bác sĩ, Chuyên khoa, Người khám, Giá tham khảo, Trạng thái, Thao tác  
 **Mobile:** Card list  
 **Actions per status:**  
   
    
   
  | Status | Thao tác |  
   
    
   
  |---|---|  
   
    
   
  | CONFIRMED | Chi tiết + Hủy lịch |  
   
    
   
  | COMPLETED | Chi tiết + **Đánh giá** (nếu chưa đánh giá) |  
   
    
   
  | Khác | Chi tiết |  
 **Luồng hủy lịch:**  
- Hủy trực tiếp: còn ≥1 ngày trước giờ khám → modal xác nhận + lý do tùy chọn  
- Gửi yêu cầu: đã qua hạn → modal nhập lý do bắt buộc → gửi cho bác sĩ xem xét  
 ***3.3 Thông tin cá nhân (*** */benh-nhan/thong-tin-ca-nhan* ***)***  
 **Fields:**  
- Họ và tên *, Email * (disabled), SĐT *, Giới tính *, Ngày sinh *, Địa chỉ  
- Avatar: hiển thị initials (không upload)  
- Email không thể chỉnh sửa, có lock icon + helper text  
 ***3.4 Hồ sơ người thân (*** */benh-nhan/nguoi-than* ***)***  
 **Giới hạn:** Không giới hạn số hồ sơ active  
   
    
   
  **Hiển thị counter:** "Đang hoạt động: X hồ sơ"  
 **Mỗi card:**  
- Tên, quan hệ, giới tính, ngày sinh, SĐT  
- Nút "Xem chi tiết" → modal view/edit  
- Nút "Xóa" → soft delete, yêu cầu xác nhận  
 **Quy tắc xóa:**  
- Không xóa được nếu đang có lịch khám chưa hoàn tất  
- Xóa = isActive = false (soft delete)  
 **Modal chi tiết:**  
- View mode → Edit mode khi nhấn "Chỉnh sửa"  
- Fields: Họ tên *, Quan hệ *, Giới tính *, Ngày sinh *, SĐT  
   
 **Luồng Đặt lịch (Patient) **/dat-lich  
 **5 bước:**  
 ***Bước 1: Chọn chuyên khoa***  
- Grid cards: emoji + tên chuyên khoa + số bác sĩ  
- Có search filter  
 ***Bước 2: Bác sĩ & Lịch***  
- Date bar 7 ngày (mặc định hôm nay)  
- Thay đổi ngày → reset slot + doctor  
- Doctor search  
- Per-doctor: avatar, tên, rating, KN, giá + slot grid (Ca sáng / Ca chiều, 4 cột)  
- Click slot → chọn bác sĩ + slot  
- Slot selected: nền cyan  
 ***Bước 3: Thông tin người được khám***  
- Mặc định: auto-fill thông tin tài khoản đang đăng nhập (Bản thân)  
- Nút "Đổi người khám" (top-right) → popup picker  
- **Popup picker:** Bản thân + danh sách hồ sơ người thân + "Thêm người thân" inline  
- Chọn → auto-fill toàn bộ form  
- Form: Họ tên *, SĐT *, Email *, Giới tính *, Ngày sinh * 📅, Địa chỉ  
- Ngày sinh: text input dd/mm/yyyy + date picker icon (📅)  
- Lý do khám *  
 ***Bước 4: Xác nhận***  
- Thông tin bác sĩ, lịch khám, bệnh nhân hiển thị đầy đủ  
- Note giá tham khảo + thanh toán tại quầy  
 ***Bước 5: Hoàn tất***  
- Mã lịch, trạng thái CONFIRMED, người khám (tên + quan hệ)  
- Thông tin đầy đủ bao gồm ngày sinh, giới tính, SĐT  
- "Email xác nhận đã gửi"  
- Buttons: Xem lịch hẹn | Đặt lịch mới | Về quản lý lịch hẹn  
 **Ràng buộc đặt lịch:**  
- Phải đăng nhập trước bước 3 (tự động redirect)  
- Email phải được xác minh  
- Tài khoản không bị khóa  
- Mỗi người khám chỉ 1 lịch active/ngày  
- Mỗi người khám chỉ 1 lịch active với cùng bác sĩ  
- Slot không bị đặt bởi người khác trong lúc thao tác  
 **Error states:**  
- same_day: người đi khám đã có lịch trong ngày  
- same_doctor: đã có lịch active với bác sĩ này  
- slot_taken: khung giờ vừa được đặt  
- email_unverified: cần xác minh email  
- account_locked: tài khoản bị khóa do no-show  
 **Đánh giá bác sĩ**  
- Chỉ sau khi lịch = COMPLETED  
- Mỗi lịch đánh giá **1 lần**  
- Validation: sao bắt buộc (1-5), comment bắt buộc (10-1000 ký tự)  
- Hiển thị trên tab "Đánh giá" trang chi tiết bác sĩ  
 ![](data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAnEAAAACCAYAAAA3pIp+AAAABmJLR0QA/wD/AP+gvaeTAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAANklEQVR4nO3OQQmAABRAsScYxpg/khHMYQKvNrCCNxG2BFtmZquOAAD4i3Ot7mr/egIAwGvXA4DmBdF2VlroAAAAAElFTkSuQmCC)  
 **ROLE: DOCTOR (Bác sĩ)**  
**Doctor Portal (**/portal/bac-si  **)**  
 ***4.1 Tổng quan***  
 **KPI cards (4 thẻ):**  
- Lịch hẹn hôm nay  
- Lịch hẹn sắp tới (CONFIRMED)  
- Lịch hẹn đã hoàn thành  
- Lịch hẹn vắng mặt (NO_SHOW)  
 **Timeline lịch hẹn hôm nay:**  
- Danh sách lịch hẹn trong ngày  
- "Xem tất cả" → /portal/bac-si/lich-hen  
***4.2 Lịch hẹn (*** */portal/bac-si/lich-hen* ***)***  
 **Default state:** Hôm nay + tab "Đã check-in"  
 **Filters:**  
- Quick date: Hôm nay | Ngày mai | Tuần này | Tuần sau | Tháng này | Tùy chọn  
- Status tabs: Tất cả | Đã xác nhận | Đã check-in | Đã hoàn thành | Vắng mặt | Đã hủy  
- Shift: Tất cả ca | Ca sáng | Ca chiều  
- Sort: Giờ tăng/giảm | Mới/Cũ nhất  
- Search: mã lịch, tên bệnh nhân, SĐT  
 **Table columns:** Mã lịch, Ngày, Giờ, Người khám, Năm sinh, Giới tính, Trạng thái, Thao tác  
 **Actions per status:**  
   
    
   
  | Status | Thao tác bác sĩ |  
   
    
   
  |---|---|  
   
    
   
  | CHECKED_IN | Chi tiết + **Hoàn thành** |  
   
    
   
  | Các status khác | Chi tiết |  
 ***Bác sĩ KHÔNG có nút "Vắng mặt"*** * — việc đánh dấu NO_SHOW do Lễ tân xử lý*  
 **Detail drawer:**  
- Thông tin bệnh nhân: tên, năm sinh, giới tính, SĐT, email, lý do khám  
- Thông tin lịch: ngày giờ, ca, giá tham khảo  
***4.3 Lịch làm việc (*** */portal/bac-si/lich-lam-viec* ***)***  
 **Toolbar (không có nút "Hôm nay"):**  
- Week navigation (prev/next)  
- Toggle Tuần / Tháng  
- Status filter: Tất cả | Làm việc | Nghỉ đã duyệt | Chờ duyệt | Đã hủy | Bị từ chối  
- Shift filter: Tất cả ca | Ca sáng | Ca chiều  
- "+ Yêu cầu nghỉ" button  
 **Weekly view:**  
- Header highlight hôm nay (background cyan nhạt + badge "Hôm nay")  
- Ca đang diễn ra: badge "Đang diễn ra"  
- Left column: "☀️ Sáng" / "🌤️ Chiều" (không có thời gian, không xoay dọc)  
- Cells: không hiển thị text trạng thái (đã có màu sắc), chỉ hiển thị: thời gian + subtext  
 **Card colors:**  
   
    
   
  | Status | Màu nền | Subtext |  
   
    
   
  |---|---|---|  
   
    
   
  | Làm việc | Cyan nhạt #EBF7FD | "Có N lịch khám" / "Chưa có lịch khám" |  
   
    
   
  | Nghỉ đã duyệt | Đỏ nhạt #FEF2F2 | "Đã được phê duyệt" |  
   
    
   
  | Chờ duyệt | Vàng nhạt #FFFBEB | "Đang chờ phê duyệt" |  
   
    
   
  | Đã hủy | Xám #F5F5F5 | "Ca làm việc đã bị hủy" |  
   
    
   
  | Bị từ chối | Cam nhạt #FFF3CD | "Tiếp tục làm việc theo lịch" |  
 **Month view:** Calendar grid, mỗi ngày hiển thị summary chips  
 **Week summary:** "Tuần này: X ca làm việc · Y ca nghỉ đã duyệt · Z yêu cầu chờ duyệt"  
 **Modal "Yêu cầu nghỉ":**  
- Ngày nghỉ *, Loại nghỉ * (Cả ngày / Theo ca / Theo khoảng giờ)  
- Ca làm việc (khi chọn Theo ca)  
- Giờ bắt đầu + kết thúc (khi chọn Theo khoảng giờ)  
- Lý do *  
- Validation: giờ bắt đầu < giờ kết thúc  
- Success: toast + block "Chờ duyệt" trên calendar  
***4.4 Tin nhắn (*** */portal/bac-si/tin-nhan* ***)***  
- Danh sách cuộc trò chuyện (trái) + active chat (phải)  
- Chỉ xem conversations liên quan đến bác sĩ  
- Real-time (mock): gửi/nhận text, trạng thái "Đã xem"/"Đã gửi"  
***4.5 Thông tin cá nhân (*** */portal/bac-si/thong-tin-ca-nhan* ***)***  
 **Fields có thể chỉnh:**  
- Họ tên *, SĐT *, Giới tính, Ngày sinh, Học hàm/học vị, Số năm kinh nghiệm, Giới thiệu bản thân  
 **Fields readonly:**  
- Email (có lock icon + helper), Chuyên khoa  
 ![](data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAnEAAAACCAYAAAA3pIp+AAAABmJLR0QA/wD/AP+gvaeTAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAANElEQVR4nO3OQQmAABRAsad4EFMY9fewnUms4E2ELcGWmTmrKwAA/uLeqrU6vp4AAPDa/gDzYgM3ZPdzEgAAAABJRU5ErkJggg==)  
 **ROLE: RECEPTIONIST (Lễ tân)**  
**Receptionist Portal (**/portal/le-tan  **)**  
 ***5.1 Tổng quan***  
 **KPI cards (5 thẻ):** Lịch hẹn hôm nay | Đã check-in | Chờ khám | Đã hoàn thành | Vắng mặt  
 **Section "Lịch hẹn hôm nay":** Table tóm tắt + "Xem tất cả"  
 **Thao tác nhanh:**  
- Đặt lịch khám → /portal/le-tan/dat-lich  
- Tra cứu lịch hẹn → /portal/le-tan/lich-hen  
- Xem lịch làm việc bác sĩ → /portal/le-tan/lich-bac-si  
***5.2 Quản lý lịch hẹn (*** */portal/le-tan/lich-hen* ***)***  
 **Filter bar (1 hàng):** Chuyên khoa → Bác sĩ (phụ thuộc chuyên khoa) → Trạng thái → Hôm nay | Ngày mai | Tuần này | Tùy chọn  
 **Table columns:** Mã lịch, Ngày, Giờ, Bệnh nhân, Ngày sinh, Bác sĩ, Chuyên khoa, Trạng thái, Thao tác  
 *Không có cột SĐT trong danh sách (chỉ xem trong chi tiết)*  
 **Actions:**  
   
    
   
  | Status | Thao tác |  
   
    
   
  |---|---|  
   
    
   
  | CONFIRMED | Chi tiết + **Check-in** (cũng có trong table row) |  
   
    
   
  | CHECKED_IN | Chi tiết + (hành động trong detail drawer) |  
   
    
   
  | Khác | Chi tiết |  
 **Detail drawer (bên phải, kéo ra):**  
- Thông tin bệnh nhân đầy đủ: tên, ngày sinh, giới tính, SĐT, email, địa chỉ, lý do  
- Thông tin bác sĩ: tên, chuyên khoa, giá  
- Lịch sử trạng thái (timeline)  
- Actions theo status:  
  - CONFIRMED → Check-in + Vắng mặt + Hủy lịch  
  - CHECKED_IN → Hoàn thành + Hủy lịch  
 **Modal Check-in:** Xác nhận bệnh nhân đã đến  
   
    
   
  **Modal Hủy lịch:** Lý do hủy *  
   
    
   
  **Modal Vắng mặt:** Ghi chú (optional)  
   
    
   
  **Modal Hoàn thành:** Ghi chú sau khám (optional)  
 ***5.3 Đặt lịch khám (*** */le-tan/dat-lich* ***)***  
 **Stepper:** Chuyên khoa → Bác sĩ & Lịch → Bệnh nhân → Xác nhận → Hoàn tất  
 **Bước 1: Chọn chuyên khoa**  
- Grid cards (giống Patient flow)  
 **Bước 2: Bác sĩ & Lịch**  
- Date bar 7 ngày (mặc định hôm nay)  
- Doctor search  
- Per-doctor cards: tên, chuyên khoa, giá, slot sáng/chiều (4 cột)  
- Slot selected: nền cyan  
 **Bước 3: Thông tin bệnh nhân**  
- **Search:** "Tìm theo SĐT, email hoặc họ tên" → tìm bệnh nhân + người thân của bệnh nhân đó  
- Khi tìm thấy: danh sách kết quả có label (Bệnh nhân chính / Mẹ / Cha / Con...)  
- Click chọn → auto-fill toàn bộ form; nút X để bỏ chọn → clear form  
- Không tìm thấy: nhập thủ công → tạo bệnh nhân mới lúc đặt lịch  
- **Form:** Họ tên *, SĐT *, Email (không bắt buộc), Giới tính *, Ngày sinh * 📅, Địa chỉ  
- Lý do khám *  
- Không có trường "Người được khám"  
 **Bước 4: Xác nhận**  
- 3 sections: Thông tin bác sĩ | Thông tin lịch khám | Thông tin bệnh nhân  
- Note giá tham khảo  
 **Bước 5: Hoàn tất (Success)**  
- Mã lịch, thông tin đầy đủ bệnh nhân + bác sĩ + ngày giờ + CONFIRMED badge  
- **Chỉ 1 button:** "Tạo lịch hẹn mới"  
- Không có "Xem chi tiết" hay "Quay về Quản lý"  
***5.4 Lịch làm việc bác sĩ (*** */portal/le-tan/lich-bac-si* ***)***  
 **Read-only** — Lễ tân chỉ xem, không chỉnh sửa  
 **Toolbar:**  
- Chuyên khoa filter → Bác sĩ filter (phụ thuộc chuyên khoa đã chọn)  
- Week navigation  
- Toggle Tuần / Ngày  
- Shift filter, Status filter  
 **Week view:** Timetable 7 cột, cells hiển thị tên bác sĩ, chuyên khoa, thời gian, số lịch hẹn  
 **Day view:** Danh sách bác sĩ với status từng ca  
***5.5 Tin nhắn (*** */portal/le-tan/tin-nhan* ***)***  
- Conversation list + active chat  
- Tìm kiếm theo tên, SĐT, email  
- Gửi/nhận real-time (mock)  
***5.6 Thông tin cá nhân (*** */portal/le-tan/thong-tin-ca-nhan* ***)***  
- Họ tên *, SĐT *, Giới tính, Ngày sinh, Địa chỉ  
- Email readonly  
 ![](data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAnEAAAACCAYAAAA3pIp+AAAABmJLR0QA/wD/AP+gvaeTAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAANklEQVR4nO3OQQmAABRAsScYxpg/khHMYQKvNrCCNxG2BFtmZquOAAD4i3Ot7mr/egIAwGvXA4DmBdF2VlroAAAAAElFTkSuQmCC)  
 **ROLE: ADMIN (Quản trị viên)**  
**Admin Portal (**/portal/admin  **)**  
- Route tương thích ngược: `/admin/*` hiện redirect sang `/portal/admin/*`; tài liệu này dùng `/portal/admin/*` làm URL chuẩn.  
 ***6.1 Tổng quan***  
 **KPI 6 thẻ:** Lịch hôm nay, Chờ duyệt, Hoàn thành, No-show, Số bác sĩ, Chuyên khoa  
 **Chart:** AreaChart lịch hẹn theo ngày (7 ngày gần nhất)  
 **Panel "Chờ duyệt":** Danh sách yêu cầu PENDING + nút Duyệt/Từ chối  
 ***6.2 Quản lý chuyên khoa***  
   
 CRUD: Tên, Mô tả, Trạng thái active  
- Form Admin không có field bắt buộc cho `slug`/`icon`. Backend tự sinh `slug` từ tên chuyên khoa; `icon` optional và đang để chuỗi rỗng nếu chưa có dữ liệu.  
- Bảng Admin có thể hiển thị slug đã sinh để đối chiếu URL/public detail; không yêu cầu Admin nhập slug thủ công.  
 ***6.3 Quản lý bác sĩ***  
- Bảng list bác sĩ  
- **Cột "Giá khám tham khảo"** (không phải "Giá khám")  
- Helper text: "Giá này chỉ dùng để hiển thị tham khảo. Không xử lý thanh toán online."  
- Edit modal cho phép cập nhật giá  
***6.4 Lịch làm việc (*** */portal/admin/lich-lam-viec* ***)***  
- Quy tắc lịch làm việc theo bác sĩ  
- Thêm quy tắc: từ ngày - đến ngày, ngày trong tuần, ca sáng/chiều/cả hai  
 ***6.5 Quản lý lịch hẹn***  
 **Filters:** Status, Booking channel (ONLINE/RECEPTION), Booking for (SELF/RELATIVE)  
 **Detail modal:**  
- patient_user_id, created_by (lễ tân nếu có), booking_channel, booking_for  
- relative info, patient_email, consultation_fee_snapshot  
- Note "Thanh toán tại quầy"  
- Status timeline  
 ***6.6 Duyệt yêu cầu***  
 **Tabs:**  
- Yêu cầu nghỉ/chặn lịch (SCHEDULE_EXCEPTION)  
- Yêu cầu hủy lịch (CANCELLATION)  
   
 Actions: Duyệt / Từ chối  
 ***6.7 Quản lý người dùng***  
 **Filter:** Vai trò, Trạng thái  
 **Actions per user:**  
- Khóa tài khoản / Mở khóa tài khoản  
- Reset no-show  
- Mở khóa đặt lịch online  
  
**Admin User APIs hiện tại (mount dưới `/api/v1/users`):**  
- `GET /api/v1/users`: Admin xem danh sách user, search/filter role/status, pagination  
- `GET /api/v1/users/:id`: Admin xem chi tiết user  
- `PATCH /api/v1/users/:id`: Admin cập nhật thông tin cơ bản của user  
- `PATCH /api/v1/users/:id/status`: Admin khóa/mở khóa tài khoản  
- `PATCH /api/v1/users/:id/reset-no-show`: Admin reset số lần vắng mặt  
- `POST /api/v1/users/staff`: Admin tạo tài khoản nhân sự  
  
**Giới hạn scope hiện tại:**  
- Admin update user không dùng để sửa `passwordHash`  
- Admin update user không dùng để reset password  
- Admin update user không dùng để sửa `noShowCount` trực tiếp  
- Admin reset noShowCount có endpoint riêng  
- Admin khóa/mở khóa có endpoint riêng  
- Admin reset password chưa thuộc scope hiện tại  
  **Tạo tài khoản nhân sự:**  
- Role: Doctor | Receptionist | Admin  
- Email, SĐT, Mật khẩu tạm, Trạng thái  
- Nếu role = Doctor → thêm Doctor profile (tên, chuyên khoa, học vị, kinh nghiệm, giá, avatar)  
 ***6.8 Quản lý bài viết***  
   
 CRUD blog posts, filter theo status (PUBLISHED/DRAFT/ARCHIVED)  
***6.9 Email Preview (*** */portal/admin/email-preview* ***)***  
   
 Preview 4 loại email:  
- Xác minh tài khoản  
- Xác nhận đặt lịch  
- Hủy lịch  
- Khóa đặt lịch do no-show  
 ***6.10 Thông tin phòng khám***  
   
 CRUD: Tên phòng khám, địa chỉ, hotline, email, giờ làm việc, mô tả  
  
**Clinic Settings APIs hiện tại:**  
- `GET /api/v1/clinic-settings/clinic-info`: Public lấy thông tin phòng khám  
- `PATCH /api/v1/clinic-settings/clinic-info`: Admin cập nhật thông tin phòng khám  
  
**Field thông tin phòng khám:**  
- `name`  
- `address`  
- `hotline`  
- `email`  
- `workingHours`  
- `description`  
 ***6.11 Cài đặt hệ thống***  
- max_booking_days_ahead (mặc định 7 ngày)  
- slot_duration_minutes (30 phút)  
- cancel_before_hours (2 giờ → yêu cầu hủy qua bác sĩ)  
- max_no_show_before_lock (3 lần)  
- max_active_appointments_per_user (giới hạn số lịch hẹn active tối đa mỗi user)  
- Giờ ca sáng/chiều  
  
**System Settings APIs hiện tại:**  
- `GET /api/v1/clinic-settings/system`: Admin xem cấu hình hệ thống  
- `PATCH /api/v1/clinic-settings/system`: Admin cập nhật cấu hình hệ thống  
- `GET /api/v1/clinic-settings/booking-rules`: Public DTO gọn cho UI đặt lịch, chỉ trả rule hiển thị lịch/giờ làm việc  
- `GET /api/v1/clinic-settings/system/public`: Deprecated/alias sang booking-rules DTO, không trả full system settings  
  
**Ý nghĩa field:**  
- `maxBookingDaysAhead`: số ngày tối đa user được đặt lịch trước  
- `slotDurationMinutes`: thời lượng mỗi khung giờ khám  
- `cancelBeforeHours`: số giờ tối thiểu trước giờ khám để được hủy trực tiếp  
- `maxNoShowBeforeLock`: số lần vắng mặt tối đa trước khi user bị hạn chế/khóa đặt lịch  
- `maxActiveAppointmentsPerUser`: số lịch hẹn active tối đa mỗi user được có cùng lúc  
- `morningShiftStart` / `morningShiftEnd`: giờ ca sáng  
- `afternoonShiftStart` / `afternoonShiftEnd`: giờ ca chiều  
  
**Ngoài scope UI cài đặt hệ thống:**  
- Token TTL / access token TTL / refresh token TTL không thuộc màn Admin System Settings  
- Các cấu hình bảo mật/auth TTL nên nằm ở env/config backend, không cho Admin chỉnh trên UI  
 ![](data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAnEAAAACCAYAAAA3pIp+AAAABmJLR0QA/wD/AP+gvaeTAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAANklEQVR4nO3OQQmAABRAsScYxpg/khHMYQKvNrCCNxG2BFtmZquOAAD4i3Ot7mr/egIAwGvXA4DmBdF2VlroAAAAAElFTkSuQmCC)  
 **4. Quy tắc nghiệp vụ tổng hợp**  
 **4.1 Anti-spam booking**  
   
 | | |  
   
 |-|-|  
   
 | **Rule** |  **Mô tả** |  
   
 | 1 lịch/ngày/người khám | Mỗi người khám chỉ có 1 lịch active trong cùng ngày |  
   
 | 1 lịch/bác sĩ/người khám | Mỗi người khám chỉ có 1 lịch active với cùng bác sĩ |  
   
 | Rule áp dụng cho | Cả bệnh nhân tự đặt và lễ tân đặt hộ |  
   
 | Xác định người khám | forSelf=true → patientId, forSelf=false → patientProfileId |  
  
 | Giới hạn theo user | Mỗi user có số lịch hẹn active tối đa theo `maxActiveAppointmentsPerUser` |  
   
    
 **4.2 Quy tắc hủy lịch (Patient)**  
   
 | | |  
   
 |-|-|  
   
 | **Điều kiện** |  **Luồng** |  
   
 | Còn ≥1 ngày trước ngày khám | Hủy trực tiếp (optional reason) |  
   
 | Đã qua hạn | Gửi yêu cầu hủy → bác sĩ xem xét → Admin duyệt |  
   
    
 **4.3 Thanh toán**  
- **Không có thanh toán online**  
- Giá khám hiển thị là **giá tham khảo**  
- Giá được snapshot vào lịch hẹn tại thời điểm đặt (consultationFee)  
- Bệnh nhân thanh toán **trực tiếp tại quầy**  
 **4.4 No-show & Khóa tài khoản**  
- Mỗi lần bệnh nhân không đến và không hủy → tăng noShowCount  
- noShowCount >= 3 → khóa tính năng đặt lịch online  
- Vẫn có thể đặt lịch tại quầy (receptionist đặt hộ)  
- Admin có thể reset và mở khóa  
- Bệnh nhân nhận email thông báo khóa  
 **4.5 Người thân (Relatives)**  
- Không giới hạn số hồ sơ người thân active mỗi tài khoản  
- Xóa = soft delete (isActive = false)  
- Không thể xóa nếu có lịch CONFIRMED hoặc CHECKED_IN  
- Không dùng hồ sơ mặc định trong nghiệp vụ hiện tại  
- Không hiển thị UI đặt mặc định  
- Khi đặt lịch qua Patient Portal: user chọn trực tiếp hồ sơ active cần khám từ danh sách  
- Khi đặt qua Receptionist: search → trả về bệnh nhân + người thân của bệnh nhân đó  
 **4.6 Email notifications**  
   
 | | |  
   
 |-|-|  
   
 | **Sự kiện** |  **Email gửi** |  
   
 | Đăng ký | Xác minh email |  
   
 | Đặt lịch thành công | Xác nhận lịch hẹn (mã lịch, bác sĩ, ngày giờ, giá tham khảo, ghi chú thanh toán) |  
   
 | Hủy lịch | Thông báo hủy |  
   
 | Tài khoản bị khóa | Thông báo no-show |  
   
    
 ![](data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAnEAAAACCAYAAAA3pIp+AAAABmJLR0QA/wD/AP+gvaeTAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAANUlEQVR4nO3OMQ2AABAAsSPBCj7fEl5YGfHAiAU2QtIq6DIzW7UHAMBfnGt1V8fXEwAAXrse4eAF6m0KxEoAAAAASUVORK5CYII=)  
 **5. Tính năng Chat**  
 **Widget Chat (Public & Patient Portal)**  
 **2 loại hội thoại:**  
1. **SUPPORT** — Chat với lễ tân/CSKH  
2. **DOCTOR_CONSULTATION** — Chat với bác sĩ cụ thể  
 **Mở chat với bác sĩ:**  
- Trang /bac-si → nút "Tư vấn chuyên sâu" → mở chat với đúng bác sĩ đó  
- Trang /bac-si/:id → nút "Nhắn tin với bác sĩ" → cùng hành vi  
- Yêu cầu đăng nhập  
- Dispatch CustomEvent('open-doctor-chat', {detail: {doctorId, doctorName}})  
 **Chat popup layout (Desktop):**  
- Trái: danh sách conversations (avatar, tên, role, online indicator, unread badge)  
- Phải: active chat (header + messages + input)  
 **Chat trang nội bộ (Doctor & Receptionist Portal)**  
 **URL:**  
- Bác sĩ: /portal/bac-si/tin-nhan  
- Lễ tân: /portal/le-tan/tin-nhan  
 **Features:**  
- Conversation list (trái): search, online status, unread badges  
- Active chat (phải): message history với timestamp, read receipts  
- Input: Enter gửi, Shift+Enter xuống dòng  
- Simulated reply sau 1.5 giây (mock)  
- Tin nhắn mình gửi: nền cyan, align right  
- Tin nhắn nhận: nền trắng, align left  
 ![](data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAnEAAAACCAYAAAA3pIp+AAAABmJLR0QA/wD/AP+gvaeTAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAANklEQVR4nO3OQQmAABRAsScYxpg/khHMYQKvNrCCNxG2BFtmZquOAAD4i3Ot7mr/egIAwGvXA4DmBdF2VlroAAAAAElFTkSuQmCC)  
 **6. Routing tổng quan**  
 **Public**  
   
 /                         → HomePage  
   
  /bac-si                   → DoctorListPage  
   
  /bac-si/:id               → DoctorDetailPage  
   
  /chuyen-khoa              → SpecialtyListPage  
   
  /chuyen-khoa/:slug        → SpecialtyDetailPage  
   
  /cam-nang                 → BlogListPage  
   
  /cam-nang/:slug           → BlogDetailPage  
   
  /ve-chung-toi             → AboutPage  
   
  /lien-he                  → ContactPage  
   
  /faq                      → FAQPage  
   
  /dat-lich                 → BookingWizard (Patient)  
   
  /dang-nhap                → LoginPage  
   
  /dang-ky                  → RegisterPage  
   
  /quen-mat-khau            → ForgotPasswordPage  
   
    
 **Patient Portal (**/benh-nhan  **)**  
   
 /benh-nhan                    → PatientDashboard  
   
  /benh-nhan/lich-hen           → PatientAppointments  
   
  /benh-nhan/thong-tin-ca-nhan  → PatientProfile  
   
  /benh-nhan/nguoi-than         → PatientRelatives  
  
**Frontend Patient screens hiện tại:**  
- `/benh-nhan/thong-tin-ca-nhan`: user xem/cập nhật thông tin cá nhân, email readonly, có card bảo mật tài khoản và đổi mật khẩu riêng, có upload avatar nếu code hiện tại bật  
- `/benh-nhan/nguoi-than`: user quản lý hồ sơ người thân, không giới hạn số hồ sơ, chỉ hiển thị tổng số hồ sơ active, không có UI đặt mặc định, thêm/sửa/xóa mềm hồ sơ theo rule backend  
   
    
**Doctor Portal (**/portal/bac-si  **)**  
   
/portal/bac-si                        → DoctorDashboard  
   
  /portal/bac-si/lich-hen               → DoctorAppointmentList  
   
  /portal/bac-si/lich-lam-viec          → DoctorWorkSchedule  
   
  /portal/bac-si/tin-nhan               → ChatPage (Doctor)  
   
  /portal/bac-si/thong-tin-ca-nhan      → DoctorProfile  
   
    
**Receptionist Portal (**/portal/le-tan  **)**  
   
/portal/le-tan                               → ReceptionistDashboard  
   
  /portal/le-tan/lich-hen                      → AppointmentManagement  
   
  /portal/le-tan/dat-lich                      → ReceptionistBooking  
   
  /portal/le-tan/lich-bac-si          → DoctorScheduleView  
   
  /portal/le-tan/tin-nhan                      → ChatPage (Receptionist)  
   
  /portal/le-tan/thong-tin-ca-nhan             → ReceptionistProfile  
   
    
**Admin Portal (**/portal/admin  **)**  
- Alias tương thích ngược: `/admin/*` redirect sang `/portal/admin/*`.  
   
/portal/admin                        → AdminDashboard  
   
  /portal/admin/chuyen-khoa            → SpecialtyManagement  
   
  /portal/admin/bac-si                 → DoctorManagement  
   
  /portal/admin/lich-lam-viec          → ScheduleRulesManagement  
   
  /portal/admin/lich-hen               → AppointmentManagement (Admin)  
   
  /portal/admin/duyet-yeu-cau          → ApprovalRequests  
   
  /portal/admin/nguoi-dung             → UserManagement  
   
  /portal/admin/blog                   → BlogManagement  
   
  /portal/admin/email-preview          → EmailPreviewPage  
   
  /portal/admin/phong-kham             → ClinicInfo  
   
  /portal/admin/cai-dat                → SystemSettings  
  
**Frontend Admin screens hiện tại:**  
- `/portal/admin/nguoi-dung`: Admin quản lý người dùng, list/search/filter role/status, pagination, xem chi tiết, sửa thông tin cơ bản, tạo tài khoản nhân sự, khóa/mở khóa, reset noShowCount; không có section đổi/đặt lại mật khẩu trong chi tiết user ở scope hiện tại; chi tiết user hiển thị số lần vắng mặt  
- `/portal/admin/chuyen-khoa`: Admin quản lý chuyên khoa, list/search/pagination nếu backend hỗ trợ, thêm, sửa, xem chi tiết nếu UI có, bật/tắt active  
- `/portal/admin/phong-kham`: Admin cập nhật thông tin phòng khám gồm tên, địa chỉ, hotline, email, giờ làm việc, mô tả  
- `/portal/admin/cai-dat`: Admin cập nhật system settings gồm giới hạn đặt lịch, thời lượng slot, thời gian hủy tối thiểu, số lần vắng mặt tối đa, số lịch hẹn active tối đa mỗi user, giờ ca sáng/chiều; không có Token TTL trên UI  
   
    
 ![](data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAnEAAAACCAYAAAA3pIp+AAAABmJLR0QA/wD/AP+gvaeTAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAANElEQVR4nO3OUQmAABBAsSeYxKSXxlxGEAOIFfwTYUuwZWa2ag8AgL841uquzq8nAAC8dj05WAYOJzduCAAAAABJRU5ErkJggg==)  
 **7. Sidebar navigation theo role**  
   
 | | |  
   
 |-|-|  
   
 | **Role** |  **Menu items** |  
   
 | **PATIENT** | Tổng quan · Lịch hẹn của tôi · Hồ sơ người thân · Thông tin cá nhân · Về trang chủ |  
   
 | **DOCTOR** | Tổng quan · Lịch hẹn · Lịch làm việc · Tin nhắn · Thông tin cá nhân |  
   
 | **RECEPTIONIST** | Tổng quan · Quản lý lịch hẹn · Đặt lịch khám · Lịch làm việc bác sĩ · Tin nhắn · Thông tin cá nhân |  
   
 | **ADMIN** | Tổng quan · Chuyên khoa · Bác sĩ · Lịch làm việc · Lịch hẹn · Duyệt yêu cầu · Người dùng · Bài viết · Email Preview · Thông tin PK · Cài đặt |  
   
    
 **Quy tắc sidebar:**  
- Chỉ **PATIENT** có nút "Về trang chủ"  
- Doctor, Receptionist, Admin: logo click → về Dashboard của role đó (không về public homepage)  
 ![](data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAnEAAAACCAYAAAA3pIp+AAAABmJLR0QA/wD/AP+gvaeTAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAANUlEQVR4nO3OMQ2AABAAsSNhQgNCkPcjIpnRgQU2QtIq6DIze3UGAMBf3Gu1VcfXEwAAXrseaJ0ELif11y4AAAAASUVORK5CYII=)  
 **8. Mock data hiện tại**  
 **Doctors (mockData.ts)**  
   
 | | | | | |  
   
 |-|-|-|-|-|  
   
 | **ID** |  **Tên** |  **Chuyên khoa** |  **Kinh nghiệm** |  **Rating** |  
   
 | d1 | ThS.BS Nguyễn Minh Anh | Tim mạch | 18 năm | 4.9 |  
   
 | d2 | BS.CKII Trần Quốc Huy | Cơ Xương Khớp | 12 năm | 4.7 |  
   
 | d3 | BS Lê Thảo Vy | Nhi khoa | 8 năm | 4.8 |  
   
 | d4 | TS.BS Phạm Hoàng Nam | Tiêu hóa | 25 năm | 5.0 |  
   
 | d5 | BS.CKI Nguyễn Thu Hương | Da liễu | 12 năm | 4.7 |  
   
 | d6 | ThS.BS Vũ Đức Thành | Nội tổng quát | 10 năm | 4.6 |  
   
    
 **Appointment statuses (mock)**  
   
 Hệ thống sử dụng mock data tĩnh với các trạng thái đa dạng để demo UI.  
 **Users (mock)**  
- 1 tài khoản Patient: [benh-nhan@careplus.vn](mailto:benh-nhan@careplus.vn "mailto:benh-nhan@careplus.vn")  
- 1 tài khoản Doctor: [bac-si@careplus.vn](mailto:bac-si@careplus.vn "mailto:bac-si@careplus.vn")  
- 1 tài khoản Receptionist: [le-tan@careplus.vn](mailto:le-tan@careplus.vn "mailto:le-tan@careplus.vn")  
- 1 tài khoản Admin: [admin@careplus.vn](mailto:admin@careplus.vn "mailto:admin@careplus.vn")  
- Password chung demo: 123456  
 ![](data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAnEAAAACCAYAAAA3pIp+AAAABmJLR0QA/wD/AP+gvaeTAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAANUlEQVR4nO3OQQmAABRAsSfYxKI/kJ0ED6bwYAVvImwJtszMVu0BAPAXx1rd1fn1BACA164HHEAF+D7GUDYAAAAASUVORK5CYII=)  
 **9. Tech stack**  
   
 Frontend  
   
  React  
   
  ↓  
   
  Redux Toolkit  
   
  ↓  
   
  Axios  
   
  ↓  
   
  Express API  
   
 Backend  
   
  Express  
   
  ↓  
   
  Service  
   
  ↓  
   
  Repository  
   
  ↓  
   
 Prisma  
   
  MySQL  
   
 Infra  
   
 ReactHook  
   
  Redis  
   
  Socket.IO  
   
  Cloudinary  
   
  Elasticsearch  
   
    
