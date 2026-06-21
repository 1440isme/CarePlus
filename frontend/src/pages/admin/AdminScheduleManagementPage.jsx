import { useMemo, useState } from 'react';
import { useAdminSpecialties } from '../../features/admin/specialties/hooks/useAdminSpecialties.js';
import { useDoctorList } from '../../features/doctor/index.js';
import { useCreateSchedules, useSchedules } from '../../features/schedule/hooks/useSchedules.js';
import './admin-doctor-schedule.css';

const PAGE_SIZE = 10;

const STATUS_LABELS = {
  WORKING: 'Đang làm việc',
  APPROVED_OFF: 'Đã duyệt nghỉ',
  PENDING: 'Chờ duyệt',
  CANCELLED: 'Đã hủy',
  REJECTED: 'Từ chối',
};

const WEEKDAY_OPTIONS = [
  { label: 'T2', value: 1 },
  { label: 'T3', value: 2 },
  { label: 'T4', value: 3 },
  { label: 'T5', value: 4 },
  { label: 'T6', value: 5 },
  { label: 'T7', value: 6 },
  { label: 'CN', value: 0 },
];

function SearchIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true">
      <path d="m14 14 3 3M8.75 15.25a6.5 6.5 0 1 1 0-13 6.5 6.5 0 0 1 0 13Z" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true">
      <path d="M10 4.25v11.5M4.25 10h11.5" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true">
      <path d="M6 2.75v2.5M14 2.75v2.5M3.75 7.75h12.5M5 4.25h10A1.75 1.75 0 0 1 16.75 6v9A1.75 1.75 0 0 1 15 16.75H5A1.75 1.75 0 0 1 3.25 15V6A1.75 1.75 0 0 1 5 4.25Z" />
    </svg>
  );
}

function getTodayDate() {
  return new Date().toISOString().slice(0, 10);
}

