import { useEffect, useState } from 'react';
import {
  ClinicInfoForm,
  useClinicInfo,
} from '../../features/admin/clinic-settings/index.js';
import { CloseIcon } from '../../features/admin/clinic-settings/components/ClinicInfoForm.jsx';
import '../../features/admin/clinic-settings/components/admin-clinic-info.css';

function getClinicInfoErrorMessage(error) {
  switch (error?.code) {
    case 'FORBIDDEN':
      return 'Bạn không có quyền truy cập thông tin phòng khám.';
    case 'CLINIC_INFO_NOT_FOUND':
      return 'Không tìm thấy thông tin phòng khám.';
    case 'GET_CLINIC_INFO_FAILED':
      return 'Tải thông tin phòng khám thất bại.';
    default:
      return error?.message ?? 'Đã có lỗi xảy ra khi tải thông tin phòng khám.';
  }
}

function LoadingState() {
  return (
    <div className="admin-clinic-info-loading" aria-hidden="true">
      <div className="admin-clinic-info-skeleton is-title" />
      <div className="admin-clinic-info-skeleton is-input" />
      <div className="admin-clinic-info-skeleton is-input" />
      <div className="admin-clinic-info-skeleton is-input" />
      <div className="admin-clinic-info-skeleton is-input" />
      <div className="admin-clinic-info-skeleton is-input" />
      <div className="admin-clinic-info-skeleton is-textarea" />
    </div>
  );
}

export default function AdminClinicInfoPage() {
  const [feedback, setFeedback] = useState(null);
  const clinicInfoQuery = useClinicInfo();

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
    <section className="admin-clinic-info-page">
      <div className="admin-clinic-info-page-header">
        <h2 className="admin-clinic-info-page-title">Thông tin phòng khám</h2>
      </div>

      <div className="admin-clinic-info-card">
        <div className="admin-clinic-info-card-inner">
          {feedback ? (
            <div className={`admin-clinic-info-feedback ${feedback.type === 'success' ? 'is-success' : 'is-error'}`}>
              <p className="admin-clinic-info-feedback-text">{feedback.message}</p>
              <button
                type="button"
                className="admin-clinic-info-feedback-close"
                aria-label="Ẩn thông báo"
                onClick={() => setFeedback(null)}
              >
                <CloseIcon />
              </button>
            </div>
          ) : null}

          {clinicInfoQuery.isLoading ? <LoadingState /> : null}

          {clinicInfoQuery.isError ? (
            <div className="admin-clinic-info-state-panel">
              <h3>Không thể tải thông tin phòng khám</h3>
              <p>{getClinicInfoErrorMessage(clinicInfoQuery.error)}</p>
              <button
                className="admin-clinic-info-state-button"
                type="button"
                onClick={() => clinicInfoQuery.refetch()}
              >
                Thử lại
              </button>
            </div>
          ) : null}

          {!clinicInfoQuery.isLoading && !clinicInfoQuery.isError ? (
            <ClinicInfoForm
              clinicInfo={clinicInfoQuery.data?.data}
              onSuccess={(response) => {
                setFeedback({
                  type: 'success',
                  message: response?.message ?? 'Cập nhật thông tin phòng khám thành công.',
                });
              }}
            />
          ) : null}
        </div>
      </div>
    </section>
  );
}
