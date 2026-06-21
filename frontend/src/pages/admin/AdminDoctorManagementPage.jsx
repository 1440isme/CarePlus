import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useDoctorList } from '../../features/doctor/index.js';
import { useAdminSpecialties } from '../../features/admin/specialties/hooks/useAdminSpecialties.js';
import { APP_ROUTES } from '../../shared/constants/routes.js';
import './admin-doctor-schedule.css';

const PAGE_SIZE = 10;

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

function formatCurrency(value) {
  if (typeof value !== 'number') {
    return 'Chưa cập nhật';
  }

  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(value);
}

function getMetaValue(meta, key, fallback) {
  return meta?.[key] ?? fallback;
}

export default function AdminDoctorManagementPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [active, setActive] = useState('');
  const [specialtyId, setSpecialtyId] = useState('');

  const doctorParams = useMemo(() => ({
    page,
    limit: PAGE_SIZE,
    search: search || undefined,
    active: active || undefined,
    specialtyId: specialtyId || undefined,
  }), [active, page, search, specialtyId]);

  const doctorsQuery = useDoctorList(doctorParams);
  const specialtiesQuery = useAdminSpecialties(
    { page: 1, limit: 100 },
    { staleTime: 5 * 60 * 1000 },
  );

  const doctors = doctorsQuery.data?.data ?? [];
  const specialties = useMemo(
    () => (specialtiesQuery.data?.data ?? []).filter((specialty) => specialty.active !== false),
    [specialtiesQuery.data?.data],
  );
  const meta = doctorsQuery.data?.meta ?? {};
  const totalItems = getMetaValue(meta, 'totalItems', getMetaValue(meta, 'total', doctors.length));
  const totalPages = getMetaValue(meta, 'totalPages', Math.max(1, Math.ceil(totalItems / PAGE_SIZE)));
  const startItem = totalItems === 0 ? 0 : ((page - 1) * PAGE_SIZE) + 1;
  const endItem = Math.min(page * PAGE_SIZE, totalItems);

  const handleSearchChange = (event) => {
    setSearch(event.target.value);
    setPage(1);
  };

  const handleSpecialtyChange = (event) => {
    setSpecialtyId(event.target.value);
    setPage(1);
  };

  const handleActiveChange = (event) => {
    setActive(event.target.value);
    setPage(1);
  };

  return (
    <div className="admin-figma-page">
      <header className="admin-figma-page-header">
        <div>
          <p className="admin-figma-eyebrow">Quản trị hệ thống</p>
          <h1 className="admin-figma-title">Quản lý bác sĩ</h1>
        </div>

        <Link className="admin-figma-primary-button" to={`${APP_ROUTES.adminRoot}/nguoi-dung`}>
          <PlusIcon />
          <span>Thêm bác sĩ</span>
        </Link>
      </header>

      <section className="admin-figma-card">
        <div className="admin-figma-filter-bar">
          <label className="admin-figma-search-control">
            <SearchIcon />
            <input
              value={search}
              onChange={handleSearchChange}
              placeholder="Tìm kiếm bác sĩ..."
              aria-label="Tìm kiếm bác sĩ"
            />
          </label>

          <select
            className="admin-figma-select"
            value={specialtyId}
            onChange={handleSpecialtyChange}
            aria-label="Lọc theo chuyên khoa"
          >
            <option value="">Tất cả chuyên khoa</option>
            {specialties.map((specialty) => (
              <option key={specialty.id} value={specialty.id}>{specialty.name}</option>
            ))}
          </select>

          <select
            className="admin-figma-select"
            value={active}
            onChange={handleActiveChange}
            aria-label="Lọc theo trạng thái"
          >
            <option value="">Tất cả trạng thái</option>
            <option value="true">Đang hoạt động</option>
            <option value="false">Tạm ẩn</option>
          </select>
        </div>

        {doctorsQuery.isLoading ? (
          <div className="admin-figma-loading-body">
            {Array.from({ length: 6 }).map((_, index) => (
              <div className="admin-figma-skeleton-row" key={index} />
            ))}
          </div>
        ) : null}

        {doctorsQuery.error ? (
          <div className="admin-figma-state-panel">
            <h2>Không thể tải danh sách bác sĩ</h2>
            <p>{doctorsQuery.error.message}</p>
            <button type="button" onClick={() => doctorsQuery.refetch()}>Thử lại</button>
          </div>
        ) : null}

        {!doctorsQuery.isLoading && !doctorsQuery.error ? (
          <>
            <div className="admin-figma-table-wrap">
              <table className="admin-figma-table admin-figma-doctor-table">
                <thead>
                  <tr>
                    <th>Bác sĩ</th>
                    <th>Chuyên khoa</th>
                    <th>Kinh nghiệm</th>
                    <th>Giá khám</th>
                    <th>Đánh giá</th>
                    <th>Trạng thái</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {doctors.map((doctor) => (
                    <tr key={doctor.id}>
                      <td>
                        <div className="admin-figma-person-cell">
                          <span className="admin-figma-avatar">
                            {doctor.avatar ? <img src={doctor.avatar} alt="" /> : doctor.name?.charAt(0)}
                          </span>
                          <div>
                            <p className="admin-figma-main-text">{doctor.title} {doctor.name}</p>
                            <p className="admin-figma-muted-text">{doctor.position || 'Bác sĩ'}</p>
                          </div>
                        </div>
                      </td>
                      <td>{doctor.specialtyName || 'Chưa phân khoa'}</td>
                      <td>{doctor.experience ?? 0} năm</td>
                      <td>{formatCurrency(doctor.price)}</td>
                      <td>
                        <span className="admin-figma-rating">{Number(doctor.rating || 0).toFixed(1)}</span>
                        <span className="admin-figma-muted-inline"> ({doctor.reviewCount || 0})</span>
                      </td>
                      <td>
                        <span className={`admin-figma-badge ${doctor.active ? 'is-active' : 'is-inactive'}`}>
                          {doctor.active ? 'Hoạt động' : 'Tạm ẩn'}
                        </span>
                      </td>
                      <td>
                        <Link className="admin-figma-outline-link" to={`/bac-si/${doctor.id}`}>
                          Xem hồ sơ
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {doctors.length === 0 ? (
              <div className="admin-figma-state-panel">
                <h2>Chưa có bác sĩ phù hợp</h2>
                <p>Thử thay đổi từ khóa, chuyên khoa hoặc trạng thái lọc.</p>
              </div>
            ) : null}

            <footer className="admin-figma-pagination">
              <p>Hiển thị {startItem}-{endItem} trong {totalItems} bác sĩ</p>
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
    </div>
  );
}
