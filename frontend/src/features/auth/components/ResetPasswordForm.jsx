import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import { resetPasswordSchema } from '../schemas/auth.schema.js';
import { useResetPassword } from '../hooks/useResetPassword.js';

const iconEmail = 'https://www.figma.com/api/mcp/asset/58852653-03da-4250-a797-5c02b47736c6';
const iconKey = 'https://www.figma.com/api/mcp/asset/87629d8e-93a6-4126-b006-03d335d084b4';
const iconLock = 'https://www.figma.com/api/mcp/asset/68cfcdab-3dc5-4e97-8d07-a59eabbbef36';
const iconEye = 'https://www.figma.com/api/mcp/asset/cf6589bb-d7c6-401a-bfcf-4a673bb94b7a';

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
    <form className="auth-register-form" onSubmit={handleSubmit(submitHandler)} noValidate>
      <div className="auth-form-field">
        <label className="auth-form-label" htmlFor="reset-password-email">Email đăng ký</label>
        <div className="auth-input-shell">
          <img className="auth-input-icon" src={iconEmail} alt="" aria-hidden="true" />
          <input
            id="reset-password-email"
            className="auth-input"
            type="email"
            placeholder="email@example.com"
            autoComplete="email"
            {...register('email')}
          />
        </div>
        {errors.email ? <p className="auth-field-error">{errors.email.message}</p> : null}
      </div>

      {!hasPrefilledToken ? (
        <div className="auth-form-field">
          <label className="auth-form-label" htmlFor="reset-password-token">Token đặt lại mật khẩu</label>
          <div className="auth-input-shell">
            <img className="auth-input-icon" src={iconKey} alt="" aria-hidden="true" />
            <input
              id="reset-password-token"
              className="auth-input"
              type="text"
              placeholder="Nhập token đặt lại mật khẩu"
              autoComplete="off"
              {...register('token')}
            />
          </div>
          {errors.token ? <p className="auth-field-error">{errors.token.message}</p> : null}
        </div>
      ) : null}

      <div className="auth-form-field">
        <label className="auth-form-label" htmlFor="reset-password-new-password">Mật khẩu mới</label>
        <div className="auth-input-shell auth-input-shell-with-action">
          <img className="auth-input-icon" src={iconLock} alt="" aria-hidden="true" />
          <input
            id="reset-password-new-password"
            className="auth-input"
            type={isNewPasswordVisible ? 'text' : 'password'}
            placeholder="Tối thiểu 6 ký tự"
            autoComplete="new-password"
            {...register('newPassword')}
          />
          <button
            className={`auth-input-action ${isNewPasswordVisible ? '' : 'auth-input-action--hidden'}`.trim()}
            type="button"
            onClick={() => setIsNewPasswordVisible((currentValue) => !currentValue)}
            aria-label={isNewPasswordVisible ? 'Ẩn mật khẩu mới' : 'Hiện mật khẩu mới'}
          >
            <img src={iconEye} alt="" />
          </button>
        </div>
        {errors.newPassword ? <p className="auth-field-error">{errors.newPassword.message}</p> : null}
      </div>

      <div className="auth-form-field auth-form-field-last">
        <label className="auth-form-label" htmlFor="reset-password-confirm-password">Xác nhận mật khẩu mới</label>
        <div className="auth-input-shell auth-input-shell-with-action">
          <img className="auth-input-icon" src={iconLock} alt="" aria-hidden="true" />
          <input
            id="reset-password-confirm-password"
            className="auth-input"
            type={isConfirmPasswordVisible ? 'text' : 'password'}
            placeholder="Nhập lại mật khẩu mới"
            autoComplete="new-password"
            {...register('confirmPassword')}
          />
          <button
            className={`auth-input-action ${isConfirmPasswordVisible ? '' : 'auth-input-action--hidden'}`.trim()}
            type="button"
            onClick={() => setIsConfirmPasswordVisible((currentValue) => !currentValue)}
            aria-label={isConfirmPasswordVisible ? 'Ẩn xác nhận mật khẩu mới' : 'Hiện xác nhận mật khẩu mới'}
          >
            <img src={iconEye} alt="" />
          </button>
        </div>
        {errors.confirmPassword ? <p className="auth-field-error">{errors.confirmPassword.message}</p> : null}
      </div>

      {resetPasswordMutation.error ? (
        <p className="auth-submit-error">{resetPasswordErrorMessage}</p>
      ) : null}

      <button className="auth-submit-button" type="submit" disabled={resetPasswordMutation.isPending}>
        {resetPasswordMutation.isPending ? 'Đang đặt lại mật khẩu...' : 'Đặt lại mật khẩu'}
      </button>

      <p className="auth-register-footnote">
        <Link to="/dang-nhap">Quay về đăng nhập</Link>
      </p>
    </form>
  );
}
