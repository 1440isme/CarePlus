# CarePlus Clinic — Backend Service

Dịch vụ Backend của hệ thống CarePlus được xây dựng bằng Node.js, Express, Prisma ORM và kết nối tới cơ sở dữ liệu MySQL.

---

## 🛠️ Yêu cầu hệ thống (Prerequisites)

*   **Node.js**: Phiên bản $\ge 20.x$
*   **pnpm**: Phiên bản $\ge 9.x$
*   **MySQL**: Phiên bản 8.0 hoặc 9.x (Khởi chạy qua Docker hoặc cài đặt cục bộ)
*   **Redis**: Cần thiết cho việc lưu trữ cache, session blacklist và rate limit.

---

## ⚙️ Các bước cài đặt và cấu hình

1.  **Cài đặt các package phụ thuộc:**
    ```bash
    pnpm install
    ```

2.  **Cấu hình Environment Variables:**
    Copy file `.env.example` thành `.env` và cập nhật thông số kết nối:
    ```bash
    cp .env.example .env
    ```
    Các biến môi trường bắt buộc:
    *   `PORT`: Cổng chạy server (mặc định: `5000`).
    *   `DATABASE_URL`: Connection string kết nối MySQL. Định dạng: `mysql://USER:PASSWORD@HOST:PORT/DATABASE`.
    *   `JWT_SECRET`: Khóa bí mật dùng để mã hóa Access Token.
    *   `ELASTIC_NODE`: Địa chỉ của ElasticSearch node (phục vụ tìm kiếm bác sĩ/blog).

3.  **Khởi chạy Database & Migrations:**
    *   Đảm bảo MySQL server của bạn đã khởi động.
    *   Chạy lệnh migration để đồng bộ database schema và tạo bảng:
        ```bash
        npx prisma migrate dev --name init
        ```
    *   Sinh mã nguồn Prisma Client tương ứng:
        ```bash
        npx prisma generate
        ```

---

## 🚀 Các lệnh phát triển (Scripts)

| Lệnh | Ý nghĩa |
| :--- | :--- |
| `pnpm run dev` | Khởi chạy server ở chế độ phát triển (sử dụng nodemon để tự động tải lại code). |
| `pnpm start` | Khởi chạy server ở chế độ Production. |
| `npx prisma studio` | Mở giao diện quản lý cơ sở dữ liệu trực quan trên trình duyệt (Prisma Studio). |

---

## ⚠️ Lưu ý quan trọng cho nhà phát triển (Prisma 7 & Driver Adapter)

*   **Không khai báo `url` trong `schema.prisma`:** Theo chuẩn của **Prisma 7**, đường dẫn kết nối cơ sở dữ liệu `url` đã bị loại bỏ khỏi file `schema.prisma`. Toàn bộ cấu hình kết nối được quản lý thông qua file `prisma.config.ts` và truyền trực tiếp vào constructor của `PrismaClient` lúc khởi chạy ứng dụng.
*   **Sử dụng Driver Adapter:** Tại runtime, dự án sử dụng `@prisma/adapter-mariadb` kết hợp driver `mariadb` để kết nối trực tiếp với MySQL. Tuyệt đối không thay đổi cách import và cấu hình này trong `src/infrastructure/database/prisma.client.js`.
*   **Quy tắc phân tầng (Clean Architecture):** Tuân thủ tuyệt đối quy định trong `AGENT.md`. Controller **không** được gọi trực tiếp Repository hay Prisma Client; mọi xử lý nghiệp vụ phải thông qua các Service.
