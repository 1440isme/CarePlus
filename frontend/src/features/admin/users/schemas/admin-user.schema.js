import { z } from 'zod';

const vietnamPhoneRegex = /^(0|\+84)(3|5|7|8|9)\d{8}$/;
const dateOfBirthRegex = /^\d{4}-\d{2}-\d{2}$/;

function isValidPastDate(value) {
  if (!dateOfBirthRegex.test(value)) {
    return false;
  }

  const [year, month, day] = value.split('-').map(Number);
  const parsedDate = new Date(Date.UTC(year, month - 1, day));

  return parsedDate.getUTCFullYear() === year
    && parsedDate.getUTCMonth() === month - 1
    && parsedDate.getUTCDate() === day
    && parsedDate.getTime() <= Date.now();
}

export const adminUserEditSchema = z.object({
  name: z.string()
    .trim()
    .min(1, 'Họ tên không được để trống')
    .max(100, 'Họ tên tối đa 100 ký tự'),
  phone: z.string()
    .trim()
    .regex(vietnamPhoneRegex, 'Số điện thoại chưa đúng định dạng Việt Nam'),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']),
  dateOfBirth: z.string()
    .trim()
    .refine(isValidPastDate, 'Ngày sinh phải theo định dạng YYYY-MM-DD và không vượt quá hiện tại'),
  address: z.string()
    .trim()
    .max(255, 'Địa chỉ tối đa 255 ký tự')
    .optional()
    .or(z.literal('')),
}).strict();

export const adminStaffCreateSchema = z.object({
  role: z.enum(['DOCTOR', 'RECEPTIONIST', 'ADMIN'], {
    errorMap: () => ({ message: 'Vui lòng chọn vai trò' }),
  }),
  name: z.string()
    .trim()
    .max(100, 'Họ tên tối đa 100 ký tự')
    .optional()
    .or(z.literal('')),
  email: z.string()
    .trim()
    .email('Email chưa đúng định dạng'),
  phone: z.string()
    .trim()
    .regex(vietnamPhoneRegex, 'Số điện thoại chưa đúng định dạng Việt Nam'),
  temporaryPassword: z.string()
    .trim()
    .min(6, 'Mật khẩu tạm tối thiểu 6 ký tự'),
  status: z.enum(['ACTIVE', 'LOCKED'], {
    errorMap: () => ({ message: 'Vui lòng chọn trạng thái' }),
  }),
  doctorName: z.string().trim().optional().or(z.literal('')),
  specialty: z.string().trim().optional().or(z.literal('')),
  academicTitle: z.string().trim().optional().or(z.literal('')),
  yearsOfExperience: z.string().trim().optional().or(z.literal('')),
  consultationFee: z.string().trim().optional().or(z.literal('')),
  avatarUrl: z.string().trim().optional().or(z.literal('')),
}).superRefine((value, ctx) => {
  if (value.role !== 'DOCTOR' && !value.name) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['name'],
      message: 'Họ tên không được để trống',
    });
  }

  if (value.role !== 'DOCTOR') {
    return;
  }

  if (!value.doctorName) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['doctorName'],
      message: 'Vui lòng nhập họ tên bác sĩ',
    });
  }

  if (!value.specialty) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['specialty'],
      message: 'Vui lòng chọn chuyên khoa',
    });
  }

  if (!value.academicTitle) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['academicTitle'],
      message: 'Vui lòng chọn học hàm/học vị',
    });
  }
}).strict();
