# CarePlus Clinic — Frontend App

Ứng dụng Frontend của hệ thống CarePlus được phát triển bằng React, sử dụng Vite làm công cụ build, Axios cho việc gọi API, và Redux Toolkit cho việc quản lý client-side state.

---

## 🛠️ Yêu cầu hệ thống (Prerequisites)

*   **Node.js**: Phiên bản $\ge 20.x$
*   **pnpm**: Phiên bản $\ge 9.x$

---

## ⚙️ Các bước cài đặt và cấu hình

1.  **Cài đặt các package phụ thuộc:**
    ```bash
    pnpm install
    ```

2.  **Cấu hình Environment Variables:**
    Tạo file `.env` từ file `.env.example`:
    ```bash
    cp .env.example .env
    ```
    Biến môi trường bắt buộc:
    *   `VITE_API_URL`: Địa chỉ API Gateway của Backend. Mặc định là `http://localhost:5000/api/v1`.

---

## 🚀 Các lệnh phát triển (Scripts)

| Lệnh | Ý nghĩa |
| :--- | :--- |
| `pnpm run dev` | Khởi chạy Vite dev server ở chế độ phát triển (hỗ trợ Hot Module Replacement). |
| `pnpm run build` | Biên dịch mã nguồn tối ưu sang mã tĩnh (Production build) trong thư mục `dist/`. |
| `pnpm run lint` | Chạy công cụ kiểm tra và chuẩn hóa cú pháp code (ESLint). |
| `pnpm run preview` | Chạy thử bản compile Production cục bộ để kiểm tra trước khi deploy. |

---

## ⚠️ Quy tắc phát triển giao diện (Frontend Guidelines)

*   **State Management (Quy tắc lưu trữ State):**
    *   **Server State** (danh sách bác sĩ, lịch hẹn, ca khám): Quản lý hoàn toàn qua TanStack Query cache. Tuyệt đối không lưu lặp lại vào Redux store.
    *   **Client State** (thông tin đăng nhập, token, vai trò): Quản lý qua Redux Toolkit.
    *   **UI State** (mở modal, active tab): Dùng `useState` nội bộ của component.
    *   **Form State**: Sử dụng `React Hook Form` kết hợp bộ kiểm tra dữ liệu `Zod resolver`.
*   **Không viết trực tiếp `axios` trong Component:** Mọi API call phải được định nghĩa trong thư mục `services` của từng feature module tương ứng, sau đó được gọi thông qua custom hooks hoặc TanStack Query.
*   **Tách biệt UI và Logic (SRP):** Các page component đóng vai trò là container (chứa logic và gọi custom hooks), các component con là presentational (chỉ nhận props và render giao diện).
