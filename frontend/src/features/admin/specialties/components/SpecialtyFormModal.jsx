import { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { specialtyFormSchema } from '../schemas/admin-specialty.schema.js';
import { useCreateSpecialty } from '../hooks/useCreateSpecialty.js';
import { useUpdateSpecialty } from '../hooks/useUpdateSpecialty.js';

function CloseIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true">
      <path d="m5 5 10 10M15 5 5 15" />
    </svg>
  );
}

function getModalTitle(mode) {
  if (mode === 'edit') {
    return 'Chỉnh sửa chuyên khoa';
  }

  if (mode === 'view') {
    return 'Chi tiết chuyên khoa';
  }

  return 'Thêm chuyên khoa';
}

function getMutationErrorMessage(error) {
  switch (error?.code) {
    case 'SPECIALTY_ALREADY_EXISTS':
      return 'Tên chuyên khoa đã tồn tại.';
    case 'SPECIALTY_SLUG_ALREADY_EXISTS':
      return 'Slug chuyên khoa đã tồn tại.';
    case 'VALIDATION_ERROR':
      return 'Dữ liệu chuyên khoa chưa hợp lệ.';
    case 'UPDATE_SPECIALTY_FAILED':
      return 'Cập nhật chuyên khoa thất bại.';
    case 'CREATE_SPECIALTY_FAILED':
      return 'Tạo chuyên khoa thất bại.';
    default:
      return error?.message ?? 'Đã có lỗi xảy ra trên hệ thống.';
  }
}

function buildDefaultValues(initialData) {
  return {
    name: initialData?.name ?? '',
    description: initialData?.description ?? '',
    active: initialData?.active ?? true,
  };
}

export default function SpecialtyFormModal({
  open,
  mode,
  initialData,
  onClose,
  onSuccess,
}) {
  const isViewMode = mode === 'view';
  const isEditMode = mode === 'edit';

  const form = useForm({
    resolver: zodResolver(specialtyFormSchema),
    defaultValues: buildDefaultValues(initialData),
  });

  useEffect(() => {
    if (open) {
      form.reset(buildDefaultValues(initialData));
    }
  }, [form, initialData, open, mode]);

  const createMutation = useCreateSpecialty({
    onSuccess: (response) => {
      onSuccess?.(response);
      form.reset(buildDefaultValues(null));
    },
  });
  const updateMutation = useUpdateSpecialty({
    onSuccess: (response) => {
      onSuccess?.(response);
    },
  });

  const activeMutation = isEditMode ? updateMutation : createMutation;
  const mutationError = activeMutation.error
    ? getMutationErrorMessage(activeMutation.error)
    : null;

  const viewSummaryItems = useMemo(() => ([
    { label: 'Đường dẫn / Slug', value: initialData?.slug || 'Tự tạo từ tên chuyên khoa' },
    { label: 'Số bác sĩ', value: String(initialData?.doctorCount ?? 0) },
  ]), [initialData]);

  if (!open) {
    return null;
  }

  const handleSubmit = form.handleSubmit((values) => {
    if (isViewMode) {
      return;
    }

    if (isEditMode && initialData?.id) {
      updateMutation.mutate({
        id: initialData.id,
        payload: values,
      });
      return;
    }

    createMutation.mutate(values);
  });

  return (
    <div className="admin-specialty-modal-backdrop" role="presentation">
      <div
        className={`admin-specialty-form-modal ${isViewMode ? 'is-view' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-specialty-modal-title"
      >
        <div className="admin-specialty-form-modal-header">
          <h3 id="admin-specialty-modal-title" className="admin-specialty-form-modal-title">
            {getModalTitle(mode)}
          </h3>

          <button
            className="admin-specialty-form-modal-close"
            type="button"
            aria-label="Đóng"
            onClick={onClose}
            disabled={activeMutation.isPending}
          >
            <CloseIcon />
          </button>
        </div>

        <form className="admin-specialty-form-modal-body" onSubmit={handleSubmit}>
          <div className="admin-specialty-form-field">
            <label className="admin-specialty-form-label" htmlFor="specialty-name">
              Tên chuyên khoa
            </label>
            <input
              id="specialty-name"
              className="admin-specialty-form-input"
              type="text"
              readOnly={isViewMode}
              disabled={isViewMode}
              {...form.register('name')}
            />
            {form.formState.errors.name ? (
              <p className="admin-specialty-form-error">{form.formState.errors.name.message}</p>
            ) : null}
          </div>

          <div className="admin-specialty-form-field">
            <label className="admin-specialty-form-label" htmlFor="specialty-description">
              Mô tả
            </label>
            <textarea
              id="specialty-description"
              className="admin-specialty-form-textarea"
              rows={5}
              readOnly={isViewMode}
              disabled={isViewMode}
              {...form.register('description')}
            />
            {form.formState.errors.description ? (
              <p className="admin-specialty-form-error">
                {form.formState.errors.description.message}
              </p>
            ) : null}
          </div>

          <div className="admin-specialty-form-checkbox-row">
            <label className="admin-specialty-form-checkbox">
              <input
                type="checkbox"
                disabled={isViewMode}
                {...form.register('active')}
              />
              <span>Kích hoạt</span>
            </label>
          </div>

          {isViewMode ? (
            <div className="admin-specialty-form-summary-grid">
              {viewSummaryItems.map((item) => (
                <div key={item.label} className="admin-specialty-form-summary-item">
                  <span className="admin-specialty-form-summary-label">{item.label}</span>
                  <span className="admin-specialty-form-summary-value">{item.value}</span>
                </div>
              ))}
            </div>
          ) : null}

          {mutationError ? (
            <p className="admin-specialty-form-submit-error">{mutationError}</p>
          ) : null}

          <div className="admin-specialty-form-actions">
            <button
              className="admin-specialty-form-button is-secondary"
              type="button"
              onClick={onClose}
              disabled={activeMutation.isPending}
            >
              {isViewMode ? 'Đóng' : 'Hủy'}
            </button>

            {!isViewMode ? (
              <button
                className="admin-specialty-form-button is-primary"
                type="submit"
                disabled={activeMutation.isPending}
              >
                {activeMutation.isPending
                  ? 'Đang xử lý'
                  : isEditMode
                    ? 'Cập nhật'
                    : 'Lưu'}
              </button>
            ) : null}
          </div>
        </form>
      </div>
    </div>
  );
}
