import { useMemo, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, AlertCircle, ArrowRight } from 'lucide-react';
import { loginSchema } from '../schemas/auth.schema.js';
import { useLogin } from '../hooks/useLogin.js';

function getLoginErrorMessage(error) {
  switch (error?.code) {
    case 'INVALID_CREDENTIALS':
      return 'Email hoặc mật khẩu không chính xác';
    case 'ACCOUNT_LOCKED':
      return 'Tài khoản đã bị khóa';
    case 'EMAIL_NOT_VERIFIED':
      return 'Email chưa được xác minh';
    default:
      return error?.message ?? 'Có lỗi xảy ra trên hệ thống';
  }
}

export default function LoginForm({
  defaultValues = {
    email: '',
    password: '',
    rememberMe: false,
  },
  onSuccess,
}) {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const loginMutation = useLogin({ onSuccess });
  const {
    control,
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues,
  });

  const currentEmail = useWatch({
    control,
    name: 'email',
  });
  
  const loginErrorMessage = useMemo(
    () => getLoginErrorMessage(loginMutation.error),
    [loginMutation.error],
  );

  const submitHandler = (values) => {
    loginMutation.mutate(values);
  };

  return (
    <div className="space-y-6">
      <form className="space-y-4" onSubmit={handleSubmit(submitHandler)} noValidate>
        {loginMutation.error ? (
          <div className="flex items-center gap-2 p-3 bg-red-50 rounded-lg text-sm text-red-600">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <div className="flex-1">
              <span>{loginErrorMessage}</span>
              {loginMutation.error.code === 'EMAIL_NOT_VERIFIED' && currentEmail && (
                <Link
                  className="underline ml-2 font-medium"
                  to={`/xac-minh-email?email=${encodeURIComponent(currentEmail.trim())}`}
                >
                  Xác minh ngay
                </Link>
              )}
            </div>
          </div>
        ) : null}

        <div>
          <label className="block text-sm text-gray-600 mb-1.5 font-medium" htmlFor="login-email">
            Email
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              id="login-email"
              type="email"
              placeholder="email@example.com"
              autoComplete="email"
              className={`w-full pl-10 pr-4 py-3 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 ${
                errors.email ? 'border-red-500' : 'border-gray-200'
              }`}
              {...register('register_email', { value: '' })} // bypass autocomplete issues if needed or standard register
              {...register('email')}
            />
          </div>
          {errors.email ? <p className="text-red-500 text-xs mt-1">{errors.email.message}</p> : null}
        </div>

        <div>
          <div className="flex justify-between items-center mb-1.5">
            <label className="text-sm text-gray-600 font-medium" htmlFor="login-password">
              Mật khẩu
            </label>
            <Link className="text-xs text-cyan-600 hover:underline" to="/quen-mat-khau">
              Quên mật khẩu?
            </Link>
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              id="login-password"
              type={isPasswordVisible ? 'text' : 'password'}
              placeholder="Nhập mật khẩu"
              autoComplete="current-password"
              className={`w-full pl-10 pr-10 py-3 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 ${
                errors.password ? 'border-red-500' : 'border-gray-200'
              }`}
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

        <div className="flex items-center">
          <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer" htmlFor="login-remember-me">
            <input
              id="login-remember-me"
              type="checkbox"
              className="w-4 h-4 rounded border-gray-300 text-cyan-600 focus:ring-cyan-500"
              {...register('rememberMe')}
            />
            <span>Ghi nhớ đăng nhập</span>
          </label>
        </div>

        <button
          className="w-full py-3 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
          type="submit"
          disabled={loginMutation.isPending}
        >
          <span>{loginMutation.isPending ? 'Đang đăng nhập...' : 'Đăng nhập'}</span>
          {!loginMutation.isPending && <ArrowRight className="w-4 h-4" />}
        </button>
      </form>
      <p className="text-center text-sm text-gray-500 mt-4">
        Chưa có tài khoản?{' '}
        <Link className="text-cyan-600 font-semibold hover:underline" to="/dang-ky">
          Đăng ký ngay
        </Link>
      </p>
    </div>
  );
}
