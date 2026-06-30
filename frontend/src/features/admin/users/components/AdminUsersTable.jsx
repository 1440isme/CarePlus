import {
  ADMIN_USER_ROLE_LABELS,
  ADMIN_USER_STATUS_LABELS,
} from '../types/admin-user.types.js';
import './admin-users.css';

function EyeIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true">
      <path d="M1.9 10s2.95-4.1 8.1-4.1 8.1 4.1 8.1 4.1-2.95 4.1-8.1 4.1S1.9 10 1.9 10Z" />
      <circle cx="10" cy="10" r="1.85" />
    </svg>
  );
}

function EmptyIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true">
      <path d="M4 5.25h12A1.75 1.75 0 0 1 17.75 7v7A1.75 1.75 0 0 1 16 15.75H4A1.75 1.75 0 0 1 2.25 14V7A1.75 1.75 0 0 1 4 5.25Zm0 0L10 10l6-4.75" />
    </svg>
  );
}

function formatDate(value) {
  if (!value) {
    return '--';
  }

  if (typeof value === 'string' && /^\d{2}\/\d{2}\/\d{4}$/.test(value)) {
    return value;
  }

  const parsedDate = new Date(value);
  if (Number.isNaN(parsedDate.getTime())) {
    return value;
  }

  return parsedDate.toLocaleDateString('vi-VN');
}

function formatCreatedDate(value) {
  if (!value) {
    return '--';
  }

  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value;
  }

  const parsedDate = new Date(value);
  if (Number.isNaN(parsedDate.getTime())) {
    return value;
  }

  const year = parsedDate.getFullYear();
  const month = String(parsedDate.getMonth() + 1).padStart(2, '0');
  const day = String(parsedDate.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function getRoleBadgeClass(role) {
  return `admin-users-badge role-${String(role).toLowerCase()}`;
}

function getStatusBadgeClass(status) {
  return `admin-users-badge status-${String(status).toLowerCase()}`;
}

export default function AdminUsersTable({
  users,
  meta,
  currentPage,
  isLoading,
  isError,
  errorMessage,
  onRetry,
  onViewDetail,
  onPreviousPage,
  onNextPage,
}) {
  if (isLoading) {
    return (
      <div className="admin-users-loading-body">
        <div className="admin-users-skeleton admin-users-skeleton-filter" />
        <div className="admin-users-skeleton admin-users-skeleton-row" />
        <div className="admin-users-skeleton admin-users-skeleton-row" />
        <div className="admin-users-skeleton admin-users-skeleton-row" />
        <div className="admin-users-skeleton admin-users-skeleton-row" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="admin-users-state-panel">
        <h3>Không thể tải danh sách người dùng</h3>
        <p>{errorMessage}</p>
        <button className="admin-users-state-button" type="button" onClick={onRetry}>
          Thử lại
        </button>
      </div>
    );
  }

  if (!users.length) {
    return (
      <div className="admin-users-empty-state">
        <span aria-hidden="true" className="admin-users-empty-state-icon">
          <EmptyIcon />
        </span>
        <h3>Không có người dùng phù hợp</h3>
        <p>Hãy thử thay đổi từ khóa tìm kiếm hoặc bộ lọc để xem thêm kết quả.</p>
      </div>
    );
  }

  return (
    <>
      <div className="admin-users-table-wrap">
        <table className="admin-users-table">
          <thead>
            <tr>
              <th>Họ tên</th>
              <th>Ngày sinh</th>
              <th>Vai trò</th>
              <th>Trạng thái</th>
              <th>Ngày tạo</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => {
              return (
                <tr key={user.id}>
                  <td className="admin-users-user-cell">
                    <p className="admin-users-user-name">{user.name}</p>
                    <p className="admin-users-user-email">{user.email}</p>
                  </td>
                  <td>{formatDate(user.dateOfBirth)}</td>
                  <td>
                    <span className={getRoleBadgeClass(user.role)}>
                      {ADMIN_USER_ROLE_LABELS[user.role] ?? user.role}
                    </span>
                  </td>
                  <td>
                    <span className={getStatusBadgeClass(user.status)}>
                      {ADMIN_USER_STATUS_LABELS[user.status] ?? user.status}
                    </span>
                  </td>
                  <td>{formatCreatedDate(user.createdAt)}</td>
                  <td>
                    <button
                      className="admin-users-table-detail-button"
                      type="button"
                      onClick={() => onViewDetail(user)}
                    >
                      <EyeIcon />
                      <span>Chi tiết</span>
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {meta.totalPages > 1 ? (
        <div className="admin-users-pagination">
          <p className="admin-users-pagination-copy">
            Trang {meta.page} / {meta.totalPages} · Tổng {meta.total} người dùng
          </p>

          <div className="admin-users-pagination-actions">
            <button
              className="admin-users-pagination-button"
              type="button"
              onClick={onPreviousPage}
              disabled={currentPage <= 1}
            >
              Trang trước
            </button>
            <button
              className="admin-users-pagination-button"
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
