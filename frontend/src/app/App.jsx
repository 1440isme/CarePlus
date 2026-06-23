import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { GuestOnlyRoute } from './route-guards.jsx';
import { APP_ROUTES } from '../shared/constants/routes.js';
import PublicLayout from '../shared/components/layout/PublicLayout';
import PatientLayout from '../shared/components/layout/PatientLayout';
import AdminLayout from '../shared/components/layout/AdminLayout.jsx';
import ReceptionistLayout from '../shared/components/layout/ReceptionistLayout.jsx';
import RequireRole from '../shared/components/layout/RequireRole.jsx';
import DashboardLayout from '../shared/components/layout/DashboardLayout.jsx';

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

import PatientAppointments from '../pages/patient/PatientAppointments.jsx';
import PatientPersonalInfoPage from '../pages/patient/PatientPersonalInfoPage';
import PatientRelativesPage from '../pages/patient/PatientRelativesPage';
import PatientDashboard from '../pages/patient/PatientDashboard.jsx';

import DoctorDashboardPage from '../pages/doctor/DoctorDashboardPage.jsx';
import DoctorAppointmentListPage from '../pages/doctor/DoctorAppointmentListPage.jsx';
import DoctorWorkSchedulePage from '../pages/doctor/DoctorWorkSchedulePage.jsx';
import DoctorChatPage from '../pages/doctor/DoctorChatPage.jsx';
import DoctorProfilePage from '../pages/doctor/DoctorProfilePage.jsx';

import ReceptionistDashboardPage from '../pages/receptionist/ReceptionistDashboardPage.jsx';
import ReceptionistAppointmentManagementPage from '../pages/receptionist/ReceptionistAppointmentManagementPage.jsx';
import ReceptionistBookingPage from '../pages/receptionist/ReceptionistBookingPage.jsx';
import ReceptionistDoctorSchedulePage from '../pages/receptionist/ReceptionistDoctorSchedulePage.jsx';
import ReceptionistProfilePage from '../pages/receptionist/ReceptionistProfilePage.jsx';
import ReceptionistChatPage from '../pages/receptionist/ReceptionistChatPage.jsx';

import AdminApprovalRequestsPage from '../pages/admin/AdminApprovalRequestsPage.jsx';
import AdminAppointmentManagementPage from '../pages/admin/AdminAppointmentManagementPage.jsx';
import AdminDashboardPage from '../pages/admin/AdminDashboardPage.jsx';
import AdminDoctorManagementPage from '../pages/admin/AdminDoctorManagementPage.jsx';
import AdminScheduleManagementPage from '../pages/admin/AdminScheduleManagementPage.jsx';
import AdminSpecialtiesPage from '../pages/admin/AdminSpecialtiesPage.jsx';
import AdminUsersPage from '../pages/admin/AdminUsersPage.jsx';
import AdminClinicInfoPage from '../pages/admin/AdminClinicInfoPage.jsx';
import AdminSystemSettingsPage from '../pages/admin/AdminSystemSettingsPage.jsx';
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
          <Route path={APP_ROUTES.register} element={<RegisterPage />} />
          <Route path={APP_ROUTES.verifyEmail} element={<VerifyEmailPage />} />
          <Route path={APP_ROUTES.login} element={<LoginPage />} />
          <Route path={APP_ROUTES.forgotPassword} element={<ForgotPasswordPage />} />
          <Route path={APP_ROUTES.resetPassword} element={<ResetPasswordPage />} />
        </Route>

        <Route path={APP_ROUTES.patientRoot} element={<PatientLayout />}>
          <Route index element={<PatientDashboard />} />
          <Route path="thong-tin-ca-nhan" element={<PatientPersonalInfoPage />} />
          <Route path="lich-hen" element={<PatientAppointments />} />
          <Route path="nguoi-than" element={<PatientRelativesPage />} />
        </Route>

        <Route
          path={APP_ROUTES.doctorRoot}
          element={(
            <RequireRole allowedRoles={['DOCTOR']}>
              <DashboardLayout />
            </RequireRole>
          )}
        >
          <Route index element={<DoctorDashboardPage />} />
          <Route path="lich-hen" element={<DoctorAppointmentListPage />} />
          <Route path="lich-lam-viec" element={<DoctorWorkSchedulePage />} />
          <Route path="tin-nhan" element={<DoctorChatPage />} />
          <Route path="thong-tin-ca-nhan" element={<DoctorProfilePage />} />
        </Route>

        <Route
          path={APP_ROUTES.receptionistRoot}
          element={(
            <RequireRole allowedRoles={['RECEPTIONIST']}>
              <ReceptionistLayout />
            </RequireRole>
          )}
        >
          <Route index element={<ReceptionistDashboardPage />} />
          <Route path="lich-hen" element={<ReceptionistAppointmentManagementPage />} />
          <Route path="dat-lich" element={<ReceptionistBookingPage />} />
          <Route path="lich-bac-si" element={<ReceptionistDoctorSchedulePage />} />
          <Route path="tin-nhan" element={<ReceptionistChatPage />} />
          <Route path="thong-tin-ca-nhan" element={<ReceptionistProfilePage />} />
        </Route>

        <Route
          path={APP_ROUTES.adminRoot}
          element={(
            <RequireRole allowedRoles={['ADMIN']}>
              <AdminLayout />
            </RequireRole>
          )}
        >
          <Route index element={<AdminDashboardPage />} />
          <Route path="chuyen-khoa" element={<AdminSpecialtiesPage />} />
          <Route path="bac-si" element={<AdminDoctorManagementPage />} />
          <Route path="lich-lam-viec" element={<AdminScheduleManagementPage />} />
          <Route path="lich-hen" element={<AdminAppointmentManagementPage />} />
          <Route path="duyet-yeu-cau" element={<AdminApprovalRequestsPage />} />
          <Route path="nguoi-dung" element={<AdminUsersPage />} />
          <Route path="blog" element={<BlogManagement />} />
          <Route path="email-preview" element={<PlaceholderPage title="Email Preview" />} />
          <Route path="phong-kham" element={<AdminClinicInfoPage />} />
          <Route path="cai-dat" element={<AdminSystemSettingsPage />} />
        </Route>

        <Route path={APP_ROUTES.home} element={<PublicLayout />}>
          <Route index element={<HomePage />} />

          {/* Public Website Routes */}
          <Route path="chuyen-khoa" element={<SpecialtyListPage />} />
          <Route path="chuyen-khoa/:slug" element={<SpecialtyDetailPage />} />
          <Route path="bac-si" element={<DoctorListPage />} />
          <Route path="bac-si/:id" element={<DoctorDetailPage />} />
          <Route path="cam-nang" element={<BlogListPage />} />
          <Route path="cam-nang/:slug" element={<BlogDetailPage />} />
          <Route path="ve-chung-toi" element={<AboutPage />} />
          <Route path="lien-he" element={<ContactPage />} />
          <Route path="faq" element={<FAQPage />} />
          <Route path="dat-lich" element={<BookingWizardPage />} />

          {/* Catch-all Route */}
          <Route path="*" element={<PlaceholderPage title="404 - Không tìm thấy trang" />} />
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
