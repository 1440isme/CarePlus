import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createPatientProfileSchema } from '../schemas/patient-profile.schema.js';
import {
  PATIENT_PROFILE_GENDER_OPTIONS,
  PATIENT_PROFILE_RELATIONSHIP_OPTIONS,
} from '../types/patient-profile.types.js';
import { X } from 'lucide-react';

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

function normalizeDateInputValue(value) {
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value;
  }
  if (!value) {
    return '';
  }
  const parsedDate = new Date(value);
  if (Number.isNaN(parsedDate.getTime())) {
    return '';
  }
  const year = parsedDate.getUTCFullYear();
  const month = String(parsedDate.getUTCMonth() + 1).padStart(2, '0');
  const day = String(parsedDate.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function normalizeFormValues(profile) {
  return {
    fullName: profile?.fullName ?? '',
    phone: profile?.phone ?? '',
    gender: profile?.gender ?? '',
    dateOfBirth: normalizeDateInputValue(profile?.dateOfBirth),
    relationship: profile?.relationship ?? '',
    address: profile?.address ?? '',
  };
}

function RequiredLabel({ htmlFor, children }) {
  return (
    <label className="block text-xs font-semibold text-gray-600 mb-1" htmlFor={htmlFor}>
      {children}
      <span className="text-red-500 ml-0.5">*</span>
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
      dateOfBirth: values.dateOfBirth,
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

  const inputStyle = "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#49BCE2] bg-white";

  return (
    <div className="fixed inset-0 bg-black/45 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-lg p-5 md:p-6 max-w-[480px] w-full shadow-lg border border-gray-100" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-base font-bold text-gray-800">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(submitHandler)} noValidate className="flex flex-col gap-4">
          {/* Full Name */}
          <div>
            <RequiredLabel htmlFor="relative-full-name">Họ và tên</RequiredLabel>
            <input
              id="relative-full-name"
              className={`${inputStyle} ${errors.fullName ? 'border-red-400 focus:ring-red-400' : ''}`}
              type="text"
              placeholder="Nhập họ và tên"
              {...register('fullName')}
            />
            {errors.fullName ? <p className="text-xs text-red-500 mt-1">{errors.fullName.message}</p> : null}
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Relationship */}
            <div>
              <RequiredLabel htmlFor="relative-relationship">Quan hệ</RequiredLabel>
              <select
                id="relative-relationship"
                className={inputStyle}
                {...register('relationship')}
              >
                <option value="" disabled>Chọn quan hệ</option>
                {PATIENT_PROFILE_RELATIONSHIP_OPTIONS
                  .filter((option) => option.value !== 'SELF')
                  .map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
              </select>
              {errors.relationship ? <p className="text-xs text-red-500 mt-1">{errors.relationship.message}</p> : null}
            </div>

            {/* Gender */}
            <div>
              <RequiredLabel htmlFor="relative-gender">Giới tính</RequiredLabel>
              <select
                id="relative-gender"
                className={inputStyle}
                {...register('gender')}
              >
                <option value="" disabled>Chọn giới tính</option>
                {PATIENT_PROFILE_GENDER_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
              {errors.gender ? <p className="text-xs text-red-500 mt-1">{errors.gender.message}</p> : null}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* DOB */}
            <div>
              <RequiredLabel htmlFor="relative-date-of-birth">Ngày sinh</RequiredLabel>
              <div className="relative">
                <input
                  id="relative-date-of-birth"
                  className={`${inputStyle} ${errors.dateOfBirth ? 'border-red-400 focus:ring-red-400' : ''}`}
                  type="date"
                  {...register('dateOfBirth')}
                />
              </div>
              {errors.dateOfBirth ? <p className="text-xs text-red-500 mt-1">{errors.dateOfBirth.message}</p> : null}
            </div>

            {/* Phone */}
            <div>
              <RequiredLabel htmlFor="relative-phone">Số điện thoại</RequiredLabel>
              <input
                id="relative-phone"
                className={`${inputStyle} ${errors.phone ? 'border-red-400 focus:ring-red-400' : ''}`}
                type="tel"
                placeholder="Nhập số điện thoại"
                {...register('phone')}
              />
              {errors.phone ? <p className="text-xs text-red-500 mt-1">{errors.phone.message}</p> : null}
            </div>
          </div>

          {/* Address */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1" htmlFor="relative-address">Địa chỉ</label>
            <textarea
              id="relative-address"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#49BCE2] bg-white resize-none"
              rows={2}
              placeholder="Nhập địa chỉ"
              {...register('address')}
            />
            {errors.address ? <p className="text-xs text-red-500 mt-1">{errors.address.message}</p> : null}
          </div>

          {mutation.error ? (
            <p className="text-xs text-red-500">{getFormErrorMessage(mutation.error)}</p>
          ) : null}

          <div className="flex gap-2.5 mt-2">
            <button
              className="flex-1 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 font-semibold hover:bg-gray-50 transition-colors cursor-pointer"
              type="button"
              onClick={onClose}
              disabled={mutation.isPending}
            >
              Hủy
            </button>
            <button
              className="flex-1 py-2 bg-[#49BCE2] text-white rounded-lg text-sm font-semibold hover:bg-[#3ca4c7] transition-colors cursor-pointer disabled:bg-gray-150 disabled:text-gray-400 disabled:cursor-not-allowed"
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
