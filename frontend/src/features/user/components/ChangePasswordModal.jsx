import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { changePasswordSchema } from '../schemas/user.schema.js';
import { useChangePassword } from '../hooks/useChangePassword.js';

function LockIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true">
      <path d="M6.25 8V6.5a3.75 3.75 0 1 1 7.5 0V8h.5a1.5 1.5 0 0 1 1.5 1.5v5a1.5 1.5 0 0 1-1.5 1.5h-8.5a1.5 1.5 0 0 1-1.5-1.5v-5A1.5 1.5 0 0 1 5.75 8Zm1.5 0h4.5V6.5a2.25 2.25 0 1 0-4.5 0Z" />
    </svg>
  );
}

function EyeOpenIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true">
      <path d="M1.2 10s3.2-5.3 8.8-5.3S18.8 10 18.8 10s-3.2 5.3-8.8 5.3S1.2 10 1.2 10Z" />
      <circle cx="10" cy="10" r="2.6" />
    </svg>
  );
}

function EyeClosedIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true">
      <path d="M2.2 3.2 17.8 16.8" />
      <path d="M4.4 5.4C2.5 7 1.4 8.9 1.2 10c0 0 3.2 5.3 8.8 5.3 1.9 0 3.5-.6 4.8-1.5" />
      <path d="M8 4.9A9.3 9.3 0 0 1 10 4.7c5.6 0 8.8 5.3 8.8 5.3a13.6 13.6 0 0 1-2.2 2.8" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true">
      <path d="M5 5l10 10M15 5 5 15" />
    </svg>
  );
}

function PasswordField({
  id,
  label,
  registration,
  error,
  visible,
  onToggleVisibility,
  autoComplete,
}) {
  return (
    <div className="patient-profile-field">
      <label className="patient-profile-label" htmlFor={id}>
        {label}
        <span className="patient-profile-required">*</span>
      </label>
      <div className="patient-profile-input-wrap">
        <span className="patient-profile-input-icon-leading">
          <LockIcon />
        </span>
        <input
          id={id}
          className="patient-profile-input patient-profile-password-input"
          type={visible ? 'text' : 'password'}
          autoComplete={autoComplete}
          {...registration}
        />
        <button
          className="patient-profile-password-toggle"
          type="button"
          onClick={onToggleVisibility}
          aria-label={visible ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
        >
          {visible ? <EyeOpenIcon /> : <EyeClosedIcon />}
        </button>
      </div>
      {error ? <p className="patient-profile-field-error">{error.message}</p> : null}
    </div>
  );
}

function getChangePasswordErrorMessage(error) {
  switch (error?.code) {
    case 'VALIDATION_ERROR':
      return 'Dữ liệu đổi mật khẩu không hợp lệ.';
    case 'CURRENT_PASSWORD_INCORRECT':
      return 'Mật khẩu hiện tại không chính xác.';
    case 'NEW_PASSWORD_SAME_AS_OLD':
      return 'Mật khẩu mới không được trùng mật khẩu hiện tại.';
    case 'USER_NOT_FOUND':
      return 'Không tìm thấy người dùng.';
    default:
      return error?.message ?? 'Không thể đổi mật khẩu.';
  }
}

export default function ChangePasswordModal({
  open,
  onClose,
}) {
  const [isCurrentPasswordVisible, setIsCurrentPasswordVisible] = useState(false);
  const [isNewPasswordVisible, setIsNewPasswordVisible] = useState(false);
  const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] = useState(false);

  const form = useForm({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  const changePasswordMutation = useChangePassword({
    onSuccess: () => {
      form.reset();
      onClose?.();
    },
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = form;

  const submitButtonLabel = useMemo(() => {
    if (changePasswordMutation.isPending) {
      return 'Đang cập nhật...';
    }

    return 'Xác nhận';
  }, [changePasswordMutation.isPending]);

  if (!open) {
    return null;
  }

  const submitHandler = (values) => {
    changePasswordMutation.mutate(values);
  };

  const closeHandler = () => {
    reset();
    changePasswordMutation.reset();
    onClose?.();
  };

  return (
    <div className="patient-password-modal-backdrop" role="presentation" onClick={closeHandler}>
      <div
        className="patient-password-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="change-password-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="patient-password-modal-header">
          <div>
            <h3 id="change-password-title" className="patient-password-modal-title">Đổi mật khẩu</h3>
            <p className="patient-password-modal-description">
              Nhập mật khẩu hiện tại và mật khẩu mới để cập nhật bảo mật tài khoản.
            </p>
          </div>
          <button className="patient-password-modal-close" type="button" onClick={closeHandler} aria-label="Đóng">
            <CloseIcon />
          </button>
        </div>

        <form className="patient-password-modal-form" onSubmit={handleSubmit(submitHandler)} noValidate>
          <PasswordField
            id="current-password"
            label="Mật khẩu hiện tại"
            registration={register('currentPassword')}
            error={errors.currentPassword}
            visible={isCurrentPasswordVisible}
            onToggleVisibility={() => setIsCurrentPasswordVisible((value) => !value)}
            autoComplete="current-password"
          />

          <PasswordField
            id="new-password"
            label="Mật khẩu mới"
            registration={register('newPassword')}
            error={errors.newPassword}
            visible={isNewPasswordVisible}
            onToggleVisibility={() => setIsNewPasswordVisible((value) => !value)}
            autoComplete="new-password"
          />

          <PasswordField
            id="confirm-password"
            label="Xác nhận mật khẩu mới"
            registration={register('confirmPassword')}
            error={errors.confirmPassword}
            visible={isConfirmPasswordVisible}
            onToggleVisibility={() => setIsConfirmPasswordVisible((value) => !value)}
            autoComplete="new-password"
          />

          {changePasswordMutation.error ? (
            <p className="patient-profile-submit-error">{getChangePasswordErrorMessage(changePasswordMutation.error)}</p>
          ) : null}

          <div className="patient-profile-form-actions patient-password-modal-actions">
            <button
              className="patient-profile-secondary-button"
              type="button"
              onClick={closeHandler}
              disabled={changePasswordMutation.isPending}
            >
              Hủy
            </button>
            <button
              className="patient-profile-primary-button"
              type="submit"
              disabled={changePasswordMutation.isPending || !isDirty}
            >
              {submitButtonLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
