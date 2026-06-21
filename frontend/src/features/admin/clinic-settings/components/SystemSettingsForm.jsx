import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { systemSettingsFormSchema } from '../schemas/system-settings.schema.js';
import { useUpdateSystemSettings } from '../hooks/useUpdateSystemSettings.js';

function getMutationErrorMessage(error) {
  switch (error?.code) {
    case 'FORBIDDEN':
      return 'Bạn không có quyền cập nhật cấu hình hệ thống.';
    case 'VALIDATION_ERROR':
      return 'Dữ liệu cấu hình hệ thống chưa hợp lệ.';
    case 'SYSTEM_SETTING_NOT_FOUND':
      return 'Không tìm thấy cấu hình hệ thống.';
    case 'UPDATE_SYSTEM_SETTING_FAILED':
      return 'Cập nhật cấu hình hệ thống thất bại.';
    default:
      return error?.message ?? 'Đã có lỗi xảy ra trên hệ thống.';
  }
}

function buildDefaultValues(systemSettings) {
  return {
    maxBookingDaysAhead: systemSettings?.maxBookingDaysAhead,
    slotDurationMinutes: systemSettings?.slotDurationMinutes,
    cancelBeforeHours: systemSettings?.cancelBeforeHours,
    maxNoShowBeforeLock: systemSettings?.maxNoShowBeforeLock,
    maxActiveAppointmentsPerUser: systemSettings?.maxActiveAppointmentsPerUser,
    morningShiftStart: systemSettings?.morningShiftStart ?? '',
    morningShiftEnd: systemSettings?.morningShiftEnd ?? '',
    afternoonShiftStart: systemSettings?.afternoonShiftStart ?? '',
    afternoonShiftEnd: systemSettings?.afternoonShiftEnd ?? '',
  };
}

function NumberField({ form, name, label }) {
  return (
    <div className="admin-system-settings-field">
      <label className="admin-system-settings-label" htmlFor={name}>
        {label}
        <span className="admin-system-settings-required">*</span>
      </label>
      <input
        id={name}
        className="admin-system-settings-input"
        type="number"
        step="1"
        {...form.register(name, { valueAsNumber: true })}
      />
      {form.formState.errors[name] ? (
        <p className="admin-system-settings-error">{form.formState.errors[name].message}</p>
      ) : null}
    </div>
  );
}

function TimeField({ form, name, label }) {
  return (
    <div className="admin-system-settings-field">
      <label className="admin-system-settings-label" htmlFor={name}>
        {label}
        <span className="admin-system-settings-required">*</span>
      </label>
      <input
        id={name}
        className="admin-system-settings-input"
        type="time"
        {...form.register(name)}
      />
      {form.formState.errors[name] ? (
        <p className="admin-system-settings-error">{form.formState.errors[name].message}</p>
      ) : null}
    </div>
  );
}

export default function SystemSettingsForm({
  systemSettings,
  onSuccess,
}) {
  const form = useForm({
    resolver: zodResolver(systemSettingsFormSchema),
    defaultValues: buildDefaultValues(systemSettings),
  });

  useEffect(() => {
    form.reset(buildDefaultValues(systemSettings));
  }, [form, systemSettings]);

  const updateMutation = useUpdateSystemSettings({
    onSuccess: (response) => {
      onSuccess?.(response);
      form.reset(buildDefaultValues(response?.data));
    },
  });

  const mutationError = updateMutation.error
    ? getMutationErrorMessage(updateMutation.error)
    : null;

  const handleSubmit = form.handleSubmit((values) => {
    updateMutation.mutate(values);
  });

  return (
    <form className="admin-system-settings-form" onSubmit={handleSubmit}>
      <div className="admin-system-settings-grid">
        <section className="admin-system-settings-card-section">
          <h3 className="admin-system-settings-card-title">Cài đặt đặt lịch</h3>
          <div className="admin-system-settings-card-fields">
            <NumberField
              form={form}
              name="maxBookingDaysAhead"
              label="Đặt lịch trước tối đa (ngày)"
            />
            <NumberField
              form={form}
              name="slotDurationMinutes"
              label="Thời lượng mỗi khung giờ khám (phút)"
            />
            <NumberField
              form={form}
              name="cancelBeforeHours"
              label="Thời gian hủy lịch tối thiểu (giờ)"
            />
            <NumberField
              form={form}
              name="maxNoShowBeforeLock"
              label="Số lần vắng mặt tối đa"
            />
            <NumberField
              form={form}
              name="maxActiveAppointmentsPerUser"
              label="Số lịch hẹn active tối đa / người dùng"
            />
          </div>
        </section>

        <section className="admin-system-settings-card-section">
          <h3 className="admin-system-settings-card-title">Giờ ca làm việc</h3>
          <div className="admin-system-settings-card-fields is-time-grid">
            <TimeField form={form} name="morningShiftStart" label="Ca sáng bắt đầu" />
            <TimeField form={form} name="morningShiftEnd" label="Ca sáng kết thúc" />
            <TimeField form={form} name="afternoonShiftStart" label="Ca chiều bắt đầu" />
            <TimeField form={form} name="afternoonShiftEnd" label="Ca chiều kết thúc" />
          </div>
        </section>
      </div>

      {mutationError ? (
        <p className="admin-system-settings-submit-error">{mutationError}</p>
      ) : null}

      <div className="admin-system-settings-actions">
        <button
          className="admin-system-settings-button is-secondary"
          type="button"
          onClick={() => form.reset(buildDefaultValues(systemSettings))}
          disabled={updateMutation.isPending}
        >
          Hủy
        </button>
        <button
          className="admin-system-settings-button is-primary"
          type="submit"
          disabled={updateMutation.isPending || !form.formState.isDirty}
        >
          {updateMutation.isPending ? 'Đang lưu' : 'Lưu cài đặt'}
        </button>
      </div>
    </form>
  );
}
