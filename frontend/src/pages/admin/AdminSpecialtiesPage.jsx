import { useEffect, useState } from 'react';
import {
  AdminSpecialtiesTable,
  AdminSpecialtyConfirmDialog,
  SpecialtyFormModal,
  useAdminSpecialties,
  useDeleteSpecialty,
} from '../../features/admin/specialties/index.js';
import '../../features/admin/specialties/components/admin-specialties.css';

const PAGE_LIMIT = 10;

function PlusIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true">
      <path d="M10 4.25v11.5M4.25 10h11.5" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true">
      <circle cx="8.75" cy="8.75" r="4.75" />
      <path d="m12.5 12.5 3.5 3.5" />
    </svg>
  );
}

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

function getDeleteErrorMessage(error) {
  switch (error?.code) {
    case 'SPECIALTY_NOT_FOUND':
      return 'Không tìm thấy chuyên khoa.';
    case 'SPECIALTY_IN_USE':
      return 'Không thể tắt/xóa chuyên khoa đang được sử dụng.';
    case 'DELETE_SPECIALTY_FAILED':
      return 'Tắt chuyên khoa thất bại.';
    default:
      return error?.message ?? 'Đã có lỗi xảy ra trên hệ thống.';
  }
}

export default function AdminSpecialtiesPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [feedback, setFeedback] = useState(null);
  const [selectedSpecialty, setSelectedSpecialty] = useState(null);
  const [modalState, setModalState] = useState({
    open: false,
    mode: 'create',
    specialty: null,
  });
  const [confirmState, setConfirmState] = useState({
    open: false,
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

  const specialtiesQuery = useAdminSpecialties({
    page: currentPage,
    limit: PAGE_LIMIT,
    search: searchKeyword || undefined,
  });

  const deleteMutation = useDeleteSpecialty({
    onSuccess: (response) => {
      setFeedback({
        type: 'success',
        message: response?.data?.message ?? 'Tắt chuyên khoa thành công.',
      });
      setConfirmState({ open: false, specialty: null });
    },
  });

  const specialties = specialtiesQuery.data?.data ?? [];
  const meta = specialtiesQuery.data?.meta ?? {
    page: currentPage,
    limit: PAGE_LIMIT,
    total: 0,
    totalPages: 1,
  };

  const handleCloseModal = () => {
    setModalState({
      open: false,
      mode: 'create',
      specialty: null,
    });
  };

  return (
    <section className="admin-specialties-page">
      <div className="admin-specialties-page-header">
        <h2 className="admin-specialties-page-title">Quản lý chuyên khoa</h2>

        <button
          className="admin-specialties-create-button"
          type="button"
          onClick={() => {
            setFeedback(null);
            setModalState({
              open: true,
              mode: 'create',
              specialty: null,
            });
          }}
        >
          <PlusIcon />
          <span>Thêm chuyên khoa</span>
        </button>
      </div>

      <div className="admin-specialties-card">
        <div className="admin-specialties-toolbar">
          <label className="admin-specialties-search" htmlFor="admin-specialties-search">
            <SearchIcon />
            <input
              id="admin-specialties-search"
              type="search"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Tìm theo tên chuyên khoa..."
            />
          </label>
        </div>

        {feedback ? (
          <p className={`admin-specialties-feedback ${feedback.type === 'success' ? 'is-success' : 'is-error'}`}>
            {feedback.message}
          </p>
        ) : null}

        <AdminSpecialtiesTable
          specialties={specialties}
          meta={meta}
          currentPage={currentPage}
          isLoading={specialtiesQuery.isLoading}
          isError={specialtiesQuery.isError}
          errorMessage={getListErrorMessage(specialtiesQuery.error)}
          onRetry={() => specialtiesQuery.refetch()}
          onCreate={() => {
            setFeedback(null);
            setModalState({
              open: true,
              mode: 'create',
              specialty: null,
            });
          }}
          onEdit={(specialty) => {
            setSelectedSpecialty(specialty);
            setModalState({
              open: true,
              mode: 'edit',
              specialty,
            });
          }}
          onDelete={(specialty) => {
            setConfirmState({
              open: true,
              specialty,
            });
          }}
          onPreviousPage={() => {
            setCurrentPage((page) => Math.max(1, page - 1));
          }}
          onNextPage={() => {
            setCurrentPage((page) => Math.min(meta.totalPages, page + 1));
          }}
        />
      </div>

      <SpecialtyFormModal
        open={modalState.open}
        mode={modalState.mode}
        initialData={modalState.specialty ?? selectedSpecialty}
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

      <AdminSpecialtyConfirmDialog
        open={confirmState.open}
        specialty={confirmState.specialty}
        isPending={deleteMutation.isPending}
        errorMessage={getDeleteErrorMessage(deleteMutation.error)}
        onClose={() => {
          if (!deleteMutation.isPending) {
            deleteMutation.reset();
            setConfirmState({ open: false, specialty: null });
          }
        }}
        onConfirm={() => {
          if (confirmState.specialty?.id) {
            deleteMutation.mutate({ id: confirmState.specialty.id });
          }
        }}
      />
    </section>
  );
}
