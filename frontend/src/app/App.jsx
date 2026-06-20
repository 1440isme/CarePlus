import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { GuestOnlyRoute } from './route-guards.jsx';
import PublicLayout from '../shared/components/layout/PublicLayout';
import PatientLayout from '../shared/components/layout/PatientLayout';
import AdminLayout from '../shared/components/layout/AdminLayout.jsx';
import RequireRole from '../shared/components/layout/RequireRole.jsx';
import HomePage from '../pages/public/HomePage';
import PlaceholderPage from '../pages/public/PlaceholderPage';
import RegisterPage from '../pages/public/RegisterPage';
import VerifyEmailPage from '../pages/public/VerifyEmailPage';
import LoginPage from '../pages/public/LoginPage';
import ForgotPasswordPage from '../pages/public/ForgotPasswordPage';
import ResetPasswordPage from '../pages/public/ResetPasswordPage';
import DoctorListPage from '../pages/public/DoctorListPage.jsx';
import DoctorDetailPage from '../pages/public/DoctorDetailPage.jsx';
import SpecialtyListPage from '../pages/public/SpecialtyListPage.jsx';
import SpecialtyDetailPage from '../pages/public/SpecialtyDetailPage.jsx';
import BlogListPage from '../pages/public/BlogListPage.jsx';
import BlogDetailPage from '../pages/public/BlogDetailPage.jsx';
import AboutPage from '../pages/public/AboutPage.jsx';
import ContactPage from '../pages/public/ContactPage.jsx';
import FAQPage from '../pages/public/FAQPage.jsx';
import BookingWizardPage from '../pages/public/BookingWizardPage.jsx';
import NotFoundPage from '../pages/public/NotFoundPage.jsx';
import PatientPersonalInfoPage from '../pages/patient/PatientPersonalInfoPage';
import PatientRelativesPage from '../pages/patient/PatientRelativesPage';
import AdminSpecialtiesPage from '../pages/admin/AdminSpecialtiesPage.jsx';
import AdminUsersPage from '../pages/admin/AdminUsersPage.jsx';
import BlogManagement from '../pages/admin/BlogManagement.jsx';
import { useAuthBootstrap } from '../features/auth/hooks/useAuthBootstrap.js';

/**
 * Main Application Component relocated to comply with AGENT.md guidelines.
 */
function App() {
  useAuthBootstrap();

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<GuestOnlyRoute />}>
          <Route path="/dang-ky" element={<RegisterPage />} />
          <Route path="/xac-minh-email" element={<VerifyEmailPage />} />
          <Route path="/dang-nhap" element={<LoginPage />} />
          <Route path="/quen-mat-khau" element={<ForgotPasswordPage />} />
          <Route path="/dat-lai-mat-khau" element={<ResetPasswordPage />} />
        </Route>

        <Route path="/benh-nhan" element={<PatientLayout />}>
          <Route index element={<Navigate to="thong-tin-ca-nhan" replace />} />
          <Route path="thong-tin-ca-nhan" element={<PatientPersonalInfoPage />} />
          <Route path="lich-hen" element={<PlaceholderPage title="Lịch hẹn của tôi" />} />
          <Route path="nguoi-than" element={<PatientRelativesPage />} />
        </Route>

        <Route
          path="/admin"
          element={(
            <RequireRole allowedRoles={['ADMIN']}>
              <AdminLayout />
            </RequireRole>
          )}
        >
          <Route index element={<PlaceholderPage title="Tổng quan Admin" />} />
          <Route path="chuyen-khoa" element={<AdminSpecialtiesPage />} />
          <Route path="bac-si" element={<PlaceholderPage title="Quản lý bác sĩ" />} />
          <Route path="lich-lam-viec" element={<PlaceholderPage title="Lịch làm việc" />} />
          <Route path="lich-hen" element={<PlaceholderPage title="Quản lý lịch hẹn" />} />
          <Route path="duyet-yeu-cau" element={<PlaceholderPage title="Duyệt yêu cầu" />} />
          <Route path="nguoi-dung" element={<AdminUsersPage />} />
          <Route path="blog" element={<BlogManagement />} />
          <Route path="email-preview" element={<PlaceholderPage title="Email Preview" />} />
          <Route path="phong-kham" element={<PlaceholderPage title="Thông tin phòng khám" />} />
          <Route path="cai-dat" element={<PlaceholderPage title="Cài đặt hệ thống" />} />
        </Route>

        <Route path="/" element={<PublicLayout />}>
          <Route index element={<HomePage />} />
          
          {/* Public Website Routes */}
          <Route path="chuyen-khoa" element={<PlaceholderPage title="Danh sách Chuyên khoa" />} />
          <Route path="chuyen-khoa/:slug" element={<PlaceholderPage title="Chi tiết Chuyên khoa" />} />
          <Route path="bac-si" element={<PlaceholderPage title="Danh sách Bác sĩ" />} />
          <Route path="bac-si/:id" element={<PlaceholderPage title="Hồ sơ Bác sĩ" />} />
          <Route path="cam-nang" element={<BlogListPage />} />
          <Route path="cam-nang/:slug" element={<BlogDetailPage />} />
          <Route path="ve-chung-toi" element={<PlaceholderPage title="Về chúng tôi" />} />
          <Route path="lien-he" element={<PlaceholderPage title="Liên hệ" />} />
          <Route path="faq" element={<PlaceholderPage title="FAQ - Câu hỏi thường gặp" />} />
          <Route path="dat-lich" element={<PlaceholderPage title="Đặt lịch khám trực tuyến" />} />
          
          {/* Auth Routes */}
          {/* Catch-all Route */}
          <Route path="*" element={<PlaceholderPage title="404 - Không tìm thấy trang" />} />
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
