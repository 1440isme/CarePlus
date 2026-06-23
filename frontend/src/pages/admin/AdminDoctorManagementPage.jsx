import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Plus, Loader2 } from 'lucide-react';
import { useDoctorList } from '../../features/doctor/index.js';
import { useAdminSpecialties } from '../../features/admin/specialties/hooks/useAdminSpecialties.js';
import { APP_ROUTES } from '../../shared/constants/routes.js';

const PAGE_SIZE = 10;

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
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Quản trị hệ thống</p>
            <h1 className="text-2xl font-bold text-gray-900">Quản lý bác sĩ</h1>
          </div>

          <Link
            className="flex items-center gap-2 px-4 py-2.5 bg-[#49BCE2] text-white text-sm font-semibold rounded-lg hover:bg-[#3ca4c5] transition shadow-sm"
            to={`${APP_ROUTES.adminRoot}/nguoi-dung`}
          >
            <Plus className="w-4 h-4" />
            <span>Thêm bác sĩ</span>
          </Link>
        </div>

        {/* Main Card */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          {/* Filter Bar */}
          <div className="flex flex-wrap items-center gap-3 p-5 border-b border-gray-100">
            <label className="relative flex-1 min-w-[280px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={handleSearchChange}
                placeholder="Tìm kiếm bác sĩ..."
                aria-label="Tìm kiếm bác sĩ"
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#49BCE2] focus:border-transparent"
              />
            </label>

            <select
              value={specialtyId}
              onChange={handleSpecialtyChange}
              aria-label="Lọc theo chuyên khoa"
              className="px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#49BCE2] focus:border-transparent bg-white min-w-[180px]"
            >
              <option value="">Tất cả chuyên khoa</option>
              {specialties.map((specialty) => (
                <option key={specialty.id} value={specialty.id}>{specialty.name}</option>
              ))}
            </select>

            <select
              value={active}
              onChange={handleActiveChange}
              aria-label="Lọc theo trạng thái"
              className="px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#49BCE2] focus:border-transparent bg-white min-w-[160px]"
            >
              <option value="">Tất cả trạng thái</option>
              <option value="true">Đang hoạt động</option>
              <option value="false">Tạm ẩn</option>
            </select>
          </div>

          {/* Loading State */}
          {doctorsQuery.isLoading ? (
            <div className="p-6 space-y-4">
              {Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="h-16 bg-gray-100 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : null}

          {/* Error State */}
          {doctorsQuery.error ? (
            <div className="p-12 text-center space-y-3">
              <h2 className="text-lg font-semibold text-gray-900">Không thể tải danh sách bác sĩ</h2>
              <p className="text-sm text-gray-600">{doctorsQuery.error.message}</p>
              <button
                type="button"
                onClick={() => doctorsQuery.refetch()}
                className="mt-4 px-4 py-2 bg-[#49BCE2] text-white text-sm font-semibold rounded-lg hover:bg-[#3ca4c5] transition"
              >
                Thử lại
              </button>
            </div>
          ) : null}

          {/* Table */}
          {!doctorsQuery.isLoading && !doctorsQuery.error ? (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Bác sĩ</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Chuyên khoa</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Kinh nghiệm</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Giá khám</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Đánh giá</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Trạng thái</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {doctors.map((doctor) => (
                      <tr key={doctor.id} className="hover:bg-gray-50 transition">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-[#49BCE2] flex items-center justify-center text-white font-semibold text-sm shrink-0 overflow-hidden">
                              {doctor.avatar ? (
                                <img src={doctor.avatar} alt="" className="w-full h-full object-cover" />
                              ) : (
                                doctor.name?.charAt(0)
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {doctor.title} {doctor.name}
                              </p>
                              <p className="text-xs text-gray-500 truncate">{doctor.position || 'Bác sĩ'}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">{doctor.specialtyName || 'Chưa phân khoa'}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{doctor.experience ?? 0} năm</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{formatCurrency(doctor.price)}</td>
                        <td className="px-6 py-4 text-sm">
                          <span className="font-semibold text-gray-900">{Number(doctor.rating || 0).toFixed(1)}</span>
                          <span className="text-gray-500"> ({doctor.reviewCount || 0})</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                            doctor.active
                              ? 'bg-green-50 text-green-700'
                              : 'bg-gray-100 text-gray-600'
                          }`}>
                            {doctor.active ? 'Hoạt động' : 'Tạm ẩn'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <Link
                            className="text-sm font-medium text-[#49BCE2] hover:text-[#3ca4c5] transition"
                            to={`/bac-si/${doctor.id}`}
                          >
                            Xem hồ sơ
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Empty State */}
              {doctors.length === 0 ? (
                <div className="p-12 text-center">
                  <h2 className="text-lg font-semibold text-gray-900">Chưa có bác sĩ phù hợp</h2>
                  <p className="mt-1 text-sm text-gray-500">Thử thay đổi từ khóa, chuyên khoa hoặc trạng thái lọc.</p>
                </div>
              ) : null}

              {/* Pagination */}
              <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
                <p className="text-sm text-gray-600">
                  Hiển thị {startItem}-{endItem} trong {totalItems} bác sĩ
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={page <= 1}
                    onClick={() => setPage((currentPage) => Math.max(1, currentPage - 1))}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    Trước
                  </button>
                  <button
                    type="button"
                    disabled={page >= totalPages}
                    onClick={() => setPage((currentPage) => Math.min(totalPages, currentPage + 1))}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    Sau
                  </button>
                </div>
              </div>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
