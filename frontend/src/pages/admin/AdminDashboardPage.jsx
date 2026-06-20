import { useDoctorList } from '../../features/doctor/index.js';
import { useApprovalRequests } from '../../features/approval/hooks/useApprovalRequests.js';
import { useUsers } from '../../features/user-management/hooks/useUsers.js';
import LoadingBlock from '../../shared/components/feedback/LoadingBlock.jsx';
import StateBlock from '../../shared/components/feedback/StateBlock.jsx';

export default function AdminDashboardPage() {
  const doctorsQuery = useDoctorList({ page: 1, limit: 5, active: true });
  const approvalsQuery = useApprovalRequests({ page: 1, limit: 5, status: 'PENDING' });
  const usersQuery = useUsers({ page: 1, limit: 5 });

  if (doctorsQuery.isLoading || approvalsQuery.isLoading || usersQuery.isLoading) {
    return <LoadingBlock label="Đang tải dashboard admin..." />;
  }

  if (doctorsQuery.error || approvalsQuery.error || usersQuery.error) {
    return <StateBlock variant="error" title="Không thể tải dashboard admin" description="Một hoặc nhiều API đang trả lỗi." />;
  }

  return (
    <div className="content-grid">
      <section className="metric-grid">
        <article className="metric-card">
          <p>Bác sĩ đang hoạt động</p>
          <strong>{doctorsQuery.data?.meta?.total ?? 0}</strong>
        </article>
        <article className="metric-card">
          <p>Yêu cầu nghỉ chờ duyệt</p>
          <strong>{approvalsQuery.data?.meta?.total ?? 0}</strong>
        </article>
        <article className="metric-card">
          <p>Tổng người dùng</p>
          <strong>{usersQuery.data?.meta?.total ?? 0}</strong>
        </article>
      </section>
    </div>
  );
}
