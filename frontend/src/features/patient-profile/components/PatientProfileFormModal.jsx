import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createPatientProfileSchema } from '../schemas/patient-profile.schema.js';
import {
  PATIENT_PROFILE_GENDER_OPTIONS,
  PATIENT_PROFILE_RELATIONSHIP_OPTIONS,
} from '../types/patient-profile.types.js';

function CloseIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true">
      <path d="M5.5 5.5 14.5 14.5M14.5 5.5 5.5 14.5" />
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

function CalendarIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true">
      <rect x="3.5" y="5.5" width="13" height="11" rx="2" />
      <path d="M6.5 3.5v4M13.5 3.5v4M3.5 8.5h13" />
    </svg>
  );
}

function getFormErrorMessage(error) {
  switch (error?.code) {
    case 'VALIDATION_ERROR':
      return 'Dữ liệu hồ sơ chưa hợp lệ.';
    case 'PATIENT_PROFILE_NOT_FOUND':
      return 'Không tìm thấy hồ sơ bệnh nhân.';
    case 'PATIENT_PROFILE_INACTIVE':
      return 'Không thể cập nhật hồ sơ đã bị xóa.';
    case 'CREATE_PATIENT_PROFILE_FAILED':
      return 'Không thể tạo hồ sơ người thân.';
    case 'UPDATE_PATIENT_PROFILE_FAILED':
      return 'Không thể cập nhật hồ sơ người thân.';
    default:
      return error?.message ?? 'Không thể lưu hồ sơ người thân.';
  }
}

function formatDateForDisplay(value) {
  if (typeof value === 'string' && /^\d{2}\/\d{2}\/\d{4}$/.test(value)) {
    return value;
  }

  if (!value) {
    return '';
  }

  const parsedDate = new Date(value);

  if (Number.isNaN(parsedDate.getTime())) {
    return '';
  }

  const day = String(parsedDate.getDate()).padStart(2, '0');
  const month = String(parsedDate.getMonth() + 1).padStart(2, '0');
  const year = parsedDate.getFullYear();

  return `${day}/${month}/${year}`;
}

function toApiDateValue(value) {
  const trimmedValue = typeof value === 'string' ? value.trim() : '';

  if (!trimmedValue) {
    return trimmedValue;
  }

  const [day, month, year] = trimmedValue.split('/');

  return `${year}-${month}-${day}`;
}

function normalizeFormValues(profile) {
  return {
    fullName: profile?.fullName ?? '',
    phone: profile?.phone ?? '',
    gender: profile?.gender ?? '',
    dateOfBirth: formatDateForDisplay(profile?.dateOfBirth),
    relationship: profile?.relationship ?? '',
    address: profile?.address ?? '',
  };
}

function RequiredLabel({ htmlFor, children }) {
  return (
    <label className="patient-relatives-form-label" htmlFor={htmlFor}>
      {children}
      <span className="patient-relatives-form-required">*</span>
    </label>
  );
}

