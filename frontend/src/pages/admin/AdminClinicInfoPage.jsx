import { useEffect, useState } from 'react';
import {
  ClinicInfoForm,
  useClinicInfo,
} from '../../features/admin/clinic-settings/index.js';
import { CloseIcon } from '../../features/admin/clinic-settings/components/ClinicInfoForm.jsx';

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
    <div className="space-y-4 animate-pulse" aria-hidden="true">
      {/* Title skeleton */}
      <div className="h-5 w-48 bg-gray-200 rounded-md" />
      {/* Input skeletons */}
      <div className="h-10 w-full bg-gray-200 rounded-lg" />
      <div className="h-10 w-full bg-gray-200 rounded-lg" />
      <div className="grid grid-cols-2 gap-4">
        <div className="h-10 w-full bg-gray-200 rounded-lg" />
        <div className="h-10 w-full bg-gray-200 rounded-lg" />
      </div>
      <div className="h-10 w-full bg-gray-200 rounded-lg" />
      {/* Textarea skeleton */}
      <div className="h-28 w-full bg-gray-200 rounded-lg" />
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
    <div className="p-6 space-y-5">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Thông tin phòng khám</h1>
        <p className="mt-1 text-sm text-gray-500">
          Quản lý thông tin hiển thị của phòng khám trên hệ thống.
        </p>
      </div>

      {/* Main card */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-xs">
        <div className="p-6">

          {/* Feedback banner */}
          {feedback ? (
            <div
              className={`flex items-start justify-between gap-3 px-4 py-3 rounded-lg mb-6 ${
                feedback.type === 'success'
                  ? 'bg-green-50 border border-green-200'
                  : 'bg-red-50 border border-red-200'
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                {feedback.type === 'success' ? (
                  <svg
                    className="w-4 h-4 text-green-500 shrink-0"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16zm3.857-9.809a.75.75 0 0 0-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 1 0-1.06 1.061l2.5 2.5a.75.75 0 0 0 1.137-.089l4-5.5z"
                      clipRule="evenodd"
                    />
                  </svg>
                ) : (
                  <svg
                    className="w-4 h-4 text-red-500 shrink-0"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM8.28 7.22a.75.75 0 0 0-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 1 0 1.06 1.06L10 11.06l1.72 1.72a.75.75 0 1 0 1.06-1.06L11.06 10l1.72-1.72a.75.75 0 0 0-1.06-1.06L10 8.94 8.28 7.22z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
                <p
                  className={`text-sm font-medium ${
                    feedback.type === 'success' ? 'text-green-700' : 'text-red-700'
                  }`}
                >
                  {feedback.message}
                </p>
              </div>
              <button
                type="button"
                aria-label="Ẩn thông báo"
                className={`shrink-0 p-0.5 rounded hover:bg-black/5 transition-colors ${
                  feedback.type === 'success' ? 'text-green-600' : 'text-red-600'
                }`}
                onClick={() => setFeedback(null)}
              >
                <CloseIcon />
              </button>
            </div>
          ) : null}

          {/* Loading skeleton */}
          {clinicInfoQuery.isLoading ? <LoadingState /> : null}

          {/* Error state */}
          {clinicInfoQuery.isError ? (
            <div className="flex flex-col items-center justify-center py-10 text-center gap-4">
              <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-red-500"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.5}
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
                  />
                </svg>
              </div>
              <div>
                <h3 className="text-base font-semibold text-gray-900">
                  Không thể tải thông tin phòng khám
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  {getClinicInfoErrorMessage(clinicInfoQuery.error)}
                </p>
              </div>
              <button
                type="button"
                className="px-4 py-2 rounded-lg text-sm font-semibold bg-[#49BCE2] text-white hover:bg-[#3ca4c5] transition-colors"
                onClick={() => clinicInfoQuery.refetch()}
              >
                Thử lại
              </button>
            </div>
          ) : null}

          {/* Clinic info form — rendered via the existing ClinicInfoForm component */}
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
    </div>
  );
}
