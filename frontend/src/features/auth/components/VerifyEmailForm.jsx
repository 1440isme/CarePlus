import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import { verifyEmailSchema } from '../schemas/auth.schema.js';
import { useVerifyEmail } from '../hooks/useVerifyEmail.js';
import { useResendVerificationOtp } from '../hooks/useResendVerificationOtp.js';

const iconEmail = 'https://www.figma.com/api/mcp/asset/58852653-03da-4250-a797-5c02b47736c6';
const iconOtp = 'https://www.figma.com/api/mcp/asset/68cfcdab-3dc5-4e97-8d07-a59eabbbef36';

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
    <form className="auth-register-form" onSubmit={handleSubmit(submitHandler)} noValidate>
      <div className="auth-form-field">
        <label className="auth-form-label" htmlFor="verify-email">Email đăng ký</label>
        <div className="auth-input-shell">
          <img className="auth-input-icon" src={iconEmail} alt="" aria-hidden="true" />
          <input
            id="verify-email"
            className="auth-input"
            type="email"
            placeholder="email@example.com"
            autoComplete="email"
            {...register('email')}
          />
        </div>
        {errors.email ? <p className="auth-field-error">{errors.email.message}</p> : null}
      </div>

      <div className="auth-form-field auth-form-field-last">
        <label className="auth-form-label" htmlFor="verify-otp">Mã OTP</label>
        <div className="auth-input-shell">
          <img className="auth-input-icon" src={iconOtp} alt="" aria-hidden="true" />
          <input
            id="verify-otp"
            className="auth-input"
            type="text"
            placeholder="Nhập 6 chữ số"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            {...register('otp')}
          />
        </div>
        {errors.otp ? <p className="auth-field-error">{errors.otp.message}</p> : null}
      </div>

      {verifyEmailMutation.error ? (
        <p className="auth-submit-error">{verifyErrorMessage}</p>
      ) : null}

      {resendVerificationOtpMutation.error ? (
        <p className="auth-submit-error">{resendErrorMessage}</p>
      ) : null}

      {resendSuccessMessage ? (
        <p className="auth-submit-success">{resendSuccessMessage}</p>
      ) : null}

      <button className="auth-submit-button" type="submit" disabled={verifyEmailMutation.isPending}>
        {verifyEmailMutation.isPending ? 'Đang xác minh...' : 'Xác minh email'}
      </button>

      <button
        className="auth-secondary-button"
        type="button"
        onClick={resendHandler}
        disabled={resendVerificationOtpMutation.isPending}
      >
        {resendVerificationOtpMutation.isPending ? 'Đang gửi lại...' : 'Gửi lại mã OTP'}
      </button>

      <p className="auth-register-footnote">
        Đã có tài khoản?{' '}
        <Link to="/dang-nhap">Đăng nhập</Link>
      </p>
    </form>
  );
}
