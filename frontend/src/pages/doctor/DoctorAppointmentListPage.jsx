import { useMemo, useState } from 'react';
import { useAppointments } from '../../features/appointment/hooks/useAppointments.js';
import { useDoctorProfile } from '../../features/doctor/index.js';
import LoadingBlock from '../../shared/components/feedback/LoadingBlock.jsx';
import StateBlock from '../../shared/components/feedback/StateBlock.jsx';
import './doctor.css';

const STATUS_OPTIONS = [
  { value: '', label: 'Tất cả' },
  { value: 'CONFIRMED', label: 'Đã xác nhận' },
  { value: 'CHECKED_IN', label: 'Check-in' },
  { value: 'COMPLETED', label: 'Hoàn thành' },
  { value: 'CANCELLED', label: 'Đã hủy' },
  { value: 'NO_SHOW', label: 'No-show' },
];

function formatDate(value) {
  if (!value) return '--';
  const date = new Date(`${value}T00:00:00`);
  return date.toLocaleDateString('vi-VN');
}

function formatRelationship(value) {
  const map = {
    SELF: 'Bản thân',
    CHA: 'Cha',
    ME: 'Mẹ',
    CON: 'Con',
    VO: 'Vợ',
    CHONG: 'Chồng',
    ANH: 'Anh',
    CHI: 'Chị',
    EM: 'Em',
    ONG: 'Ông',
    BA: 'Bà',
    KHAC: 'Khác',
  };

  return map[value] || value || '--';
}

