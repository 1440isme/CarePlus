# Hướng dẫn Tích hợp & Sử dụng Elasticsearch

Elasticsearch được tích hợp vào hệ thống CarePlus nhằm mục đích cung cấp tính năng tìm kiếm Full-text search (cho bác sĩ, bài viết blog, chuyên khoa...) với tốc độ phản hồi nhanh và khả năng tìm kiếm gần đúng (Fuzziness).

---

## 1. Nguyên tắc cốt lõi (Development Laws)

Tất cả lập trình viên cần tuân thủ nghiêm ngặt các nguyên tắc sau:
1. **MySQL là Source of Truth**: Elasticsearch chỉ đóng vai trò làm search index phục vụ tra cứu. Mọi hoạt động đọc/ghi chính phải thực hiện trên MySQL.
2. **Cơ chế Fallback**: Khi Elasticsearch gặp sự cố ngoại tuyến (Offline), SearchService sẽ tự động chuyển sang truy vấn MySQL `LIKE` một cách an toàn mà không làm crash API.
3. **Đồng bộ dữ liệu (Sync Strategy)**:
   - Ghi đồng bộ phải diễn ra sau khi ghi vào database MySQL thành công.
   - Thao tác đồng bộ lên Elasticsearch nên được chạy bất đồng bộ (Non-blocking), không được block luồng trả về kết quả cho Client.
4. **Không lạm dụng Index**: Chỉ index các trường phục vụ trực tiếp cho tìm kiếm (ví dụ: `name`, `description`, `title`, `tags`). Không đưa các thông tin nhạy cảm (mật khẩu, log) hoặc toàn bộ bản ghi vào Elasticsearch.

---

## 2. Khởi chạy Dịch vụ với Docker Compose

Dự án đã cấu hình sẵn file `docker-compose.yml` ở thư mục gốc của dự án chứa cả **MySQL** và **Elasticsearch** phiên bản `8.11.3` (tắt tính năng bảo mật để dev nhanh).

Để khởi động toàn bộ môi trường cơ sở dữ liệu và tìm kiếm, tại thư mục gốc chạy lệnh:
```bash
docker-compose up -d
```

Để dừng các dịch vụ:
```bash
docker-compose down
```

---

## 3. Các Bước Kích Hoạt Index & Đồng Bộ (Lần Đầu)

Sau khi các container Docker đã khởi động thành công, chạy script sau tại thư mục gốc của dự án để khởi tạo mapping index và đồng bộ dữ liệu hiện tại từ MySQL sang:

```bash
pnpm --filter backend exec node src/infrastructure/search/reindex.script.js
```

---

## 3. Hướng dẫn Phát triển & Tích hợp cho Lập trình viên

### A. Thực hiện Tìm kiếm (Search)
Khi tạo API tìm kiếm ở Controller, hãy gọi trực tiếp qua service:

```javascript
const SearchService = require('../services/search.service');

// Ví dụ: Tìm kiếm bác sĩ
const searchResults = await SearchService.searchDoctors({
  query: req.query.search,  // Từ khóa tìm kiếm từ client
  active: true,             // Lọc trạng thái (ES Filter)
  page: parseInt(req.query.page) || 1,
  limit: parseInt(req.query.limit) || 10
});

return res.status(200).json(searchResults);
```

### B. Đồng bộ dữ liệu khi Thêm/Sửa/Xóa (Write Sync)

Trong Service Layer xử lý nghiệp vụ của bạn, hãy thêm trigger để cập nhật dữ liệu trên Elasticsearch ngay sau khi thao tác database MySQL thành công.

#### 1. Khi tạo mới hoặc cập nhật thông tin:
```javascript
const SearchService = require('./search.service');
const prisma = require('../infrastructure/database/prisma.client');

async function updateDoctorInfo(doctorId, updateData) {
  // Ghi vào MySQL
  const updatedDoctor = await prisma.doctor.update({
    where: { id: doctorId },
    data: updateData
  });

  // Đồng bộ lên Elasticsearch (chạy ngầm, không await để tránh blocking)
  SearchService.indexDocument('doctors', updatedDoctor.id, {
    name: updatedDoctor.name,
    specialtyName: updatedDoctor.specialtyName,
    description: updatedDoctor.description,
    title: updatedDoctor.title,
    experience: updatedDoctor.experience,
    price: updatedDoctor.price,
    rating: updatedDoctor.rating,
    active: updatedDoctor.active
  }).catch(err => console.error('ES Sync Error:', err));

  return updatedDoctor;
}
```

#### 2. Khi xóa bản ghi:
```javascript
async function deleteDoctor(doctorId) {
  // Xóa khỏi MySQL
  await prisma.doctor.delete({
    where: { id: doctorId }
  });

  // Xóa khỏi Elasticsearch index
  SearchService.deleteDocument('doctors', doctorId).catch(err => 
    console.error('ES Delete Error:', err)
  );
}
```
