import { useState } from 'react';
import { useApprovalRequests, useApproveRequest, useRejectRequest } from '../../features/approval/hooks/useApprovalRequests.js';
import LoadingBlock from '../../shared/components/feedback/LoadingBlock.jsx';
import StateBlock from '../../shared/components/feedback/StateBlock.jsx';

const SHIFT_LABELS = {
  MORNING: 'Ca sáng',
  AFTERNOON: 'Ca chiều',
  ALL_DAY: 'Cả ngày',
};

const STATUS_LABELS = {
  PENDING: 'Chờ xử lý',
  APPROVED: 'Đã duyệt',
  REJECTED: 'Đã từ chối',
};

const TYPE_LABELS = {
  SCHEDULE_EXCEPTION: 'Yêu cầu nghỉ',
  CANCELLATION: 'Yêu cầu hủy lịch',
};

function formatScope(item) {
  if (item.type === 'CANCELLATION') return item.appointmentCode || '--';
  if (item.exceptionType === 'ALL_DAY') return SHIFT_LABELS.ALL_DAY;
  return SHIFT_LABELS[item.shift] || item.shift || item.exceptionType || '--';
}

function TypeBadge({ type }) {
  if (type === 'SCHEDULE_EXCEPTION') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
        📅 {TYPE_LABELS[type]}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-700">
      ❌ {TYPE_LABELS[type] || type}
    </span>
  );
}

function StatusBadge({ status }) {
  if (status === 'PENDING') {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
        Chờ duyệt
      </span>
    );
  }
  if (status === 'APPROVED') {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
        Đã duyệt
      </span>
    );
  }
  if (status === 'REJECTED') {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
        Từ chối
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
      {status}
    </span>
  );
}

const STATUS_TABS = [
  { key: undefined, label: 'Tất cả' },
  { key: 'PENDING', label: 'Chờ duyệt' },
  { key: 'APPROVED', label: 'Đã duyệt' },
  { key: 'REJECTED', label: 'Từ chối' },
];

