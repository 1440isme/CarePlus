export const APP_ROUTES = {
  home: '/',
  doctors: '/bac-si',
  doctorDetail: '/bac-si/:id',
  specialties: '/chuyen-khoa',
  specialtyDetail: '/chuyen-khoa/:slug',
  blogs: '/cam-nang',
  blogDetail: '/cam-nang/:slug',
  about: '/ve-chung-toi',
  contact: '/lien-he',
  faq: '/faq',
  booking: '/dat-lich',
  login: '/dang-nhap',
  register: '/dang-ky',
  forgotPassword: '/quen-mat-khau',
  resetPassword: '/dat-lai-mat-khau',
  verifyEmail: '/xac-minh-email',
  patientRoot: '/benh-nhan',
  doctorRoot: '/portal/bac-si',
  receptionistRoot: '/portal/le-tan',
  adminRoot: '/portal/admin',
};

export const ROLE_HOME_ROUTES = {
  PATIENT: APP_ROUTES.home,
  DOCTOR: APP_ROUTES.doctorRoot,
  RECEPTIONIST: APP_ROUTES.receptionistRoot,
  ADMIN: APP_ROUTES.adminRoot,
};
