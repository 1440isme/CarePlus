import { z } from 'zod';

const vietnamPhoneRegex = /^(0|\+84)(3|5|7|8|9)\d{8}$/;
const humanNameRegex = /^[\p{L}\s]+$/u;

export const updateMeSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Họ tên không được để trống')
    .max(100, 'Họ tên tối đa 100 ký tự')
    .regex(humanNameRegex, 'Họ tên không được chứa số hoặc ký tự đặc biệt'),
  phone: z
    .string()
    .trim()
    .regex(vietnamPhoneRegex, 'Số điện thoại không hợp lệ'),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER'], {
    message: 'Giới tính không hợp lệ',
  }),
  dateOfBirth: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Ngày sinh phải theo định dạng YYYY-MM-DD'),
  address: z
    .string()
    .trim()
    .min(1, 'Địa chỉ không được để trống')
    .max(255, 'Địa chỉ tối đa 255 ký tự'),
});

export const changePasswordSchema = z.object({
  currentPassword: z
    .string()
    .min(1, 'Mật khẩu hiện tại không được để trống'),
  newPassword: z
    .string()
    .min(6, 'Mật khẩu mới phải có ít nhất 6 ký tự'),
  confirmPassword: z
    .string()
    .min(1, 'Xác nhận mật khẩu không được để trống'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  path: ['confirmPassword'],
  message: 'Xác nhận mật khẩu phải khớp với mật khẩu mới',
});
