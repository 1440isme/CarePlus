import { useMemo, useState } from 'react';
import { useAdminSpecialties } from '../../features/admin/specialties/hooks/useAdminSpecialties.js';
import { useDoctorList } from '../../features/doctor/index.js';
import { useCreateSchedules, useSchedules } from '../../features/schedule/hooks/useSchedules.js';
import { Search, Plus, Calendar, X } from 'lucide-react';
import './admin-doctor-schedule.css';

const PAGE_SIZE = 10;

const STATUS_LABELS = {
  WORKING: 'Đang làm việc',
  APPROVED_OFF: 'Đã duyệt nghỉ',
  PENDING: 'Chờ duyệt',
  CANCELLED: 'Đã hủy',
  REJECTED: 'Từ chối',
};

const WORKING_SHIFT_LABELS = {
  MORNING: 'Ca sáng',
  AFTERNOON: 'Ca chiều',
  ALL_DAY: 'Cả ngày',
};

const WORKING_SHIFT_OPTIONS = [
  { label: 'Ca sáng', value: 'MORNING' },
  { label: 'Ca chiều', value: 'AFTERNOON' },
  { label: 'Cả ngày', value: 'ALL_DAY' },
];

const WEEKDAY_OPTIONS = [
  { label: 'T2', value: 1 },
  { label: 'T3', value: 2 },
  { label: 'T4', value: 3 },
  { label: 'T5', value: 4 },
  { label: 'T6', value: 5 },
  { label: 'T7', value: 6 },
  { label: 'CN', value: 0 },
];

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
    workingShift: 'ALL_DAY',
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
    workingShift: createPayload.workingShift,
  });

  const isCreateScheduleDisabled = createSchedulesMutation.isPending
    || !createPayload.doctorId
    || !createPayload.fromDate
    || !createPayload.toDate
    || !createPayload.workingShift
    || createPayload.weekdays.length === 0;

  const openCreateModal = () => {
    createSchedulesMutation.reset();
    setCreatePayload({
      specialtyId: '',
      doctorId: '',
      fromDate: getTodayDate(),
      toDate: getDateAfterDays(7),
      weekdays: [1, 2, 3, 4, 5, 6],
      workingShift: 'ALL_DAY',
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Quản trị hệ thống</p>
          <h1 className="text-2xl font-bold text-gray-900">Quản lý lịch làm việc bác sĩ</h1>
        </div>

        <button
          className="flex items-center gap-2 px-4 py-2.5 bg-[#49BCE2] hover:bg-[#3ca4c5] text-white rounded-xl text-sm font-semibold transition-colors shadow-sm"
          type="button"
          onClick={openCreateModal}
        >
          <Plus className="w-4 h-4" />
          <span>Thêm lịch làm việc</span>
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white border border-gray-100 rounded-xl p-5">
          <div className="text-sm text-gray-500 mb-1">Tổng slot</div>
          <div className="text-2xl font-bold text-gray-900">{totals.totalSlots}</div>
        </div>
        <div className="bg-white border border-gray-100 rounded-xl p-5">
          <div className="text-sm text-gray-500 mb-1">Còn trống</div>
          <div className="text-2xl font-bold text-gray-900">{totals.availableSlots}</div>
        </div>
        <div className="bg-white border border-gray-100 rounded-xl p-5">
          <div className="text-sm text-gray-500 mb-1">Đã đặt</div>
          <div className="text-2xl font-bold text-gray-900">{totals.bookedSlots}</div>
        </div>
      </div>

      {/* Main Card */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        {/* Filter Bar */}
        <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-3">
          <label className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <input
              type="date"
              value={date}
              onChange={handleDateChange}
              aria-label="Ngày làm việc"
              className="pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#49BCE2] bg-white min-w-[180px]"
            />
          </label>

          <select
            className="px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#49BCE2] bg-white"
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
            className="px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#49BCE2] bg-white"
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

        {/* Loading State */}
        {schedulesQuery.isLoading ? (
          <div className="p-5 space-y-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="h-12 bg-gray-100 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : null}

        {/* Error State */}
        {schedulesQuery.error ? (
          <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Không thể tải lịch làm việc</h2>
            <p className="text-sm text-gray-500 mb-4">{schedulesQuery.error.message}</p>
            <button
              type="button"
              onClick={() => schedulesQuery.refetch()}
              className="px-4 py-2 bg-[#49BCE2] hover:bg-[#3ca4c5] text-white rounded-lg text-sm font-semibold transition-colors"
            >
              Thử lại
            </button>
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
                    <th>Ca</th>
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
                      <td>{WORKING_SHIFT_LABELS[schedule.workingShift || schedule.shift] || schedule.workingShift || 'Cả ngày'}</td>
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
      </div>

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

            <fieldset className="admin-assignment-fieldset">
              <legend>Ca làm việc <strong>*</strong></legend>
              <div className="admin-shift-tabs admin-shift-tabs-three">
                {WORKING_SHIFT_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    className={createPayload.workingShift === option.value ? 'is-active' : ''}
                    onClick={() => setCreatePayload((currentPayload) => ({
                      ...currentPayload,
                      workingShift: option.value,
                    }))}
                  >
                    {option.label}
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
