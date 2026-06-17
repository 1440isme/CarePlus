import { z } from 'zod';

const vietnamPhoneRegex = /^(0|\+84)(3|5|7|8|9)\d{8}$/;

export const loginSchema = z.object({
  email: z.string().trim().email('Email không hợp lệ'),
  password: z.string().trim().min(1, 'Mật khẩu không được để trống'),
});

export const registerSchema = z.object({
  name: z.string().trim().min(1, 'Họ tên không được để trống').max(100, 'Họ tên tối đa 100 ký tự'),
  email: z.string().trim().email('Email không hợp lệ'),
  phone: z.string().trim().regex(vietnamPhoneRegex, 'Số điện thoại không hợp lệ'),
  password: z.string().min(6, 'Mật khẩu phải có ít nhất 6 ký tự'),
  confirmPassword: z.string().min(6, 'Xác nhận mật khẩu phải có ít nhất 6 ký tự'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Xác nhận mật khẩu không khớp',
  path: ['confirmPassword'],
});

export const verifyEmailSchema = z.object({
  email: z.string().trim().email('Email không hợp lệ'),
  otp: z.string().trim().regex(/^\d{6}$/, 'Mã OTP phải gồm 6 chữ số'),
});

export const resendVerificationOtpSchema = z.object({
  email: z.string().trim().email('Email không hợp lệ'),
});

export const forgotPasswordSchema = z.object({
  email: z.string().trim().email('Email không hợp lệ'),
});

export const resetPasswordSchema = z.object({
  email: z.string().trim().email('Email không hợp lệ'),
  token: z.string().trim().min(1, 'Token đặt lại mật khẩu là bắt buộc'),
  newPassword: z.string().min(6, 'Mật khẩu mới phải có ít nhất 6 ký tự'),
  confirmPassword: z.string().min(6, 'Xác nhận mật khẩu phải có ít nhất 6 ký tự'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Xác nhận mật khẩu không khớp',
  path: ['confirmPassword'],
});
