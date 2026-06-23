import { useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'react-router-dom';
import { Mail, AlertCircle, CheckCircle } from 'lucide-react';
import { forgotPasswordSchema } from '../schemas/auth.schema.js';
import { useForgotPassword } from '../hooks/useForgotPassword.js';

function getForgotPasswordErrorMessage(error) {
  switch (error?.code) {
    case 'TOO_MANY_REQUESTS':
      return 'Bạn đã gửi yêu cầu quá nhiều lần. Vui lòng thử lại sau';
    case 'FORGOT_PASSWORD_FAILED':
      return 'Không thể xử lý yêu cầu quên mật khẩu';
    default:
      return error?.message ?? 'Có lỗi xảy ra trên hệ thống';
  }
}

export default function ForgotPasswordForm({ defaultValues = { email: '' }, onSuccess }) {
  const forgotPasswordMutation = useForgotPassword({ onSuccess });
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues,
  });

  const forgotPasswordErrorMessage = useMemo(
    () => getForgotPasswordErrorMessage(forgotPasswordMutation.error),
    [forgotPasswordMutation.error],
  );

  const submitHandler = (values) => {
    forgotPasswordMutation.mutate(values);
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit(submitHandler)} noValidate>
      {forgotPasswordMutation.error ? (
        <div className="flex items-center gap-2 p-3 bg-red-50 rounded-lg text-sm text-red-600">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{forgotPasswordErrorMessage}</span>
        </div>
      ) : null}

      {forgotPasswordMutation.isSuccess ? (
        <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg text-sm text-green-600">
          <CheckCircle className="w-4 h-4 flex-shrink-0" />
          <span>Nếu email tồn tại trong hệ thống, hướng dẫn đặt lại mật khẩu đã được gửi.</span>
        </div>
      ) : null}

      <div>
        <label className="block text-sm text-gray-600 mb-1.5 font-medium" htmlFor="forgot-password-email">
          Email đăng ký
        </label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            id="forgot-password-email"
            type="email"
            placeholder="email@example.com"
            autoComplete="email"
            className={`w-full pl-10 pr-4 py-3 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 ${
              errors.email ? 'border-red-500' : 'border-gray-200'
            }`}
            {...register('email')}
          />
        </div>
        {errors.email ? <p className="text-red-500 text-xs mt-1">{errors.email.message}</p> : null}
      </div>

      <button
        className="w-full py-3 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
        type="submit"
        disabled={forgotPasswordMutation.isPending}
      >
        {forgotPasswordMutation.isPending ? 'Đang gửi yêu cầu...' : 'Gửi link đặt lại mật khẩu'}
      </button>

      <p className="text-center text-sm text-gray-500 mt-4">
        <Link to="/dang-nhap" className="text-cyan-600 font-medium hover:underline">Quay về đăng nhập</Link>
      </p>
    </form>
  );
}
