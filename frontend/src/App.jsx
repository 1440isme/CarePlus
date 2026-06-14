import { BrowserRouter, Routes, Route } from 'react-router-dom';
import PublicLayout from './shared/components/layout/PublicLayout';
import HomePage from './pages/public/HomePage';
import PlaceholderPage from './pages/public/PlaceholderPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<PublicLayout />}>
          <Route index element={<HomePage />} />
          
          {/* Public Website Routes */}
          <Route path="chuyen-khoa" element={<PlaceholderPage title="Danh sách Chuyên khoa" />} />
          <Route path="chuyen-khoa/:slug" element={<PlaceholderPage title="Chi tiết Chuyên khoa" />} />
          <Route path="bac-si" element={<PlaceholderPage title="Danh sách Bác sĩ" />} />
          <Route path="bac-si/:id" element={<PlaceholderPage title="Hồ sơ Bác sĩ" />} />
          <Route path="cam-nang" element={<PlaceholderPage title="Cẩm nang Sức khỏe" />} />
          <Route path="cam-nang/:slug" element={<PlaceholderPage title="Chi tiết Bài viết" />} />
          <Route path="ve-chung-toi" element={<PlaceholderPage title="Về chúng tôi" />} />
          <Route path="lien-he" element={<PlaceholderPage title="Liên hệ" />} />
          <Route path="faq" element={<PlaceholderPage title="FAQ - Câu hỏi thường gặp" />} />
          <Route path="dat-lich" element={<PlaceholderPage title="Đặt lịch khám trực tuyến" />} />
          
          {/* Auth Routes */}
          <Route path="dang-nhap" element={<PlaceholderPage title="Đăng nhập tài khoản" />} />
          <Route path="dang-ky" element={<PlaceholderPage title="Đăng ký tài khoản" />} />
          <Route path="quen-mat-khau" element={<PlaceholderPage title="Quên mật khẩu" />} />

          {/* Catch-all Route */}
          <Route path="*" element={<PlaceholderPage title="404 - Không tìm thấy trang" />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
