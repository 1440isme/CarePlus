import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  ADMIN_USER_ROLE_LABELS,
  ADMIN_USER_STATUS_LABELS,
  ADMIN_USER_VERIFIED_LABELS,
} from '../types/admin-user.types.js';
import { adminUserEditSchema } from '../schemas/admin-user.schema.js';
import { useAdminUserDetail } from '../hooks/useAdminUserDetail.js';
import { useUpdateAdminUser } from '../hooks/useUpdateAdminUser.js';
import './admin-users.css';

const GENDER_OPTIONS = [
  { value: 'MALE', label: 'Nam' },
  { value: 'FEMALE', label: 'Nữ' },
  { value: 'OTHER', label: 'Khác' },
];

function CloseIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true">
      <path d="m5 5 10 10M15 5 5 15" />
    </svg>
  );
}

function PencilIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true">
      <path d="m4.5 13.75 8.75-8.75 2.5 2.5-8.75 8.75-3.5 1Z" />
      <path d="m12.5 5.75 2.5 2.5" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true">
      <path d="M6.25 8V6.5a3.75 3.75 0 1 1 7.5 0V8m-8.5 0h9.5a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1h-9.5a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1Z" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true">
      <path d="M5.75 6.25h8.5M8 6.25v-1a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v1m-7 0 .55 8.05A1.75 1.75 0 0 0 7.3 16h5.4a1.75 1.75 0 0 0 1.75-1.7L15 6.25" />
      <path d="M8.75 9v4.25M11.25 9v4.25" />
    </svg>
  );
}

function getInitials(name) {
  if (!name) {
    return 'A';
  }

  return name
    .trim()
    .split(/\s+/)
    .slice(0, 1)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');
}

function formatDate(value) {
  if (!value) {
    return '--';
  }

  return value;
}

