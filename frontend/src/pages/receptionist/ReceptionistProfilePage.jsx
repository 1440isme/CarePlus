import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMe } from '../../features/user/hooks/useMe.js';
import { useUpdateMe } from '../../features/user/hooks/useUpdateMe.js';
import { updateMeSchema } from '../../features/user/schemas/user.schema.js';
import StateBlock from '../../shared/components/feedback/StateBlock.jsx';
import './receptionist.css';

function formatDateForDisplay(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return '';
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

function getInitials(name) {
  if (!name) return 'LT';
  const words = name.trim().split(/\s+/).filter(Boolean);
  return words.slice(0, 2).map(w => w[0]?.toUpperCase()).join('') || 'LT';
}

export default function ReceptionistProfilePage() {
  const [isEditMode, setIsEditMode] = useState(false);
  const [statusBanner, setStatusBanner] = useState(null);

  const { data: meResponse, isLoading, isError, error } = useMe();
  const user = meResponse?.data;

  const updateMeMutation = useUpdateMe({
    onSuccess: () => {
      setStatusBanner({ type: 'success', message: 'Cập nhật thông tin cá nhân thành công!' });
      setIsEditMode(false);
      setTimeout(() => setStatusBanner(null), 3000);
    },
    onError: (err) => {
      setStatusBanner({
        type: 'error',
        message: err?.response?.data?.error?.message || err?.message || 'Có lỗi xảy ra khi lưu thông tin.'
      });
    }
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty }
  } = useForm({
    resolver: zodResolver(updateMeSchema),
    defaultValues: {
      name: '',
      phone: '',
      gender: '',
      dateOfBirth: '',
      address: ''
    }
  });

  useEffect(() => {
    if (user) {
      reset({
        name: user.name || '',
        phone: user.phone || '',
        gender: user.gender || '',
        dateOfBirth: formatDateForDisplay(user.dateOfBirth),
        address: user.address || ''
      });
    }
  }, [user, reset]);

  if (isLoading) {
    return (
      <div className="receptionist-page" style={{ padding: '40px', textAlign: 'center' }}>
        <div style={{
          width: '32px',
          height: '32px',
          margin: '0 auto 16px',
          borderRadius: '50%',
          border: '3px solid #d8f0f7',
          borderTopColor: '#0092b8',
          animation: 'spin 1s linear infinite'
        }} />
        <p>Đang tải thông tin cá nhân...</p>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (isError || !user) {
    return (
      <div className="receptionist-page" style={{ padding: '24px' }}>
        <StateBlock
          variant="danger"
          title="Không thể tải thông tin cá nhân"
          description={error?.message || 'Đã có lỗi xảy ra trên hệ thống. Vui lòng thử lại sau.'}
        />
      </div>
    );
  }

  const handleEditClick = () => {
    setIsEditMode(true);
    setStatusBanner(null);
  };

  const handleCancelClick = () => {
    setIsEditMode(false);
    setStatusBanner(null);
    reset({
      name: user.name || '',
      phone: user.phone || '',
      gender: user.gender || '',
      dateOfBirth: formatDateForDisplay(user.dateOfBirth),
      address: user.address || ''
    });
  };

  const onSubmit = (values) => {
    const payload = {};
    if (values.name !== user.name) payload.name = values.name.trim();
    if (values.phone !== user.phone) payload.phone = values.phone.trim();
    if (values.gender !== user.gender) payload.gender = values.gender;
    if (values.dateOfBirth !== formatDateForDisplay(user.dateOfBirth)) payload.dateOfBirth = values.dateOfBirth.trim();
    if (values.address !== user.address) payload.address = values.address.trim();

    if (Object.keys(payload).length === 0) {
      setIsEditMode(false);
      return;
    }

    updateMeMutation.mutate(payload);
  };

  return (
    <div className="receptionist-page profile-page-wrapper">
      <div className="profile-page-header">
        <h1>Thông tin cá nhân</h1>
        <p>Quản lý thông tin tài khoản của bạn</p>
      </div>

      {statusBanner && (
        <div className={`profile-submit-status-banner ${statusBanner.type}`}>
          {statusBanner.message}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)}>
        {/* Card 1: Summary Card */}
        <div className="profile-summary-card">
          <div className="profile-card-accent-bar" />
          <div className="profile-summary-content">
            <div className="profile-avatar-circle">
              {getInitials(user.name)}
            </div>
            <div className="profile-summary-info">
              <h2>{user.name}</h2>
              <p className="profile-role">Lễ tân</p>
              <span className="status-badge-active">
                <span className="status-dot status-dot-completed" style={{ margin: '0 4px 0 0', width: '6px', height: '6px' }} />
                Hoạt động
              </span>
            </div>

            {!isEditMode && (
              <button
                type="button"
                className="profile-edit-action-btn"
                onClick={handleEditClick}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '4px' }}>
                  <path d="M12 20h9"></path>
                  <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"></path>
                </svg>
                Chỉnh sửa
              </button>
            )}
          </div>
        </div>

        {/* Card 2: Details Card */}
        <div className="profile-details-card">
          <div className="profile-details-list">
            {/* Họ và tên */}
            <div className="profile-detail-item">
              <span className="profile-detail-label">Họ và tên</span>
              {isEditMode ? (
                <div className="profile-edit-field">
                  <input
                    type="text"
                    className="profile-edit-input"
                    {...register('name')}
                  />
                  {errors.name && <span className="profile-edit-error-msg">{errors.name.message}</span>}
                </div>
              ) : (
                <span className="profile-detail-value">{user.name}</span>
              )}
            </div>

            {/* Email */}
            <div className="profile-detail-item">
              <span className="profile-detail-label">Email</span>
              <span className="profile-detail-value email-value">{user.email}</span>
            </div>

            {/* Số điện thoại */}
            <div className="profile-detail-item">
              <span className="profile-detail-label">Số điện thoại</span>
              {isEditMode ? (
                <div className="profile-edit-field">
                  <input
                    type="text"
                    className="profile-edit-input"
                    {...register('phone')}
                  />
                  {errors.phone && <span className="profile-edit-error-msg">{errors.phone.message}</span>}
                </div>
              ) : (
                <span className="profile-detail-value">{user.phone || '--'}</span>
              )}
            </div>

            {/* Giới tính */}
            <div className="profile-detail-item">
              <span className="profile-detail-label">Giới tính</span>
              {isEditMode ? (
                <div className="profile-edit-field">
                  <select
                    className="profile-edit-input"
                    {...register('gender')}
                  >
                    <option value="">Chọn giới tính</option>
                    <option value="MALE">Nam</option>
                    <option value="FEMALE">Nữ</option>
                    <option value="OTHER">Khác</option>
                  </select>
                  {errors.gender && <span className="profile-edit-error-msg">{errors.gender.message}</span>}
                </div>
              ) : (
                <span className="profile-detail-value">
                  {user.gender === 'MALE' ? 'Nam' : user.gender === 'FEMALE' ? 'Nữ' : user.gender === 'OTHER' ? 'Khác' : '--'}
                </span>
              )}
            </div>

            {/* Ngày sinh */}
            <div className="profile-detail-item">
              <span className="profile-detail-label">Ngày sinh</span>
              {isEditMode ? (
                <div className="profile-edit-field">
                  <input
                    type="text"
                    className="profile-edit-input"
                    placeholder="DD/MM/YYYY"
                    {...register('dateOfBirth')}
                  />
                  {errors.dateOfBirth && <span className="profile-edit-error-msg">{errors.dateOfBirth.message}</span>}
                </div>
              ) : (
                <span className="profile-detail-value">{formatDateForDisplay(user.dateOfBirth) || '--'}</span>
              )}
            </div>

            {/* Địa chỉ */}
            <div className="profile-detail-item">
              <span className="profile-detail-label">Địa chỉ</span>
              {isEditMode ? (
                <div className="profile-edit-field">
                  <input
                    type="text"
                    className="profile-edit-input"
                    {...register('address')}
                  />
                  {errors.address && <span className="profile-edit-error-msg">{errors.address.message}</span>}
                </div>
              ) : (
                <span className="profile-detail-value">{user.address || '--'}</span>
              )}
            </div>
          </div>

          {isEditMode && (
            <div className="profile-form-actions">
              <button
                type="button"
                className="profile-btn-cancel"
                onClick={handleCancelClick}
                disabled={updateMeMutation.isPending}
              >
                Hủy
              </button>
              <button
                type="submit"
                className="profile-btn-save"
                disabled={updateMeMutation.isPending || !isDirty}
              >
                {updateMeMutation.isPending ? 'Đang lưu...' : 'Lưu thay đổi'}
              </button>
            </div>
          )}
        </div>
      </form>
    </div>
  );
}
