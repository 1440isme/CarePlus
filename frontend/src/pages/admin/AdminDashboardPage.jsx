import { useDoctorList } from '../../features/doctor/index.js';
import { useApprovalRequests } from '../../features/approval/hooks/useApprovalRequests.js';
import { useUsers } from '../../features/user-management/hooks/useUsers.js';
import { useAppointments } from '../../features/appointment/hooks/useAppointments.js';
import LoadingBlock from '../../shared/components/feedback/LoadingBlock.jsx';
import StateBlock from '../../shared/components/feedback/StateBlock.jsx';
import {
  Calendar, AlertCircle, CheckCircle, X, Stethoscope, BookOpen,
  Users, TrendingUp, Clock, ArrowRight
} from 'lucide-react';
import { Link } from 'react-router-dom';

const BRAND = '#49BCE2';

// Custom bar chart (no recharts needed)
function BarChartSimple({ data }) {
  const max = Math.max(...data.map(d => d.count), 1);
  return (
    <div className="flex items-end gap-2 h-28 mt-2">
      {data.map((d) => {
        const pct = Math.round((d.count / max) * 100);
        return (
          <div key={d.date} className="flex-1 flex flex-col items-center gap-1">
            <span className="text-[10px] text-gray-400">{d.count}</span>
            <div
              className="w-full rounded-t-sm transition-all"
              style={{ height: `${Math.max(pct, 4)}%`, background: BRAND }}
            />
            <span className="text-[9px] text-gray-400 whitespace-nowrap">{d.date}</span>
          </div>
        );
      })}
    </div>
  );
}

