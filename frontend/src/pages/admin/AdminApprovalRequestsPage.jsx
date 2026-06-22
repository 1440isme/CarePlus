import { useState } from 'react';
import { useApprovalRequests, useApproveRequest, useRejectRequest } from '../../features/approval/hooks/useApprovalRequests.js';
import LoadingBlock from '../../shared/components/feedback/LoadingBlock.jsx';
import StateBlock from '../../shared/components/feedback/StateBlock.jsx';

const SHIFT_LABELS = {
  MORNING: 'Ca sáng',
  AFTERNOON: 'Ca chiều',
  ALL_DAY: 'Cả ngày',
};

function formatScope(item) {
  if (item.exceptionType === 'ALL_DAY') return SHIFT_LABELS.ALL_DAY;
  return SHIFT_LABELS[item.shift] || item.shift || item.exceptionType;
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

  return (
    <section className="surface-card">
      <h2>Duyệt yêu cầu nghỉ bác sĩ</h2>
      {feedback ? <p className="helper-text">{feedback}</p> : null}
      {approveMutation.error ? <StateBlock variant="error" title="Duyệt yêu cầu thất bại" description={approveMutation.error.message} /> : null}
      {rejectMutation.error ? <StateBlock variant="error" title="Từ chối yêu cầu thất bại" description={rejectMutation.error.message} /> : null}
      <table className="data-table">
        <thead>
          <tr>
            <th>Bác sĩ</th>
            <th>Ngày</th>
            <th>Phạm vi</th>
            <th>Lý do</th>
            <th>Trạng thái</th>
            <th>Phản hồi admin</th>
            <th>Thao tác</th>
          </tr>
        </thead>
        <tbody>
          {(requestsQuery.data?.data || []).map((item) => (
            <tr key={item.id}>
              <td>{item.doctorName}</td>
              <td>{item.date}</td>
              <td>{formatScope(item)}</td>
              <td>{item.reason}</td>
              <td><span className={`status-chip status-${String(item.status || '').toLowerCase()}`}>{item.status}</span></td>
              <td>{item.rejectionReason || (item.reviewedAt ? `Đã xử lý lúc ${new Date(item.reviewedAt).toLocaleString('vi-VN')}` : '--')}</td>
              <td>
                {item.status === 'PENDING' ? (
                  <div className="toolbar" style={{ alignItems: 'stretch' }}>
                    <button
                      type="button"
                      className="button-primary"
                      disabled={approveMutation.isPending || rejectMutation.isPending}
                      onClick={() => handleApprove(item.id)}
                    >
                      Duyệt
                    </button>
                    <input
                      type="text"
                      placeholder="Lý do từ chối"
                      value={rejectReasonById[item.id] || ''}
                      onChange={(event) => setRejectReasonById((current) => ({
                        ...current,
                        [item.id]: event.target.value,
                      }))}
                    />
                    <button
                      type="button"
                      className="button-danger"
                      disabled={approveMutation.isPending || rejectMutation.isPending}
                      onClick={() => handleReject(item.id)}
                    >
                      Từ chối
                    </button>
                  </div>
                ) : 'Đã xử lý'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
