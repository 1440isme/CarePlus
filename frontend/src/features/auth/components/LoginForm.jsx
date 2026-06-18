import { useMemo, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'react-router-dom';
import { loginSchema } from '../schemas/auth.schema.js';
import { useLogin } from '../hooks/useLogin.js';

const iconEmail = 'https://www.figma.com/api/mcp/asset/ac3aad8e-1aed-4517-8a03-82ee6d283840';
const iconLock = 'https://www.figma.com/api/mcp/asset/87629d8e-93a6-4126-b006-03d335d084b4';
const iconEye = 'https://www.figma.com/api/mcp/asset/5de5873e-ef3b-4444-b863-5ddce1e4c23e';
const iconArrow = 'https://www.figma.com/api/mcp/asset/f2e1994a-7ecc-4efc-945f-7ff8bc6951bc';

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
  },
  onSuccess,
}) {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const loginMutation = useLogin({ onSuccess });
  const {
    control,
    register,
    handleSubmit,
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
    <form className="auth-register-form auth-login-form" onSubmit={handleSubmit(submitHandler)} noValidate>
      <div className="auth-form-field auth-form-field-login-first">
        <label className="auth-form-label" htmlFor="login-email">Email</label>
        <div className="auth-input-shell">
          <img className="auth-input-icon" src={iconEmail} alt="" aria-hidden="true" />
          <input
            id="login-email"
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
        <div className="auth-form-label-row">
          <label className="auth-form-label auth-form-label-inline" htmlFor="login-password">Mật khẩu</label>
          <Link className="auth-inline-link" to="/quen-mat-khau">
            Quên mật khẩu?
          </Link>
        </div>
        <div className="auth-input-shell auth-input-shell-with-action">
          <img className="auth-input-icon" src={iconLock} alt="" aria-hidden="true" />
          <input
            id="login-password"
            className="auth-input"
            type={isPasswordVisible ? 'text' : 'password'}
            placeholder="Nhập mật khẩu"
            autoComplete="current-password"
            {...register('password')}
          />
          <button
            className={`auth-input-action ${isPasswordVisible ? '' : 'auth-input-action--hidden'}`.trim()}
            type="button"
            onClick={() => setIsPasswordVisible((currentValue) => !currentValue)}
            aria-label={isPasswordVisible ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
          >
            <img src={iconEye} alt="" />
          </button>
        </div>
        {errors.password ? <p className="auth-field-error">{errors.password.message}</p> : null}
      </div>

      {loginMutation.error ? (
        <div className="auth-submit-feedback">
          <p className="auth-submit-error">{loginErrorMessage}</p>
          {loginMutation.error.code === 'EMAIL_NOT_VERIFIED' && currentEmail ? (
            <Link
              className="auth-inline-link auth-inline-link-feedback"
              to={`/xac-minh-email?email=${encodeURIComponent(currentEmail.trim())}`}
            >
              Xác minh email ngay
            </Link>
          ) : null}
        </div>
      ) : null}

      <button className="auth-submit-button auth-submit-button-with-icon" type="submit" disabled={loginMutation.isPending}>
        <span>{loginMutation.isPending ? 'Đang đăng nhập...' : 'Đăng nhập'}</span>
        {!loginMutation.isPending ? <img src={iconArrow} alt="" aria-hidden="true" /> : null}
      </button>

      <p className="auth-register-footnote">
        Chưa có tài khoản?{' '}
        <Link to="/dang-ky">Đăng ký ngay</Link>
      </p>
    </form>
  );
}