function getDateAfterDays(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

function getMetaValue(meta, key, fallback) {
  return meta?.[key] ?? fallback;
}

export default function AdminScheduleManagementPage() {
  const [page, setPage] = useState(1);
  const [date, setDate] = useState(getTodayDate());
  const [doctorId, setDoctorId] = useState('');
  const [status, setStatus] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createPayload, setCreatePayload] = useState({
    specialtyId: '',
    doctorId: '',
    fromDate: getTodayDate(),
    toDate: getDateAfterDays(7),
    weekdays: [1, 2, 3, 4, 5, 6],
  });

  const scheduleParams = useMemo(() => ({
    page,
    limit: PAGE_SIZE,
    date,
    view: 'DAY',
    doctorId: doctorId || undefined,
    status: status || undefined,
  }), [date, doctorId, page, status]);

  const schedulesQuery = useSchedules(scheduleParams);
  const doctorsQuery = useDoctorList({ page: 1, limit: 100, active: true });
  const specialtiesQuery = useAdminSpecialties(
    { page: 1, limit: 100 },
    { staleTime: 5 * 60 * 1000 },
  );
  const createSchedulesMutation = useCreateSchedules();

  const schedules = schedulesQuery.data?.data ?? [];
  const meta = schedulesQuery.data?.meta ?? {};
  const totalItems = getMetaValue(meta, 'totalItems', getMetaValue(meta, 'total', schedules.length));
  const totalPages = getMetaValue(meta, 'totalPages', Math.max(1, Math.ceil(totalItems / PAGE_SIZE)));
  const startItem = totalItems === 0 ? 0 : ((page - 1) * PAGE_SIZE) + 1;
  const endItem = Math.min(page * PAGE_SIZE, totalItems);

  const totals = schedules.reduce((accumulator, schedule) => ({
    totalSlots: accumulator.totalSlots + (schedule.totalSlots || 0),
    availableSlots: accumulator.availableSlots + (schedule.availableSlots || 0),
    bookedSlots: accumulator.bookedSlots + (schedule.bookedSlots || 0),
  }), { totalSlots: 0, availableSlots: 0, bookedSlots: 0 });

  const specialties = useMemo(
    () => (specialtiesQuery.data?.data ?? []).filter((specialty) => specialty.active !== false),
    [specialtiesQuery.data?.data],
  );

  const availableDoctors = useMemo(() => {
    const doctors = doctorsQuery.data?.data ?? [];

    if (!createPayload.specialtyId) {
      return doctors;
    }

    return doctors.filter((doctor) => doctor.specialtyId === createPayload.specialtyId);
  }, [createPayload.specialtyId, doctorsQuery.data?.data]);

  const handleDateChange = (event) => {
    setDate(event.target.value);
    setPage(1);
  };

  const handleDoctorChange = (event) => {
    setDoctorId(event.target.value);
    setPage(1);
  };

  const handleStatusChange = (event) => {
    setStatus(event.target.value);
    setPage(1);
  };

  const handleCreateFieldChange = (event) => {
    const { name, value } = event.target;
    setCreatePayload((currentPayload) => ({
      ...currentPayload,
      [name]: value,
    }));
  };

  const handleWeekdayToggle = (weekday) => {
    setCreatePayload((currentPayload) => {
      const weekdays = currentPayload.weekdays.includes(weekday)
        ? currentPayload.weekdays.filter((value) => value !== weekday)
        : [...currentPayload.weekdays, weekday].sort((left, right) => left - right);

      return {
        ...currentPayload,
        weekdays,
      };
    });
  };

  const buildCreateSchedulePayload = () => ({
    doctorId: createPayload.doctorId,
    fromDate: createPayload.fromDate,
    toDate: createPayload.toDate,
    weekdays: createPayload.weekdays,
  });

  const isCreateScheduleDisabled = createSchedulesMutation.isPending
    || !createPayload.doctorId
    || !createPayload.fromDate
    || !createPayload.toDate
    || createPayload.weekdays.length === 0;

  const openCreateModal = () => {
    createSchedulesMutation.reset();
    setCreatePayload({
      specialtyId: '',
      doctorId: '',
      fromDate: getTodayDate(),
      toDate: getDateAfterDays(7),
      weekdays: [1, 2, 3, 4, 5, 6],
    });
    setIsCreateModalOpen(true);
  };

  const closeCreateModal = () => {
    if (!createSchedulesMutation.isPending) {
      setIsCreateModalOpen(false);
    }
  };

  const handleCreateSchedule = async (event) => {
    event.preventDefault();
    await createSchedulesMutation.mutateAsync(buildCreateSchedulePayload());
    setIsCreateModalOpen(false);
    setDate(createPayload.fromDate);
    setDoctorId(createPayload.doctorId);
    setStatus('');
    setPage(1);
  };

  const handleCreateDateChange = (event) => {
    const { name, value } = event.target;
    setCreatePayload((currentPayload) => {
      const nextPayload = {
        ...currentPayload,
        [name]: value,
      };

      if (name === 'fromDate' && value > currentPayload.toDate) {
        nextPayload.toDate = value;
      }

      return nextPayload;
    });
  };

  return (
    <div className="admin-figma-page">
      <header className="admin-figma-page-header">
        <div>
          <p className="admin-figma-eyebrow">Quản trị hệ thống</p>
          <h1 className="admin-figma-title">Quản lý lịch làm việc bác sĩ</h1>
        </div>

        <button
          className="admin-figma-primary-button"
          type="button"
          onClick={openCreateModal}
        >
          <PlusIcon />
          <span>Thêm lịch làm việc</span>
        </button>
      </header>

      <div className="admin-figma-stat-grid">
        <article>
          <span>Tổng slot</span>
          <strong>{totals.totalSlots}</strong>
        </article>
        <article>
          <span>Còn trống</span>
          <strong>{totals.availableSlots}</strong>
        </article>
        <article>
          <span>Đã đặt</span>
          <strong>{totals.bookedSlots}</strong>
        </article>
      </div>

      <section className="admin-figma-card">
        <div className="admin-figma-filter-bar">
          <label className="admin-figma-search-control admin-figma-date-control">
            <SearchIcon />
            <input type="date" value={date} onChange={handleDateChange} aria-label="Ngày làm việc" />
          </label>

          <select
            className="admin-figma-select"
            value={doctorId}
            onChange={handleDoctorChange}
            aria-label="Lọc theo bác sĩ"
          >
            <option value="">Tất cả bác sĩ</option>
            {(doctorsQuery.data?.data ?? []).map((doctor) => (
              <option key={doctor.id} value={doctor.id}>{doctor.name}</option>
            ))}
          </select>

          <select
            className="admin-figma-select"
            value={status}
            onChange={handleStatusChange}
            aria-label="Lọc theo trạng thái"
          >
            <option value="">Tất cả trạng thái</option>
            {Object.entries(STATUS_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>

        {schedulesQuery.isLoading ? (
          <div className="admin-figma-loading-body">
            {Array.from({ length: 6 }).map((_, index) => (
              <div className="admin-figma-skeleton-row" key={index} />
            ))}
          </div>
        ) : null}

        {schedulesQuery.error ? (
          <div className="admin-figma-state-panel">
            <h2>Không thể tải lịch làm việc</h2>
            <p>{schedulesQuery.error.message}</p>
            <button type="button" onClick={() => schedulesQuery.refetch()}>Thử lại</button>
          </div>
        ) : null}

        {!schedulesQuery.isLoading && !schedulesQuery.error ? (
          <>
            <div className="admin-figma-table-wrap">
              <table className="admin-figma-table admin-figma-schedule-table">
                <thead>
                  <tr>
                    <th>Ngày</th>
                    <th>Bác sĩ</th>
                    <th>Chuyên khoa</th>
                    <th>Trạng thái</th>
                    <th>Tổng slot</th>
                    <th>Còn trống</th>
                    <th>Đã đặt</th>
                    <th>Đã khóa</th>
                  </tr>
                </thead>
                <tbody>
                  {schedules.map((schedule) => (
                    <tr key={schedule.id}>
                      <td>
                        <p className="admin-figma-main-text">{schedule.workingDate}</p>
                      </td>
                      <td>{schedule.doctor?.name || 'Chưa có bác sĩ'}</td>
                      <td>{schedule.doctor?.specialtyName || 'Chưa phân khoa'}</td>
                      <td>
                        <span className={`admin-figma-badge status-${String(schedule.status).toLowerCase()}`}>
                          {STATUS_LABELS[schedule.status] || schedule.status}
                        </span>
                      </td>
                      <td>{schedule.totalSlots || 0}</td>
                      <td>{schedule.availableSlots || 0}</td>
                      <td>{schedule.bookedSlots || 0}</td>
                      <td>{schedule.lockedSlots || 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {schedules.length === 0 ? (
              <div className="admin-figma-state-panel">
                <h2>Chưa có lịch làm việc</h2>
                <p>Thử chọn ngày khác hoặc bỏ bớt bộ lọc.</p>
              </div>
            ) : null}

            <footer className="admin-figma-pagination">
              <p>Hiển thị {startItem}-{endItem} trong {totalItems} lịch làm việc</p>
              <div>
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((currentPage) => Math.max(1, currentPage - 1))}
                >
                  Trước
                </button>
                <button
                  type="button"
                  disabled={page >= totalPages}
                  onClick={() => setPage((currentPage) => Math.min(totalPages, currentPage + 1))}
                >
                  Sau
                </button>
              </div>
            </footer>
          </>
        ) : null}
      </section>

      {isCreateModalOpen ? (
        <div className="admin-figma-modal-backdrop" role="presentation">
          <form className="admin-figma-modal admin-figma-assignment-modal" onSubmit={handleCreateSchedule}>
            <header className="admin-figma-modal-header">
              <h2>Phân công lịch làm việc</h2>
              <button
                type="button"
                className="admin-figma-modal-close"
                onClick={closeCreateModal}
                aria-label="Đóng"
              >
                ×
              </button>
            </header>

            <label className="admin-figma-form-field">
              <span>Chuyên khoa</span>
              <select
                name="specialtyId"
                value={createPayload.specialtyId}
                onChange={handleCreateFieldChange}
              >
                <option value="">Chọn chuyên khoa</option>
                {specialties.map((specialty) => (
                  <option key={specialty.id} value={specialty.id}>{specialty.name}</option>
                ))}
              </select>
            </label>

            <label className="admin-figma-form-field">
              <span>Bác sĩ <strong>*</strong></span>
              <select
                name="doctorId"
                value={createPayload.doctorId}
                onChange={handleCreateFieldChange}
                required
              >
                <option value="">Chọn bác sĩ</option>
                {availableDoctors.map((doctor) => (
                  <option key={doctor.id} value={doctor.id}>{doctor.name}</option>
                ))}
              </select>
            </label>

            <div className="admin-figma-form-row">
              <label className="admin-figma-form-field">
                <span>Từ ngày <strong>*</strong></span>
                <span className="admin-figma-input-icon-wrap">
                  <input
                    type="date"
                    name="fromDate"
                    value={createPayload.fromDate}
                    min={getTodayDate()}
                    onChange={handleCreateDateChange}
                    required
                    placeholder="mm/dd/yyyy"
                  />
                  <CalendarIcon />
                </span>
              </label>

              <label className="admin-figma-form-field">
                <span>Đến ngày <strong>*</strong></span>
                <span className="admin-figma-input-icon-wrap">
                  <input
                    type="date"
                    name="toDate"
                    value={createPayload.toDate}
                    min={createPayload.fromDate || getTodayDate()}
                    onChange={handleCreateDateChange}
                    required
                    placeholder="mm/dd/yyyy"
                  />
                  <CalendarIcon />
                </span>
              </label>
            </div>

            <fieldset className="admin-assignment-fieldset">
              <legend>Thứ trong tuần <strong>*</strong></legend>
              <div className="admin-weekday-tags">
                {WEEKDAY_OPTIONS.map((weekday) => (
                  <button
                    key={weekday.value}
                    type="button"
                    className={createPayload.weekdays.includes(weekday.value) ? 'is-active' : ''}
                    onClick={() => handleWeekdayToggle(weekday.value)}
                  >
                    {weekday.label}
                  </button>
                ))}
              </div>
            </fieldset>

            <div className="admin-assignment-sr-only" aria-hidden="true">
              <label>
                <input
                  type="checkbox"
                  checked={createPayload.weekdays.length > 0}
                  readOnly
                  required
                />
              </label>
            </div>

            {createSchedulesMutation.error ? (
              <p className="admin-figma-form-error">{createSchedulesMutation.error.message}</p>
            ) : null}

            <footer className="admin-figma-modal-actions">
              <button
                type="button"
                className="admin-figma-secondary-button"
                onClick={closeCreateModal}
              >
                Hủy
              </button>
              <button
                type="submit"
                className="admin-figma-primary-button"
                disabled={isCreateScheduleDisabled}
              >
                {createSchedulesMutation.isPending ? 'Đang phân công...' : 'Phân công'}
              </button>
            </footer>
          </form>
        </div>
      ) : null}
    </div>
  );
}
