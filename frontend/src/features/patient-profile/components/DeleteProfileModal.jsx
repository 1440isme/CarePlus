import {
  PATIENT_PROFILE_GENDER_LABELS,
  PATIENT_PROFILE_RELATIONSHIP_LABELS,
} from '../types/patient-profile.types.js';

function getDeleteErrorMessage(error) {
  if (error?.code === 'PROFILE_HAS_ACTIVE_APPOINTMENT') {
    return 'Không thể xóa hồ sơ này vì đang có lịch hẹn chưa hoàn tất.';
  }

  return error?.message ?? 'Không thể xóa hồ sơ người thân.';
}

export default function DeleteProfileModal({
  profile,
  mutation,
  onClose,
  onConfirm,
}) {
  return (
    <div className="patient-relatives-modal-backdrop" role="presentation">
      <div
        className="patient-relatives-modal patient-relatives-confirm-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="patient-relative-delete-title"
      >
        <div className="patient-relatives-modal-header">
          <h3 id="patient-relative-delete-title" className="patient-relatives-modal-title">
            Xác nhận xóa hồ sơ
          </h3>
        </div>

        <div className="patient-relatives-confirm-copy">
          <p className="patient-relatives-confirm-text">
            Bạn có chắc muốn xóa hồ sơ người thân này không?
          </p>

          <div className="patient-relatives-confirm-summary">
            <p><strong>Họ và tên:</strong> {profile?.fullName ?? '--'}</p>
            <p><strong>Quan hệ:</strong> {PATIENT_PROFILE_RELATIONSHIP_LABELS[profile?.relationship] ?? profile?.relationship ?? '--'}</p>
            <p><strong>Giới tính:</strong> {PATIENT_PROFILE_GENDER_LABELS[profile?.gender] ?? profile?.gender ?? '--'}</p>
            <p><strong>Số điện thoại:</strong> {profile?.phone ?? '--'}</p>
          </div>

          {mutation.error ? (
            <p className="patient-relatives-form-submit-error">{getDeleteErrorMessage(mutation.error)}</p>
          ) : null}
        </div>

        <div className="patient-relatives-modal-actions">
          <button
            className="patient-relatives-outline-button"
            type="button"
            onClick={onClose}
            disabled={mutation.isPending}
          >
            Hủy
          </button>
          <button
            className="patient-relatives-danger-button"
            type="button"
            onClick={onConfirm}
            disabled={mutation.isPending}
          >
            {mutation.isPending ? 'Đang xóa...' : 'Xác nhận xóa'}
          </button>
        </div>
      </div>
    </div>
  );
}
