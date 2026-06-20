import { useApprovalRequests, useApproveRequest, useRejectRequest } from '../../features/approval/hooks/useApprovalRequests.js';
import LoadingBlock from '../../shared/components/feedback/LoadingBlock.jsx';
import StateBlock from '../../shared/components/feedback/StateBlock.jsx';

export default function AdminApprovalRequestsPage() {
  const requestsQuery = useApprovalRequests({ page: 1, limit: 20, type: 'SCHEDULE_EXCEPTION' });
  const approveMutation = useApproveRequest();
  const rejectMutation = useRejectRequest();

  if (requestsQuery.isLoading) {
    return <LoadingBlock label="Đang tải yêu cầu nghỉ..." />;
  }

  if (requestsQuery.error) {
    return <StateBlock variant="error" title="Không thể tải yêu cầu nghỉ" description={requestsQuery.error.message} />;
  }

  return (
    <section className="surface-card">
      <h2>Duyệt yêu cầu nghỉ bác sĩ</h2>
      <table className="data-table">
        <thead>
          <tr>
            <th>Bác sĩ</th>
            <th>Ngày</th>
            <th>Phạm vi</th>
            <th>Lý do</th>
            <th>Trạng thái</th>
            <th>Thao tác</th>
          </tr>
        </thead>
        <tbody>
          {(requestsQuery.data?.data || []).map((item) => (
            <tr key={item.id}>
              <td>{item.doctorName}</td>
              <td>{item.date}</td>
              <td>{item.shift || item.exceptionType}</td>
              <td>{item.reason}</td>
              <td><span className={`status-chip status-${String(item.status || '').toLowerCase()}`}>{item.status}</span></td>
              <td>
                {item.status === 'PENDING' ? (
                  <div className="toolbar">
                    <button type="button" className="button-primary" onClick={() => approveMutation.mutate(item.id)}>Duyệt</button>
                    <button type="button" className="button-danger" onClick={() => rejectMutation.mutate(item.id)}>Từ chối</button>
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