export default function DoctorAppointmentListPage() {
  const [search, setSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [page, setPage] = useState(1);
  const [selectedAppointment, setSelectedAppointment] = useState(null);

  const profileQuery = useDoctorProfile();
  const doctor = profileQuery.data?.data;

  const appointmentParams = useMemo(() => ({
    page,
    limit: 10,
    doctorId: doctor?.id,
    ...(search.trim() ? { search: search.trim() } : {}),
    ...(selectedStatus ? { status: selectedStatus } : {}),
    ...(selectedDate ? { date: selectedDate } : {}),
  }), [doctor?.id, page, search, selectedStatus, selectedDate]);

  const appointmentsQuery = useAppointments(appointmentParams);

  const appointments = appointmentsQuery.data?.data || [];
  const meta = appointmentsQuery.data?.meta || { page: 1, totalPages: 1, total: 0 };

  const resetFilters = () => {
    setSearch('');
    setSelectedStatus('');
    setSelectedDate('');
    setPage(1);
  };

  if (profileQuery.isLoading) {
    return <LoadingBlock label="Đang tải hồ sơ bác sĩ..." />;
  }

  if (profileQuery.error) {
    return <StateBlock variant="error" title="Không thể tải hồ sơ bác sĩ" description={profileQuery.error.message} />;
  }

  return (
    <div className="content-grid doctor-page">
      <div className="doctor-page-header">
        <h2>Lịch hẹn</h2>
        <p>Theo dõi danh sách lịch hẹn của bác sĩ, tra cứu nhanh theo ngày và xem chi tiết từng cuộc hẹn.</p>
      </div>

      <section className="surface-card doctor-filter-shell">
        <div className="doctor-filter-grid">
          <input
            type="text"
            placeholder="Tìm theo mã lịch, bệnh nhân..."
            value={search}
            onChange={(event) => {
              setPage(1);
              setSearch(event.target.value);
            }}
          />

          <input
            type="date"
            value={selectedDate}
            onChange={(event) => {
              setPage(1);
              setSelectedDate(event.target.value);
            }}
          />

          <select
            value={selectedStatus}
            onChange={(event) => {
              setPage(1);
              setSelectedStatus(event.target.value);
            }}
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value || 'all'} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <button type="button" className="button-secondary" onClick={resetFilters}>
            Xóa bộ lọc
          </button>
        </div>

        <div className="doctor-status-tabs">
          {STATUS_OPTIONS.map((option) => (
            <button
              key={option.value || 'all-pill'}
              type="button"
              className={`doctor-status-tab ${selectedStatus === option.value ? 'active' : ''}`}
              onClick={() => {
                setPage(1);
                setSelectedStatus(option.value);
              }}
            >
              {option.label}
            </button>
          ))}
        </div>
      </section>

      <section className="surface-card">
        <div className="doctor-section-title">
          <div>
            <h3>Danh sách lịch hẹn</h3>
            <p className="doctor-table-note">
              Bác sĩ hiện tại: <strong>{doctor?.name}</strong> {doctor?.specialtyName ? `· ${doctor.specialtyName}` : ''}
            </p>
          </div>
          <span className="doctor-subtle-tag">{meta.total} lịch hẹn</span>
        </div>

        {appointmentsQuery.isLoading ? (
          <LoadingBlock label="Đang tải lịch hẹn..." />
        ) : appointmentsQuery.error ? (
          <StateBlock variant="error" title="Không thể tải lịch hẹn" description={appointmentsQuery.error.message} />
        ) : appointments.length === 0 ? (
          <StateBlock title="Chưa có lịch hẹn phù hợp" description="Hãy thay đổi bộ lọc hoặc quay lại sau khi có thêm dữ liệu từ hệ thống." />
        ) : (
          <>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Mã lịch</th>
                  <th>Bệnh nhân</th>
                  <th>Ngày khám</th>
                  <th>Khung giờ</th>
                  <th>Lý do khám</th>
                  <th>Trạng thái</th>
                  <th style={{ textAlign: 'right' }}>Chi tiết</th>
                </tr>
              </thead>
              <tbody>
                {appointments.map((appointment) => (
                  <tr key={appointment.id}>
                    <td><code>{appointment.code}</code></td>
                    <td>
                      <div className="doctor-appointment-main">
                        <strong>{appointment.patientName}</strong>
                        <span>{appointment.patientProfile?.relationship ? formatRelationship(appointment.patientProfile.relationship) : 'Bệnh nhân'}</span>
                      </div>
                    </td>
                    <td>{formatDate(appointment.appointmentDate)}</td>
                    <td>{appointment.startTime} - {appointment.endTime}</td>
                    <td>{appointment.reason || 'Không có ghi chú'}</td>
                    <td>
                      <span className={`status-chip status-${String(appointment.status || '').toLowerCase()}`}>
                        {appointment.status}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        type="button"
                        className="doctor-detail-btn"
                        onClick={() => setSelectedAppointment(appointment)}
                      >
                        Xem chi tiết
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {meta.totalPages > 1 ? (
              <div className="doctor-section-title" style={{ marginTop: 16, marginBottom: 0 }}>
                <p className="doctor-table-note">
                  Trang <strong>{meta.page}</strong> / <strong>{meta.totalPages}</strong>
                </p>
                <div className="doctor-action-pills">
                  <button
                    type="button"
                    className="button-secondary"
                    disabled={page === 1}
                    onClick={() => setPage((current) => Math.max(1, current - 1))}
                  >
                    Trước
                  </button>
                  <button
                    type="button"
                    className="button-secondary"
                    disabled={page === meta.totalPages}
                    onClick={() => setPage((current) => Math.min(meta.totalPages, current + 1))}
                  >
                    Sau
                  </button>
                </div>
              </div>
            ) : null}
          </>
        )}
      </section>

      {selectedAppointment ? (
        <>
          <div className="doctor-drawer-backdrop" onClick={() => setSelectedAppointment(null)} />
          <aside className="doctor-drawer" aria-label="Chi tiết lịch hẹn">
            <div className="doctor-drawer-header">
              <div>
                <h2>Chi tiết lịch hẹn</h2>
                <p className="doctor-table-note">{selectedAppointment.code}</p>
              </div>
              <button type="button" className="doctor-drawer-close" onClick={() => setSelectedAppointment(null)}>
                &times;
              </button>
            </div>

            <div className="doctor-drawer-body">
              <div>
                <h4 className="doctor-drawer-section-title">Trạng thái</h4>
                <span className={`status-chip status-${String(selectedAppointment.status || '').toLowerCase()}`}>
                  {selectedAppointment.status}
                </span>
              </div>

              <div>
                <h4 className="doctor-drawer-section-title">Thông tin lịch khám</h4>
                <div className="doctor-drawer-panel">
                  <div className="doctor-drawer-row">
                    <span>Ngày khám</span>
                    <strong>{formatDate(selectedAppointment.appointmentDate)}</strong>
                  </div>
                  <div className="doctor-drawer-row">
                    <span>Khung giờ</span>
                    <strong>{selectedAppointment.startTime} - {selectedAppointment.endTime}</strong>
                  </div>
                  <div className="doctor-drawer-row">
                    <span>Chuyên khoa</span>
                    <strong>{selectedAppointment.specialty?.name || doctor?.specialtyName || '--'}</strong>
                  </div>
                  <div className="doctor-drawer-row">
                    <span>Giá tham khảo</span>
                    <strong>{(selectedAppointment.consultationFee || 0).toLocaleString('vi-VN')} VNĐ</strong>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="doctor-drawer-section-title">Thông tin bệnh nhân</h4>
                <div className="doctor-drawer-panel">
                  <div className="doctor-drawer-row">
                    <span>Người khám</span>
                    <strong>{selectedAppointment.patientName}</strong>
                  </div>
                  <div className="doctor-drawer-row">
                    <span>Số điện thoại</span>
                    <strong>{selectedAppointment.patientProfile?.phone || selectedAppointment.patient?.phone || '--'}</strong>
                  </div>
                  <div className="doctor-drawer-row">
                    <span>Email</span>
                    <strong>{selectedAppointment.patientProfile?.email || selectedAppointment.patient?.email || selectedAppointment.patientEmail || '--'}</strong>
                  </div>
                  <div className="doctor-drawer-row">
                    <span>Ngày sinh</span>
                    <strong>{selectedAppointment.patientProfile?.dateOfBirth || selectedAppointment.patient?.dateOfBirth || selectedAppointment.patientDob || '--'}</strong>
                  </div>
                  <div className="doctor-drawer-row">
                    <span>Quan hệ</span>
                    <strong>{formatRelationship(selectedAppointment.patientProfile?.relationship)}</strong>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="doctor-drawer-section-title">Lý do khám</h4>
                <div className="doctor-drawer-panel">
                  <div className="doctor-drawer-reason">{selectedAppointment.reason || 'Không có triệu chứng hoặc ghi chú được cung cấp.'}</div>
                </div>
              </div>

              {selectedAppointment.note ? (
                <div>
                  <h4 className="doctor-drawer-section-title">Ghi chú</h4>
                  <div className="doctor-drawer-panel">
                    <div className="doctor-drawer-reason">{selectedAppointment.note}</div>
                  </div>
                </div>
              ) : null}
            </div>

            <div className="doctor-drawer-footer">
              <button type="button" className="button-secondary" onClick={() => setSelectedAppointment(null)}>
                Đóng
              </button>
            </div>
          </aside>
        </>
      ) : null}
    </div>
  );
}
