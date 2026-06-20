import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useCreateAdminStaffUser } from '../hooks/useCreateAdminStaffUser.js';
import { useUpdateAdminUser } from '../hooks/useUpdateAdminUser.js';
import { useAdminSpecialties } from '../../specialties/hooks/useAdminSpecialties.js';
import {
  ADMIN_USER_ROLE_OPTIONS,
  ADMIN_USER_STATUS_OPTIONS,
} from '../types/admin-user.types.js';
import {
  adminStaffCreateSchema,
  adminUserEditSchema,
} from '../schemas/admin-user.schema.js';
import './admin-users.css';

const CREATE_ROLE_OPTIONS = ADMIN_USER_ROLE_OPTIONS.filter((option) => option.value !== 'ALL' && option.value !== 'PATIENT');
const CREATE_STATUS_OPTIONS = ADMIN_USER_STATUS_OPTIONS.filter((option) => option.value !== 'ALL');

const GENDER_OPTIONS = [
  { value: 'MALE', label: 'Nam' },
  { value: 'FEMALE', label: 'Nữ' },
  { value: 'OTHER', label: 'Khác' },
];

const ACADEMIC_TITLE_OPTIONS = [
  { value: '', label: 'Chọn học hàm/Học vị' },
  { value: 'BS', label: 'BS' },
  { value: 'BS_CKI', label: 'BS.CKI' },
  { value: 'BS_CKII', label: 'BS.CKII' },
  { value: 'THS_BS', label: 'ThS.BS' },
  { value: 'TS_BS', label: 'TS.BS' },
];

function CloseIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true">
      <path d="m5 5 10 10M15 5 5 15" />
    </svg>
  );
}

function formatGender(value) {
  return value || 'OTHER';
}

function createEditDefaultValues(user) {
  return {
    name: user?.name ?? '',
    phone: user?.phone ?? '',
    gender: formatGender(user?.gender),
    dateOfBirth: user?.dateOfBirth ?? '',
    address: user?.address ?? '',
  };
}

function createStaffDefaultValues() {
  return {
    role: 'RECEPTIONIST',
    name: '',
    email: '',
    phone: '',
    temporaryPassword: '',
    status: 'ACTIVE',
    doctorName: '',
    specialty: '',
    academicTitle: '',
    yearsOfExperience: '',
    consultationFee: '',
    avatarUrl: '',
  };
}

