import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { GuestOnlyRoute, ProtectedRoute } from './route-guards.jsx';
import PublicLayout from '../shared/components/layout/PublicLayout';
import PatientLayout from '../shared/components/layout/PatientLayout';
import DashboardLayout from '../shared/components/layout/DashboardLayout.jsx';
import HomePage from '../pages/public/HomePage';
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
import PatientDashboard from '../pages/patient/PatientDashboard.jsx';
import PatientAppointments from '../pages/patient/PatientAppointments.jsx';
import PatientPersonalInfoPage from '../pages/patient/PatientPersonalInfoPage';
import PatientRelativesPage from '../pages/patient/PatientRelativesPage';
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
import AdminDashboardPage from '../pages/admin/AdminDashboardPage.jsx';
import AdminDoctorManagementPage from '../pages/admin/AdminDoctorManagementPage.jsx';
import AdminScheduleManagementPage from '../pages/admin/AdminScheduleManagementPage.jsx';
import AdminApprovalRequestsPage from '../pages/admin/AdminApprovalRequestsPage.jsx';
import AdminUserManagementPage from '../pages/admin/AdminUserManagementPage.jsx';
import AdminAppointmentManagementPage from '../pages/admin/AdminAppointmentManagementPage.jsx';

/**
 * Main Application Component relocated to comply with AGENT.md guidelines.
 */
function App() {
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

        <Route element={<ProtectedRoute allowedRoles={['PATIENT']} />}>
          <Route path="/benh-nhan" element={<PatientLayout />}>
            <Route index element={<PatientDashboard />} />
            <Route path="thong-tin-ca-nhan" element={<PatientPersonalInfoPage />} />
            <Route path="lich-hen" element={<PatientAppointments />} />
            <Route path="nguoi-than" element={<PatientRelativesPage />} />
          </Route>
        </Route>

        <Route element={<ProtectedRoute allowedRoles={['DOCTOR']} />}>
          <Route path="/bac-si-portal" element={<DashboardLayout />}>
            <Route index element={<DoctorDashboardPage />} />
            <Route path="lich-hen" element={<DoctorAppointmentListPage />} />
            <Route path="lich-lam-viec" element={<DoctorWorkSchedulePage />} />
            <Route path="tin-nhan" element={<DoctorChatPage />} />
            <Route path="thong-tin-ca-nhan" element={<DoctorProfilePage />} />
          </Route>
        </Route>

        <Route element={<ProtectedRoute allowedRoles={['RECEPTIONIST']} />}>
          <Route path="/le-tan" element={<DashboardLayout />}>
            <Route index element={<ReceptionistDashboardPage />} />
            <Route path="lich-hen" element={<ReceptionistAppointmentManagementPage />} />
            <Route path="dat-lich" element={<ReceptionistBookingPage />} />
            <Route path="lich-bac-si" element={<ReceptionistDoctorSchedulePage />} />
            <Route path="thong-tin-ca-nhan" element={<ReceptionistProfilePage />} />
          </Route>
        </Route>

        <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
          <Route path="/admin" element={<DashboardLayout />}>
            <Route index element={<AdminDashboardPage />} />
            <Route path="bac-si" element={<AdminDoctorManagementPage />} />
            <Route path="lich-lam-viec" element={<AdminScheduleManagementPage />} />
            <Route path="duyet-yeu-cau" element={<AdminApprovalRequestsPage />} />
            <Route path="nguoi-dung" element={<AdminUserManagementPage />} />
            <Route path="lich-hen" element={<AdminAppointmentManagementPage />} />
          </Route>
        </Route>

        <Route path="/" element={<PublicLayout />}>
          <Route index element={<HomePage />} />
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
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
