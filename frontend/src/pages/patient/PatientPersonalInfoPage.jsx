import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { PersonalInfoForm, useMe } from '../../features/user/index.js';
import './patient-portal.css';

function getInitials(name) {
  if (!name) {
    return 'BN';
  }

  const words = name
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  return words
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? '')
    .join('') || 'BN';
}

function formatDisplayValue(value) {
  if (value === null || value === undefined || value === '') {
    return '--';
  }

  return value;
}

function formatDateForInput(value) {
  if (!value) {
    return '';
  }

  if (/^\d{2}\/\d{2}\/\d{4}$/.test(value)) {
    return value;
  }

  const parsedDate = new Date(value);

  if (Number.isNaN(parsedDate.getTime())) {
    return '';
  }

  return parsedDate.toLocaleDateString('vi-VN');
}

function getGenderLabel(value) {
  switch (value) {
    case 'MALE':
      return 'Nam';
    case 'FEMALE':
      return 'Nữ';
    case 'OTHER':
      return 'Khác';
    default:
      return value ?? '';
  }
}

function toDateDisplay(value) {
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

function PencilIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true">
      <path d="M13.85 3.9a1.5 1.5 0 0 1 2.12 2.12l-8.2 8.2-2.77.65.65-2.77Zm-1.06 1.06L6 11.75l-.28 1.22 1.22-.28 6.8-6.8Z" />
    </svg>
  );
}

function buildDraftFromUser(user) {
  return {
    name: user?.name ?? '',
    phone: user?.phone ?? '',
    gender: user?.gender ?? 'MALE',
    dateOfBirth: formatDateForInput(user?.dateOfBirth) || '15/05/1990',
    address: user?.address ?? '123 Đường ABC, Quận 1, TP.HCM',
  };
}

function PatientProfileView({ profile, onEdit }) {
  return (
    <>
      <div className="patient-profile-page-header">
        <div>
          <h2 className="patient-profile-page-title">Thông tin cá nhân</h2>
        </div>

        <button className="patient-profile-toolbar-button" type="button" onClick={onEdit}>
          <PencilIcon />
          <span>Chỉnh sửa</span>
        </button>
      </div>

      <article className="patient-profile-card patient-profile-view-card">
        <div className="patient-profile-identity-card">
          <div className="patient-profile-avatar">{getInitials(profile.name)}</div>
          <div className="patient-profile-identity-copy">
            <h3 className="patient-profile-name">{profile.name}</h3>
            <p className="patient-profile-role-chip">Bệnh nhân</p>
          </div>
        </div>

        <div className="patient-profile-view-list">
          <div className="patient-profile-view-row">
            <span>Họ và tên</span>
            <strong>{formatDisplayValue(profile.name)}</strong>
          </div>
          <div className="patient-profile-view-row">
            <span>Email</span>
            <strong>{formatDisplayValue(profile.email)}</strong>
          </div>
          <div className="patient-profile-view-row">
            <span>Số điện thoại</span>
            <strong>{formatDisplayValue(profile.phone)}</strong>
          </div>
          <div className="patient-profile-view-row">
            <span>Giới tính</span>
            <strong>{formatDisplayValue(getGenderLabel(profile.gender))}</strong>
          </div>
          <div className="patient-profile-view-row">
            <span>Ngày sinh</span>
            <strong>{formatDisplayValue(toDateDisplay(profile.dateOfBirth))}</strong>
          </div>
          <div className="patient-profile-view-row">
            <span>Địa chỉ</span>
            <strong>{formatDisplayValue(profile.address)}</strong>
          </div>
        </div>
      </article>
    </>
  );
}

export default function PatientPersonalInfoPage() {
  const accessToken = useSelector((state) => state.auth.accessToken);
  const meQuery = useMe({ enabled: Boolean(accessToken) });
  const user = meQuery.data?.data ?? null;
  const [isEditing, setIsEditing] = useState(false);
  const [draftProfile, setDraftProfile] = useState(null);

  useEffect(() => {
    if (user && !draftProfile) {
      setDraftProfile(buildDraftFromUser(user));
    }
  }, [draftProfile, user]);

  const profile = useMemo(() => ({
    ...user,
    ...(draftProfile ?? {}),
  }), [draftProfile, user]);

  if (!accessToken) {
    return (
      <section className="patient-profile-page">
        <div className="patient-profile-state-panel">
          <h2 className="patient-profile-page-title">Thông tin cá nhân</h2>
          <p className="patient-profile-state-text">
            Bạn cần đăng nhập để xem và cập nhật thông tin cá nhân.
          </p>
          <Link className="patient-profile-primary-button patient-profile-inline-button" to="/dang-nhap">
            Đi đến đăng nhập
          </Link>
        </div>
      </section>
    );
  }

  if (meQuery.isLoading) {
    return (
      <section className="patient-profile-page">
        <div className="patient-profile-page-header">
          <h2 className="patient-profile-page-title">Thông tin cá nhân</h2>
        </div>
        <div className="patient-profile-card patient-profile-loading-card">
          <div className="patient-profile-skeleton patient-profile-skeleton-avatarrow" />
          <div className="patient-profile-skeleton patient-profile-skeleton-row" />
          <div className="patient-profile-skeleton patient-profile-skeleton-row" />
          <div className="patient-profile-skeleton patient-profile-skeleton-row" />
          <div className="patient-profile-skeleton patient-profile-skeleton-row" />
        </div>
      </section>
    );
  }

  if (meQuery.isError || !user) {
    return (
      <section className="patient-profile-page">
        <div className="patient-profile-state-panel">
          <h2 className="patient-profile-page-title">Thông tin cá nhân</h2>
          <p className="patient-profile-state-text">
            {meQuery.error?.message ?? 'Đã có lỗi xảy ra khi lấy thông tin tài khoản.'}
          </p>
          <button
            className="patient-profile-primary-button patient-profile-inline-button"
            type="button"
            onClick={() => meQuery.refetch()}
          >
            Thử lại
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="patient-profile-page">
      {isEditing ? (
        <>
          <div className="patient-profile-page-header">
            <div>
              <h2 className="patient-profile-page-title">Thông tin cá nhân</h2>
            </div>
          </div>

          <PersonalInfoForm
            user={user}
            draftValues={profile}
            onCancel={() => {
              setDraftProfile(buildDraftFromUser(user));
              setIsEditing(false);
            }}
            onSuccess={(values) => {
              setDraftProfile((current) => ({
                ...(current ?? buildDraftFromUser(user)),
                ...values,
              }));
              setIsEditing(false);
            }}
          />
        </>
      ) : (
        <PatientProfileView
          profile={profile}
          onEdit={() => {
            setDraftProfile((current) => current ?? buildDraftFromUser(user));
            setIsEditing(true);
          }}
        />
      )}
    </section>
  );
}
