import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useMe } from '../../features/user/hooks/useMe.js';
import { useMyAppointments } from '../../features/appointment/hooks/useAppointments.js';
import { usePatientProfiles } from '../../features/patient-profile/index.js';
import LoadingBlock from '../../shared/components/feedback/LoadingBlock.jsx';
import StateBlock from '../../shared/components/feedback/StateBlock.jsx';
import { Calendar, Stethoscope, Users, ChevronRight, Clock, X } from 'lucide-react';

export default function PatientDashboard() {
  const accessToken = useSelector((state) => state.auth.accessToken);
  const [selectedAppointmentId, setSelectedAppointmentId] = useState(null);

  // Queries
  const meQuery = useMe({ enabled: Boolean(accessToken) });
  const appointmentsQuery = useMyAppointments({ enabled: Boolean(accessToken) });
  const patientProfilesQuery = usePatientProfiles(
    { page: 1, limit: 100 },
    { enabled: Boolean(accessToken) }
  );

  const user = meQuery.data?.data?.user || meQuery.data?.data;
  const appointmentsList = appointmentsQuery.data?.data || [];
  const relativeProfiles = patientProfilesQuery.data?.data || [];

  const selectedAppointment = appointmentsList.find(a => a.id === selectedAppointmentId);

  const getStatusConfig = (status) => {
    switch (status) {
      case 'CONFIRMED':
        return { label: 'Đã xác nhận', bg: 'bg-[#EBF7FD] text-[#49BCE2] border-[#49BCE2]/20' };
      case 'CHECKED_IN':
        return { label: 'Đã check-in', bg: 'bg-[#F0FDF4] text-[#16A34A] border-[#16A34A]/20' };
      case 'COMPLETED':
        return { label: 'Hoàn thành', bg: 'bg-[#F0FDF4] text-[#16A34A] border-[#16A34A]/20' };
      case 'NO_SHOW':
        return { label: 'Không đến', bg: 'bg-red-50 text-red-600 border-red-200' };
      case 'CANCELLED':
        return { label: 'Đã hủy', bg: 'bg-gray-100 text-gray-500 border-gray-200' };
      default:
        return { label: status, bg: 'bg-gray-50 text-gray-700 border-gray-200' };
    }
  };

  const patientName = user?.name || 'Bệnh nhân';

  // Lọc danh sách Lịch hẹn sắp tới (Chỉ trạng thái CONFIRMED hoặc CHECKED_IN và ngày khám >= hôm nay)
  const upcomingAppointments = useMemo(() => {
    const todayStr = new Date().toLocaleDateString('sv').slice(0, 10);
    return appointmentsList
      .filter((appt) => {
        const isUpcomingStatus = appt.status === 'CONFIRMED' || appt.status === 'CHECKED_IN';
        if (!isUpcomingStatus) return false;
        if (!appt.appointmentDate) return false;
        return appt.appointmentDate >= todayStr;
      })
      .sort((a, b) => {
        const dateA = a.appointmentDate + ' ' + (a.startTime || '00:00');
        const dateB = b.appointmentDate + ' ' + (b.startTime || '00:00');
        return dateA.localeCompare(dateB);
      })
      .slice(0, 4); // Lấy tối đa 4 lịch hẹn sắp tới
  }, [appointmentsList]);

  // Số lượng Stats Cards
  const upcomingCount = useMemo(() => {
    const todayStr = new Date().toLocaleDateString('sv').slice(0, 10);
    return appointmentsList.filter(
      (appt) => (appt.status === 'CONFIRMED' || appt.status === 'CHECKED_IN') && appt.appointmentDate && appt.appointmentDate >= todayStr
    ).length;
  }, [appointmentsList]);

  const completedCount = useMemo(() => {
    return appointmentsList.filter((appt) => appt.status === 'COMPLETED').length;
  }, [appointmentsList]);

  const relativesCount = useMemo(() => {
    return relativeProfiles.filter((p) => p.isActive).length;
  }, [relativeProfiles]);

  // Sinh danh sách dữ liệu lượt khám theo tháng (T1 -> T6 của năm hiện tại)
  const monthlyData = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const months = [0, 1, 2, 3, 4, 5]; // T1 -> T6

    const counts = months.map(m => {
      return appointmentsList.filter(appt => {
        if (!appt.appointmentDate) return false;
        const [year, month] = appt.appointmentDate.slice(0, 10).split('-').map(Number);
        const isValid = appt.status !== 'CANCELLED';
        return isValid && (month - 1) === m && year === currentYear;
      }).length;
    });

    const maxCount = Math.max(...counts, 1);

    return months.map((m, index) => {
      let displayCount = counts[index];
      let displayHeight = (displayCount / maxCount) * 100;

      // Fallback về mock data của Figma gốc nếu DB trống
      if (appointmentsList.length === 0) {
        const mockCounts = [0, 1, 0, 2, 1, 2];
        const mockMax = 2;
        displayCount = mockCounts[index];
        displayHeight = (mockCounts[index] / mockMax) * 100;
      }

      return {
        label: `T${m + 1}`,
        count: displayCount,
        heightPercent: Math.max(displayHeight, 5), // Tối thiểu 5% để cột không bị biến mất hoàn toàn
      };
    });
  }, [appointmentsList]);

  // Sinh danh sách dữ liệu lượt khám theo chuyên khoa
  const specialtyData = useMemo(() => {
    const validAppts = appointmentsList.filter(appt => appt.status !== 'CANCELLED');

    // Fallback về mock data của Figma gốc nếu DB trống
    if (validAppts.length === 0) {
      return [
        { name: 'Nội tổng quát', count: 3, percentage: 50, color: '#49BCE2' },
        { name: 'Tim mạch', count: 1, percentage: 17, color: '#FFC10E' },
        { name: 'Da liễu', count: 1, percentage: 17, color: '#A78BFA' },
        { name: 'Nhi khoa', count: 1, percentage: 17, color: '#34D399' }
      ];
    }

    const map = {};
    validAppts.forEach(appt => {
      const specName = appt.specialty?.name || 'Khác';
      map[specName] = (map[specName] || 0) + 1;
    });

    const total = validAppts.length;
    const colors = ['#49BCE2', '#FFC10E', '#A78BFA', '#34D399', '#EC4899'];

    return Object.keys(map).map((name, index) => {
      const count = map[name];
      const percentage = Math.round((count / total) * 100);
      return {
        name,
        count,
        percentage,
        color: colors[index % colors.length]
      };
    }).sort((a, b) => b.count - a.count).slice(0, 4); // Lấy top 4 chuyên khoa
  }, [appointmentsList]);

  if (!accessToken) {
    return (
      <StateBlock
        variant="warning"
        title="Yêu cầu đăng nhập"
        description="Vui lòng đăng nhập tài khoản bệnh nhân để xem trang tổng quan sức khỏe của bạn."
      />
    );
  }

  const isLoading = meQuery.isLoading || appointmentsQuery.isLoading || patientProfilesQuery.isLoading;
  const isError = meQuery.error || appointmentsQuery.error || patientProfilesQuery.error;

  const stats = [
    { label: 'Lịch hẹn sắp tới', value: upcomingCount, icon: <Calendar className="w-[18px] h-[18px] text-[#49BCE2]" />, bg: 'bg-[#EBF7FD]' },
    { label: 'Đã hoàn thành', value: completedCount, icon: <Stethoscope className="w-[18px] h-[18px] text-[#16A34A]" />, bg: 'bg-[#F0FDF4]' },
    { label: 'Hồ sơ người thân', value: relativesCount, icon: <Users className="w-[18px] h-[18px] text-[#7C3AED]" />, bg: 'bg-[#F3E8FF]' },
  ];

  return (
    <div className="font-sans">
      <div className="mb-5">
        <h1 className="text-xl md:text-2xl font-bold text-gray-800">Xin chào, {patientName}!</h1>
        <p className="text-xs md:text-sm text-gray-500 mt-1">Quản lý lịch khám và thông tin sức khỏe của bạn</p>
      </div>

      {isLoading ? (
        <LoadingBlock label="Đang tải thông tin tổng quan..." />
      ) : isError ? (
        <StateBlock
          variant="error"
          title="Không thể tải thông tin tổng quan"
          description={
            meQuery.error?.message ||
            appointmentsQuery.error?.message ||
            patientProfilesQuery.error?.message
          }
        />
      ) : (
        <>
          {/* Stats grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-5">
            {stats.map(s => (
              <div key={s.label} className="bg-white border border-gray-200 rounded-lg p-3.5 md:p-4 flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow">
                <div className={`w-10 h-10 ${s.bg} rounded-lg flex items-center justify-center shrink-0`}>
                  {s.icon}
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-800">{s.value}</div>
                  <div className="text-xs text-gray-500">{s.label}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Upcoming appointments */}
          <div className="bg-white border border-gray-200 rounded-lg p-4 md:p-5 mb-5 shadow-sm">
            <h2 className="text-sm font-bold text-gray-800 mb-3.5">Lịch hẹn sắp tới</h2>
            {upcomingAppointments.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="w-9 h-9 mx-auto mb-2 text-gray-300" />
                <div className="text-sm font-semibold text-gray-600 mb-1">Chưa có lịch hẹn sắp tới</div>
                <p className="text-xs text-gray-400 mb-3">Các lịch hẹn đã xác nhận sẽ được hiển thị tại đây.</p>
                <Link to="/dat-lich" className="inline-block px-4 py-2 bg-[#49BCE2] text-white text-xs font-semibold rounded-lg hover:bg-[#3ca4c7] transition-colors">
                  Đặt lịch khám ngay
                </Link>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {upcomingAppointments.map(a => (
                  <div
                    key={a.id}
                    onClick={() => setSelectedAppointmentId(a.id)}
                    className="flex items-center gap-3.5 p-3 bg-gray-50 rounded-lg border border-gray-200 cursor-pointer hover:border-[#49BCE2] transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-bold text-gray-800 mb-0.5">
                        {a.doctor?.title || 'ThS.BS'} {a.doctor?.name || a.doctorName || 'Bác sĩ'}
                      </div>
                      <div className="text-xs text-gray-500 flex flex-wrap gap-x-4 gap-y-1">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          {a.appointmentDate ? a.appointmentDate.split('-').reverse().join('/') : 'N/A'}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {a.startTime?.slice(0, 5) || '08:00'}
                        </span>
                        <span className="text-[#49BCE2] font-medium">{a.specialty?.name || 'N/A'}</span>
                      </div>
                      <div className="text-[10px] text-gray-400 mt-0.5">Mã: {a.code}</div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-sm font-semibold text-gray-800">{a.patientName}</div>
                      <div className="text-xs text-gray-500">
                        Quan hệ: {a.forSelf ? 'Bản thân' : (a.patientProfile?.relationship || 'Người thân')}
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-300 shrink-0" />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Charts */}
          <div className="bg-white border border-gray-200 rounded-lg p-4 md:p-5 shadow-sm">
            <h2 className="text-sm font-bold text-gray-800 mb-4">Tần suất khám</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div className="text-xs text-gray-500 mb-3">Số lượt khám theo tháng</div>
                <div className="flex items-end gap-1.5 h-[120px] pt-4">
                  {monthlyData.map((d, idx) => (
                    <div key={idx} className="flex-1 flex flex-col items-center justify-end h-full">
                      <div className="text-[10px] text-gray-400 mb-1">{d.count > 0 ? d.count : ''}</div>
                      <div className="w-full flex-1 flex items-end">
                        <div
                          className={`w-full ${d.count > 0 ? 'bg-[#49BCE2]' : 'bg-gray-200'} rounded-t transition-all duration-300`}
                          style={{ height: `${d.heightPercent}%`, minHeight: '4px' }}
                        />
                      </div>
                      <div className="text-[10px] text-gray-400 mt-1.5">{d.label}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-2">Lịch hẹn theo chuyên khoa</div>
                <div className="flex flex-col gap-2.5 pt-1">
                  {specialtyData.map((s, idx) => (
                    <div key={idx}>
                      <div className="flex justify-between text-xs text-gray-600 mb-1">
                        <span>{s.name}</span>
                        <span className="text-gray-400">{s.count} lượt ({s.percentage}%)</span>
                      </div>
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-300"
                          style={{ width: `${s.percentage}%`, backgroundColor: s.color }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Appointment Detail Modal */}
      {selectedAppointment && (
        <div className="fixed inset-0 bg-black/45 z-50 flex items-center justify-center p-4" onClick={() => setSelectedAppointmentId(null)}>
          <div className="bg-white rounded-lg p-5 md:p-6 max-w-[440px] w-full shadow-lg border border-gray-100" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-3.5">
              <h3 className="text-base font-bold text-gray-800">Chi tiết lịch hẹn</h3>
              <button onClick={() => setSelectedAppointmentId(null)} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex flex-col gap-2">
              {[
                { label: 'Mã lịch', value: <code className="font-mono text-xs bg-gray-50 px-1.5 py-0.5 rounded border border-gray-150">{selectedAppointment.code}</code> },
                { label: 'Bác sĩ', value: `${selectedAppointment.doctor?.title || 'ThS.BS'} ${selectedAppointment.doctor?.name || selectedAppointment.doctorName || 'Bác sĩ'}` },
                { label: 'Chuyên khoa', value: selectedAppointment.specialty?.name || 'N/A' },
                { label: 'Ngày khám', value: selectedAppointment.appointmentDate ? selectedAppointment.appointmentDate.split('-').reverse().join('/') : 'N/A' },
                { label: 'Giờ khám', value: `${selectedAppointment.startTime?.slice(0, 5) || '08:00'} - ${selectedAppointment.endTime?.slice(0, 5) || '08:30'}` },
                { label: 'Người khám', value: selectedAppointment.patientName },
                { label: 'Quan hệ', value: selectedAppointment.forSelf ? 'Bản thân' : (selectedAppointment.patientProfile?.relationship || 'Người thân') },
                { label: 'Giá khám tham khảo', value: `${(selectedAppointment.consultationFee || 0).toLocaleString('vi-VN')} đ` },
                {
                  label: 'Trạng thái', value: (
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-semibold rounded-full border ${getStatusConfig(selectedAppointment.status).bg}`}>
                      {getStatusConfig(selectedAppointment.status).label}
                    </span>
                  )
                },
              ].map(row => (
                <div key={row.label} className="flex justify-between items-center py-2 border-b border-gray-50 text-sm">
                  <span className="text-gray-500">{row.label}</span>
                  <span className="font-medium text-gray-800">{row.value}</span>
                </div>
              ))}
            </div>

            {selectedAppointment.reason && (
              <div className="mt-3.5 p-3 bg-gray-50 rounded-lg text-xs text-gray-600">
                <div className="font-semibold text-gray-700 mb-1">Lý do khám / Triệu chứng:</div>
                <div className="whitespace-pre-wrap">{selectedAppointment.reason}</div>
              </div>
            )}

            {selectedAppointment.status === 'CANCELLED' && selectedAppointment.note && (
              <div className="mt-3.5 p-3 bg-red-50 text-red-700 rounded-lg text-xs">
                <div className="font-semibold mb-1">Lý do hủy:</div>
                <div>{selectedAppointment.note}</div>
              </div>
            )}

            <button onClick={() => setSelectedAppointmentId(null)} className="mt-5 w-full py-2.5 bg-[#49BCE2] text-white rounded-lg text-sm font-semibold hover:bg-[#3ca4c7] transition-colors shadow-sm">
              Đóng
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

