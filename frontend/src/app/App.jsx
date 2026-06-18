import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import PublicLayout from '../shared/components/layout/PublicLayout';
import PatientLayout from '../shared/components/layout/PatientLayout';
import HomePage from '../pages/public/HomePage';
import PlaceholderPage from '../pages/public/PlaceholderPage';
import RegisterPage from '../pages/public/RegisterPage';
import VerifyEmailPage from '../pages/public/VerifyEmailPage';
import LoginPage from '../pages/public/LoginPage';
import ForgotPasswordPage from '../pages/public/ForgotPasswordPage';
import ResetPasswordPage from '../pages/public/ResetPasswordPage';
import PatientPersonalInfoPage from '../pages/patient/PatientPersonalInfoPage';
import PatientRelativesPage from '../pages/patient/PatientRelativesPage';

/**
 * Main Application Component relocated to comply with AGENT.md guidelines.
 */
function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/dang-ky" element={<RegisterPage />} />
        <Route path="/xac-minh-email" element={<VerifyEmailPage />} />
        <Route path="/dang-nhap" element={<LoginPage />} />
        <Route path="/quen-mat-khau" element={<ForgotPasswordPage />} />
        <Route path="/dat-lai-mat-khau" element={<ResetPasswordPage />} />

        <Route path="/benh-nhan" element={<PatientLayout />}>
          <Route index element={<Navigate to="thong-tin-ca-nhan" replace />} />
          <Route path="thong-tin-ca-nhan" element={<PatientPersonalInfoPage />} />
          <Route path="lich-hen" element={<PlaceholderPage title="Lịch hẹn của tôi" />} />
          <Route path="nguoi-than" element={<PatientRelativesPage />} />
        </Route>

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
          {/* Catch-all Route */}
          <Route path="*" element={<PlaceholderPage title="404 - Không tìm thấy trang" />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
