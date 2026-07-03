import { useEffect, useMemo, useState } from 'react';
import {
  AdminSpecialtiesTable,
  SpecialtyFormModal,
  useAdminSpecialties,
} from '../../features/admin/specialties/index.js';
import { Plus, Search, CheckCircle, XCircle } from 'lucide-react';
import '../../features/admin/specialties/components/admin-specialties.css';

const PAGE_LIMIT = 10;

function getListErrorMessage(error) {
  switch (error?.code) {
    case 'FORBIDDEN':
      return 'Bạn không có quyền truy cập danh sách chuyên khoa.';
    case 'LIST_SPECIALTIES_FAILED':
      return 'Không thể tải danh sách chuyên khoa.';
    default:
      return error?.message ?? 'Đã có lỗi xảy ra khi tải danh sách chuyên khoa.';
  }
}

export default function AdminSpecialtiesPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [feedback, setFeedback] = useState(null);
  const [modalState, setModalState] = useState({
    open: false,
    mode: 'create',
    specialty: null,
  });

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      const normalizedKeyword = searchInput.trim();
      setCurrentPage(1);
      setSearchKeyword((currentKeyword) => (
        currentKeyword === normalizedKeyword ? currentKeyword : normalizedKeyword
      ));
    }, 300);
    return () => window.clearTimeout(timeoutId);
  }, [searchInput]);

  useEffect(() => {
    if (!feedback) {
      return undefined;
    }
    const timeoutId = window.setTimeout(() => {
      setFeedback(null);
    }, 5000);
    return () => window.clearTimeout(timeoutId);
  }, [feedback]);

  const specialtiesQuery = useAdminSpecialties({
    page: currentPage,
    limit: PAGE_LIMIT,
    search: searchKeyword || undefined,
  });

  const specialties = useMemo(
    () => (Array.isArray(specialtiesQuery.data?.data) ? specialtiesQuery.data.data : []),
    [specialtiesQuery.data?.data],
  );

  const meta = specialtiesQuery.data?.meta ?? {
    page: currentPage,
    limit: PAGE_LIMIT,
    total: 0,
    totalPages: 1,
  };

  const handleCloseModal = () => {
    setModalState({ open: false, mode: 'create', specialty: null });
  };

  const handleOpenCreateModal = () => {
    setFeedback(null);
    setModalState({ open: true, mode: 'create', specialty: null });
  };

  const handleOpenEditModal = (specialty) => {
    setFeedback(null);
    setModalState({ open: true, mode: 'edit', specialty });
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quản lý chuyên khoa</h1>
          <p className="text-sm text-gray-500 mt-1">Thêm, chỉnh sửa và quản lý các chuyên khoa trong hệ thống</p>
        </div>
        <button
          type="button"
          onClick={handleOpenCreateModal}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#49BCE2] hover:bg-[#3ca4c5] text-white rounded-xl text-sm font-semibold transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Thêm chuyên khoa
        </button>
      </div>

      {/* Card */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        {/* Toolbar */}
        <div className="px-5 py-4 border-b border-gray-100">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              id="admin-specialties-search"
              type="search"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Tìm theo tên chuyên khoa..."
              className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#49BCE2] bg-white"
            />
          </div>
        </div>

        {/* Feedback Banner */}
        {feedback && (
          <div
            className={`mx-5 mt-4 flex items-center justify-between gap-3 px-4 py-3 rounded-xl border text-sm font-medium ${
              feedback.type === 'success'
                ? 'bg-green-50 border-green-200 text-green-800'
                : 'bg-red-50 border-red-200 text-red-800'
            }`}
          >
            <div className="flex items-center gap-2">
              {feedback.type === 'success'
                ? <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                : <XCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
              }
              {feedback.message}
            </div>
            <button
              type="button"
              aria-label="Ẩn thông báo"
              onClick={() => setFeedback(null)}
              className="text-current opacity-60 hover:opacity-100 transition-opacity flex-shrink-0 text-lg leading-none"
            >
              ×
            </button>
          </div>
        )}

        {/* Table - uses existing AdminSpecialtiesTable component */}
        <AdminSpecialtiesTable
          specialties={specialties}
          meta={meta}
          currentPage={currentPage}
          isLoading={specialtiesQuery.isLoading}
          isError={specialtiesQuery.isError}
          errorMessage={getListErrorMessage(specialtiesQuery.error)}
          onRetry={() => specialtiesQuery.refetch()}
          onCreate={handleOpenCreateModal}
          onEdit={handleOpenEditModal}
          onPreviousPage={() => {
            setCurrentPage((page) => Math.max(1, page - 1));
          }}
          onNextPage={() => {
            setCurrentPage((page) => Math.min(meta.totalPages, page + 1));
          }}
        />
      </div>

      {/* Modals */}
      <SpecialtyFormModal
        open={modalState.open}
        mode={modalState.mode}
        initialData={modalState.specialty}
        onClose={handleCloseModal}
        onSuccess={(response) => {
          setFeedback({
            type: 'success',
            message: response?.data?.message ?? (
              modalState.mode === 'edit'
                ? 'Cập nhật chuyên khoa thành công.'
                : 'Tạo chuyên khoa thành công.'
            ),
          });
          handleCloseModal();
        }}
      />
    </div>
  );
}
