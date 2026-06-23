import { useUsers } from '../../features/user-management/hooks/useUsers.js';
import { Loader2 } from 'lucide-react';
import StateBlock from '../../shared/components/feedback/StateBlock.jsx';

export default function AdminUserManagementPage() {
  const usersQuery = useUsers({ page: 1, limit: 20 });

  if (usersQuery.isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="text-center space-y-3">
          <Loader2 className="w-8 h-8 mx-auto text-[#49BCE2] animate-spin" />
          <p className="text-sm text-gray-600">Đang tải người dùng...</p>
        </div>
      </div>
    );
  }

  if (usersQuery.error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <StateBlock variant="error" title="Không thể tải danh sách người dùng" description={usersQuery.error.message} />
      </div>
    );
  }

  const users = usersQuery.data?.data || [];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-5">
        {/* Header */}
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Quản trị hệ thống</p>
          <h1 className="text-2xl font-bold text-gray-900">Quản lý người dùng</h1>
        </div>

        {/* Table Card */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Họ tên</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Vai trò</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Trạng thái</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">No-show</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{user.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{user.email}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{user.role}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        String(user.status || '').toLowerCase() === 'active'
                          ? 'bg-green-50 text-green-700'
                          : String(user.status || '').toLowerCase() === 'inactive'
                          ? 'bg-gray-100 text-gray-600'
                          : 'bg-yellow-50 text-yellow-700'
                      }`}>
                        {user.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{user.noShowCount || 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {users.length === 0 && (
            <div className="px-6 py-12 text-center">
              <p className="text-sm text-gray-500">Chưa có người dùng nào trong hệ thống.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
