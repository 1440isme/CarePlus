import { z } from 'zod';
import {
  PATIENT_PROFILE_GENDER_OPTIONS,
  PATIENT_PROFILE_RELATIONSHIP_OPTIONS,
} from '../types/patient-profile.types.js';

const vietnamPhoneRegex = /^(0|\+84)(3|5|7|8|9)\d{8}$/;
const dateOfBirthRegex = /^\d{4}-\d{2}-\d{2}$/;
const validGenderValues = PATIENT_PROFILE_GENDER_OPTIONS.map((option) => option.value);
const validRelationshipValues = PATIENT_PROFILE_RELATIONSHIP_OPTIONS.map((option) => option.value);

function isValidDateOfBirth(value) {
  if (!dateOfBirthRegex.test(value)) {
    return false;
  }

  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(year, month - 1, day);

  if (
    Number.isNaN(date.getTime())
    || date.getDate() !== day
    || date.getMonth() !== month - 1
    || date.getFullYear() !== year
  ) {
    return false;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  date.setHours(0, 0, 0, 0);

  return date.getTime() <= today.getTime();
}

const basePatientProfileSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(1, 'Họ và tên không được để trống')
    .max(100, 'Họ và tên tối đa 100 ký tự'),
  phone: z
    .string()
    .trim()
    .regex(vietnamPhoneRegex, 'Số điện thoại không hợp lệ'),
  gender: z
    .string()
    .trim()
    .refine((value) => validGenderValues.includes(value), 'Giới tính không hợp lệ'),
  dateOfBirth: z
    .string()
    .trim()
    .regex(dateOfBirthRegex, 'Ngày sinh phải theo định dạng YYYY-MM-DD')
    .refine(isValidDateOfBirth, 'Ngày sinh không hợp lệ'),
  relationship: z
    .string()
    .trim()
    .refine((value) => validRelationshipValues.includes(value), 'Quan hệ không hợp lệ'),
  address: z
    .string()
    .trim()
    .max(500, 'Địa chỉ tối đa 500 ký tự')
    .optional()
    .or(z.literal('')),
}).strict();

export const patientProfileSchema = basePatientProfileSchema;
export const createPatientProfileSchema = basePatientProfileSchema;
export const updatePatientProfileSchema = basePatientProfileSchema;
