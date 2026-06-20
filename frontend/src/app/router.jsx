import { createBrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import { GuestOnlyRoute, ProtectedRoute } from './route-guards.jsx';
import PublicLayout from '../shared/components/layout/PublicLayout.jsx';
import DashboardLayout from '../shared/components/layout/DashboardLayout.jsx';
import { APP_ROUTES } from '../shared/constants/routes.js';
import HomePage from '../pages/public/HomePage.jsx';
import RegisterPage from '../pages/public/RegisterPage.jsx';
import VerifyEmailPage from '../pages/public/VerifyEmailPage.jsx';
import LoginPage from '../pages/public/LoginPage.jsx';
import ForgotPasswordPage from '../pages/public/ForgotPasswordPage.jsx';
import ResetPasswordPage from '../pages/public/ResetPasswordPage.jsx';
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
import PatientRelatives from '../pages/patient/PatientRelatives.jsx';
import PatientProfilePage from '../pages/patient/PatientProfilePage.jsx';
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

export const router = createBrowserRouter([
  {
    path: APP_ROUTES.home,
    element: <App />,
    children: [
      {
        element: <GuestOnlyRoute />,
        children: [
          { path: APP_ROUTES.register, element: <RegisterPage /> },
          { path: APP_ROUTES.verifyEmail, element: <VerifyEmailPage /> },
          { path: APP_ROUTES.login, element: <LoginPage /> },
          { path: APP_ROUTES.forgotPassword, element: <ForgotPasswordPage /> },
          { path: APP_ROUTES.resetPassword, element: <ResetPasswordPage /> },
        ],
      },
      {
        element: <PublicLayout />,
        children: [
          { index: true, element: <HomePage /> },
          { path: APP_ROUTES.doctors, element: <DoctorListPage /> },
          { path: APP_ROUTES.doctorDetail, element: <DoctorDetailPage /> },
          { path: APP_ROUTES.specialties, element: <SpecialtyListPage /> },
          { path: APP_ROUTES.specialtyDetail, element: <SpecialtyDetailPage /> },
          { path: APP_ROUTES.blogs, element: <BlogListPage /> },
          { path: APP_ROUTES.blogDetail, element: <BlogDetailPage /> },
          { path: APP_ROUTES.about, element: <AboutPage /> },
          { path: APP_ROUTES.contact, element: <ContactPage /> },
          { path: APP_ROUTES.faq, element: <FAQPage /> },
          { path: APP_ROUTES.booking, element: <BookingWizardPage /> },
        ],
      },
      {
        element: <ProtectedRoute allowedRoles={['PATIENT']} />,
        children: [
          {
            path: APP_ROUTES.patientRoot,
            element: <DashboardLayout />,
            children: [
              { index: true, element: <PatientDashboard /> },
              { path: 'lich-hen', element: <PatientAppointments /> },
              { path: 'nguoi-than', element: <PatientRelatives /> },
              { path: 'thong-tin-ca-nhan', element: <PatientProfilePage /> },
            ],
          },
        ],
      },
      {
        element: <ProtectedRoute allowedRoles={['DOCTOR']} />,
        children: [
          {
            path: APP_ROUTES.doctorRoot,
            element: <DashboardLayout />,
            children: [
              { index: true, element: <DoctorDashboardPage /> },
              { path: 'lich-hen', element: <DoctorAppointmentListPage /> },
              { path: 'lich-lam-viec', element: <DoctorWorkSchedulePage /> },
              { path: 'tin-nhan', element: <DoctorChatPage /> },
              { path: 'thong-tin-ca-nhan', element: <DoctorProfilePage /> },
            ],
          },
        ],
      },
      {
        element: <ProtectedRoute allowedRoles={['RECEPTIONIST']} />,
        children: [
          {
            path: APP_ROUTES.receptionistRoot,
            element: <DashboardLayout />,
            children: [
              { index: true, element: <ReceptionistDashboardPage /> },
              { path: 'lich-hen', element: <ReceptionistAppointmentManagementPage /> },
              { path: 'dat-lich', element: <ReceptionistBookingPage /> },
              { path: 'lich-bac-si', element: <ReceptionistDoctorSchedulePage /> },
              { path: 'thong-tin-ca-nhan', element: <ReceptionistProfilePage /> },
            ],
          },
        ],
      },
      {
        element: <ProtectedRoute allowedRoles={['ADMIN']} />,
        children: [
          {
            path: APP_ROUTES.adminRoot,
            element: <DashboardLayout />,
            children: [
              { index: true, element: <AdminDashboardPage /> },
              { path: 'bac-si', element: <AdminDoctorManagementPage /> },
              { path: 'lich-lam-viec', element: <AdminScheduleManagementPage /> },
              { path: 'duyet-yeu-cau', element: <AdminApprovalRequestsPage /> },
              { path: 'nguoi-dung', element: <AdminUserManagementPage /> },
              { path: 'lich-hen', element: <AdminAppointmentManagementPage /> },
            ],
          },
        ],
      },
      {
        path: '*',
        element: <NotFoundPage />,
      },
    ],
  },
]);
