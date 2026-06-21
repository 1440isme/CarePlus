import { useEffect, useState } from 'react';
import { CloseIcon } from '../../features/admin/clinic-settings/components/ClinicInfoForm.jsx';
import { useSystemSettings } from '../../features/admin/clinic-settings/hooks/useSystemSettings.js';
import SystemSettingsForm from '../../features/admin/clinic-settings/components/SystemSettingsForm.jsx';
import '../../features/admin/clinic-settings/components/admin-system-settings.css';

function getSystemSettingsErrorMessage(error) {
  switch (error?.code) {
    case 'FORBIDDEN':
      return 'Bạn không có quyền truy cập cấu hình hệ thống.';
    case 'SYSTEM_SETTING_NOT_FOUND':
      return 'Không tìm thấy cấu hình hệ thống.';
    case 'GET_SYSTEM_SETTING_FAILED':
      return 'Tải cấu hình hệ thống thất bại.';
    default:
      return error?.message ?? 'Đã có lỗi xảy ra khi tải cấu hình hệ thống.';
  }
}

function LoadingState() {
  return (
    <div className="admin-system-settings-loading" aria-hidden="true">
      <div className="admin-system-settings-loading-card">
        <div className="admin-system-settings-skeleton is-title" />
        <div className="admin-system-settings-skeleton is-input" />
        <div className="admin-system-settings-skeleton is-input" />
        <div className="admin-system-settings-skeleton is-input" />
        <div className="admin-system-settings-skeleton is-input" />
        <div className="admin-system-settings-skeleton is-input" />
      </div>
      <div className="admin-system-settings-loading-card">
        <div className="admin-system-settings-skeleton is-title" />
        <div className="admin-system-settings-skeleton is-input" />
        <div className="admin-system-settings-skeleton is-input" />
        <div className="admin-system-settings-skeleton is-input" />
        <div className="admin-system-settings-skeleton is-input" />
      </div>
    </div>
  );
}

export default function AdminSystemSettingsPage() {
  const [feedback, setFeedback] = useState(null);
  const systemSettingsQuery = useSystemSettings();

  useEffect(() => {
    if (!feedback) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      setFeedback(null);
    }, 5000);

    return () => window.clearTimeout(timeoutId);
  }, [feedback]);

  return (
    <section className="admin-system-settings-page">
      <div className="admin-system-settings-page-header">
        <h2 className="admin-system-settings-page-title">Cài đặt hệ thống</h2>
      </div>

      <div className="admin-system-settings-shell">
        {feedback ? (
          <div className={`admin-system-settings-feedback ${feedback.type === 'success' ? 'is-success' : 'is-error'}`}>
            <p className="admin-system-settings-feedback-text">{feedback.message}</p>
            <button
              type="button"
              className="admin-system-settings-feedback-close"
              aria-label="Ẩn thông báo"
              onClick={() => setFeedback(null)}
            >
              <CloseIcon />
            </button>
          </div>
        ) : null}

        {systemSettingsQuery.isLoading ? <LoadingState /> : null}

        {systemSettingsQuery.isError ? (
          <div className="admin-system-settings-state-panel">
            <h3>Không thể tải cấu hình hệ thống</h3>
            <p>{getSystemSettingsErrorMessage(systemSettingsQuery.error)}</p>
            <button
              className="admin-system-settings-state-button"
              type="button"
              onClick={() => systemSettingsQuery.refetch()}
            >
              Thử lại
            </button>
          </div>
        ) : null}

        {!systemSettingsQuery.isLoading && !systemSettingsQuery.isError ? (
          <SystemSettingsForm
            systemSettings={systemSettingsQuery.data?.data}
            onSuccess={(response) => {
              setFeedback({
                type: 'success',
                message: response?.message ?? 'Cập nhật cấu hình hệ thống thành công.',
              });
            }}
          />
        ) : null}
      </div>
    </section>
  );
}