export default function AdminApprovalRequestsPage() {
  const [rejectReasonById, setRejectReasonById] = useState({});
  const [feedback, setFeedback] = useState('');
  const [activeStatus, setActiveStatus] = useState(undefined);

  // Không filter type để hiện tất cả (SCHEDULE_EXCEPTION + CANCELLATION)
  const params = { page: 1, limit: 50 };
  if (activeStatus) params.status = activeStatus;

  const requestsQuery = useApprovalRequests(params);
  const approveMutation = useApproveRequest();
  const rejectMutation = useRejectRequest();

  const handleApprove = async (requestId) => {
    setFeedback('');
    await approveMutation.mutateAsync(requestId);
    setFeedback('Đã duyệt yêu cầu nghỉ thành công.');
  };

  const handleReject = async (requestId) => {
    setFeedback('');
    await rejectMutation.mutateAsync({
      requestId,
      rejectionReason: rejectReasonById[requestId] || '',
    });
    setFeedback('Đã từ chối yêu cầu nghỉ.');
  };

  if (requestsQuery.isLoading) {
    return <LoadingBlock label="Đang tải yêu cầu duyệt..." />;
  }

  if (requestsQuery.error) {
    return <StateBlock variant="error" title="Không thể tải yêu cầu duyệt" description={requestsQuery.error.message} />;
  }

  const allRows = requestsQuery.data?.data || [];
  const meta = requestsQuery.data?.meta || {};

  // Count per status for tabs
  const pendingCount = allRows.filter(r => r.status === 'PENDING').length;

  return (
    <div className="space-y-5">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Duyệt yêu cầu</h1>
        <p className="mt-1 text-sm text-gray-500">
          Xem xét và xử lý các yêu cầu nghỉ / hủy lịch của bác sĩ trong hệ thống.
        </p>
      </div>

      {/* Feedback banner */}
      {feedback && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-green-50 border border-green-200">
          <svg className="w-4 h-4 text-green-500 shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16zm3.707-9.293a1 1 0 0 0-1.414-1.414L9 10.586 7.707 9.293a1 1 0 0 0-1.414 1.414l2 2a1 1 0 0 0 1.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <p className="text-sm font-medium text-green-700">{feedback}</p>
        </div>
      )}

      {/* Mutation error banners */}
      {approveMutation.error && (
        <StateBlock variant="error" title="Duyệt yêu cầu thất bại" description={approveMutation.error.message} />
      )}
      {rejectMutation.error && (
        <StateBlock variant="error" title="Từ chối yêu cầu thất bại" description={rejectMutation.error.message} />
      )}

      {/* Status Tabs */}
      <div className="flex gap-1 border-b border-gray-200">
        {STATUS_TABS.map((tab) => {
          const isActive = activeStatus === tab.key;
          return (
            <button
              key={tab.label}
              type="button"
              onClick={() => { setActiveStatus(tab.key); setFeedback(''); }}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${isActive
                  ? 'border-[#49BCE2] text-[#49BCE2]'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
            >
              {tab.label}
              {tab.key === 'PENDING' && pendingCount > 0 && (
                <span className="ml-1.5 bg-amber-100 text-amber-700 text-xs font-bold px-1.5 py-0.5 rounded-full">
                  {pendingCount}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Main table card */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-xs">
        {allRows.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <svg className="w-10 h-10 text-gray-300 mb-3" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25ZM6.75 12h.008v.008H6.75V12Zm0 3h.008v.008H6.75V15Zm0 3h.008v.008H6.75V18Z" />
            </svg>
            <p className="text-sm font-medium text-gray-500">
              {activeStatus ? `Không có yêu cầu nào ở trạng thái "${STATUS_TABS.find(t => t.key === activeStatus)?.label}"` : 'Không có yêu cầu nào'}
            </p>
            <p className="text-xs text-gray-400 mt-1">Tất cả yêu cầu đã được xử lý hoặc chưa có yêu cầu mới.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    Bác sĩ
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    Loại yêu cầu
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    Ngày / Phạm vi
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Lý do
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    Trạng thái
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Hành động
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {allRows.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                    {/* Doctor name */}
                    <td className="px-4 py-3">
                      <span className="text-sm font-medium text-gray-900 whitespace-nowrap">
                        {item.doctorName}
                      </span>
                    </td>

                    {/* Type */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <TypeBadge type={item.type} />
                    </td>

                    {/* Date + Scope */}
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-0.5">
                        {item.date && (
                          <span className="text-sm text-gray-700 whitespace-nowrap">
                            {item.date.split('T')[0].split('-').reverse().join('/')}
                          </span>
                        )}
                        <span className="text-xs text-gray-500">{formatScope(item)}</span>
                      </div>
                    </td>

                    {/* Reason */}
                    <td className="px-4 py-3 max-w-[200px]">
                      <p className="text-sm text-gray-700 line-clamp-2">{item.reason || '--'}</p>
                    </td>

                    {/* Status badge */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <StatusBadge status={item.status} />
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3">
                      {item.status === 'PENDING' ? (
                        <div className="flex flex-col gap-2 min-w-[240px]">
                          {/* Approve */}
                          <button
                            type="button"
                            className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold bg-green-500 text-white hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            disabled={approveMutation.isPending || rejectMutation.isPending}
                            onClick={() => handleApprove(item.id)}
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                            </svg>
                            Duyệt
                          </button>

                          {/* Reject section */}
                          <div className="flex flex-col gap-1.5">
                            <textarea
                              rows={2}
                              placeholder="Lý do từ chối (tuỳ chọn)..."
                              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#49BCE2] bg-white resize-none placeholder:text-gray-400"
                              value={rejectReasonById[item.id] || ''}
                              onChange={(event) =>
                                setRejectReasonById((current) => ({
                                  ...current,
                                  [item.id]: event.target.value,
                                }))
                              }
                            />
                            <button
                              type="button"
                              className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold bg-red-500 text-white hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                              disabled={approveMutation.isPending || rejectMutation.isPending}
                              onClick={() => handleReject(item.id)}
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                              </svg>
                              Từ chối
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="text-sm text-gray-500">
                          {item.rejectionReason ? (
                            <p className="italic text-red-600 max-w-[200px] line-clamp-2">
                              &ldquo;{item.rejectionReason}&rdquo;
                            </p>
                          ) : item.reviewedAt ? (
                            <span className="whitespace-nowrap text-xs">
                              Đã xử lý lúc {new Date(item.reviewedAt).toLocaleString('vi-VN')}
                            </span>
                          ) : (
                            <span className="text-xs">Đã xử lý</span>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {meta.total > 0 && (
        <p className="text-xs text-gray-400 text-right">
          Hiển thị {allRows.length} / {meta.total} yêu cầu
        </p>
      )}
    </div>
  );
}
