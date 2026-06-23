import { useEffect, useState } from 'react';
import { CloseIcon } from '../../features/admin/clinic-settings/components/ClinicInfoForm.jsx';
import { useSystemSettings } from '../../features/admin/clinic-settings/hooks/useSystemSettings.js';
import SystemSettingsForm from '../../features/admin/clinic-settings/components/SystemSettingsForm.jsx';
import { Settings, CheckCircle, XCircle, RefreshCw } from 'lucide-react';

function getSystemSettingsErrorMessage(error) {
  switch (error?.code) {
    case 'FORBIDDEN':
      return 'Bạn không có quyền truy cập cấu hình hệ thống.';
    case 'SYSTEM_SETTING_NOT_FOUND':
      return 'Không tìm thấy cấu hình hệ thống.';
    case 'GET_SYSTEM_SETTING_FAILED':
      return 'Tải cấu hình hệ thống thất bại.';
    default:
      return error?.message ?? 'Đã có lỗi xảy ra khi tải cấu hình hệ thống.';
  }
}

function LoadingState() {
  return (
    <div className="space-y-4" aria-hidden="true">
      {[1, 2].map((card) => (
        <div key={card} className="bg-white border border-gray-200 rounded-xl p-6 space-y-3">
          <div className="h-5 bg-gray-100 rounded-md w-48 animate-pulse" />
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-10 bg-gray-100 rounded-lg w-full animate-pulse" />
          ))}
        </div>
      ))}
    </div>
  );
}

export default function AdminSystemSettingsPage() {
  const [feedback, setFeedback] = useState(null);
  const systemSettingsQuery = useSystemSettings();

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
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
          <Settings className="w-5 h-5 text-gray-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Cài đặt hệ thống</h1>
          <p className="text-sm text-gray-500 mt-0.5">Cấu hình các thông số hoạt động của hệ thống</p>
        </div>
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div
          className={`flex items-center justify-between gap-3 px-4 py-3 rounded-xl border text-sm font-medium ${
            feedback.type === 'success'
              ? 'bg-green-50 border-green-200 text-green-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'success'
              ? <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
              : <XCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
            }
            {feedback.message}
          </div>
          <button
            type="button"
            aria-label="Ẩn thông báo"
            onClick={() => setFeedback(null)}
            className="text-current opacity-60 hover:opacity-100 transition-opacity flex-shrink-0"
          >
            <CloseIcon />
          </button>
        </div>
      )}

      {/* Loading */}
      {systemSettingsQuery.isLoading && <LoadingState />}

      {/* Error */}
      {systemSettingsQuery.isError && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-8 flex flex-col items-center text-center gap-4">
          <XCircle className="w-10 h-10 text-red-400" />
          <div>
            <h3 className="font-semibold text-red-800 mb-1">Không thể tải cấu hình hệ thống</h3>
            <p className="text-sm text-red-600">{getSystemSettingsErrorMessage(systemSettingsQuery.error)}</p>
          </div>
          <button
            type="button"
            onClick={() => systemSettingsQuery.refetch()}
            className="flex items-center gap-2 px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg text-sm font-semibold transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Thử lại
          </button>
        </div>
      )}

      {/* Content - uses the existing SystemSettingsForm component */}
      {!systemSettingsQuery.isLoading && !systemSettingsQuery.isError && (
        <SystemSettingsForm
          systemSettings={systemSettingsQuery.data?.data}
          onSuccess={(response) => {
            setFeedback({
              type: 'success',
              message: response?.message ?? 'Cập nhật cấu hình hệ thống thành công.',
            });
          }}
        />
      )}
    </div>
  );
}
