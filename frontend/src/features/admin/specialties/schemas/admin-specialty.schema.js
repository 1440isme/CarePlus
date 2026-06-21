import { z } from 'zod';

export const specialtyFormSchema = z.object({
  name: z.string()
    .trim()
    .min(1, 'Tên chuyên khoa là bắt buộc')
    .max(100, 'Tên chuyên khoa tối đa 100 ký tự'),
  description: z.string()
    .trim()
    .max(5000, 'Mô tả tối đa 5000 ký tự'),
  active: z.boolean(),
});

export const createSpecialtySchema = specialtyFormSchema;
export const updateSpecialtySchema = specialtyFormSchema;
