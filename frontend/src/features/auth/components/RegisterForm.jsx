import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { Eye, EyeOff, Mail, Lock, User, Phone, AlertCircle } from 'lucide-react';
import { registerSchema } from '../schemas/auth.schema.js';
import { useRegister } from '../hooks/useRegister.js';
import { getAuthInputClassName } from './authFieldClassName.js';

export default function RegisterForm({
  defaultValues = {
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  },
  onSuccess: onSuccessProp,
}) {
  const navigate = useNavigate();
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] = useState(false);
  const registerMutation = useRegister({
    onSuccess: (response, variables, context) => {
      const nextEmail = response?.data?.user?.email ?? variables?.email ?? '';

      onSuccessProp?.(response, variables, context);
      navigate(`/xac-minh-email?email=${encodeURIComponent(nextEmail)}`);
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues,
  });

  const submitHandler = (values) => {
    const { confirmPassword, ...payload } = values;
    void confirmPassword;
    registerMutation.mutate(payload);
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit(submitHandler)} noValidate>
      {registerMutation.error ? (
        <div className="flex items-center gap-2 p-3 bg-red-50 rounded-lg text-sm text-red-600">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>
            {registerMutation.error.code === 'EMAIL_ALREADY_EXISTS'
              ? 'Email đã tồn tại trong hệ thống'
              : registerMutation.error.message}
          </span>
        </div>
      ) : null}

      <div>
        <label className="block text-sm text-gray-600 mb-1.5 font-medium" htmlFor="register-name">
          Họ và tên
        </label>
        <div className="relative">
          <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            id="register-name"
            type="text"
            placeholder="Nguyễn Văn A"
            autoComplete="name"
            className={getAuthInputClassName({ hasError: Boolean(errors.name) })}
            {...register('name')}
          />
        </div>
        {errors.name ? <p className="text-red-500 text-xs mt-1">{errors.name.message}</p> : null}
      </div>

      <div>
        <label className="block text-sm text-gray-600 mb-1.5 font-medium" htmlFor="register-email">
          Email
        </label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            id="register-email"
            type="email"
            placeholder="email@example.com"
            autoComplete="email"
            className={getAuthInputClassName({ hasError: Boolean(errors.email) })}
            {...register('email')}
          />
        </div>
        {errors.email ? <p className="text-red-500 text-xs mt-1">{errors.email.message}</p> : null}
      </div>

      <div>
        <label className="block text-sm text-gray-600 mb-1.5 font-medium" htmlFor="register-phone">
          Số điện thoại
        </label>
        <div className="relative">
          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            id="register-phone"
            type="tel"
            placeholder="0901234567"
            autoComplete="tel"
            className={getAuthInputClassName({ hasError: Boolean(errors.phone) })}
            {...register('phone')}
          />
        </div>
        {errors.phone ? <p className="text-red-500 text-xs mt-1">{errors.phone.message}</p> : null}
      </div>

      <div>
        <label className="block text-sm text-gray-600 mb-1.5 font-medium" htmlFor="register-password">
          Mật khẩu
        </label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            id="register-password"
            type={isPasswordVisible ? 'text' : 'password'}
            placeholder="Tối thiểu 8 ký tự"
            autoComplete="new-password"
            className={getAuthInputClassName({
              hasError: Boolean(errors.password),
              hasTrailingIcon: true,
            })}
            {...register('password')}
          />
          <button
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
            type="button"
            onClick={() => setIsPasswordVisible((v) => !v)}
            aria-label={isPasswordVisible ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
          >
            {isPasswordVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        {errors.password ? <p className="text-red-500 text-xs mt-1">{errors.password.message}</p> : null}
      </div>

      <div>
        <label className="block text-sm text-gray-600 mb-1.5 font-medium" htmlFor="register-confirm-password">
          Xác nhận mật khẩu
        </label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            id="register-confirm-password"
            type={isConfirmPasswordVisible ? 'text' : 'password'}
            placeholder="Nhập lại mật khẩu"
            autoComplete="new-password"
            className={getAuthInputClassName({
              hasError: Boolean(errors.confirmPassword),
              hasTrailingIcon: true,
            })}
            {...register('confirmPassword')}
          />
          <button
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
            type="button"
            onClick={() => setIsConfirmPasswordVisible((v) => !v)}
            aria-label={isConfirmPasswordVisible ? 'Ẩn xác nhận mật khẩu' : 'Hiện xác nhận mật khẩu'}
          >
            {isConfirmPasswordVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        {errors.confirmPassword ? <p className="text-red-500 text-xs mt-1">{errors.confirmPassword.message}</p> : null}
      </div>

      <button
        className="w-full py-3 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
        type="submit"
        disabled={registerMutation.isPending}
      >
        {registerMutation.isPending ? 'Đang tạo tài khoản...' : 'Tạo tài khoản'}
      </button>

      <p className="text-center text-sm text-gray-500 mt-4">
        Đã có tài khoản?{' '}
        <Link to="/dang-nhap" className="text-cyan-600 font-medium hover:underline">Đăng nhập</Link>
      </p>
    </form>
  );
}
