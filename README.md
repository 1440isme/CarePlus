# CarePlus Clinic — Hệ thống Đặt lịch phòng khám

Hệ thống Đặt lịch khám trực tuyến CarePlus bao gồm 5 cổng thông tin (Patient, Doctor, Receptionist, Admin, và Public Website). 
Hệ thống được phát triển dựa trên kiến trúc phân tầng Clean Architecture, sử dụng React (Frontend) và Express + Prisma + MySQL (Backend).

Tài liệu này hướng dẫn cách thiết lập và chạy dự án từ lúc clone source code về máy của lập trình viên.

---

## 📋 Yêu cầu hệ thống (Prerequisites)

Trước khi bắt đầu, hãy đảm bảo máy tính của bạn đã cài đặt:
1. **Node.js**: Phiên bản LTS mới nhất (Khuyến nghị $\ge 20.x$)
2. **Docker & Docker Compose**: Dùng để khởi chạy các dịch vụ (MySQL, Elasticsearch, Redis) tự động.
3. **pnpm**: Trình quản lý package chính của dự án.

---

## 🛠️ Hướng dẫn cài đặt từng bước

### Bước 1: Clone dự án từ GitHub
Mở terminal và chạy lệnh:
```bash
git clone <URL_KHO_LƯU_TRỮ_GITHUB>
cd CarePlus
```
```bash
git pull origin main
git checkout <ten_nhanh>
```

### Bước 2: Cài đặt pnpm trên máy
Nếu máy của bạn chưa cài `pnpm`, bạn có thể cài đặt globally thông qua `npm`:
```bash
npm install -g pnpm
```
*(Hoặc dùng Corepack nếu Node.js đã bật sẵn: `corepack enable`)*

### Bước 3: Cài đặt Dependencies cho toàn bộ dự án
Dự án sử dụng mô hình **pnpm Workspace**. Bạn chỉ cần chạy cài đặt một lần duy nhất từ thư mục gốc (root):
```bash
pnpm install
```
Lệnh này sẽ tự động cài đặt tất cả các thư viện của cả `backend` và `frontend`.

---

## 🖥️ 1. Hướng dẫn thiết lập Backend

### 1.1 Thiết lập Environment Variables (`.env`)
Di chuyển vào thư mục backend, sao chép file cấu hình mẫu và cấu hình:
```bash
cd backend
cp .env.example .env
```
Mở file `.env` và kiểm tra các thông số kết nối cơ sở dữ liệu:
```env
PORT=5000
DATABASE_URL="mysql://root:root@localhost:3306/careplus"
```
*(Nếu cài đặt MySQL trên máy khác cấu hình mặc định, hãy cập nhật `DATABASE_URL` tương ứng)*

### 1.2 Khởi chạy Cơ sở dữ liệu, Tìm kiếm và Cache (Docker Compose)
Dự án sử dụng Docker Compose để khởi chạy đồng thời **MySQL**, **Elasticsearch** và **Redis**. Từ thư mục gốc của dự án, chạy lệnh:
```bash
docker-compose up -d
```
*(Lệnh này sẽ tự động chạy MySQL trên cổng 3306, Elasticsearch trên cổng 9200 và Redis trên cổng 6379).*

### 1.3 Chạy Migration và sinh Prisma Client
Chạy lệnh sau từ thư mục gốc (root) để tạo các bảng trong database MySQL và đồng bộ cấu hình schema:
```bash
# Quay lại thư mục gốc nếu đang ở backend/
cd ..

# Chạy migration để tạo các bảng trong DB
pnpm --filter backend exec prisma migrate dev --name init

# Sinh Prisma Client tương thích trong workspace
pnpm --filter backend exec prisma generate
```

### 1.4 Khởi tạo và đồng bộ Elasticsearch Index (Reindex)
Sau khi database đã sẵn sàng và chạy migration thành công, thực hiện chạy lệnh dưới đây từ thư mục gốc (root) để thiết lập mapping và chuyển dữ liệu ban đầu sang Elasticsearch:
```bash
pnpm --filter backend exec node src/infrastructure/search/reindex.script.js
```

