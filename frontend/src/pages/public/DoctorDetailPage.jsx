import { Link, useParams, useSearchParams } from 'react-router-dom';
import { useMemo } from 'react';
import { useDoctorDetail } from '../../features/doctor/index.js';
import { useTimeSlots } from '../../features/timeslot/hooks/useTimeSlots.js';
import { usePublicSystemSettings } from '../../features/admin/clinic-settings/hooks/usePublicSystemSettings.js';
import { buildVirtualSlots, mergePersistedSlots } from '../../features/timeslot/utils/virtual-slots.js';
import LoadingBlock from '../../shared/components/feedback/LoadingBlock.jsx';
import StateBlock from '../../shared/components/feedback/StateBlock.jsx';
import './public-pages.css';

function getDefaultDate(searchParams) {
  return searchParams.get('date') || new Date().toISOString().slice(0, 10);
}

function buildDateOptions(count = 7) {
  return Array.from({ length: count }).map((_, index) => {
    const date = new Date();
    date.setDate(date.getDate() + index);
    const value = date.toISOString().slice(0, 10);

    return {
      value,
      weekday: date.toLocaleDateString('vi-VN', { weekday: 'short' }),
      day: date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }),
    };
  });
}

function SlotButton({ slot }) {
  const isBooked = ['BOOKED', 'EXPIRED'].includes(slot.status);

  return (
    <button
      type="button"
      className={`slot-button status-${slot.status}`}
      disabled={isBooked}
      aria-label={`${slot.startTime} đến ${slot.endTime}`}
    >
      <span>{slot.startTime}</span>
      {isBooked ? <small>Đã đặt</small> : null}
    </button>
  );
}

export default function DoctorDetailPage() {
  const { id } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedDate = getDefaultDate(searchParams);
  const { data: doctorResponse, isLoading, error } = useDoctorDetail(id);
  const doctor = doctorResponse?.data;
  const { data: systemSettingsResponse } = usePublicSystemSettings();
  const { data: slotResponse, isLoading: isLoadingSlots } = useTimeSlots({ doctorId: id, date: selectedDate });
  const slotData = slotResponse?.data;
  const dateOptions = useMemo(() => buildDateOptions(systemSettingsResponse?.data?.maxBookingDaysAhead || 7), [systemSettingsResponse?.data?.maxBookingDaysAhead]);
  const slotGroups = useMemo(() => {
    if (!slotData?.scheduleId || slotData.scheduleStatus !== 'WORKING') {
      return { morning: [], afternoon: [] };
    }

    return mergePersistedSlots(
      buildVirtualSlots(systemSettingsResponse?.data),
      slotData.slots || [],
    );
  }, [slotData, systemSettingsResponse?.data]);
  const visibleSlotCount = slotGroups.morning.length + slotGroups.afternoon.length;

  const handleDateChange = (event) => {
    const next = new URLSearchParams(searchParams);
    next.set('date', event.target.value);
    setSearchParams(next);
  };

  const handleDateSelect = (value) => {
    const next = new URLSearchParams(searchParams);
    next.set('date', value);
    setSearchParams(next);
  };

  return (
    <div className="page-shell">
      {isLoading ? <LoadingBlock label="Đang tải hồ sơ bác sĩ..." /> : null}
      {error ? <StateBlock variant="error" title="Không thể tải hồ sơ bác sĩ" description={error.message} /> : null}

      {doctor ? (
        <div className="content-grid">
          <section className="split-hero">
            <div className="surface-card">
              <h1>{doctor.title} {doctor.name}</h1>
              <div className="doctor-meta">
                <span>{doctor.specialtyName}</span>
                <span>{doctor.position}</span>
                <span>{doctor.experience} năm kinh nghiệm</span>
              </div>
              <p>{doctor.description}</p>
            </div>

            <aside className="sidebar-stack">
              <div className="surface-card">
                <h3>Giá khám tham khảo</h3>
                <strong>{Number(doctor.price || 0).toLocaleString('vi-VN')} VNĐ</strong>
                <p className="helper-text">Bệnh nhân thanh toán trực tiếp tại quầy theo quy định hệ thống.</p>
              </div>
              <div className="surface-card">
                <h3>Đặt lịch</h3>
                <p className="helper-text">Chọn ngày và khung giờ còn trống để tiếp tục booking wizard.</p>
                <Link className="button-primary" to={`/dat-lich?doctorId=${doctor.id}&date=${selectedDate}`}>Bắt đầu đặt lịch</Link>
              </div>
            </aside>
          </section>

          <section className="detail-tab-grid">
            <div className="surface-card doctor-schedule-panel">
              <div className="page-header-block schedule-heading">
                <div>
                  <h2>Lịch khám</h2>
                  <p>Khung giờ được hiển thị theo cấu hình hệ thống, trạng thái đặt/nghỉ đọc từ dữ liệu thực.</p>
                </div>
                <input type="date" value={selectedDate} onChange={handleDateChange} />
              </div>

              <div className="date-pill-row" aria-label="Chọn ngày khám">
                {dateOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    className={option.value === selectedDate ? 'is-active' : ''}
                    onClick={() => handleDateSelect(option.value)}
                  >
                    <span>{option.weekday}</span>
                    <strong>{option.day}</strong>
                  </button>
                ))}
              </div>

              {isLoadingSlots ? <LoadingBlock label="Đang tải lịch khám..." /> : null}

              {!isLoadingSlots ? (
                visibleSlotCount > 0 ? (
                  <div className="doctor-slot-sections">
                    <section>
                      <h3>Buổi sáng</h3>
                      <div className="slot-grid figma-slot-grid">
                        {slotGroups.morning.map((slot) => (
                          <SlotButton key={`${slot.startTime}-${slot.endTime}`} slot={slot} />
                        ))}
                      </div>
                    </section>
                    <section>
                      <h3>Buổi chiều</h3>
                      <div className="slot-grid figma-slot-grid">
                        {slotGroups.afternoon.map((slot) => (
                          <SlotButton key={`${slot.startTime}-${slot.endTime}`} slot={slot} />
                        ))}
                      </div>
                    </section>
                  </div>
                ) : (
                  <StateBlock title="Chưa có lịch làm việc" description="Bác sĩ chưa được mở lịch trong ngày bạn chọn." />
                )
              ) : null}
            </div>

            <div className="surface-card simple-article">
              <h2>Đánh giá và thông tin chuyên môn</h2>
              <p>Điểm đánh giá hiện tại: <strong>{doctor.rating}/5</strong> với <strong>{doctor.reviewCount}</strong> lượt đánh giá hợp lệ.</p>
              <p>Chuyên khoa: {doctor.specialtyName}</p>
              <p>Hệ thống hiện chỉ đọc rating tổng hợp từ backend doctor profile. Chi tiết review sẽ được nối khi API review sẵn sàng.</p>
            </div>
          </section>
        </div>
      ) : null}
    </div>
  );
}
