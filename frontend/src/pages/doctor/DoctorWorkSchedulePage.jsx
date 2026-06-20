import { useState } from 'react';
import { useSchedules } from '../../features/schedule/hooks/useSchedules.js';
import { useApprovalRequests, useCreateLeaveRequest } from '../../features/approval/hooks/useApprovalRequests.js';
import LeaveRequestForm from '../../features/approval/components/LeaveRequestForm.jsx';
import LoadingBlock from '../../shared/components/feedback/LoadingBlock.jsx';
import StateBlock from '../../shared/components/feedback/StateBlock.jsx';

export default function DoctorWorkSchedulePage() {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const schedulesQuery = useSchedules({ date, view: 'DAY', page: 1, limit: 31 });
  const requestsQuery = useApprovalRequests({ type: 'SCHEDULE_EXCEPTION', page: 1, limit: 20 });
  const leaveMutation = useCreateLeaveRequest();

  const handleSubmit = async (values) => {
    await leaveMutation.mutateAsync(values);
  };

  return (
    <div className="content-grid">
      <div className="toolbar">
        <input type="date" value={date} onChange={(event) => setDate(event.target.value)} />
      </div>

      <div className="split-panel">
        <section className="surface-card">
          <h2>Lịch làm việc</h2>
          {schedulesQuery.isLoading ? <LoadingBlock label="Đang tải lịch làm việc..." /> : null}
          {schedulesQuery.error ? <StateBlock variant="error" title="Không thể tải lịch làm việc" description={schedulesQuery.error.message} /> : null}
          {!schedulesQuery.isLoading && !schedulesQuery.error ? (
            (schedulesQuery.data?.data || []).length > 0 ? (
              <div className="timeline-list">
                {schedulesQuery.data.data.map((item) => (
                  <div className="timeline-item" key={item.id}>
                    <div>
                      <strong>{item.workingDate}</strong>
                      <p>{item.totalSlots} slot, available: {item.availableSlots}</p>
                    </div>
                    <span className={`status-chip status-${String(item.status || '').toLowerCase()}`}>{item.status}</span>
                  </div>
                ))}
              </div>
            ) : (
              <StateBlock title="Chưa có lịch trong ngày chọn" description="Admin cần mở lịch làm việc trước khi bác sĩ xem hoặc gửi yêu cầu nghỉ." />
            )
          ) : null}
        </section>

        <LeaveRequestForm
          onSubmit={handleSubmit}
          isSubmitting={leaveMutation.isPending}
          submitError={leaveMutation.error?.message}
        />
      </div>

      <section className="surface-card">
        <h2>Yêu cầu nghỉ gần đây</h2>
        {requestsQuery.isLoading ? <LoadingBlock label="Đang tải yêu cầu nghỉ..." /> : null}
        {requestsQuery.error ? <StateBlock variant="error" title="Không thể tải yêu cầu nghỉ" description={requestsQuery.error.message} /> : null}
        {!requestsQuery.isLoading && !requestsQuery.error ? (
          <table className="data-table">
            <thead>
              <tr>
                <th>Ngày</th>
                <th>Loại</th>
                <th>Phạm vi</th>
                <th>Lý do</th>
                <th>Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {(requestsQuery.data?.data || []).map((item) => (
                <tr key={item.id}>
                  <td>{item.date}</td>
                  <td>{item.exceptionType}</td>
                  <td>{item.shift || `${item.startTime || '--'} - ${item.endTime || '--'}`}</td>
                  <td>{item.reason}</td>
                  <td><span className={`status-chip status-${String(item.status || '').toLowerCase()}`}>{item.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : null}
      </section>
    </div>
  );
}
