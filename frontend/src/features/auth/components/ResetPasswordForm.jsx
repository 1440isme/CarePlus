import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Key, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { resetPasswordSchema } from '../schemas/auth.schema.js';
import { useResetPassword } from '../hooks/useResetPassword.js';
import { getAuthInputClassName } from './authFieldClassName.js';

function getResetPasswordErrorMessage(error) {
  switch (error?.code) {
    case 'RESET_TOKEN_EXPIRED_OR_NOT_FOUND':
      return 'Mã đặt lại mật khẩu đã hết hạn hoặc không tồn tại';
    case 'INVALID_RESET_TOKEN':
      return 'Mã đặt lại mật khẩu không hợp lệ';
    case 'RESET_PASSWORD_FAILED':
      return 'Đặt lại mật khẩu thất bại';
    default:
      return error?.message ?? 'Có lỗi xảy ra trên hệ thống';
  }
}

export default function ResetPasswordForm({
  defaultValues = {
    email: '',
    token: '',
    newPassword: '',
    confirmPassword: '',
  },
  onSuccess,
}) {
  const navigate = useNavigate();
  const [isNewPasswordVisible, setIsNewPasswordVisible] = useState(false);
  const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] = useState(false);
  const hasPrefilledToken = Boolean(defaultValues.token);
  const resetPasswordMutation = useResetPassword({
    onSuccess: (response, variables, context) => {
      onSuccess?.(response, variables, context);
      navigate('/dang-nhap?reset=success', { replace: true });
    },
  });
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues,
  });

  const resetPasswordErrorMessage = useMemo(
    () => getResetPasswordErrorMessage(resetPasswordMutation.error),
    [resetPasswordMutation.error],
  );

  const submitHandler = (values) => {
    const { confirmPassword, ...payload } = values;
    void confirmPassword;
    resetPasswordMutation.mutate(payload);
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit(submitHandler)} noValidate>
      {resetPasswordMutation.error ? (
        <div className="flex items-center gap-2 p-3 bg-red-50 rounded-lg text-sm text-red-600">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{resetPasswordErrorMessage}</span>
        </div>
      ) : null}

      <div>
        <label className="block text-sm text-gray-600 mb-1.5 font-medium" htmlFor="reset-password-email">
          Email đăng ký
        </label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            id="reset-password-email"
            type="email"
            placeholder="email@example.com"
            autoComplete="email"
            className={getAuthInputClassName({ hasError: Boolean(errors.email) })}
            {...register('email')}
          />
        </div>
        {errors.email ? <p className="text-red-500 text-xs mt-1">{errors.email.message}</p> : null}
      </div>

      {!hasPrefilledToken ? (
        <div>
          <label className="block text-sm text-gray-600 mb-1.5 font-medium" htmlFor="reset-password-token">
            Token đặt lại mật khẩu
          </label>
          <div className="relative">
            <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              id="reset-password-token"
              type="text"
              placeholder="Nhập token đặt lại mật khẩu"
              autoComplete="off"
            className={getAuthInputClassName({ hasError: Boolean(errors.token) })}
              {...register('token')}
            />
          </div>
          {errors.token ? <p className="text-red-500 text-xs mt-1">{errors.token.message}</p> : null}
        </div>
      ) : null}

      <div>
        <label className="block text-sm text-gray-600 mb-1.5 font-medium" htmlFor="reset-password-new-password">
          Mật khẩu mới
        </label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            id="reset-password-new-password"
            type={isNewPasswordVisible ? 'text' : 'password'}
            placeholder="Tối thiểu 6 ký tự"
            autoComplete="new-password"
            className={getAuthInputClassName({
              hasError: Boolean(errors.newPassword),
              hasTrailingIcon: true,
            })}
            {...register('newPassword')}
          />
          <button
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
            type="button"
            onClick={() => setIsNewPasswordVisible((currentValue) => !currentValue)}
            aria-label={isNewPasswordVisible ? 'Ẩn mật khẩu mới' : 'Hiện mật khẩu mới'}
          >
            {isNewPasswordVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        {errors.newPassword ? <p className="text-red-500 text-xs mt-1">{errors.newPassword.message}</p> : null}
      </div>

      <div>
        <label className="block text-sm text-gray-600 mb-1.5 font-medium" htmlFor="reset-password-confirm-password">
          Xác nhận mật khẩu mới
        </label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            id="reset-password-confirm-password"
            type={isConfirmPasswordVisible ? 'text' : 'password'}
            placeholder="Nhập lại mật khẩu mới"
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
            onClick={() => setIsConfirmPasswordVisible((currentValue) => !currentValue)}
            aria-label={isConfirmPasswordVisible ? 'Ẩn xác nhận mật khẩu mới' : 'Hiện xác nhận mật khẩu mới'}
          >
            {isConfirmPasswordVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        {errors.confirmPassword ? <p className="text-red-500 text-xs mt-1">{errors.confirmPassword.message}</p> : null}
      </div>

      <button
        className="w-full py-3 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
        type="submit"
        disabled={resetPasswordMutation.isPending}
      >
        {resetPasswordMutation.isPending ? 'Đang đặt lại mật khẩu...' : 'Đặt lại mật khẩu'}
      </button>

      <p className="text-center text-sm text-gray-500 mt-4">
        <Link to="/dang-nhap" className="text-cyan-600 font-medium hover:underline">Quay về đăng nhập</Link>
      </p>
    </form>
  );
}
