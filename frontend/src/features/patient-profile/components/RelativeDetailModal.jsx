import {
  PATIENT_PROFILE_GENDER_LABELS,
  PATIENT_PROFILE_RELATIONSHIP_LABELS,
} from '../types/patient-profile.types.js';

function CloseIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true">
      <path d="M5.5 5.5 14.5 14.5M14.5 5.5 5.5 14.5" />
    </svg>
  );
}

function PencilIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true">
      <path d="M13.85 3.9a1.5 1.5 0 0 1 2.12 2.12l-8.2 8.2-2.77.65.65-2.77Zm-1.06 1.06L6 11.75l-.28 1.22 1.22-.28 6.8-6.8Z" />
    </svg>
  );
}

function formatDisplayDate(value) {
  if (!value) {
    return '--';
  }

  if (/^\d{2}\/\d{2}\/\d{4}$/.test(value)) {
    return value;
  }

  const parsedDate = new Date(value);

  if (Number.isNaN(parsedDate.getTime())) {
    return value;
  }

  return parsedDate.toLocaleDateString('vi-VN');
}

function formatDisplayValue(value) {
  if (value === null || value === undefined || value === '') {
    return '--';
  }

  return value;
}

function getInitials(name) {
  if (!name) {
    return 'NT';
  }

  return name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

export default function RelativeDetailModal({
  profile,
  onClose,
  onEdit,
}) {
  return (
    <div className="patient-relatives-modal-backdrop" role="presentation">
      <div
        className="patient-relatives-modal patient-relatives-detail-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="patient-relative-detail-title"
      >
        <div className="patient-relatives-modal-header">
          <h3 id="patient-relative-detail-title" className="patient-relatives-modal-title">
            Chi tiết người thân
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

        <div className="patient-relatives-detail-card">
          <div className="patient-relatives-detail-identity">
            <div className="patient-relatives-detail-avatar">{getInitials(profile?.fullName)}</div>
            <div>
              <p className="patient-relatives-detail-name">{profile?.fullName ?? '--'}</p>
              <p className="patient-relatives-detail-meta">
                {PATIENT_PROFILE_RELATIONSHIP_LABELS[profile?.relationship] ?? profile?.relationship ?? '--'}
              </p>
            </div>
          </div>

          <div className="patient-relatives-detail-list">
            <div className="patient-relatives-detail-row">
              <span>Họ và tên</span>
              <strong>{formatDisplayValue(profile?.fullName)}</strong>
            </div>
            <div className="patient-relatives-detail-row">
              <span>Quan hệ</span>
              <strong>{formatDisplayValue(PATIENT_PROFILE_RELATIONSHIP_LABELS[profile?.relationship] ?? profile?.relationship)}</strong>
            </div>
            <div className="patient-relatives-detail-row">
              <span>Giới tính</span>
              <strong>{formatDisplayValue(PATIENT_PROFILE_GENDER_LABELS[profile?.gender] ?? profile?.gender)}</strong>
            </div>
            <div className="patient-relatives-detail-row">
              <span>Ngày sinh</span>
              <strong>{formatDisplayValue(formatDisplayDate(profile?.dateOfBirth))}</strong>
            </div>
            <div className="patient-relatives-detail-row">
              <span>Số điện thoại</span>
              <strong>{formatDisplayValue(profile?.phone)}</strong>
            </div>
            <div className="patient-relatives-detail-row">
              <span>Địa chỉ</span>
              <strong>{formatDisplayValue(profile?.address)}</strong>
            </div>
          </div>
        </div>

        <div className="patient-relatives-modal-actions">
          <button className="patient-relatives-outline-button" type="button" onClick={onClose}>
            Đóng
          </button>
          <button className="patient-relatives-outline-button is-emphasis" type="button" onClick={onEdit}>
            <PencilIcon />
            <span>Chỉnh sửa</span>
          </button>
        </div>
      </div>
    </div>
  );
}
