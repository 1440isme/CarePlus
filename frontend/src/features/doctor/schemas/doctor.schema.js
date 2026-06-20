import { z } from 'zod';

export const doctorProfileSchema = z.object({
  name: z.string().trim().min(1, 'Vui lòng nhập họ tên'),
  phone: z.string().trim().min(10, 'Số điện thoại không hợp lệ'),
  title: z.string().trim().min(1, 'Vui lòng nhập học vị'),
  experience: z.coerce.number().int().min(0, 'Số năm kinh nghiệm phải từ 0 trở lên'),
  description: z.string().trim().min(1, 'Vui lòng nhập giới thiệu'),
  position: z.string().trim().min(1, 'Vui lòng nhập chức vụ'),
});
