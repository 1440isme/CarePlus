import { useState } from 'react';
import { useSchedules } from '../../features/schedule/hooks/useSchedules.js';
import LoadingBlock from '../../shared/components/feedback/LoadingBlock.jsx';
import StateBlock from '../../shared/components/feedback/StateBlock.jsx';

export default function ReceptionistDoctorSchedulePage() {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const schedulesQuery = useSchedules({ date, view: 'DAY', page: 1, limit: 20 });

  return (
    <div className="content-grid">
      <div className="toolbar">
        <input type="date" value={date} onChange={(event) => setDate(event.target.value)} />
      </div>

      <section className="surface-card">
        <h2>Lịch làm việc bác sĩ</h2>
        {schedulesQuery.isLoading ? <LoadingBlock label="Đang tải lịch..." /> : null}
        {schedulesQuery.error ? <StateBlock variant="error" title="Không thể tải lịch bác sĩ" description={schedulesQuery.error.message} /> : null}
        {!schedulesQuery.isLoading && !schedulesQuery.error ? (
          <table className="data-table">
            <thead>
              <tr>
                <th>Ngày</th>
                <th>Bác sĩ</th>
                <th>Chuyên khoa</th>
                <th>Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {(schedulesQuery.data?.data || []).map((item) => (
                <tr key={item.id}>
                  <td>{item.workingDate}</td>
                  <td>{item.doctor?.name}</td>
                  <td>{item.doctor?.specialtyName}</td>
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
