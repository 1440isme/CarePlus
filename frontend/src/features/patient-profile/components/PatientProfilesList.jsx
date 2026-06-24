import {
  PATIENT_PROFILE_GENDER_LABELS,
  PATIENT_PROFILE_RELATIONSHIP_LABELS,
} from '../types/patient-profile.types.js';
import { Plus, User, Eye, Trash2 } from 'lucide-react';

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
    <div className="max-w-[600px] font-sans">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Hồ sơ người thân</h1>
          <div className="text-xs text-gray-500 mt-1">
            Đang hoạt động: <strong className="text-[#49BCE2]">{activeCount} hồ sơ</strong>
          </div>
        </div>

        <button
          onClick={onCreate}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-semibold text-white shadow-sm transition-colors cursor-pointer bg-[#49BCE2] hover:bg-[#3ca4c7]"
        >
          <Plus className="w-4 h-4" />
          <span>Thêm người thân</span>
        </button>
      </div>

      {activeCount === 0 ? (
        <div className="bg-white border border-gray-200 rounded-lg p-10 text-center shadow-sm">
          <User className="w-9 h-9 mx-auto mb-3.5 text-gray-300" />
          <h3 className="text-sm font-semibold text-gray-600 mb-1">Chưa có hồ sơ người thân nào</h3>
          <p className="text-xs text-gray-400 mb-4">Thêm hồ sơ để đặt lịch nhanh hơn cho người thân của bạn.</p>
          <button
            className="inline-flex items-center gap-1 px-4 py-2 bg-[#49BCE2] text-white text-xs font-semibold rounded-lg hover:bg-[#3ca4c7] transition-colors cursor-pointer shadow-sm"
            onClick={onCreate}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Thêm ngay</span>
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {profiles.map((profile) => (
            <div
              key={profile.id}
              className="bg-white border border-gray-200 rounded-lg p-3.5 md:p-4 shadow-sm flex items-start justify-between gap-4"
            >
              <div className="flex gap-3">
                <div className="w-[38px] h-[38px] bg-purple-50 rounded-full flex items-center justify-center shrink-0">
                  <User className="w-4 h-4 text-purple-600" />
                </div>
                <div>
                  <div className="text-sm font-bold text-gray-800 mb-0.5">{profile.fullName}</div>
                  <div className="text-xs text-gray-500">
                    {PATIENT_PROFILE_RELATIONSHIP_LABELS[profile.relationship] ?? profile.relationship} · {PATIENT_PROFILE_GENDER_LABELS[profile.gender] ?? profile.gender} · {formatDateForCard(profile.dateOfBirth)}
                  </div>
                  {profile.phone && <div className="text-xs text-gray-400 mt-0.5">{profile.phone}</div>}
                </div>
              </div>

              <div className="flex gap-2 shrink-0">
                <button
                  className="flex items-center gap-1 px-2.5 py-1.5 border border-[#49BCE2] text-[#49BCE2] rounded-lg text-xs font-semibold bg-white hover:bg-blue-50 transition-colors cursor-pointer"
                  onClick={() => onViewDetail(profile)}
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Chi tiết</span>
                </button>
                <button
                  className="flex items-center gap-1 px-2.5 py-1.5 border border-red-500 text-red-500 rounded-lg text-xs font-semibold bg-white hover:bg-red-50 transition-colors cursor-pointer"
                  onClick={() => onDelete(profile)}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Xóa</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
