import { Link, useParams, useSearchParams } from 'react-router-dom';
import { useDoctorDetail } from '../../features/doctor/index.js';
import { useTimeSlots } from '../../features/timeslot/hooks/useTimeSlots.js';
import LoadingBlock from '../../shared/components/feedback/LoadingBlock.jsx';
import StateBlock from '../../shared/components/feedback/StateBlock.jsx';
import './public-pages.css';

function getDefaultDate(searchParams) {
  return searchParams.get('date') || new Date().toISOString().slice(0, 10);
}

export default function DoctorDetailPage() {
  const { id } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedDate = getDefaultDate(searchParams);
  const { data: doctorResponse, isLoading, error } = useDoctorDetail(id);
  const doctor = doctorResponse?.data;
  const { data: slotResponse, isLoading: isLoadingSlots } = useTimeSlots({ doctorId: id, date: selectedDate });
  const slots = slotResponse?.data?.slots || [];

  const handleDateChange = (event) => {
    const next = new URLSearchParams(searchParams);
    next.set('date', event.target.value);
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
            <div className="surface-card">
              <div className="page-header-block">
                <div>
                  <h2>Lịch khám</h2>
                  <p>API timeslot trả về trạng thái chính xác để Dev 3 tiếp tục booking flow.</p>
                </div>
                <input type="date" value={selectedDate} onChange={handleDateChange} />
              </div>

              {isLoadingSlots ? <LoadingBlock label="Đang tải lịch khám..." /> : null}

              {!isLoadingSlots ? (
                slots.length > 0 ? (
                  <div className="slot-grid">
                    {slots.map((slot) => (
                      <div key={slot.timeSlotId} className={`slot-button status-${slot.status}`}>
                        <div>{slot.startTime} - {slot.endTime}</div>
                        <small>{slot.status}</small>
                      </div>
                    ))}
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
