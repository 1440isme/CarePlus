import { useUsers } from '../../features/user-management/hooks/useUsers.js';
import LoadingBlock from '../../shared/components/feedback/LoadingBlock.jsx';
import StateBlock from '../../shared/components/feedback/StateBlock.jsx';

export default function AdminUserManagementPage() {
  const usersQuery = useUsers({ page: 1, limit: 20 });

  if (usersQuery.isLoading) {
    return <LoadingBlock label="Đang tải người dùng..." />;
  }

  if (usersQuery.error) {
    return <StateBlock variant="error" title="Không thể tải danh sách người dùng" description={usersQuery.error.message} />;
  }

  return (
    <section className="surface-card">
      <h2>Quản lý người dùng</h2>
      <table className="data-table">
        <thead>
          <tr>
            <th>Họ tên</th>
            <th>Email</th>
            <th>Vai trò</th>
            <th>Trạng thái</th>
            <th>No-show</th>
          </tr>
        </thead>
        <tbody>
          {(usersQuery.data?.data || []).map((user) => (
            <tr key={user.id}>
              <td>{user.name}</td>
              <td>{user.email}</td>
              <td>{user.role}</td>
              <td><span className={`status-chip status-${String(user.status || '').toLowerCase()}`}>{user.status}</span></td>
              <td>{user.noShowCount}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
