import { z } from 'zod';

const hotlineRegex = /^[0-9+\s().-]{8,20}$/;

export const clinicInfoFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Tên phòng khám không được để trống')
    .max(255, 'Tên phòng khám tối đa 255 ký tự'),
  address: z
    .string()
    .trim()
    .min(1, 'Địa chỉ không được để trống')
    .max(1000, 'Địa chỉ tối đa 1000 ký tự'),
  hotline: z
    .string()
    .trim()
    .regex(hotlineRegex, 'Hotline không hợp lệ'),
  email: z
    .string()
    .trim()
    .email('Email không hợp lệ'),
  workingHours: z
    .string()
    .trim()
    .min(1, 'Giờ làm việc không được để trống')
    .max(255, 'Giờ làm việc tối đa 255 ký tự'),
  description: z
    .string()
    .trim()
    .min(1, 'Mô tả không được để trống')
    .max(5000, 'Mô tả tối đa 5000 ký tự'),
}).strict();

export const updateClinicInfoSchema = clinicInfoFormSchema;
