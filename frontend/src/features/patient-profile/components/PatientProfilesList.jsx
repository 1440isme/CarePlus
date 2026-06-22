import {
  PATIENT_PROFILE_GENDER_LABELS,
  PATIENT_PROFILE_RELATIONSHIP_LABELS,
} from '../types/patient-profile.types.js';

function PlusIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true">
      <path d="M10 4.5v11M4.5 10h11" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true">
      <path d="M10 3.75a3.25 3.25 0 1 1 0 6.5 3.25 3.25 0 0 1 0-6.5Zm-5.25 11a5.25 5.25 0 1 1 10.5 0v.5H4.75Z" />
    </svg>
  );
}

function EyeIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true">
      <path d="M1.75 10s3-4.75 8.25-4.75S18.25 10 18.25 10 15.25 14.75 10 14.75 1.75 10 1.75 10Z" />
      <circle cx="10" cy="10" r="2.25" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true">
      <path d="M4.75 5.5h10.5M7.25 5.5V4.25a.75.75 0 0 1 .75-.75h4a.75.75 0 0 1 .75.75V5.5m-7.25 0 .5 9a1 1 0 0 0 1 .94h6a1 1 0 0 0 1-.94l.5-9M8.5 8v4.75M11.5 8v4.75" />
    </svg>
  );
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

function formatDateForCard(value) {
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

export default function PatientProfilesList({
  profiles,
  onCreate,
  onViewDetail,
  onDelete,
}) {
  const activeCount = profiles.length;

  return (
    <section className="patient-relatives-page">
      <div className="patient-relatives-header">
        <div>
          <h2 className="patient-relatives-title">Hồ sơ người thân</h2>
          <p className="patient-relatives-counter">Đang hoạt động: {activeCount} hồ sơ</p>
        </div>

        <button className="patient-relatives-add-button" type="button" onClick={onCreate}>
          <PlusIcon />
          <span>Thêm người thân</span>
        </button>
      </div>

      {activeCount === 0 ? (
        <div className="patient-relatives-card patient-relatives-empty-state">
          <div className="patient-relatives-empty-icon">
            <UserIcon />
          </div>
          <h3>Bạn chưa có hồ sơ người thân nào.</h3>
          <p>Thêm hồ sơ để đặt lịch nhanh hơn cho người thân của bạn.</p>
          <button className="patient-relatives-add-button" type="button" onClick={onCreate}>
            <PlusIcon />
            <span>Thêm người thân</span>
          </button>
        </div>
      ) : (
        <div className="patient-relatives-card">
          {profiles.map((profile, index) => (
            <div
              key={profile.id}
              className={`patient-relatives-item ${index < profiles.length - 1 ? 'has-divider' : ''}`}
            >
              <div className="patient-relatives-item-main">
                <div className="patient-relatives-avatar">
                  {getInitials(profile.fullName)}
                </div>

                <div className="patient-relatives-copy">
                  <div className="patient-relatives-copy-heading">
                    <h3>{profile.fullName}</h3>
                  </div>
                  <p>
                    {PATIENT_PROFILE_RELATIONSHIP_LABELS[profile.relationship] ?? profile.relationship}
                    {' · '}
                    {PATIENT_PROFILE_GENDER_LABELS[profile.gender] ?? profile.gender}
                    {' · '}
                    {formatDateForCard(profile.dateOfBirth)}
                  </p>
                  <span>{profile.phone}</span>
                </div>
              </div>

              <div className="patient-relatives-actions">
                <button className="patient-relatives-row-button" type="button" onClick={() => onViewDetail(profile)}>
                  <EyeIcon />
                  <span>Xem chi tiết</span>
                </button>
                <button
                  className="patient-relatives-row-button is-danger"
                  type="button"
                  onClick={() => onDelete(profile)}
                >
                  <TrashIcon />
                  <span>Xóa</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
