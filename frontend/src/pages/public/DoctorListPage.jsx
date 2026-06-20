import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useDoctorList } from '../../features/doctor/index.js';
import LoadingBlock from '../../shared/components/feedback/LoadingBlock.jsx';
import StateBlock from '../../shared/components/feedback/StateBlock.jsx';
import './public-pages.css';

function getTodayDateString() {
  return new Date().toISOString().slice(0, 10);
}

export default function DoctorListPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchInput, setSearchInput] = useState(searchParams.get('search') || '');

  const query = useMemo(() => ({
    search: searchParams.get('search') || '',
    page: Number(searchParams.get('page') || 1),
    limit: 12,
    active: true,
  }), [searchParams]);

  const { data, isLoading, error } = useDoctorList(query);
  const doctors = data?.data || [];

  const handleSubmit = (event) => {
    event.preventDefault();
    const next = new URLSearchParams(searchParams);
    if (searchInput.trim()) {
      next.set('search', searchInput.trim());
    } else {
      next.delete('search');
    }
    next.set('page', '1');
    setSearchParams(next);
  };

  return (
    <div className="page-shell">
      <div className="page-header-block">
        <div>
          <h1>Đội ngũ bác sĩ</h1>
          <p>Tìm bác sĩ theo tên hoặc chuyên khoa và xem nhanh khung giờ đang sẵn sàng cho ngày bạn chọn.</p>
        </div>
      </div>

      <form className="toolbar" onSubmit={handleSubmit}>
        <input
          type="search"
          placeholder="Tìm tên bác sĩ hoặc chuyên khoa"
          value={searchInput}
          onChange={(event) => setSearchInput(event.target.value)}
        />
        <button type="submit" className="button-primary">Tìm kiếm</button>
      </form>

      {isLoading ? <LoadingBlock label="Đang tải danh sách bác sĩ..." /> : null}
      {error ? <StateBlock variant="error" title="Không thể tải danh sách bác sĩ" description={error.message} /> : null}

      {!isLoading && !error ? (
        <div className="listing-layout">
          {doctors.length === 0 ? (
            <StateBlock title="Không có bác sĩ phù hợp" description="Hãy thử đổi từ khóa tìm kiếm hoặc quay lại sau." />
          ) : doctors.map((doctor) => (
            <article key={doctor.id} className="doctor-card">
              <div className="doctor-card-main">
                <h3>{doctor.title} {doctor.name}</h3>
                <div className="doctor-meta">
                  <span>Chuyên khoa: {doctor.specialtyName}</span>
                  <span>{doctor.experience} năm kinh nghiệm</span>
                  <span>{doctor.rating}/5 ({doctor.reviewCount} đánh giá)</span>
                </div>
                <p>{doctor.position}</p>
                <p>{doctor.description}</p>
                <div className="toolbar">
                  <Link to={`/bac-si/${doctor.id}`} className="button-primary">Xem chi tiết</Link>
                  <Link to={`/dat-lich?doctorId=${doctor.id}&date=${getTodayDateString()}`} className="button-secondary">Đặt lịch</Link>
                </div>
              </div>

              <div className="doctor-card-schedule">
                <h4>Lịch khám nhanh</h4>
                <p className="helper-text">Khung giờ theo API timeslot sẽ hiển thị chi tiết trong trang bác sĩ.</p>
                <div className="slot-grid">
                  <Link className="slot-button status-AVAILABLE" to={`/bac-si/${doctor.id}`}>08:00 - 08:30</Link>
                  <span className="slot-button status-BOOKED">08:30 - 09:00</span>
                  <span className="slot-button status-LOCKED">13:30 - 14:00</span>
                  <Link className="slot-button status-AVAILABLE" to={`/bac-si/${doctor.id}`}>14:00 - 14:30</Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : null}
    </div>
  );
}
