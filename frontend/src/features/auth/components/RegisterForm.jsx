import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { registerSchema } from '../schemas/auth.schema.js';
import { useRegister } from '../hooks/useRegister.js';

const iconUser = 'https://www.figma.com/api/mcp/asset/ff1ab23a-a402-405b-a4f1-67ad52886863';
const iconEmail = 'https://www.figma.com/api/mcp/asset/4d93a5b4-38a9-49f2-a9fa-8d12320fae2e';
const iconPhone = 'https://www.figma.com/api/mcp/asset/49b9e4a6-0407-4f0e-8239-c237579e1dca';
const iconLock = 'https://www.figma.com/api/mcp/asset/68cfcdab-3dc5-4e97-8d07-a59eabbbef36';
const iconEye = 'https://www.figma.com/api/mcp/asset/cf6589bb-d7c6-401a-bfcf-4a673bb94b7a';

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
    <form className="auth-register-form" onSubmit={handleSubmit(submitHandler)} noValidate>
      <div className="auth-form-field">
        <label className="auth-form-label" htmlFor="register-name">Họ và tên</label>
        <div className="auth-input-shell">
          <img className="auth-input-icon" src={iconUser} alt="" aria-hidden="true" />
          <input
            id="register-name"
            className="auth-input"
            type="text"
            placeholder="Nguyễn Văn A"
            autoComplete="name"
            {...register('name')}
          />
        </div>
        {errors.name ? <p className="auth-field-error">{errors.name.message}</p> : null}
      </div>

      <div className="auth-form-field">
        <label className="auth-form-label" htmlFor="register-email">Email</label>
        <div className="auth-input-shell">
          <img className="auth-input-icon" src={iconEmail} alt="" aria-hidden="true" />
          <input
            id="register-email"
            className="auth-input"
            type="email"
            placeholder="email@example.com"
            autoComplete="email"
            {...register('email')}
          />
        </div>
        {errors.email ? <p className="auth-field-error">{errors.email.message}</p> : null}
      </div>

      <div className="auth-form-field">
        <label className="auth-form-label" htmlFor="register-phone">Số điện thoại</label>
        <div className="auth-input-shell">
          <img className="auth-input-icon" src={iconPhone} alt="" aria-hidden="true" />
          <input
            id="register-phone"
            className="auth-input"
            type="tel"
            placeholder="0901234567"
            autoComplete="tel"
            {...register('phone')}
          />
        </div>
        {errors.phone ? <p className="auth-field-error">{errors.phone.message}</p> : null}
      </div>

      <div className="auth-form-field">
        <label className="auth-form-label" htmlFor="register-password">Mật khẩu</label>
        <div className="auth-input-shell auth-input-shell-with-action">
          <img className="auth-input-icon" src={iconLock} alt="" aria-hidden="true" />
          <input
            id="register-password"
            className="auth-input"
            type={isPasswordVisible ? 'text' : 'password'}
            placeholder="Tối thiểu 8 ký tự"
            autoComplete="new-password"
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

      <div className="auth-form-field auth-form-field-last">
        <label className="auth-form-label" htmlFor="register-confirm-password">Xác nhận mật khẩu</label>
        <div className="auth-input-shell auth-input-shell-with-action">
          <img className="auth-input-icon" src={iconLock} alt="" aria-hidden="true" />
          <input
            id="register-confirm-password"
            className="auth-input"
            type={isConfirmPasswordVisible ? 'text' : 'password'}
            placeholder="Nhập lại mật khẩu"
            autoComplete="new-password"
            {...register('confirmPassword')}
          />
          <button
            className={`auth-input-action ${isConfirmPasswordVisible ? '' : 'auth-input-action--hidden'}`.trim()}
            type="button"
            onClick={() => setIsConfirmPasswordVisible((currentValue) => !currentValue)}
            aria-label={isConfirmPasswordVisible ? 'Ẩn xác nhận mật khẩu' : 'Hiện xác nhận mật khẩu'}
          >
            <img src={iconEye} alt="" />
          </button>
        </div>
        {errors.confirmPassword ? <p className="auth-field-error">{errors.confirmPassword.message}</p> : null}
      </div>

      {registerMutation.error ? (
        <p className="auth-submit-error">
          {registerMutation.error.code === 'EMAIL_ALREADY_EXISTS'
            ? 'Email đã tồn tại trong hệ thống'
            : registerMutation.error.message}
        </p>
      ) : null}

      <button className="auth-submit-button" type="submit" disabled={registerMutation.isPending}>
        {registerMutation.isPending ? 'Đang tạo tài khoản...' : 'Tạo tài khoản'}
      </button>

      <p className="auth-register-footnote">
        Đã có tài khoản?{' '}
        <Link to="/dang-nhap">Đăng nhập</Link>
      </p>
    </form>
  );
}
