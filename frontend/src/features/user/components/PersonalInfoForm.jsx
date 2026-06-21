import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import ProfileAvatarUpload from './ProfileAvatarUpload.jsx';
import { updateMeSchema } from '../schemas/user.schema.js';
import { useUpdateMe } from '../hooks/useUpdateMe.js';

function LockIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true">
      <path d="M6.25 8V6.5a3.75 3.75 0 1 1 7.5 0V8h.5a1.5 1.5 0 0 1 1.5 1.5v5a1.5 1.5 0 0 1-1.5 1.5h-8.5a1.5 1.5 0 0 1-1.5-1.5v-5A1.5 1.5 0 0 1 5.75 8Zm1.5 0h4.5V6.5a2.25 2.25 0 1 0-4.5 0Z" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true">
      <path d="M5 2.75a.75.75 0 0 1 .75.75v.75h8.5V3.5a.75.75 0 0 1 1.5 0v.75h.25A1.5 1.5 0 0 1 17.5 5.75v9.5a1.5 1.5 0 0 1-1.5 1.5H4A1.5 1.5 0 0 1 2.5 15.25v-9.5A1.5 1.5 0 0 1 4 4.25h.25V3.5A.75.75 0 0 1 5 2.75Zm11 4H4v8.5h12Z" />
    </svg>
  );
}

function ChevronIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true">
      <path d="m5.5 7.5 4.5 5 4.5-5" />
    </svg>
  );
}

function getUpdateErrorMessage(error) {
  switch (error?.code) {
    case 'VALIDATION_ERROR':
      return 'Dữ liệu cập nhật không hợp lệ.';
    case 'USER_NOT_FOUND':
      return 'Không tìm thấy người dùng.';
    default:
      return error?.message ?? 'Không thể cập nhật thông tin cá nhân.';
  }
}

function RequiredLabel({ htmlFor, children }) {
  return (
    <label className="patient-profile-label" htmlFor={htmlFor}>
      {children}
      <span className="patient-profile-required">*</span>
    </label>
  );
}

