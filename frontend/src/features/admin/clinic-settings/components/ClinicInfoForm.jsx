import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { clinicInfoFormSchema } from '../schemas/clinic-info.schema.js';
import { useUpdateClinicInfo } from '../hooks/useUpdateClinicInfo.js';

function CloseIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true">
      <path d="m5 5 10 10M15 5 5 15" />
    </svg>
  );
}

function getMutationErrorMessage(error) {
  switch (error?.code) {
    case 'FORBIDDEN':
      return 'Bạn không có quyền cập nhật thông tin phòng khám.';
    case 'VALIDATION_ERROR':
      return 'Dữ liệu thông tin phòng khám chưa hợp lệ.';
    case 'CLINIC_INFO_NOT_FOUND':
      return 'Không tìm thấy thông tin phòng khám.';
    case 'UPDATE_CLINIC_INFO_FAILED':
      return 'Cập nhật thông tin phòng khám thất bại.';
    default:
      return error?.message ?? 'Đã có lỗi xảy ra trên hệ thống.';
  }
}

function buildDefaultValues(clinicInfo) {
  return {
    name: clinicInfo?.name ?? '',
    address: clinicInfo?.address ?? '',
    hotline: clinicInfo?.hotline ?? '',
    email: clinicInfo?.email ?? '',
    workingHours: clinicInfo?.workingHours ?? '',
    description: clinicInfo?.description ?? '',
  };
}

export default function ClinicInfoForm({
  clinicInfo,
  onSuccess,
}) {
  const form = useForm({
    resolver: zodResolver(clinicInfoFormSchema),
    defaultValues: buildDefaultValues(clinicInfo),
  });

  useEffect(() => {
    form.reset(buildDefaultValues(clinicInfo));
  }, [clinicInfo, form]);

  const updateMutation = useUpdateClinicInfo({
    onSuccess: (response) => {
      onSuccess?.(response);
      form.reset(buildDefaultValues(response?.data));
    },
  });

  const mutationError = updateMutation.error
    ? getMutationErrorMessage(updateMutation.error)
    : null;

  const isSubmitDisabled = updateMutation.isPending || !form.formState.isDirty;

  const handleSubmit = form.handleSubmit((values) => {
    updateMutation.mutate(values);
  });

  return (
    <form className="admin-clinic-info-form" onSubmit={handleSubmit}>
      <div className="admin-clinic-info-fields">
        <div className="admin-clinic-info-field is-full">
          <label className="admin-clinic-info-label" htmlFor="clinic-name">
            Tên phòng khám
            <span className="admin-clinic-info-required">*</span>
          </label>
          <input
            id="clinic-name"
            className="admin-clinic-info-input"
            type="text"
            {...form.register('name')}
          />
          {form.formState.errors.name ? (
            <p className="admin-clinic-info-error">{form.formState.errors.name.message}</p>
          ) : null}
        </div>

        <div className="admin-clinic-info-field is-full">
          <label className="admin-clinic-info-label" htmlFor="clinic-address">
            Địa chỉ
            <span className="admin-clinic-info-required">*</span>
          </label>
          <input
            id="clinic-address"
            className="admin-clinic-info-input"
            type="text"
            {...form.register('address')}
          />
          {form.formState.errors.address ? (
            <p className="admin-clinic-info-error">{form.formState.errors.address.message}</p>
          ) : null}
        </div>

        <div className="admin-clinic-info-field">
          <label className="admin-clinic-info-label" htmlFor="clinic-hotline">
            Hotline
            <span className="admin-clinic-info-required">*</span>
          </label>
          <input
            id="clinic-hotline"
            className="admin-clinic-info-input"
            type="text"
            {...form.register('hotline')}
          />
          {form.formState.errors.hotline ? (
            <p className="admin-clinic-info-error">{form.formState.errors.hotline.message}</p>
          ) : null}
        </div>

        <div className="admin-clinic-info-field">
          <label className="admin-clinic-info-label" htmlFor="clinic-email">
            Email
            <span className="admin-clinic-info-required">*</span>
          </label>
          <input
            id="clinic-email"
            className="admin-clinic-info-input"
            type="email"
            {...form.register('email')}
          />
          {form.formState.errors.email ? (
            <p className="admin-clinic-info-error">{form.formState.errors.email.message}</p>
          ) : null}
        </div>

        <div className="admin-clinic-info-field is-full">
          <label className="admin-clinic-info-label" htmlFor="clinic-working-hours">
            Giờ làm việc
            <span className="admin-clinic-info-required">*</span>
          </label>
          <input
            id="clinic-working-hours"
            className="admin-clinic-info-input"
            type="text"
            {...form.register('workingHours')}
          />
          {form.formState.errors.workingHours ? (
            <p className="admin-clinic-info-error">{form.formState.errors.workingHours.message}</p>
          ) : null}
        </div>

        <div className="admin-clinic-info-field is-full">
          <label className="admin-clinic-info-label" htmlFor="clinic-description">
            Mô tả
            <span className="admin-clinic-info-required">*</span>
          </label>
          <textarea
            id="clinic-description"
            className="admin-clinic-info-textarea"
            rows={6}
            {...form.register('description')}
          />
          {form.formState.errors.description ? (
            <p className="admin-clinic-info-error">{form.formState.errors.description.message}</p>
          ) : null}
        </div>
      </div>

      {mutationError ? (
        <p className="admin-clinic-info-submit-error">{mutationError}</p>
      ) : null}

      <div className="admin-clinic-info-actions">
        <button
          className="admin-clinic-info-button is-secondary"
          type="button"
          onClick={() => form.reset(buildDefaultValues(clinicInfo))}
          disabled={updateMutation.isPending}
        >
          Hủy
        </button>
        <button
          className="admin-clinic-info-button is-primary"
          type="submit"
          disabled={isSubmitDisabled}
        >
          {updateMutation.isPending ? 'Đang lưu' : 'Lưu thay đổi'}
        </button>
      </div>
    </form>
  );
}

export { CloseIcon };