export default function AdminDashboardPage() {
  const todayStr = new Date().toLocaleDateString('sv').slice(0, 10);
  const formattedDate = new Date().toLocaleDateString('vi-VN', { day: 'numeric', month: 'numeric', year: 'numeric' });

  const doctorsQuery = useDoctorList({ page: 1, limit: 5, active: true });
  const approvalsQuery = useApprovalRequests({ page: 1, limit: 5, status: 'PENDING' });
  const usersQuery = useUsers({ page: 1, limit: 5 });
  const todayApptsQuery = useAppointments({ date: todayStr, limit: 100 });

  const isLoading = doctorsQuery.isLoading || approvalsQuery.isLoading || usersQuery.isLoading;
  const hasError = doctorsQuery.error || approvalsQuery.error || usersQuery.error;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <LoadingBlock label="Đang tải dashboard admin..." />
      </div>
    );
  }

  if (hasError) {
    return (
      <div className="p-6">
        <StateBlock
          variant="error"
          title="Không thể tải dashboard admin"
          description="Một hoặc nhiều API đang trả lỗi. Vui lòng thử lại."
        />
      </div>
    );
  }

  const totalDoctors = doctorsQuery.data?.meta?.total ?? 0;
  const pendingApprovals = approvalsQuery.data?.meta?.total ?? 0;
  const totalUsers = usersQuery.data?.meta?.total ?? 0;

  const todayAppts = todayApptsQuery.data?.data || [];
  const totalToday = todayAppts.length;
  const completedToday = todayAppts.filter(a => a.status === 'COMPLETED').length;
  const noShowToday = todayAppts.filter(a => a.status === 'NO_SHOW').length;

  const kpis = [
    {
      label: 'Lịch hôm nay',
      value: totalToday,
      icon: Calendar,
      iconBg: 'bg-cyan-50',
      iconColor: 'text-cyan-600',
      delta: todayApptsQuery.isLoading ? '...' : null,
      to: '/admin/appointments',
    },
    {
      label: 'Chờ duyệt',
      value: pendingApprovals,
      icon: AlertCircle,
      iconBg: 'bg-amber-50',
      iconColor: 'text-amber-600',
      deltaText: pendingApprovals > 0 ? 'cần xử lý' : null,
      deltaColor: 'text-amber-600',
      to: '/admin/approvals',
    },
    {
      label: 'Hoàn thành',
      value: completedToday,
      icon: CheckCircle,
      iconBg: 'bg-green-50',
      iconColor: 'text-green-600',
      to: null,
    },
    {
      label: 'No-show',
      value: noShowToday,
      icon: X,
      iconBg: 'bg-red-50',
      iconColor: 'text-red-500',
      to: null,
    },
    {
      label: 'Số bác sĩ',
      value: totalDoctors,
      icon: Stethoscope,
      iconBg: 'bg-blue-50',
      iconColor: 'text-blue-600',
      to: '/admin/doctors',
    },
    {
      label: 'Tổng người dùng',
      value: totalUsers,
      icon: Users,
      iconBg: 'bg-purple-50',
      iconColor: 'text-purple-600',
      to: '/admin/users',
    },
  ];

  // Chart data: mock by day-of-week for demo (replace with real API if available)
  const chartData = [
    { date: 'T2', count: 8 }, { date: 'T3', count: 12 }, { date: 'T4', count: 6 },
    { date: 'T5', count: 15 }, { date: 'T6', count: 9 }, { date: 'T7', count: 11 }, { date: 'CN', count: 4 },
  ];

  // Pending approvals list
  const pendingList = approvalsQuery.data?.data || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Tổng quan hệ thống</h1>
        <p className="text-sm text-gray-500 mt-1">Ngày {formattedDate}</p>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {kpis.map((k) => {
          const Icon = k.icon;
          const card = (
            <div className="bg-white border border-gray-100 rounded-xl p-4 hover:shadow-sm transition-shadow">
              <div className={`w-9 h-9 ${k.iconBg} rounded-lg flex items-center justify-center mb-3`}>
                <Icon className={`w-5 h-5 ${k.iconColor}`} />
              </div>
              <div className="text-2xl font-bold text-gray-900">{k.value}</div>
              <div className="text-xs text-gray-500 mt-0.5">{k.label}</div>
              {k.deltaText && (
                <div className={`text-xs mt-1 font-medium ${k.deltaColor || 'text-green-600'}`}>{k.deltaText}</div>
              )}
            </div>
          );
          return k.to ? (
            <Link key={k.label} to={k.to} className="block group">
              {card}
            </Link>
          ) : (
            <div key={k.label}>{card}</div>
          );
        })}
      </div>

      {/* Charts + Pending row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Bar chart */}
        <div className="lg:col-span-2 bg-white border border-gray-100 rounded-xl p-5">
          <div className="flex items-center justify-between mb-1">
            <h3 className="font-semibold text-gray-900">Lịch hẹn theo ngày (tuần này)</h3>
            <TrendingUp className="w-4 h-4 text-gray-300" />
          </div>
          <p className="text-xs text-gray-400 mb-3">Số lượng lịch khám mỗi ngày</p>
          <BarChartSimple data={chartData} />
        </div>

        {/* Pending Approvals */}
        <div className="bg-white border border-gray-100 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Chờ duyệt</h3>
            <span className="text-xs font-bold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
              {pendingApprovals}
            </span>
          </div>
          {pendingList.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <CheckCircle className="w-8 h-8 text-green-300 mb-2" />
              <p className="text-xs text-gray-400">Không có yêu cầu nào cần duyệt</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {pendingList.slice(0, 4).map((r) => (
                <div key={r.id} className="p-3 bg-amber-50 border border-amber-100 rounded-xl">
                  <div className="text-xs text-amber-600 font-medium mb-1">
                    {r.type === 'SCHEDULE_EXCEPTION' ? '📅 Nghỉ lịch' : '❌ Hủy lịch'}
                  </div>
                  <div className="text-sm font-medium text-gray-900">{r.doctorName}</div>
                  <div className="text-xs text-gray-500 truncate mt-0.5">{r.reason}</div>
                </div>
              ))}
              {pendingList.length > 4 && (
                <Link
                  to="/admin/approvals"
                  className="flex items-center justify-center gap-1 text-xs text-[#49BCE2] hover:text-[#3ca4c5] font-semibold py-1 transition-colors"
                >
                  Xem tất cả <ArrowRight className="w-3 h-3" />
                </Link>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Specialty breakdown */}
      <div className="bg-white border border-gray-100 rounded-xl p-5">
        <h3 className="font-semibold text-gray-900 mb-4">Lịch hẹn theo chuyên khoa (demo)</h3>
        {(() => {
          const data = [
            { name: 'Tim mạch', count: 25, color: '#49BCE2' },
            { name: 'Nhi khoa', count: 18, color: '#FFC10E' },
            { name: 'Cơ Xương Khớp', count: 12, color: '#A78BFA' },
            { name: 'Da liễu', count: 10, color: '#34D399' },
            { name: 'Tiêu hóa', count: 8, color: '#F87171' },
          ];
          const max = Math.max(...data.map(d => d.count));
          return (
            <div className="space-y-3">
              {data.map(d => (
                <div key={d.name} className="flex items-center gap-3">
                  <div className="w-28 text-sm text-gray-600 flex-shrink-0">{d.name}</div>
                  <div className="flex-1 h-5 bg-gray-100 rounded-md overflow-hidden">
                    <div
                      className="h-full rounded-md transition-all duration-500"
                      style={{ width: `${(d.count / max) * 100}%`, background: d.color }}
                    />
                  </div>
                  <div className="w-8 text-sm font-bold text-gray-700 text-right">{d.count}</div>
                </div>
              ))}
            </div>
          );
        })()}
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Quản lý bác sĩ', to: '/admin/doctors', icon: Stethoscope, color: 'text-blue-600 bg-blue-50' },
          { label: 'Quản lý lịch hẹn', to: '/admin/appointments', icon: Calendar, color: 'text-cyan-600 bg-cyan-50' },
          { label: 'Người dùng', to: '/admin/users', icon: Users, color: 'text-purple-600 bg-purple-50' },
          { label: 'Duyệt yêu cầu', to: '/admin/approvals', icon: AlertCircle, color: 'text-amber-600 bg-amber-50' },
        ].map(q => {
          const Icon = q.icon;
          return (
            <Link
              key={q.label}
              to={q.to}
              className="bg-white border border-gray-100 rounded-xl p-4 hover:shadow-sm transition-all group flex items-center gap-3"
            >
              <div className={`w-9 h-9 ${q.color.split(' ')[1]} rounded-lg flex items-center justify-center flex-shrink-0`}>
                <Icon className={`w-5 h-5 ${q.color.split(' ')[0]}`} />
              </div>
              <span className="text-sm font-semibold text-gray-700 group-hover:text-gray-900 transition-colors">{q.label}</span>
              <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 ml-auto transition-colors" />
            </Link>
          );
        })}
      </div>
    </div>
  );
}
