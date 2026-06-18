import { z } from 'zod';

const vietnamPhoneRegex = /^(0|\+84)(3|5|7|8|9)\d{8}$/;

export const updateMeSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Họ tên không được để trống')
    .max(100, 'Họ tên tối đa 100 ký tự'),
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
    .regex(/^\d{2}\/\d{2}\/\d{4}$/, 'Ngày sinh phải theo định dạng DD/MM/YYYY'),
  address: z
    .string()
    .trim()
    .min(1, 'Địa chỉ không được để trống')
    .max(255, 'Địa chỉ tối đa 255 ký tự'),
});
