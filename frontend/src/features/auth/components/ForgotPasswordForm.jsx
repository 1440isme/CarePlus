import { useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'react-router-dom';
import { forgotPasswordSchema } from '../schemas/auth.schema.js';
import { useForgotPassword } from '../hooks/useForgotPassword.js';

const iconEmail = 'https://www.figma.com/api/mcp/asset/58852653-03da-4250-a797-5c02b47736c6';

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
    <form className="auth-register-form" onSubmit={handleSubmit(submitHandler)} noValidate>
      <div className="auth-form-field auth-form-field-last">
        <label className="auth-form-label" htmlFor="forgot-password-email">Email đăng ký</label>
        <div className="auth-input-shell">
          <img className="auth-input-icon" src={iconEmail} alt="" aria-hidden="true" />
          <input
            id="forgot-password-email"
            className="auth-input"
            type="email"
            placeholder="email@example.com"
            autoComplete="email"
            {...register('email')}
          />
        </div>
        {errors.email ? <p className="auth-field-error">{errors.email.message}</p> : null}
      </div>

      {forgotPasswordMutation.error ? (
        <p className="auth-submit-error">{forgotPasswordErrorMessage}</p>
      ) : null}

      {forgotPasswordMutation.isSuccess ? (
        <p className="auth-submit-success">
          Nếu email tồn tại trong hệ thống, hướng dẫn đặt lại mật khẩu đã được gửi.
        </p>
      ) : null}

      <button className="auth-submit-button" type="submit" disabled={forgotPasswordMutation.isPending}>
        {forgotPasswordMutation.isPending ? 'Đang gửi yêu cầu...' : 'Gửi link đặt lại mật khẩu'}
      </button>

      <p className="auth-register-footnote">
        <Link to="/dang-nhap">Quay về đăng nhập</Link>
      </p>
    </form>
  );
}
