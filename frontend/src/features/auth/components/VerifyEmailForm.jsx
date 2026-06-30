import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, AlertCircle, CheckCircle } from 'lucide-react';
import { verifyEmailSchema } from '../schemas/auth.schema.js';
import { useVerifyEmail } from '../hooks/useVerifyEmail.js';
import { useResendVerificationOtp } from '../hooks/useResendVerificationOtp.js';
import { getAuthInputClassName } from './authFieldClassName.js';

function getVerifyErrorMessage(error) {
  switch (error?.code) {
    case 'INVALID_OTP':
      return 'Mã OTP không chính xác';
    case 'OTP_EXPIRED_OR_NOT_FOUND':
      return 'Mã OTP đã hết hạn hoặc không tồn tại';
    case 'EMAIL_ALREADY_VERIFIED':
      return 'Email này đã được xác minh trước đó';
    case 'USER_NOT_FOUND':
      return 'Không tìm thấy tài khoản với email này';
    default:
      return error?.message ?? 'Có lỗi xảy ra trên hệ thống';
  }
}

function getResendErrorMessage(error) {
  switch (error?.code) {
    case 'TOO_MANY_OTP_REQUESTS':
      return 'Bạn đã yêu cầu OTP quá nhiều lần. Vui lòng thử lại sau';
    case 'EMAIL_ALREADY_VERIFIED':
      return 'Email này đã được xác minh trước đó';
    case 'USER_NOT_FOUND':
      return 'Không tìm thấy tài khoản với email này';
    default:
      return error?.message ?? 'Không thể gửi lại mã OTP';
  }
}

export default function VerifyEmailForm({ defaultValues = { email: '', otp: '' }, onSuccess }) {
  const navigate = useNavigate();
  const [resendSuccessMessage, setResendSuccessMessage] = useState('');
  const verifyEmailMutation = useVerifyEmail({
    onSuccess: (response, variables, context) => {
      onSuccess?.(response, variables, context);
      navigate('/dang-nhap');
    },
  });
  const resendVerificationOtpMutation = useResendVerificationOtp({
    onSuccess: () => {
      setResendSuccessMessage('Mã OTP mới đã được gửi');
    },
  });
  const {
    register,
    handleSubmit,
    getValues,
    trigger,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(verifyEmailSchema),
    defaultValues,
  });

  const verifyErrorMessage = useMemo(
    () => getVerifyErrorMessage(verifyEmailMutation.error),
    [verifyEmailMutation.error],
  );

  const resendErrorMessage = useMemo(
    () => getResendErrorMessage(resendVerificationOtpMutation.error),
    [resendVerificationOtpMutation.error],
  );

  const submitHandler = (values) => {
    setResendSuccessMessage('');
    verifyEmailMutation.mutate(values);
  };

  const resendHandler = async () => {
    const isEmailValid = await trigger('email');

    if (!isEmailValid) {
      return;
    }

    setResendSuccessMessage('');
    resendVerificationOtpMutation.mutate({
      email: getValues('email'),
    });
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit(submitHandler)} noValidate>
      {verifyEmailMutation.error ? (
        <div className="flex items-center gap-2 p-3 bg-red-50 rounded-lg text-sm text-red-600">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{verifyErrorMessage}</span>
        </div>
      ) : null}

      {resendVerificationOtpMutation.error ? (
        <div className="flex items-center gap-2 p-3 bg-red-50 rounded-lg text-sm text-red-600">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{resendErrorMessage}</span>
        </div>
      ) : null}

      {resendSuccessMessage ? (
        <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg text-sm text-green-600">
          <CheckCircle className="w-4 h-4 flex-shrink-0" />
          <span>{resendSuccessMessage}</span>
        </div>
      ) : null}

      <div>
        <label className="block text-sm text-gray-600 mb-1.5 font-medium" htmlFor="verify-email">
          Email đăng ký
        </label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            id="verify-email"
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
        <label className="block text-sm text-gray-600 mb-1.5 font-medium" htmlFor="verify-otp">
          Mã OTP
        </label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            id="verify-otp"
            type="text"
            placeholder="Nhập 6 chữ số"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            className={getAuthInputClassName({ hasError: Boolean(errors.otp) })}
            {...register('otp')}
          />
        </div>
        {errors.otp ? <p className="text-red-500 text-xs mt-1">{errors.otp.message}</p> : null}
      </div>

      <div className="pt-2 space-y-2">
        <button
          className="w-full py-3 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
          type="submit"
          disabled={verifyEmailMutation.isPending}
        >
          {verifyEmailMutation.isPending ? 'Đang xác minh...' : 'Xác minh email'}
        </button>

        <button
          className="w-full py-3 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
          type="button"
          onClick={resendHandler}
          disabled={resendVerificationOtpMutation.isPending}
        >
          {resendVerificationOtpMutation.isPending ? 'Đang gửi lại...' : 'Gửi lại mã OTP'}
        </button>
      </div>

      <p className="text-center text-sm text-gray-500 mt-4">
        Đã có tài khoản?{' '}
        <Link to="/dang-nhap" className="text-cyan-600 font-medium hover:underline">Đăng nhập</Link>
      </p>
    </form>
  );
}
