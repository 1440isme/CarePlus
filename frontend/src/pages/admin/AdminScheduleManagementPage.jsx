import { useState } from 'react';
import { useSchedules } from '../../features/schedule/hooks/useSchedules.js';
import LoadingBlock from '../../shared/components/feedback/LoadingBlock.jsx';
import StateBlock from '../../shared/components/feedback/StateBlock.jsx';

export default function AdminScheduleManagementPage() {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const schedulesQuery = useSchedules({ date, view: 'DAY', page: 1, limit: 20 });

  return (
    <div className="content-grid">
      <div className="toolbar">
        <input type="date" value={date} onChange={(event) => setDate(event.target.value)} />
      </div>
      <section className="surface-card">
        <h2>Lịch làm việc bác sĩ</h2>
        {schedulesQuery.isLoading ? <LoadingBlock label="Đang tải lịch làm việc..." /> : null}
        {schedulesQuery.error ? <StateBlock variant="error" title="Không thể tải lịch làm việc" description={schedulesQuery.error.message} /> : null}
        {!schedulesQuery.isLoading && !schedulesQuery.error ? (
          <table className="data-table">
            <thead>
              <tr>
                <th>Ngày</th>
                <th>Bác sĩ</th>
                <th>Trạng thái</th>
                <th>Tổng slot</th>
              </tr>
            </thead>
            <tbody>
              {(schedulesQuery.data?.data || []).map((item) => (
                <tr key={item.id}>
                  <td>{item.workingDate}</td>
                  <td>{item.doctor?.name}</td>
                  <td><span className={`status-chip status-${String(item.status || '').toLowerCase()}`}>{item.status}</span></td>
                  <td>{item.totalSlots}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : null}
      </section>
    </div>
  );
}