function formatCreatedDate(value) {
  if (!value) {
    return '--';
  }

  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value;
  }

  const parsedDate = new Date(value);
  if (Number.isNaN(parsedDate.getTime())) {
    return value;
  }

  const year = parsedDate.getFullYear();
  const month = String(parsedDate.getMonth() + 1).padStart(2, '0');
  const day = String(parsedDate.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function formatGender(value) {
  if (value === 'MALE') {
    return 'Nam';
  }

  if (value === 'FEMALE') {
    return 'Nữ';
  }

  if (value === 'OTHER') {
    return 'Khác';
  }

  return '--';
}

function getDetailErrorMessage(error) {
  switch (error?.code) {
    case 'USER_NOT_FOUND':
      return 'Không tìm thấy người dùng.';
    case 'FORBIDDEN':
      return 'Bạn không có quyền xem chi tiết người dùng.';
    default:
      return error?.message ?? 'Không thể tải chi tiết người dùng.';
  }
}

function createEditDefaultValues(user) {
  return {
    name: user?.name ?? '',
    phone: user?.phone ?? '',
    gender: user?.gender ?? 'OTHER',
    dateOfBirth: user?.dateOfBirth ?? '',
    address: user?.address ?? '',
  };
}

function DetailRow({ label, value }) {
  return (
    <div className="admin-user-detail-row">
      <span className="admin-user-detail-row-label">{label}</span>
      <span className="admin-user-detail-row-value">{value || '--'}</span>
    </div>
  );
}

function DetailEditField({ label, error, children }) {
  return (
    <div className="admin-user-detail-edit-field">
      <label className="admin-user-detail-edit-label">{label}</label>
      {children}
      {error ? <p className="admin-user-detail-edit-error">{error}</p> : null}
    </div>
  );
}

export default function AdminUserDetailDrawer({
  open,
  userId,
  onClose,
  onRequestLockToggle,
  onRequestResetNoShow,
  isStatusUpdating,
  statusUpdatingUserId,
  isResettingNoShow,
  resetNoShowUserId,
}) {
  const [note, setNote] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const detailQuery = useAdminUserDetail(userId, { enabled: open && Boolean(userId) });
  const user = detailQuery.data?.data ?? null;
  const updateAdminUserMutation = useUpdateAdminUser({
    onSuccess: (response) => {
      setNote(response?.data?.message ?? 'Cập nhật thông tin người dùng thành công.');
      setIsEditing(false);
    },
  });

  const defaultValues = useMemo(() => createEditDefaultValues(user), [user]);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isDirty },
  } = useForm({
    resolver: zodResolver(adminUserEditSchema),
    defaultValues,
    mode: 'onChange',
  });

  useEffect(() => {
    if (open) {
      setNote('');
      setIsEditing(false);
      reset(defaultValues);
    }
  }, [defaultValues, open, reset]);

  const formValues = watch();
  const hasMeaningfulChanges = useMemo(() => {
    if (!isDirty) {
      return false;
    }

    return JSON.stringify(formValues) !== JSON.stringify(defaultValues);
  }, [defaultValues, formValues, isDirty]);

  if (!open) {
    return null;
  }

  if (detailQuery.isLoading || !user) {
    return (
      <div className="admin-user-drawer-backdrop" role="presentation" onClick={onClose}>
        <aside
          className="admin-user-drawer"
          role="dialog"
          aria-modal="true"
          aria-labelledby="admin-user-drawer-title"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="admin-user-detail-topbar">
            <h3 className="admin-user-drawer-title" id="admin-user-drawer-title">Chi tiết tài khoản</h3>

            <button className="admin-user-drawer-close" type="button" onClick={onClose} aria-label="Đóng">
              <CloseIcon />
            </button>
          </div>

          <section className="admin-user-detail-section">
            {detailQuery.isError ? (
              <div className="admin-user-detail-state">
                <p className="admin-user-detail-note is-error">{getDetailErrorMessage(detailQuery.error)}</p>
                <button className="admin-user-detail-secondary-button" type="button" onClick={() => detailQuery.refetch()}>
                  Thử lại
                </button>
              </div>
            ) : (
              <div className="admin-user-detail-state">
                <p className="admin-user-detail-note">Đang tải chi tiết người dùng...</p>
              </div>
            )}
          </section>
        </aside>
      </div>
    );
  }

  const isUserBeingUpdated = isStatusUpdating && statusUpdatingUserId === user.id;
  const isUserNoShowBeingReset = isResettingNoShow && resetNoShowUserId === user.id;
  const isLockAction = user.status === 'ACTIVE';
  const editErrorMessage = updateAdminUserMutation.error?.message ?? 'Không thể cập nhật thông tin người dùng.';
  const isSaveDisabled = updateAdminUserMutation.isPending || !hasMeaningfulChanges;

  const handleEditSubmit = (values) => {
    setNote('');
    updateAdminUserMutation.mutate({
      userId: user.id,
      payload: values,
    });
  };

  return (
    <div className="admin-user-drawer-backdrop" role="presentation" onClick={onClose}>
      <aside
        className="admin-user-drawer"
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-user-drawer-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="admin-user-detail-topbar">
          <h3 className="admin-user-drawer-title" id="admin-user-drawer-title">Chi tiết tài khoản</h3>

          <button className="admin-user-drawer-close" type="button" onClick={onClose} aria-label="Đóng">
            <CloseIcon />
          </button>
        </div>

        <section className="admin-user-detail-section">
          <div className="admin-user-detail-section-header">
            <p className="admin-user-detail-section-title">A. THÔNG TIN CÁ NHÂN</p>

            {!isEditing ? (
              <button className="admin-user-detail-outline-button" type="button" onClick={() => setIsEditing(true)}>
                <PencilIcon />
                <span>Chỉnh sửa</span>
              </button>
            ) : null}
          </div>

          <div className="admin-user-detail-profile">
            <div className="admin-user-detail-avatar">{getInitials(user.name)}</div>
            <div className="admin-user-detail-profile-copy">
              <p className="admin-user-detail-profile-name">{user.name}</p>
              <p className="admin-user-detail-profile-email">{user.email}</p>
            </div>
          </div>

          {!isEditing ? (
            <div className="admin-user-detail-list">
              <DetailRow label="Họ tên" value={user.name} />
              <DetailRow label="Ngày sinh" value={formatDate(user.dateOfBirth)} />
              <DetailRow label="Giới tính" value={formatGender(user.gender)} />
              <DetailRow label="Email" value={user.email} />
              <DetailRow label="SĐT" value={user.phone || '—'} />
              <DetailRow label="Địa chỉ" value={user.address || '—'} />
            </div>
          ) : (
            <form className="admin-user-detail-edit-form" onSubmit={handleSubmit(handleEditSubmit)}>
              <DetailEditField label="Họ tên" error={errors.name?.message}>
                <input className="admin-user-detail-input" type="text" {...register('name')} />
              </DetailEditField>

              <DetailEditField label="Email">
                <input className="admin-user-detail-input is-disabled" type="email" value={user.email} readOnly disabled />
              </DetailEditField>

              <DetailEditField label="SĐT" error={errors.phone?.message}>
                <input className="admin-user-detail-input" type="text" {...register('phone')} />
              </DetailEditField>

              <DetailEditField label="Giới tính" error={errors.gender?.message}>
                <select className="admin-user-detail-input" {...register('gender')}>
                  {GENDER_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </DetailEditField>

              <DetailEditField label="Ngày sinh" error={errors.dateOfBirth?.message}>
                <input className="admin-user-detail-input" type="text" placeholder="DD/MM/YYYY" {...register('dateOfBirth')} />
              </DetailEditField>

              <DetailEditField label="Địa chỉ" error={errors.address?.message}>
                <textarea className="admin-user-detail-textarea" rows={4} {...register('address')} />
              </DetailEditField>

              <div className="admin-user-detail-edit-actions">
                <button
                  className="admin-user-detail-secondary-button"
                  type="button"
                  disabled={updateAdminUserMutation.isPending}
                  onClick={() => {
                    reset(defaultValues);
                    setIsEditing(false);
                    setNote('');
                    updateAdminUserMutation.reset();
                  }}
                >
                  Hủy
                </button>
                <button
                  className="admin-user-detail-submit-button"
                  type="submit"
                  disabled={isSaveDisabled}
                >
                  {updateAdminUserMutation.isPending ? 'Đang lưu...' : 'Lưu'}
                </button>
              </div>

              {updateAdminUserMutation.error ? (
                <p className="admin-user-detail-note">{editErrorMessage}</p>
              ) : null}
            </form>
          )}
        </section>

        {!isEditing ? (
          <>
            <section className="admin-user-detail-section">
              <p className="admin-user-detail-section-title">B. THÔNG TIN TÀI KHOẢN</p>
              <div className="admin-user-detail-list">
                <DetailRow label="Vai trò" value={ADMIN_USER_ROLE_LABELS[user.role] ?? user.role} />
                <DetailRow label="Trạng thái" value={ADMIN_USER_STATUS_LABELS[user.status] ?? user.status} />
                <DetailRow label="Email xác minh" value={ADMIN_USER_VERIFIED_LABELS[String(Boolean(user.emailVerified))]} />
                <DetailRow label="Số lần vắng mặt" value={String(user.noShowCount ?? 0)} />
                <DetailRow label="Ngày tạo" value={formatCreatedDate(user.createdAt)} />
              </div>
            </section>

            <section className="admin-user-detail-section">
              <p className="admin-user-detail-section-title">C. THAO TÁC TÀI KHOẢN</p>
              <div className="admin-user-detail-account-actions">
                <button
                  className="admin-user-detail-danger-button"
                  type="button"
                  onClick={() => onRequestLockToggle(user)}
                  disabled={isUserBeingUpdated}
                >
                  <LockIcon />
                  <span>
                    {isUserBeingUpdated
                      ? 'Đang cập nhật'
                      : isLockAction
                        ? 'Khóa tài khoản'
                        : 'Mở khóa tài khoản'}
                  </span>
                </button>

                <button
                  className="admin-user-detail-warning-button"
                  type="button"
                  onClick={() => onRequestResetNoShow(user)}
                  disabled={isUserNoShowBeingReset || Number(user.noShowCount ?? 0) === 0}
                >
                  <TrashIcon />
                  <span>{isUserNoShowBeingReset ? 'Đang reset' : 'Reset số lần vắng mặt'}</span>
                </button>
              </div>
            </section>
          </>
        ) : null}

        {note ? <p className="admin-user-detail-note">{note}</p> : null}
      </aside>
    </div>
  );
}
