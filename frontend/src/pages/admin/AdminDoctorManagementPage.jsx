import { useState } from 'react';
import { useDoctorList } from '../../features/doctor/index.js';
import LoadingBlock from '../../shared/components/feedback/LoadingBlock.jsx';
import StateBlock from '../../shared/components/feedback/StateBlock.jsx';

export default function AdminDoctorManagementPage() {
  const [search, setSearch] = useState('');
  const doctorsQuery = useDoctorList({ page: 1, limit: 20, active: true, search });

  return (
    <div className="content-grid">
      <div className="toolbar">
        <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Tìm bác sĩ..." />
      </div>

      <section className="surface-card">
        <h2>Quản lý bác sĩ</h2>
        {doctorsQuery.isLoading ? <LoadingBlock label="Đang tải danh sách bác sĩ..." /> : null}
        {doctorsQuery.error ? <StateBlock variant="error" title="Không thể tải bác sĩ" description={doctorsQuery.error.message} /> : null}
        {!doctorsQuery.isLoading && !doctorsQuery.error ? (
          <table className="data-table">
            <thead>
              <tr>
                <th>Bác sĩ</th>
                <th>Chuyên khoa</th>
                <th>Kinh nghiệm</th>
                <th>Rating</th>
              </tr>
            </thead>
            <tbody>
              {(doctorsQuery.data?.data || []).map((doctor) => (
                <tr key={doctor.id}>
                  <td>{doctor.title} {doctor.name}</td>
                  <td>{doctor.specialtyName}</td>
                  <td>{doctor.experience} năm</td>
                  <td>{doctor.rating}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : null}
      </section>
    </div>
  );
}
