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

function formatScope(item) {
  if (item.exceptionType === 'ALL_DAY') return SHIFT_LABELS.ALL_DAY;
  return SHIFT_LABELS[item.shift] || item.shift || item.exceptionType;
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

export default function AdminApprovalRequestsPage() {
  const [rejectReasonById, setRejectReasonById] = useState({});
  const [feedback, setFeedback] = useState('');
  const requestsQuery = useApprovalRequests({ page: 1, limit: 20, type: 'SCHEDULE_EXCEPTION' });
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
    return <LoadingBlock label="Đang tải yêu cầu nghỉ..." />;
  }

  if (requestsQuery.error) {
    return <StateBlock variant="error" title="Không thể tải yêu cầu nghỉ" description={requestsQuery.error.message} />;
  }

  const rows = requestsQuery.data?.data || [];

  return (
    <div className="p-6 space-y-5">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Duyệt yêu cầu nghỉ bác sĩ</h1>
        <p className="mt-1 text-sm text-gray-500">
          Xem xét và xử lý các yêu cầu nghỉ của bác sĩ trong hệ thống.
        </p>
      </div>

      {/* Feedback banner */}
      {feedback ? (
        <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-amber-50 border border-amber-200">
          <svg className="w-4 h-4 text-amber-500 shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10A8 8 0 1 1 2 10a8 8 0 0 1 16 0zm-7-4a1 1 0 1 1-2 0 1 1 0 0 1 2 0zM9 9a1 1 0 0 0 0 2v3a1 1 0 0 0 1 1h1a1 1 0 1 0 0-2v-3a1 1 0 0 0-1-1H9z" clipRule="evenodd" />
          </svg>
          <p className="text-sm font-medium text-amber-700">{feedback}</p>
        </div>
      ) : null}

      {/* Mutation error banners */}
      {approveMutation.error ? (
        <StateBlock variant="error" title="Duyệt yêu cầu thất bại" description={approveMutation.error.message} />
      ) : null}
      {rejectMutation.error ? (
        <StateBlock variant="error" title="Từ chối yêu cầu thất bại" description={rejectMutation.error.message} />
      ) : null}

      {/* Main table card */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-xs">
        {rows.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <svg className="w-10 h-10 text-gray-300 mb-3" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25ZM6.75 12h.008v.008H6.75V12Zm0 3h.008v.008H6.75V15Zm0 3h.008v.008H6.75V18Z" />
            </svg>
            <p className="text-sm font-medium text-gray-500">Không có yêu cầu nghỉ nào</p>
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
                    Ngày
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    Phạm vi
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
                {rows.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                    {/* Doctor name */}
                    <td className="px-4 py-3">
                      <span className="text-sm font-medium text-gray-900 whitespace-nowrap">
                        {item.doctorName}
                      </span>
                    </td>

                    {/* Date */}
                    <td className="px-4 py-3">
                      <span className="text-sm text-gray-700 whitespace-nowrap">{item.date}</span>
                    </td>

                    {/* Scope */}
                    <td className="px-4 py-3">
                      <span className="text-sm text-gray-700 whitespace-nowrap">{formatScope(item)}</span>
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
                        <div className="flex flex-col gap-2 min-w-[260px]">
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
                            Duyệt yêu cầu
                          </button>

                          {/* Reject section */}
                          <div className="flex flex-col gap-1.5">
                            <textarea
                              rows={2}
                              placeholder="Nhập lý do từ chối (tuỳ chọn)..."
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
                            <span className="whitespace-nowrap">
                              Đã xử lý lúc {new Date(item.reviewedAt).toLocaleString('vi-VN')}
                            </span>
                          ) : (
                            <span>Đã xử lý</span>
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
    </div>
  );
}
