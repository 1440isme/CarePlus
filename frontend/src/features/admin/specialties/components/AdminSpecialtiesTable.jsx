import { ADMIN_SPECIALTY_STATUS_LABELS } from '../types/admin-specialty.types.js';

function EditIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true">
      <path d="M4.25 14.75 5 11.5 12.8 3.7a1.6 1.6 0 1 1 2.25 2.25L7.25 13.75 4.25 14.75Z" />
      <path d="M11.75 4.75 14.25 7.25" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true">
      <path d="M4.5 5.5h11" />
      <path d="M7.25 5.5V4.25c0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1V5.5" />
      <path d="M6.25 5.5l.6 9.15c.04.61.55 1.1 1.16 1.1h3.98c.61 0 1.12-.48 1.16-1.1l.6-9.15" />
      <path d="M8.5 8.25v4.75M11.5 8.25v4.75" />
    </svg>
  );
}

function LoadingState() {
  return (
    <div className="admin-specialties-loading-body">
      <div className="admin-specialties-skeleton admin-specialties-skeleton-row" />
      <div className="admin-specialties-skeleton admin-specialties-skeleton-row" />
      <div className="admin-specialties-skeleton admin-specialties-skeleton-row" />
      <div className="admin-specialties-skeleton admin-specialties-skeleton-row" />
    </div>
  );
}

function EmptyState({ onCreate }) {
  return (
    <div className="admin-specialties-state-panel">
      <h3>Chưa có chuyên khoa nào</h3>
      <p>Thêm chuyên khoa mới để bắt đầu quản lý danh mục khám bệnh.</p>
      <button
        className="admin-specialties-state-button"
        type="button"
        onClick={onCreate}
      >
        Thêm chuyên khoa
      </button>
    </div>
  );
}

function ErrorState({ errorMessage, onRetry }) {
  return (
    <div className="admin-specialties-state-panel">
      <h3>Không thể tải danh sách chuyên khoa</h3>
      <p>{errorMessage}</p>
      <button
        className="admin-specialties-state-button"
        type="button"
        onClick={onRetry}
      >
        Thử lại
      </button>
    </div>
  );
}

export default function AdminSpecialtiesTable({
  specialties,
  meta,
  currentPage,
  isLoading,
  isError,
  errorMessage,
  onRetry,
  onCreate,
  onEdit,
  onDelete,
  onPreviousPage,
  onNextPage,
}) {
  if (isLoading) {
    return <LoadingState />;
  }

  if (isError) {
    return <ErrorState errorMessage={errorMessage} onRetry={onRetry} />;
  }

  if (specialties.length === 0) {
    return <EmptyState onCreate={onCreate} />;
  }

  return (
    <>
      <div className="admin-specialties-table-wrap">
        <table className="admin-specialties-table">
          <thead>
            <tr>
              <th>Tên chuyên khoa</th>
              <th>Mô tả</th>
              <th>Số bác sĩ</th>
              <th>Trạng thái</th>
              <th>Thao tác</th>
            </tr>
          </thead>

          <tbody>
            {specialties.map((specialty) => (
              <tr key={specialty.id}>
                <td className="admin-specialties-name-cell">
                  <p className="admin-specialties-name">{specialty.name}</p>
                  <p className="admin-specialties-slug">{specialty.slug}</p>
                </td>
                <td>
                  <p className="admin-specialties-description">
                    {specialty.description || 'Chưa có mô tả chuyên khoa.'}
                  </p>
                </td>
                <td className="admin-specialties-count-cell">{specialty.doctorCount ?? 0}</td>
                <td>
                  <span className={`admin-specialties-badge ${specialty.active ? 'status-active' : 'status-inactive'}`}>
                    {specialty.active
                      ? ADMIN_SPECIALTY_STATUS_LABELS.ACTIVE
                      : ADMIN_SPECIALTY_STATUS_LABELS.INACTIVE}
                  </span>
                </td>
                <td>
                  <div className="admin-specialties-action-group">
                    <button
                      className="admin-specialties-action-button"
                      type="button"
                      aria-label={`Chỉnh sửa ${specialty.name}`}
                      onClick={() => onEdit(specialty)}
                    >
                      <EditIcon />
                    </button>

                    <button
                      className="admin-specialties-action-button is-danger"
                      type="button"
                      aria-label={`Tắt ${specialty.name}`}
                      onClick={() => onDelete(specialty)}
                    >
                      <TrashIcon />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {meta.totalPages > 1 ? (
        <div className="admin-specialties-pagination">
          <p className="admin-specialties-pagination-copy">
            Trang {currentPage} / {meta.totalPages} · {meta.total} chuyên khoa
          </p>

          <div className="admin-specialties-pagination-actions">
            <button
              className="admin-specialties-pagination-button"
              type="button"
              onClick={onPreviousPage}
              disabled={currentPage <= 1}
            >
              Trang trước
            </button>

            <button
              className="admin-specialties-pagination-button"
              type="button"
              onClick={onNextPage}
              disabled={currentPage >= meta.totalPages}
            >
              Trang sau
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}
