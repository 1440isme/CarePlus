import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  ChangePasswordModal,
  PersonalInfoForm,
  ProfileAvatarUpload,
  SecurityCard,
  useMe,
} from '../../features/user/index.js';
import { Edit2 } from 'lucide-react';

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
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value;
  }
  const parsedDate = new Date(value);
  if (Number.isNaN(parsedDate.getTime())) {
    return '';
  }
  const year = parsedDate.getUTCFullYear();
  const month = String(parsedDate.getUTCMonth() + 1).padStart(2, '0');
  const day = String(parsedDate.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
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
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year, month, day] = value.split('-');
    return `${day}/${month}/${year}`;
  }
  const parsedDate = new Date(value);
  if (Number.isNaN(parsedDate.getTime())) {
    return value;
  }
  return parsedDate.toLocaleDateString('vi-VN');
}

function buildDraftFromUser(user) {
  return {
    name: user?.name ?? '',
    phone: user?.phone ?? '',
    gender: user?.gender ?? 'MALE',
    dateOfBirth: formatDateForInput(user?.dateOfBirth),
    address: user?.address ?? '',
  };
}

function PatientProfileView({ profile, onEdit }) {
  return (
    <>
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-xl font-bold text-gray-800">Thông tin cá nhân</h1>
        <button
          className="flex items-center gap-1.5 px-3.5 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 bg-white hover:bg-gray-50 transition-colors cursor-pointer"
          type="button"
          onClick={onEdit}
        >
          <Edit2 className="w-3.5 h-3.5" />
          <span>Chỉnh sửa</span>
        </button>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
        {/* Identity card */}
        <div className="p-5 border-b border-gray-100 flex items-center gap-4">
          <ProfileAvatarUpload name={profile.name} avatarUrl={profile.avatarUrl} compact />
          <div>
            <h3 className="text-base font-bold text-gray-800">{profile.name}</h3>
            <span className="inline-block mt-1 px-2.5 py-0.5 text-xs font-semibold rounded-full bg-blue-50 text-[#49BCE2] border border-blue-100">
              Bệnh nhân
            </span>
          </div>
        </div>

        {/* View fields list */}
        <div className="p-5 flex flex-col gap-3.5">
          {[
            { label: 'Họ và tên', value: formatDisplayValue(profile.name) },
            { label: 'Email', value: formatDisplayValue(profile.email) },
            { label: 'Số điện thoại', value: formatDisplayValue(profile.phone) },
            { label: 'Giới tính', value: formatDisplayValue(getGenderLabel(profile.gender)) },
            { label: 'Ngày sinh', value: formatDisplayValue(toDateDisplay(profile.dateOfBirth)) },
            { label: 'Địa chỉ', value: formatDisplayValue(profile.address) },
          ].map(row => (
            <div key={row.label} className="flex justify-between items-center py-1.5 border-b border-gray-50 text-sm">
              <span className="text-gray-500">{row.label}</span>
              <span className="font-semibold text-gray-800">{row.value}</span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

export default function PatientPersonalInfoPage() {
  const accessToken = useSelector((state) => state.auth.accessToken);
  const meQuery = useMe({ enabled: Boolean(accessToken) });
  const user = meQuery.data?.data ?? null;
  const [isEditing, setIsEditing] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
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
      <div className="max-w-[560px] font-sans">
        <div className="bg-white border border-gray-200 rounded-lg p-6 text-center shadow-sm">
          <h2 className="text-base font-bold text-gray-800 mb-2">Thông tin cá nhân</h2>
          <p className="text-sm text-gray-500 mb-4">
            Bạn cần đăng nhập để xem và cập nhật thông tin cá nhân.
          </p>
          <Link className="inline-block px-5 py-2.5 bg-[#49BCE2] text-white text-sm font-semibold rounded-lg hover:bg-[#3ca4c7] transition-colors" to="/dang-nhap">
            Đi đến đăng nhập
          </Link>
        </div>
      </div>
    );
  }

  if (meQuery.isLoading) {
    return (
      <div className="max-w-[560px] font-sans">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-bold text-gray-800">Thông tin cá nhân</h2>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-5 flex flex-col gap-4 shadow-sm">
          <div className="h-14 w-full bg-gray-100 animate-pulse rounded-lg" />
          <div className="h-8 w-full bg-gray-50 animate-pulse rounded" />
          <div className="h-8 w-full bg-gray-50 animate-pulse rounded" />
          <div className="h-8 w-full bg-gray-50 animate-pulse rounded" />
          <div className="h-8 w-full bg-gray-50 animate-pulse rounded" />
        </div>
      </div>
    );
  }

  if (meQuery.isError || !user) {
    return (
      <div className="max-w-[560px] font-sans">
        <div className="bg-white border border-gray-200 rounded-lg p-6 text-center shadow-sm">
          <h2 className="text-base font-bold text-gray-800 mb-2">Thông tin cá nhân</h2>
          <p className="text-sm text-gray-500 mb-4">
            {meQuery.error?.message ?? 'Đã có lỗi xảy ra khi lấy thông tin tài khoản.'}
          </p>
          <button
            className="px-5 py-2.5 bg-[#49BCE2] text-white text-sm font-semibold rounded-lg hover:bg-[#3ca4c7] transition-colors cursor-pointer"
            type="button"
            onClick={() => meQuery.refetch()}
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[560px] font-sans">
      {isEditing ? (
        <>
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-xl font-bold text-gray-800">Thông tin cá nhân</h2>
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

      <SecurityCard onChangePassword={() => setIsPasswordModalOpen(true)} />
      <ChangePasswordModal
        open={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
      />
    </div>
  );
}