function formatCurrencyWithDots(value) {
  const digitsOnly = String(value ?? '').replace(/\D/g, '');

  if (!digitsOnly) {
    return '';
  }

  return digitsOnly.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

function FormField({ label, error, required = false, children }) {
  return (
    <div className="admin-user-form-field">
      <label className="admin-user-form-label">
        {label}
        {required ? <span className="admin-user-form-required">*</span> : null}
      </label>
      {children}
      {error ? <p className="admin-user-form-error">{error}</p> : null}
    </div>
  );
}

export default function AdminUserFormModal({
  open,
  mode,
  user,
  onClose,
  onSuccess,
}) {
  const [submitMessage, setSubmitMessage] = useState(null);
  const createAdminStaffUserMutation = useCreateAdminStaffUser({
    onSuccess: (response) => {
      setSubmitMessage(null);
      onSuccess?.(response);
      onClose();
    },
  });
  const updateAdminUserMutation = useUpdateAdminUser({
    onSuccess: (response) => {
      setSubmitMessage(null);
      onSuccess?.(response);
      onClose();
    },
  });

  const schema = mode === 'create' ? adminStaffCreateSchema : adminUserEditSchema;
  const defaultValues = useMemo(
    () => (mode === 'create' ? createStaffDefaultValues() : createEditDefaultValues(user)),
    [mode, user],
  );

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues,
  });

  const specialtiesQuery = useAdminSpecialties(
    { page: 1, limit: 100 },
    {
      enabled: open && mode === 'create',
      staleTime: 60_000,
    },
  );

  useEffect(() => {
    if (open) {
      reset(defaultValues);
      setSubmitMessage(null);
    }
  }, [defaultValues, open, reset]);

  const roleValue = mode === 'create' ? watch('role') : null;
  const isDoctorRole = roleValue === 'DOCTOR';
  const isSubmitting = mode === 'create'
    ? createAdminStaffUserMutation.isPending
    : updateAdminUserMutation.isPending;
  const specialtyOptions = useMemo(() => {
    const specialties = Array.isArray(specialtiesQuery.data?.data)
      ? specialtiesQuery.data.data
      : [];

    return [
      {
        value: '',
        label: specialtiesQuery.isLoading ? 'Đang tải chuyên khoa...' : 'Chọn chuyên khoa',
      },
      ...specialties.map((specialty) => ({
        value: specialty.id,
        label: specialty.name,
      })),
    ];
  }, [specialtiesQuery.data?.data, specialtiesQuery.isLoading]);

  const mutationErrorMessage = mode === 'create'
    ? (createAdminStaffUserMutation.error?.message ?? 'Không thể tạo tài khoản nhân sự.')
    : (updateAdminUserMutation.error?.message ?? 'Không thể cập nhật thông tin người dùng.');

  const handleConsultationFeeChange = (event) => {
    const formattedValue = formatCurrencyWithDots(event.target.value);

    setValue('consultationFee', formattedValue, {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true,
    });
  };

  if (!open) {
    return null;
  }

  const handleFormSubmit = (values) => {
    setSubmitMessage(null);

    if (mode === 'create') {
      const normalizedName = values.role === 'DOCTOR'
        ? values.doctorName.trim()
        : values.name.trim();

      createAdminStaffUserMutation.mutate({
        name: normalizedName,
        email: values.email.trim().toLowerCase(),
        phone: values.phone.trim(),
        password: values.temporaryPassword,
        role: values.role,
      });

      return;
    }

    if (!user?.id) {
      setSubmitMessage('Không tìm thấy người dùng để cập nhật.');
      return;
    }

    updateAdminUserMutation.mutate({
      userId: user.id,
      payload: values,
    });
  };

  return (
    <div className="admin-user-modal-backdrop" role="presentation" onClick={onClose}>
      <div
        className={`admin-user-form-modal ${mode === 'create' ? 'is-create' : 'is-edit'}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-user-form-modal-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="admin-user-form-modal-header">
          <h3 className="admin-user-form-modal-title" id="admin-user-form-modal-title">
            {mode === 'create' ? 'Tạo tài khoản nhân sự' : 'Chỉnh sửa thông tin người dùng'}
          </h3>
          <button className="admin-user-form-modal-close" type="button" onClick={onClose} aria-label="Đóng">
            <CloseIcon />
          </button>
        </div>

        <form className="admin-user-form-modal-body" onSubmit={handleSubmit(handleFormSubmit)}>
          {mode === 'create' ? (
            <>
              <FormField label="Vai trò" error={errors.role?.message}>
                <select className="admin-user-form-input" {...register('role')}>
                  {CREATE_ROLE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </FormField>

              {!isDoctorRole ? (
                <FormField label="Họ tên" error={errors.name?.message}>
                  <input className="admin-user-form-input" type="text" {...register('name')} />
                </FormField>
              ) : null}

              <FormField label="Email" error={errors.email?.message}>
                <input className="admin-user-form-input" type="email" placeholder="email@careplus.vn" {...register('email')} />
              </FormField>

              <FormField label="Số điện thoại" error={errors.phone?.message}>
                <input className="admin-user-form-input" type="text" {...register('phone')} />
              </FormField>

              <FormField label="Mật khẩu tạm" error={errors.temporaryPassword?.message}>
                <input className="admin-user-form-input" type="text" {...register('temporaryPassword')} />
              </FormField>

              <FormField label="Trạng thái" error={errors.status?.message}>
                <select className="admin-user-form-input" {...register('status')}>
                  {CREATE_STATUS_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </FormField>

              {isDoctorRole ? (
                <div className="admin-user-form-section">
                  <h4 className="admin-user-form-section-title">Thông tin bác sĩ</h4>

                  <FormField label="Họ tên bác sĩ" error={errors.doctorName?.message}>
                    <input className="admin-user-form-input" type="text" {...register('doctorName')} />
                  </FormField>

                  <div className="admin-user-form-grid">
                    <FormField label="Chuyên khoa" error={errors.specialty?.message}>
                      <select className="admin-user-form-input" {...register('specialty')}>
                        {specialtyOptions.map((option) => (
                          <option key={option.value || 'blank'} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </FormField>

                    <FormField label="Học hàm/Học vị" error={errors.academicTitle?.message}>
                      <select className="admin-user-form-input" {...register('academicTitle')}>
                        {ACADEMIC_TITLE_OPTIONS.map((option) => (
                          <option key={option.value || 'blank'} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </FormField>

                    <FormField label="Kinh nghiệm (năm)" error={errors.yearsOfExperience?.message}>
                      <input className="admin-user-form-input" type="text" {...register('yearsOfExperience')} />
                    </FormField>

                    <FormField label="Giá khám tham khảo" error={errors.consultationFee?.message}>
                      <input
                        className="admin-user-form-input"
                        type="text"
                        inputMode="numeric"
                        placeholder="VD: 500.000"
                        {...register('consultationFee', {
                          onChange: handleConsultationFeeChange,
                        })}
                      />
                    </FormField>
                  </div>

                  <FormField label="Avatar URL" error={errors.avatarUrl?.message}>
                    <input className="admin-user-form-input" type="text" placeholder="https://..." {...register('avatarUrl')} />
                  </FormField>
                </div>
              ) : null}
            </>
          ) : (
            <>
              <FormField label="Họ tên" error={errors.name?.message}>
                <input className="admin-user-form-input" type="text" {...register('name')} />
              </FormField>

              <FormField label="Email">
                <input className="admin-user-form-input is-disabled" type="email" value={user?.email ?? ''} readOnly disabled />
              </FormField>

              <FormField label="Số điện thoại" error={errors.phone?.message}>
                <input className="admin-user-form-input" type="text" {...register('phone')} />
              </FormField>

              <div className="admin-user-form-grid">
                <FormField label="Giới tính" error={errors.gender?.message}>
                  <select className="admin-user-form-input" {...register('gender')}>
                    {GENDER_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </FormField>

                <FormField label="Ngày sinh" error={errors.dateOfBirth?.message}>
                  <input className="admin-user-form-input" type="text" placeholder="DD/MM/YYYY" {...register('dateOfBirth')} />
                </FormField>
              </div>

              <FormField label="Địa chỉ" error={errors.address?.message}>
                <textarea className="admin-user-form-textarea" rows={4} {...register('address')} />
              </FormField>
            </>
          )}

          {submitMessage ? (
            <p className="admin-user-form-submit-note">{submitMessage}</p>
          ) : null}

          {!submitMessage && (createAdminStaffUserMutation.error || updateAdminUserMutation.error) ? (
            <p className="admin-user-form-submit-note">{mutationErrorMessage}</p>
          ) : null}

          <div className="admin-user-form-actions">
            <button className="admin-user-form-cancel" type="button" onClick={onClose} disabled={isSubmitting}>Hủy</button>
            <button className="admin-user-form-submit" type="submit" disabled={isSubmitting}>
              {isSubmitting
                ? (mode === 'create' ? 'Đang tạo...' : 'Đang lưu...')
                : (mode === 'create' ? 'Tạo tài khoản' : 'Lưu thay đổi')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
