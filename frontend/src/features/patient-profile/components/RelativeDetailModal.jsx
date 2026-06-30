import {
  PATIENT_PROFILE_GENDER_LABELS,
  PATIENT_PROFILE_RELATIONSHIP_LABELS,
} from '../types/patient-profile.types.js';
import { X, Edit2, User } from 'lucide-react';

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

export default function RelativeDetailModal({
  profile,
  onClose,
  onEdit,
}) {
  return (
    <div className="fixed inset-0 bg-black/45 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-lg p-5 md:p-6 max-w-[460px] w-full shadow-lg border border-gray-100" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-base font-bold text-gray-800">Chi tiết người thân</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Identity card header */}
        <div className="p-4 bg-gray-50 border border-gray-150 rounded-lg flex items-center gap-3.5 mb-4">
          <div className="w-11 h-11 bg-purple-50 rounded-full flex items-center justify-center shrink-0">
            <User className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <div className="text-sm font-bold text-gray-800">{profile?.fullName ?? '--'}</div>
            <div className="text-xs text-gray-400 mt-0.5">
              {PATIENT_PROFILE_RELATIONSHIP_LABELS[profile?.relationship] ?? profile?.relationship ?? '--'}
            </div>
          </div>
        </div>

        {/* Info Rows */}
        <div className="flex flex-col gap-2">
          {[
            { label: 'Họ và tên', value: formatDisplayValue(profile?.fullName) },
            { label: 'Quan hệ', value: formatDisplayValue(PATIENT_PROFILE_RELATIONSHIP_LABELS[profile?.relationship] ?? profile?.relationship) },
            { label: 'Giới tính', value: formatDisplayValue(PATIENT_PROFILE_GENDER_LABELS[profile?.gender] ?? profile?.gender) },
            { label: 'Ngày sinh', value: formatDisplayValue(formatDisplayDate(profile?.dateOfBirth)) },
            { label: 'Số điện thoại', value: formatDisplayValue(profile?.phone) },
            { label: 'Địa chỉ', value: formatDisplayValue(profile?.address) },
          ].map(row => (
            <div key={row.label} className="flex justify-between items-center py-2 border-b border-gray-50 text-sm">
              <span className="text-gray-500">{row.label}</span>
              <span className="font-semibold text-gray-800">{row.value}</span>
            </div>
          ))}
        </div>

        <div className="flex gap-2.5 mt-5">
          <button
            className="flex-1 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-600 font-semibold hover:bg-gray-50 transition-colors cursor-pointer"
            onClick={onClose}
          >
            Đóng
          </button>
          <button
            className="flex-1 py-2.5 bg-[#49BCE2] text-white rounded-lg text-sm font-semibold hover:bg-[#3ca4c7] transition-colors cursor-pointer flex items-center justify-center gap-1"
            onClick={onEdit}
          >
            <Edit2 className="w-3.5 h-3.5" />
            <span>Chỉnh sửa</span>
          </button>
        </div>
      </div>
    </div>
  );
}