export default function PatientProfileFormModal({
  mode,
  profile,
  mutation,
  onClose,
  onSubmittedSuccess,
}) {
  const form = useForm({
    resolver: zodResolver(createPatientProfileSchema),
    defaultValues: normalizeFormValues(profile),
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = form;

  useEffect(() => {
    reset(normalizeFormValues(profile));
  }, [profile, reset]);

  const submitHandler = (values) => {
    const payload = {
      fullName: values.fullName.trim(),
      phone: values.phone.trim(),
      gender: values.gender,
      dateOfBirth: toApiDateValue(values.dateOfBirth),
      relationship: values.relationship,
      address: values.address?.trim() ? values.address.trim() : undefined,
    };

    if (mode === 'edit' && profile?.id) {
      mutation.mutate(
        {
          id: profile.id,
          payload,
        },
        {
          onSuccess: () => {
            reset(normalizeFormValues(profile));
            onSubmittedSuccess?.(mode);
            onClose?.();
          },
        },
      );
      return;
    }

    mutation.mutate(payload, {
      onSuccess: () => {
        reset(normalizeFormValues(null));
        onSubmittedSuccess?.(mode);
        onClose?.();
      },
    });
  };

  const isEditMode = mode === 'edit';
  const title = isEditMode ? 'Chỉnh sửa người thân' : 'Thêm người thân mới';
  const submitLabel = isEditMode ? 'Lưu thay đổi' : 'Thêm';

  return (
    <div className="patient-relatives-modal-backdrop" role="presentation">
      <div
        className={`patient-relatives-modal patient-relatives-form-modal ${
          isEditMode
            ? 'patient-relatives-form-modal-edit'
            : 'patient-relatives-form-modal-create'
        }`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="patient-relative-form-title"
      >
        {isEditMode ? (
          <div className="patient-relatives-modal-header patient-relatives-form-modal-edit-header">
            <h3 id="patient-relative-form-title" className="patient-relatives-modal-title patient-relatives-form-modal-title">
              {title}
            </h3>
            <button
              className="patient-relatives-modal-close"
              type="button"
              onClick={onClose}
              aria-label="Đóng"
            >
              <CloseIcon />
            </button>
          </div>
        ) : null}

        <form
          className={`patient-relatives-form ${
            isEditMode ? 'patient-relatives-form-edit' : 'patient-relatives-form-create'
          }`}
          onSubmit={handleSubmit(submitHandler)}
          noValidate
        >
          {!isEditMode ? (
            <div className="patient-relatives-form-title-wrap">
              <h3 id="patient-relative-form-title" className="patient-relatives-form-card-title">
                {title}
              </h3>
            </div>
          ) : null}

          <div className="patient-relatives-form-field">
            <RequiredLabel htmlFor="relative-full-name">Họ và tên</RequiredLabel>
            <input
              id="relative-full-name"
              className="patient-relatives-form-input"
              type="text"
              placeholder="Nhập họ và tên"
              {...register('fullName')}
            />
            {errors.fullName ? <p className="patient-relatives-form-error">{errors.fullName.message}</p> : null}
          </div>

          <div className={`patient-relatives-form-grid ${isEditMode ? 'patient-relatives-form-grid-single' : ''}`}>
            <div className="patient-relatives-form-field">
              <RequiredLabel htmlFor="relative-relationship">Quan hệ</RequiredLabel>
              <div className="patient-relatives-form-select-wrap">
                <select
                  id="relative-relationship"
                  className="patient-relatives-form-input patient-relatives-form-select"
                  {...register('relationship')}
                >
                  <option value="" disabled>
                    Chọn quan hệ
                  </option>
                  {PATIENT_PROFILE_RELATIONSHIP_OPTIONS
                    .filter((option) => option.value !== 'SELF')
                    .map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                </select>
                <span className="patient-relatives-form-select-icon">
                  <ChevronIcon />
                </span>
              </div>
              {errors.relationship ? <p className="patient-relatives-form-error">{errors.relationship.message}</p> : null}
            </div>

            <div className="patient-relatives-form-field">
              <RequiredLabel htmlFor="relative-gender">Giới tính</RequiredLabel>
              <div className="patient-relatives-form-select-wrap">
                <select
                  id="relative-gender"
                  className="patient-relatives-form-input patient-relatives-form-select"
                  {...register('gender')}
                >
                  <option value="" disabled>
                    Chọn giới tính
                  </option>
                  {PATIENT_PROFILE_GENDER_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
                <span className="patient-relatives-form-select-icon">
                  <ChevronIcon />
                </span>
              </div>
              {errors.gender ? <p className="patient-relatives-form-error">{errors.gender.message}</p> : null}
            </div>
          </div>

          <div className={`patient-relatives-form-grid ${isEditMode ? 'patient-relatives-form-grid-single' : ''}`}>
            <div className="patient-relatives-form-field">
              <RequiredLabel htmlFor="relative-date-of-birth">Ngày sinh</RequiredLabel>
              <div className="patient-relatives-form-input-wrap">
                <input
                  id="relative-date-of-birth"
                  className="patient-relatives-form-input patient-relatives-form-input-with-icon"
                  type="text"
                  placeholder="dd/mm/yyyy"
                  {...register('dateOfBirth')}
                />
                <span className="patient-relatives-form-input-icon">
                  <CalendarIcon />
                </span>
              </div>
              {errors.dateOfBirth ? <p className="patient-relatives-form-error">{errors.dateOfBirth.message}</p> : null}
            </div>

            <div className="patient-relatives-form-field">
              <RequiredLabel htmlFor="relative-phone">Số điện thoại</RequiredLabel>
              <input
                id="relative-phone"
                className="patient-relatives-form-input"
                type="tel"
                placeholder="Nhập số điện thoại"
                {...register('phone')}
              />
              {errors.phone ? <p className="patient-relatives-form-error">{errors.phone.message}</p> : null}
            </div>
          </div>

          <div className="patient-relatives-form-field">
            <label className="patient-relatives-form-label" htmlFor="relative-address">Địa chỉ</label>
            <textarea
              id="relative-address"
              className="patient-relatives-form-textarea"
              rows={isEditMode ? 3 : 2}
              placeholder="Nhập địa chỉ"
              {...register('address')}
            />
            {errors.address ? <p className="patient-relatives-form-error">{errors.address.message}</p> : null}
          </div>

          {mutation.error ? (
            <p className="patient-relatives-form-submit-error">{getFormErrorMessage(mutation.error)}</p>
          ) : null}

          <div className={`patient-relatives-modal-actions ${
            isEditMode
              ? 'patient-relatives-form-actions-edit'
              : 'patient-relatives-form-actions-create'
          }`}>
            <button
              className="patient-relatives-outline-button"
              type="button"
              onClick={onClose}
              disabled={mutation.isPending}
            >
              Hủy
            </button>
            <button
              className="patient-relatives-primary-button"
              type="submit"
              disabled={mutation.isPending || (mode === 'edit' && !isDirty)}
            >
              {mutation.isPending ? 'Đang lưu...' : submitLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
