# CarePlus Clinic — Hệ thống Đặt lịch phòng khám

Hệ thống Đặt lịch khám trực tuyến CarePlus bao gồm 5 cổng thông tin (Patient, Doctor, Receptionist, Admin, và Public Website). 
Hệ thống được phát triển dựa trên kiến trúc phân tầng Clean Architecture, sử dụng React (Frontend) và Express + Prisma + MySQL (Backend).

Tài liệu này hướng dẫn cách thiết lập và chạy dự án từ lúc clone source code về máy của lập trình viên.

---

## 📋 Yêu cầu hệ thống (Prerequisites)

Trước khi bắt đầu, hãy đảm bảo máy tính của bạn đã cài đặt:
1. **Node.js**: Phiên bản LTS mới nhất (Khuyến nghị $\ge 20.x$)
2. **Docker**: Dùng để khởi chạy MySQL nhanh chóng (hoặc MySQL cài trực tiếp trên máy)
3. **pnpm**: Trình quản lý package chính của dự án.

---

## 🛠️ Hướng dẫn cài đặt từng bước

### Bước 1: Clone dự án từ GitHub
Mở terminal và chạy lệnh:
```bash
git clone <URL_KHO_LƯU_TRỮ_GITHUB>
cd CarePlus
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

### 1.2 Khởi chạy MySQL Database
Nếu bạn sử dụng Docker (khuyên dùng), hãy khởi chạy container chứa MySQL:
```bash
# Khởi động container MySQL đã có sẵn
docker start mysql-9.6.0
```
*(Nếu cần cài mới qua docker, hãy tạo một container MySQL chạy trên cổng 3306 với username: `root`, password: `root` và database: `careplus`)*

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

---

## 👥 Phân chia công việc (Task Allocation)
Để biết bạn thuộc nhóm phát triển phân hệ nào và cần làm những task gì, vui lòng xem tại:
👉 [developer_task_allocation.md](./docs/developer_task_allocation.md)
