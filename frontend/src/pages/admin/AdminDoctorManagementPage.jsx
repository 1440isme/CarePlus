import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Plus, X, Edit2, Save, Loader2 } from 'lucide-react';
import { useDoctorDetail, useDoctorList, useUpdateDoctorByAdmin, useUpdateDoctorPrice } from '../../features/doctor/index.js';
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

function DetailRow({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-gray-100 py-3 last:border-b-0">
      <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">{label}</span>
      <span className="max-w-[58%] text-right text-sm font-medium text-gray-800">{value || '--'}</span>
    </div>
  );
}

function Field({ label, error, children }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold text-gray-600">{label}</span>
      {children}
      {error ? <span className="mt-1 block text-xs text-red-500">{error}</span> : null}
    </label>
  );
}

function buildDoctorFormValues(doctor) {
  return {
    name: doctor?.user?.name || doctor?.name || '',
    title: doctor?.title || '',
    experience: doctor?.experience ?? 0,
    price: doctor?.price ?? 0,
    position: doctor?.position || '',
    description: doctor?.description || '',
    active: doctor?.active !== false,
  };
}

function AdminDoctorDetailDrawer({ doctor, onClose }) {
  const [isEditing, setIsEditing] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [formValues, setFormValues] = useState(() => buildDoctorFormValues(doctor));
  const [errors, setErrors] = useState({});
  const detailQuery = useDoctorDetail(doctor?.id);
  const updateDoctorMutation = useUpdateDoctorByAdmin();
  const updatePriceMutation = useUpdateDoctorPrice();
  const detailDoctor = detailQuery.data?.data || doctor;

  useEffect(() => {
    setIsEditing(false);
    setFeedback('');
    setErrors({});
    setFormValues(buildDoctorFormValues(detailDoctor));
  }, [detailDoctor?.id]);

  useEffect(() => {
    if (!isEditing) {
      setFormValues(buildDoctorFormValues(detailDoctor));
    }
  }, [detailDoctor, isEditing]);

  if (!doctor) {
    return null;
  }

  const inputClass = 'w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 outline-none transition focus:border-[#49BCE2] focus:ring-2 focus:ring-[#49BCE2]/20';
  const disabledInputClass = 'w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-400';
  const avatarUrl = detailDoctor?.user?.avatarUrl || detailDoctor?.avatar;
  const doctorName = detailDoctor?.user?.name || detailDoctor?.name || 'Bác sĩ';

  const validateForm = () => {
    const nextErrors = {};
    if (!formValues.name.trim()) nextErrors.name = 'Vui lòng nhập họ tên.';
    if (!formValues.title.trim()) nextErrors.title = 'Vui lòng nhập học hàm / học vị.';
    if (!formValues.position.trim()) nextErrors.position = 'Vui lòng nhập chức vụ.';
    if (!formValues.description.trim()) nextErrors.description = 'Vui lòng nhập giới thiệu.';
    if (Number(formValues.experience) < 0) nextErrors.experience = 'Kinh nghiệm phải từ 0 trở lên.';
    if (Number(formValues.price) < 0) nextErrors.price = 'Giá khám phải từ 0 trở lên.';
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    setFeedback('');
    setErrors((current) => ({ ...current, [name]: undefined }));
    setFormValues((current) => ({
      ...current,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validateForm()) return;

    const response = await updateDoctorMutation.mutateAsync({
      doctorId: detailDoctor.id,
      name: formValues.name.trim(),
      title: formValues.title.trim(),
      experience: Number(formValues.experience),
      position: formValues.position.trim(),
      description: formValues.description.trim(),
      active: Boolean(formValues.active),
    });

    if (Number(formValues.price) !== Number(detailDoctor.price ?? 0)) {
      await updatePriceMutation.mutateAsync({
        doctorId: detailDoctor.id,
        price: Number(formValues.price),
      });
    }

    setFeedback(response?.data?.message || response?.message || 'Cập nhật hồ sơ bác sĩ thành công.');
    setIsEditing(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/35" role="presentation" onClick={onClose}>
      <aside
        className="h-full w-full max-w-[560px] overflow-y-auto bg-white shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-label="Chi tiết bác sĩ"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-100 bg-white px-6 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Hồ sơ bác sĩ</p>
            <h2 className="text-lg font-bold text-gray-900">Chi tiết bác sĩ</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
            aria-label="Đóng"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-5 px-6 py-5">
          <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
            <div className="h-1.5 bg-[#49BCE2]" />
            <div className="flex items-center gap-4 p-5">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#49BCE2] text-lg font-bold text-white">
                {avatarUrl ? <img src={avatarUrl} alt="" className="h-full w-full object-cover" /> : doctorName.charAt(0)}
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="truncate text-base font-bold text-gray-900">
                  {detailDoctor?.title ? `${detailDoctor.title} ` : ''}{doctorName}
                </h3>
                <p className="mt-1 text-sm font-medium text-[#1587a8]">{detailDoctor?.specialtyName || 'Chưa phân khoa'}</p>
                <span className={`mt-2 inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${detailDoctor?.active !== false ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                  {detailDoctor?.active !== false ? 'Hoạt động' : 'Tạm ẩn'}
                </span>
              </div>
              {!isEditing ? (
                <button
                  type="button"
                  onClick={() => {
                    setFeedback('');
                    setErrors({});
                    setIsEditing(true);
                  }}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-600 transition hover:bg-gray-50"
                >
                  <Edit2 className="h-3.5 w-3.5" />
                  Chỉnh sửa
                </button>
              ) : null}
            </div>
          </section>

          {detailQuery.isLoading ? (
            <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 text-sm text-gray-500">Đang tải chi tiết...</div>
          ) : null}

          {feedback ? (
            <div className="rounded-xl border border-green-100 bg-green-50 px-4 py-3 text-sm font-medium text-green-700">{feedback}</div>
          ) : null}

          {!isEditing ? (
            <>
              <section className="rounded-2xl border border-gray-200 bg-white p-5">
                <p className="mb-3 text-xs font-bold uppercase tracking-wide text-gray-400">Thông tin chuyên môn</p>
                <DetailRow label="Họ tên" value={`${detailDoctor?.title || ''} ${doctorName}`.trim()} />
                <DetailRow label="Chuyên khoa" value={detailDoctor?.specialty?.name || detailDoctor?.specialtyName} />
                <DetailRow label="Chức vụ" value={detailDoctor?.position} />
                <DetailRow label="Kinh nghiệm" value={`${detailDoctor?.experience ?? 0} năm`} />
                <DetailRow label="Giá khám" value={formatCurrency(detailDoctor?.price)} />
                <DetailRow label="Đánh giá" value={`${Number(detailDoctor?.rating || 0).toFixed(1)} (${detailDoctor?.reviewCount || 0} lượt)`} />
              </section>

              <section className="rounded-2xl border border-gray-200 bg-white p-5">
                <p className="mb-3 text-xs font-bold uppercase tracking-wide text-gray-400">Thông tin tài khoản</p>
                <DetailRow label="Email" value={detailDoctor?.user?.email} />
                <DetailRow label="Số điện thoại" value={detailDoctor?.user?.phone} />
                <DetailRow label="Ngày tạo" value={detailDoctor?.createdAt ? new Date(detailDoctor.createdAt).toLocaleDateString('vi-VN') : '--'} />
                <DetailRow label="Cập nhật" value={detailDoctor?.updatedAt ? new Date(detailDoctor.updatedAt).toLocaleDateString('vi-VN') : '--'} />
              </section>

              <section className="rounded-2xl border border-gray-200 bg-white p-5">
                <p className="mb-3 text-xs font-bold uppercase tracking-wide text-gray-400">Giới thiệu</p>
                <p className="whitespace-pre-line text-sm leading-6 text-gray-600">{detailDoctor?.description || 'Chưa cập nhật giới thiệu.'}</p>
              </section>
            </>
          ) : (
            <form className="space-y-4 rounded-2xl border border-gray-200 bg-white p-5" onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Họ và tên" error={errors.name}>
                  <input name="name" value={formValues.name} onChange={handleChange} className={inputClass} />
                </Field>
                <Field label="Học hàm / học vị" error={errors.title}>
                  <input name="title" value={formValues.title} onChange={handleChange} className={inputClass} />
                </Field>
                <Field label="Số năm kinh nghiệm" error={errors.experience}>
                  <input name="experience" type="number" value={formValues.experience} onChange={handleChange} className={inputClass} />
                </Field>
                <Field label="Giá khám" error={errors.price}>
                  <input name="price" type="number" value={formValues.price} onChange={handleChange} className={inputClass} />
                </Field>
              </div>

              <Field label="Chức vụ" error={errors.position}>
                <input name="position" value={formValues.position} onChange={handleChange} className={inputClass} />
              </Field>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Email">
                  <input value={detailDoctor?.user?.email || ''} disabled className={disabledInputClass} />
                </Field>
                <Field label="Chuyên khoa">
                  <input value={detailDoctor?.specialtyName || ''} disabled className={disabledInputClass} />
                </Field>
              </div>

              <Field label="Giới thiệu" error={errors.description}>
                <textarea name="description" rows={5} value={formValues.description} onChange={handleChange} className={inputClass} />
              </Field>

              <label className="flex items-center justify-between rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
                <span>
                  <span className="block text-sm font-semibold text-gray-800">Trạng thái hoạt động</span>
                  <span className="text-xs text-gray-500">Tắt để tạm ẩn bác sĩ khỏi danh sách đặt lịch.</span>
                </span>
                <input name="active" type="checkbox" checked={formValues.active} onChange={handleChange} className="h-5 w-5 accent-[#49BCE2]" />
              </label>

              {updateDoctorMutation.error || updatePriceMutation.error ? (
                <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
                  {updateDoctorMutation.error?.message || updatePriceMutation.error?.message || 'Không thể cập nhật hồ sơ bác sĩ.'}
                </p>
              ) : null}

              <div className="flex items-center justify-end gap-3 border-t border-gray-100 pt-4">
                <button
                  type="button"
                  disabled={updateDoctorMutation.isPending || updatePriceMutation.isPending}
                  onClick={() => {
                    setFormValues(buildDoctorFormValues(detailDoctor));
                    setErrors({});
                    setFeedback('');
                    updateDoctorMutation.reset();
                    updatePriceMutation.reset();
                    setIsEditing(false);
                  }}
                  className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-600 transition hover:bg-gray-50 disabled:opacity-60"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={updateDoctorMutation.isPending || updatePriceMutation.isPending}
                  className="inline-flex items-center gap-2 rounded-lg bg-[#49BCE2] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#3ca4c5] disabled:opacity-60"
                >
                  {updateDoctorMutation.isPending || updatePriceMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  {updateDoctorMutation.isPending || updatePriceMutation.isPending ? 'Đang lưu...' : 'Lưu thay đổi'}
                </button>
              </div>
            </form>
          )}
        </div>
      </aside>
    </div>
  );
}

export default function AdminDoctorManagementPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [active, setActive] = useState('');
  const [specialtyId, setSpecialtyId] = useState('');
  const [selectedDoctor, setSelectedDoctor] = useState(null);

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
                          <button
                            type="button"
                            className="text-sm font-medium text-[#49BCE2] hover:text-[#3ca4c5] transition"
                            onClick={() => setSelectedDoctor(doctor)}
                          >
                            Xem hồ sơ
                          </button>
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
      <AdminDoctorDetailDrawer
        doctor={selectedDoctor}
        onClose={() => setSelectedDoctor(null)}
      />
    </div>
  );
}