---

## 🎨 2. Hướng dẫn thiết lập Frontend

### 2.1 Thiết lập Environment Variables (`.env`)
Di chuyển vào thư mục frontend, tạo file cấu hình môi trường `.env` từ file mẫu:
```bash
cd frontend
cp .env.example .env
```
File `.env` mặc định sẽ chứa cổng kết nối tới API Backend:
```env
VITE_API_URL=http://localhost:5000/api/v1
```

---

## 🚀 3. Chạy dự án (Start Development Servers)

Quay lại thư mục gốc (root) của dự án. Bạn có thể khởi chạy đồng thời cả Backend và Frontend dev servers chỉ bằng một câu lệnh:
```bash
# Quay lại thư mục gốc
cd ..

# Chạy cả 2 server đồng thời
pnpm run dev
```

*   **Vite Frontend** sẽ chạy tại: `http://localhost:5173`
*   **Express Backend** sẽ chạy tại: `http://localhost:5000` (Endpoint kiểm tra sức khỏe hệ thống: `http://localhost:5000/health`)

---

## 📖 Quy tắc phát triển (Development Laws)

Tất cả các thành viên phát triển hệ thống **bắt buộc** phải đọc và tuân thủ các quy tắc thiết kế kiến trúc, cấu trúc thư mục, quy ước commit và các Anti-patterns được định nghĩa chi tiết tại:
👉 [AGENT.md](./AGENT.md)

### ⚠️ Lưu ý kỹ thuật cho Backend (Prisma 7 & Driver Adapter)
*   **Không khai báo `url` trong `schema.prisma`:** Theo chuẩn của **Prisma 7**, đường dẫn kết nối cơ sở dữ liệu `url` đã bị loại bỏ khỏi file `schema.prisma`. Toàn bộ cấu hình kết nối được quản lý thông qua file `prisma.config.ts` và truyền trực tiếp vào constructor của `PrismaClient` lúc khởi chạy ứng dụng.
*   **Sử dụng Driver Adapter:** Tại runtime, dự án sử dụng `@prisma/adapter-mariadb` kết hợp driver `mariadb` để kết nối trực tiếp với MySQL. Tuyệt đối không thay đổi cấu hình này trong `src/infrastructure/database/prisma.client.js`.
*   **Quy tắc phân tầng (Clean Architecture):** Controller **không** được gọi trực tiếp Repository hay Prisma Client; mọi xử lý nghiệp vụ phải thông qua các Service.

### ⚠️ Quy tắc phát triển giao diện (Frontend Guidelines)
*   **Quản lý State (State Management):**
    *   **Server State** (danh sách bác sĩ, lịch hẹn, ca khám): Quản lý hoàn toàn qua TanStack Query cache. Tuyệt đối không lưu lặp lại vào Redux store.
    *   **Client State** (thông tin đăng nhập, token, vai trò): Quản lý qua Redux Toolkit.
    *   **UI State** (mở modal, active tab): Dùng `useState` nội bộ của component.
    *   **Form State**: Sử dụng `React Hook Form` kết hợp bộ kiểm tra dữ liệu `Zod resolver`.
*   **Không viết trực tiếp `axios` trong Component:** Mọi API call phải sử dụng thực thể cấu hình sẵn `axiosInstance` trong `src/shared/services/axios.instance.js`, tuyệt đối không tự ý `import axios` trực tiếp trong Component.
*   **Tách biệt UI và Logic (SRP):** Các page component đóng vai trò là container (chứa logic và gọi custom hooks), các component con là presentational (chỉ nhận props và render giao diện).

---

## 👥 Phân chia công việc (Task Allocation)
Để biết bạn thuộc nhóm phát triển phân hệ nào và cần làm những task gì, vui lòng xem tại:
👉 [developer_task_allocation.md](./docs/developer_task_allocation.md)
