import {
  PATIENT_PROFILE_GENDER_LABELS,
  PATIENT_PROFILE_RELATIONSHIP_LABELS,
} from '../types/patient-profile.types.js';
import { AlertCircle } from 'lucide-react';

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
    <div className="fixed inset-0 bg-black/45 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-lg p-5 md:p-6 max-w-[420px] w-full shadow-lg border border-gray-100" onClick={e => e.stopPropagation()}>
        <div className="flex gap-3 mb-4">
          <div className="w-10 h-10 bg-red-50 rounded-full flex items-center justify-center shrink-0">
            <AlertCircle className="w-5 h-5 text-red-500" />
          </div>
          <div>
            <h3 className="text-base font-bold text-gray-800">Xác nhận xóa hồ sơ</h3>
            <p className="text-xs md:text-sm text-gray-500 mt-1">
              Bạn có chắc chắn muốn xóa hồ sơ người thân này không?
            </p>
          </div>
        </div>

        <div className="p-3.5 bg-gray-50 border border-gray-150 rounded-lg text-sm flex flex-col gap-2 mb-4">
          <div><strong className="text-gray-600">Họ và tên:</strong> <span className="text-gray-800 font-medium">{profile?.fullName ?? '--'}</span></div>
          <div><strong className="text-gray-600">Quan hệ:</strong> <span className="text-gray-800 font-medium">{PATIENT_PROFILE_RELATIONSHIP_LABELS[profile?.relationship] ?? profile?.relationship ?? '--'}</span></div>
          <div><strong className="text-gray-600">Giới tính:</strong> <span className="text-gray-800 font-medium">{PATIENT_PROFILE_GENDER_LABELS[profile?.gender] ?? profile?.gender ?? '--'}</span></div>
          {profile?.phone && <div><strong className="text-gray-600">Số điện thoại:</strong> <span className="text-gray-800 font-medium">{profile.phone}</span></div>}
        </div>

        {mutation.error ? (
          <p className="text-xs text-red-500 mb-3.5">{getDeleteErrorMessage(mutation.error)}</p>
        ) : null}

        <div className="flex gap-2.5">
          <button
            className="flex-1 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 font-semibold hover:bg-gray-50 transition-colors cursor-pointer"
            type="button"
            onClick={onClose}
            disabled={mutation.isPending}
          >
            Hủy
          </button>
          <button
            className="flex-1 py-2 bg-red-500 text-white rounded-lg text-sm font-semibold hover:bg-red-650 transition-colors cursor-pointer"
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