export default function PersonalInfoForm({
  user,
  draftValues,
  onCancel,
  onSuccess,
}) {
  const form = useForm({
    resolver: zodResolver(updateMeSchema),
    defaultValues: {
      name: draftValues?.name ?? user?.name ?? '',
      phone: draftValues?.phone ?? user?.phone ?? '',
      gender: draftValues?.gender ?? user?.gender ?? '',
      dateOfBirth: draftValues?.dateOfBirth ?? user?.dateOfBirth ?? '',
      address: draftValues?.address ?? user?.address ?? '',
    },
  });

  const updateMeMutation = useUpdateMe({
    onSuccess: (_, variables) => {
      onSuccess?.(variables);
    },
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = form;

  useEffect(() => {
    reset({
      name: draftValues?.name ?? user?.name ?? '',
      phone: draftValues?.phone ?? user?.phone ?? '',
      gender: draftValues?.gender ?? user?.gender ?? '',
      dateOfBirth: draftValues?.dateOfBirth ?? user?.dateOfBirth ?? '',
      address: draftValues?.address ?? user?.address ?? '',
    });
  }, [draftValues, reset, user]);

  const submitHandler = (values) => {
    const draftPayload = {
      name: values.name,
      phone: values.phone,
      gender: values.gender,
      dateOfBirth: values.dateOfBirth,
      address: values.address,
    };

    updateMeMutation.mutate({
      name: values.name,
      phone: values.phone,
      gender: values.gender,
      dateOfBirth: values.dateOfBirth,
      address: values.address,
    }, {
      onSuccess: () => {
        onSuccess?.(draftPayload);
      },
    });
  };

  const cancelHandler = () => {
    reset({
      name: draftValues?.name ?? user?.name ?? '',
      phone: draftValues?.phone ?? user?.phone ?? '',
      gender: draftValues?.gender ?? user?.gender ?? '',
      dateOfBirth: draftValues?.dateOfBirth ?? user?.dateOfBirth ?? '',
      address: draftValues?.address ?? user?.address ?? '',
    });
    onCancel?.();
  };

  return (
    <form className="patient-profile-card patient-profile-edit-card" onSubmit={handleSubmit(submitHandler)} noValidate>
      <div className="patient-profile-identity-card">
        <ProfileAvatarUpload
          name={draftValues?.name ?? user?.name}
          avatarUrl={user?.avatarUrl}
          compact
        />
        <div className="patient-profile-identity-copy has-avatar-meta">
          <h3 className="patient-profile-name">{draftValues?.name ?? user?.name ?? 'Bệnh nhân'}</h3>
          <p className="patient-profile-role-chip">Bệnh nhân</p>
        </div>
      </div>

      <div className="patient-profile-edit-body">
        <div className="patient-profile-field">
          <RequiredLabel htmlFor="patient-name">Họ và tên</RequiredLabel>
          <input
            id="patient-name"
            className="patient-profile-input"
            type="text"
            autoComplete="name"
            {...register('name')}
          />
          {errors.name ? <p className="patient-profile-field-error">{errors.name.message}</p> : null}
        </div>

        <div className="patient-profile-field">
          <RequiredLabel htmlFor="patient-email">Email</RequiredLabel>
          <div className="patient-profile-input-wrap is-disabled">
            <input
              id="patient-email"
              className="patient-profile-input"
              type="email"
              value={user?.email ?? ''}
              readOnly
              disabled
            />
            <span className="patient-profile-input-icon-trailing">
              <LockIcon />
            </span>
          </div>
          <p className="patient-profile-helper-text">
            Email dùng để đăng nhập và nhận xác nhận lịch hẹn, không thể chỉnh sửa tại đây.
          </p>
        </div>

        <div className="patient-profile-field">
          <RequiredLabel htmlFor="patient-phone">Số điện thoại</RequiredLabel>
          <input
            id="patient-phone"
            className="patient-profile-input"
            type="tel"
            autoComplete="tel"
            {...register('phone')}
          />
          {errors.phone ? <p className="patient-profile-field-error">{errors.phone.message}</p> : null}
        </div>

        <div className="patient-profile-field">
          <RequiredLabel htmlFor="patient-gender">Giới tính</RequiredLabel>
          <div className="patient-profile-input-wrap">
            <select id="patient-gender" className="patient-profile-input patient-profile-select" {...register('gender')}>
              <option value="MALE">Nam</option>
              <option value="FEMALE">Nữ</option>
              <option value="OTHER">Khác</option>
            </select>
            <span className="patient-profile-input-icon-trailing">
              <ChevronIcon />
            </span>
          </div>
        </div>

        <div className="patient-profile-field">
          <RequiredLabel htmlFor="patient-birthdate">Ngày sinh</RequiredLabel>
          <div className="patient-profile-input-wrap">
            <input
              id="patient-birthdate"
              className="patient-profile-input"
              type="text"
              placeholder="DD/MM/YYYY"
              {...register('dateOfBirth')}
            />
            <span className="patient-profile-input-icon-trailing is-calendar">
              <CalendarIcon />
            </span>
          </div>
        </div>

        <div className="patient-profile-field">
          <label className="patient-profile-label" htmlFor="patient-address">Địa chỉ</label>
          <textarea
            id="patient-address"
            className="patient-profile-textarea"
            rows={2}
            {...register('address')}
          />
        </div>

        {updateMeMutation.error ? (
          <p className="patient-profile-submit-error">{getUpdateErrorMessage(updateMeMutation.error)}</p>
        ) : null}

        {updateMeMutation.isSuccess ? (
          <p className="patient-profile-submit-success">
            {updateMeMutation.data?.data?.message ?? 'Cập nhật thông tin cá nhân thành công.'}
          </p>
        ) : null}

        <div className="patient-profile-form-actions">
          <button
            className="patient-profile-secondary-button"
            type="button"
            onClick={cancelHandler}
            disabled={updateMeMutation.isPending}
          >
            Hủy
          </button>
          <button
            className="patient-profile-primary-button"
            type="submit"
            disabled={updateMeMutation.isPending || !isDirty}
          >
            {updateMeMutation.isPending ? 'Đang lưu...' : 'Lưu thay đổi'}
          </button>
        </div>
      </div>
    </form>
  );
}
