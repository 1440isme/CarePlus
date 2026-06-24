import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useMyAppointments, useCancelMyAppointment } from '../../features/appointment/hooks/useAppointments.js';
import { usePatientProfiles } from '../../features/patient-profile/index.js';
import LoadingBlock from '../../shared/components/feedback/LoadingBlock.jsx';
import StateBlock from '../../shared/components/feedback/StateBlock.jsx';
import ReviewModal from '../../features/review/components/ReviewModal.jsx';
import { Search, Filter, Calendar, Clock, X, AlertCircle } from 'lucide-react';

export default function PatientAppointments() {
  const [searchParams, setSearchParams] = useSearchParams();
  const appointmentIdParam = searchParams.get('id');

  const [search, setSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedAppointmentId, setSelectedAppointmentId] = useState(null);
  const [cancellingAppointmentId, setCancellingAppointmentId] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [selectedMemberId, setSelectedMemberId] = useState('');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [appointmentToReview, setAppointmentToReview] = useState(null);

  // Sync URL parameter to selected appointment ID and reset status to All
  useEffect(() => {
    if (appointmentIdParam) {
      setSelectedStatus('');
      setSelectedAppointmentId(appointmentIdParam);
    }
  }, [appointmentIdParam]);

  const handleCloseDrawer = () => {
    setSelectedAppointmentId(null);
    if (searchParams.has('id')) {
      const newParams = new URLSearchParams(searchParams);
      newParams.delete('id');
      setSearchParams(newParams, { replace: true });
    }
  };

  // Local state to mock reviewed status for interactive WOW effect
  const [reviewedAppointments, setReviewedAppointments] = useState({});

  // Query parameters
  const appointmentsParams = {
    ...(selectedStatus ? { status: selectedStatus } : {}),
  };

  const appointmentsQuery = useMyAppointments(appointmentsParams);
  const patientProfilesQuery = usePatientProfiles({ page: 1, limit: 100 });
  const cancelMutation = useCancelMyAppointment();

  const appointmentsList = appointmentsQuery.data?.data || [];
  const relativeProfiles = patientProfilesQuery.data?.data || [];

  // Client-side filtering for search, patient/relative and date range
  const filteredAppointments = useMemo(() => {
    return appointmentsList.filter((appointment) => {
      // 1. Search filter
      let matchesSearch = true;
      if (search.trim()) {
        const query = search.toLowerCase().trim();
        const code = (appointment.code || '').toLowerCase();
        const doctorName = (appointment.doctor?.name || appointment.doctorName || '').toLowerCase();
        const specialtyName = (appointment.specialty?.name || '').toLowerCase();
        const patientName = (appointment.patientName || '').toLowerCase();

        matchesSearch = code.includes(query) ||
          doctorName.includes(query) ||
          specialtyName.includes(query) ||
          patientName.includes(query);
      }

      // 2. Lọc theo Bệnh nhân / Người thân
      let matchesMember = true;
      if (selectedMemberId === 'self') {
        matchesMember = appointment.forSelf === true;
      } else if (selectedMemberId) {
        matchesMember = appointment.forSelf === false && appointment.patientProfileId === selectedMemberId;
      }

      // 3. Lọc theo Khoảng thời gian
      let matchesStartDate = true;
      if (filterStartDate) {
        matchesStartDate = appointment.appointmentDate >= filterStartDate;
      }

      let matchesEndDate = true;
      if (filterEndDate) {
        matchesEndDate = appointment.appointmentDate <= filterEndDate;
      }

      return matchesSearch && matchesMember && matchesStartDate && matchesEndDate;
    });
  }, [appointmentsList, search, selectedMemberId, filterStartDate, filterEndDate]);

  const selectedAppointment = appointmentsList.find(a => a.id === selectedAppointmentId);

  const getStatusConfig = (appt) => {
    if (appt?.hasPendingCancellation) {
      return { label: 'Chờ hủy', bg: 'bg-amber-50 text-amber-600 border-amber-200' };
    }
    const status = typeof appt === 'string' ? appt : appt?.status;
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

  const handleCancelSubmit = async (e) => {
    e.preventDefault();
    if (!cancelReason.trim() || !cancellingAppointmentId) return;

    try {
      const result = await cancelMutation.mutateAsync({
        id: cancellingAppointmentId,
        payload: { reason: cancelReason }
      });
      setCancellingAppointmentId(null);
      setCancelReason('');
      if (result?.requiresApproval) {
        alert("Yêu cầu hủy lịch đã được gửi đến lễ tân duyệt do sát giờ khám.");
      }
    } catch (error) {
      alert(`Lỗi hủy lịch hẹn: ${error.response?.data?.error?.message || error.message}`);
    }
  };

  const handleReviewClick = (appointment) => {
    setAppointmentToReview(appointment);
    setIsReviewModalOpen(true);
  };

  const tabs = [
    { value: '', label: 'Tất cả' },
    { value: 'CONFIRMED', label: 'Đã xác nhận' },
    { value: 'CHECKED_IN', label: 'Check-in' },
    { value: 'COMPLETED', label: 'Hoàn thành' },
    { value: 'CANCELLED', label: 'Đã hủy' },
    { value: 'NO_SHOW', label: 'Vắng mặt' },
  ];

  return (
    <div className="font-sans">
      {/* Header */}
      <div className="mb-4">
        <h1 className="text-xl font-bold text-gray-800">Lịch hẹn của tôi</h1>
      </div>

      {/* Search & Filter bar */}
      <div className="flex gap-2.5 mb-3.5">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            className="w-full border border-gray-200 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#49BCE2] bg-white"
            placeholder="Tìm theo mã lịch, tên bác sĩ, chuyên khoa, người khám..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <button
          className={`flex items-center gap-1.5 px-3.5 py-2 border rounded-lg text-sm bg-white cursor-pointer transition-colors ${showFilterPanel ? 'border-[#49BCE2] text-[#49BCE2]' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}
          onClick={() => setShowFilterPanel(!showFilterPanel)}
        >
          <Filter className="w-3.5 h-3.5" />
          Lọc
        </button>
      </div>

      {/* Optional Filter Panel */}
      {showFilterPanel && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3.5 md:p-4 mb-3.5 flex flex-wrap gap-4 items-end">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-gray-500 font-medium">Người khám</label>
            <select
              className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#49BCE2] bg-white min-w-[180px]"
              value={selectedMemberId}
              onChange={(e) => setSelectedMemberId(e.target.value)}
            >
              <option value="">Tất cả người khám</option>
              <option value="self">Bản thân</option>
              {relativeProfiles.filter(p => p.isActive).map(p => (
                <option key={p.id} value={p.id}>{p.fullName} ({p.relationship})</option>
              ))}
            </select>
          </div>
          
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-gray-500 font-medium">Từ ngày</label>
            <input
              type="date"
              className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#49BCE2] bg-white"
              value={filterStartDate}
              onChange={(e) => setFilterStartDate(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-gray-500 font-medium">Đến ngày</label>
            <input
              type="date"
              className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#49BCE2] bg-white"
              value={filterEndDate}
              onChange={(e) => setFilterEndDate(e.target.value)}
            />
          </div>

          {(selectedMemberId || filterStartDate || filterEndDate) && (
            <button
              className="px-3.5 py-1.5 border border-gray-250 rounded-lg text-sm text-gray-500 bg-white hover:bg-gray-50 cursor-pointer"
              onClick={() => {
                setSelectedMemberId('');
                setFilterStartDate('');
                setFilterEndDate('');
              }}
            >
              Xóa bộ lọc
            </button>
          )}
        </div>
      )}

      {/* Status tabs */}
      <div className="flex gap-0 border-b border-gray-200 mb-3.5 overflow-x-auto scrollbar-none">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            className={`py-2 px-3.5 text-xs md:text-sm font-semibold whitespace-nowrap bg-transparent border-none border-b-2 cursor-pointer transition-all ${selectedStatus === tab.value ? 'border-[#49BCE2] text-[#49BCE2]' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
            onClick={() => setSelectedStatus(tab.value)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Appointment lists */}
      <div>
        {appointmentsQuery.isLoading ? (
          <LoadingBlock label="Đang tải lịch hẹn..." />
        ) : appointmentsQuery.error ? (
          <StateBlock
            variant="error"
            title="Không thể tải lịch hẹn"
            description={appointmentsQuery.error.message}
          />
        ) : filteredAppointments.length === 0 ? (
          <StateBlock
            variant="empty"
            title="Không có lịch hẹn"
            description="Bạn không có cuộc hẹn khám bệnh nào khớp với bộ lọc hiện tại."
          />
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      {['Mã lịch', 'Ngày giờ', 'Bác sĩ', 'Chuyên khoa', 'Người khám', 'Giá tham khảo', 'Trạng thái', 'Thao tác'].map(h => (
                        <th key={h} className="p-3 text-xs font-bold text-gray-500 uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredAppointments.map((appt) => {
                      const statusCfg = getStatusConfig(appt);
                      const isReviewed = reviewedAppointments[appt.id] || appt.isReviewed;
                      const formattedDate = appt.appointmentDate
                        ? appt.appointmentDate.split('-').reverse().join('/')
                        : 'N/A';
                      const formattedTime = appt.startTime ? appt.startTime.slice(0, 5) : '08:00';

                      return (
                        <tr key={appt.id} className="hover:bg-gray-50 transition-colors">
                          <td className="p-3">
                            <code className="font-mono text-xs text-gray-600 bg-gray-50 px-1.5 py-0.5 rounded border border-gray-150">{appt.code}</code>
                          </td>
                          <td className="p-3 whitespace-nowrap">
                            <div className="font-semibold text-gray-800">{formattedDate}</div>
                            <div className="text-xs text-gray-400">{formattedTime}</div>
                          </td>
                          <td className="p-3 font-medium text-gray-800">
                            {appt.doctor?.title || 'ThS.BS'} {appt.doctor?.name || appt.doctorName || 'Bác sĩ'}
                          </td>
                          <td className="p-3 text-[#49BCE2] font-semibold">
                            {appt.specialty?.name || 'N/A'}
                          </td>
                          <td className="p-3">
                            <div className="font-semibold text-gray-800">{appt.patientName}</div>
                            <div className="text-xs text-gray-400">
                              Quan hệ: {appt.forSelf ? 'Bản thân' : (appt.patientProfile?.relationship || 'Người thân')}
                            </div>
                          </td>
                          <td className="p-3 text-gray-600 font-medium">
                            {(appt.consultationFee || 0).toLocaleString('vi-VN')} đ
                          </td>
                          <td className="p-3">
                            <span className={`inline-flex items-center px-2.5 py-0.5 text-xs font-semibold rounded-full border ${statusCfg.bg}`}>
                              {statusCfg.label}
                            </span>
                          </td>
                          <td className="p-3">
                            <div className="flex gap-2 justify-end">
                              <button
                                type="button"
                                className="px-2.5 py-1 text-xs border border-[#49BCE2] text-[#49BCE2] rounded bg-white font-semibold hover:bg-blue-50 transition-colors cursor-pointer"
                                onClick={() => setSelectedAppointmentId(appt.id)}
                              >
                                Chi tiết
                              </button>

                              {appt.status === 'CONFIRMED' && !appt.hasPendingCancellation && (
                                <button
                                  type="button"
                                  className="px-2.5 py-1 text-xs border border-red-500 text-red-500 rounded bg-white font-semibold hover:bg-red-50 transition-colors cursor-pointer"
                                  onClick={() => {
                                    setCancellingAppointmentId(appt.id);
                                    setCancelReason('');
                                  }}
                                >
                                  Hủy
                                </button>
                              )}

                              {appt.status === 'COMPLETED' && (
                                isReviewed ? (
                                  <span className="px-2.5 py-1 text-xs text-green-600 bg-green-50 rounded font-semibold border border-green-200">
                                    Đã đánh giá
                                  </span>
                                ) : (
                                  <button
                                    type="button"
                                    className="px-2.5 py-1 text-xs border border-yellow-500 text-yellow-600 rounded bg-white font-semibold hover:bg-yellow-50 transition-colors cursor-pointer"
                                    onClick={() => handleReviewClick(appt)}
                                  >
                                    Đánh giá
                                  </button>
                                )
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile list */}
            <div className="flex flex-col gap-2.5 md:hidden">
              {filteredAppointments.map((appt) => {
                const statusCfg = getStatusConfig(appt);
                const isReviewed = reviewedAppointments[appt.id] || appt.isReviewed;
                const formattedDate = appt.appointmentDate
                  ? appt.appointmentDate.split('-').reverse().join('/')
                  : 'N/A';
                const formattedTime = appt.startTime ? appt.startTime.slice(0, 5) : '08:00';

                return (
                  <div key={appt.id} className="bg-white border border-gray-200 rounded-lg p-3.5 shadow-sm">
                    <div className="flex justify-between items-center mb-2">
                      <code className="font-mono text-xs text-gray-500">{appt.code}</code>
                      <span className={`inline-flex items-center px-2 py-0.5 text-[10px] font-semibold rounded-full border ${statusCfg.bg}`}>
                        {statusCfg.label}
                      </span>
                    </div>
                    <div className="text-sm font-bold text-gray-800 mb-0.5">
                      {appt.doctor?.title || 'ThS.BS'} {appt.doctor?.name || appt.doctorName || 'Bác sĩ'}
                    </div>
                    <div className="text-xs text-[#49BCE2] font-semibold mb-1.5">
                      {appt.specialty?.name || 'N/A'}
                    </div>
                    <div className="text-xs text-gray-500 flex gap-4 mb-1.5">
                      <span>{formattedDate}</span>
                      <span>{formattedTime}</span>
                    </div>
                    <div className="text-xs text-gray-600 mb-3.5">
                      Người khám: <span className="font-semibold text-gray-700">{appt.patientName}</span>
                      <span className="text-gray-400 mx-1.5">|</span>
                      Giá tham khảo: <span className="font-semibold text-gray-700">{(appt.consultationFee || 0).toLocaleString('vi-VN')} đ</span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        className="flex-1 py-1.5 text-xs border border-[#49BCE2] text-[#49BCE2] rounded-lg bg-white font-semibold hover:bg-blue-50 transition-colors cursor-pointer"
                        onClick={() => setSelectedAppointmentId(appt.id)}
                      >
                        Chi tiết
                      </button>
                      {appt.status === 'CONFIRMED' && !appt.hasPendingCancellation && (
                        <button
                          type="button"
                          className="flex-1 py-1.5 text-xs border border-red-500 text-red-500 rounded-lg bg-white font-semibold hover:bg-red-50 transition-colors cursor-pointer"
                          onClick={() => {
                            setCancellingAppointmentId(appt.id);
                            setCancelReason('');
                          }}
                        >
                          Hủy lịch
                        </button>
                      )}
                      {appt.status === 'COMPLETED' && (
                        isReviewed ? (
                          <span className="flex-1 py-1.5 text-xs text-center text-green-600 bg-green-50 rounded-lg font-semibold border border-green-200">
                            ✓ Đã đánh giá
                          </span>
                        ) : (
                          <button
                            type="button"
                            className="flex-1 py-1.5 text-xs border border-yellow-500 text-yellow-600 rounded-lg bg-white font-semibold hover:bg-yellow-50 transition-colors cursor-pointer"
                            onClick={() => handleReviewClick(appt)}
                          >
                            Đánh giá
                          </button>
                        )
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Appointment Detail Modal */}
      {selectedAppointment && (
        <div className="fixed inset-0 bg-black/45 z-50 flex items-center justify-center p-4" onClick={handleCloseDrawer}>
          <div className="bg-white rounded-lg p-5 md:p-6 max-w-[440px] w-full shadow-lg border border-gray-100" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-3.5">
              <h3 className="text-base font-bold text-gray-800">Chi tiết lịch hẹn</h3>
              <button onClick={handleCloseDrawer} className="text-gray-400 hover:text-gray-600 transition-colors">
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
                { label: 'Trạng thái', value: (
                  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-semibold rounded-full border ${getStatusConfig(selectedAppointment).bg}`}>
                    {getStatusConfig(selectedAppointment).label}
                  </span>
                )},
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

            <button onClick={handleCloseDrawer} className="mt-5 w-full py-2.5 bg-[#49BCE2] text-white rounded-lg text-sm font-semibold hover:bg-[#3ca4c7] transition-colors shadow-sm">
              Đóng
            </button>
          </div>
        </div>
      )}

      {/* Cancel Confirmation Modal */}
      {cancellingAppointmentId && (
        <div className="fixed inset-0 bg-black/45 z-50 flex items-center justify-center p-4" onClick={() => setCancellingAppointmentId(null)}>
          <div className="bg-white rounded-lg p-5 md:p-6 max-w-[420px] w-full shadow-lg border border-gray-100" onClick={e => e.stopPropagation()}>
            <div className="flex gap-3 mb-4">
              <div className="w-10 h-10 bg-red-50 rounded-full flex items-center justify-center shrink-0">
                <AlertCircle className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-800">Xác nhận hủy lịch hẹn</h3>
                <p className="text-xs md:text-sm text-gray-500 mt-1">
                  Bạn có chắc chắn muốn hủy lịch hẹn này không? Sau khi hủy, khung giờ khám sẽ được mở lại cho người khác.
                </p>
              </div>
            </div>
            <form onSubmit={handleCancelSubmit}>
              <div className="mb-4">
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  Lý do hủy lịch <span className="text-red-500">*</span>
                </label>
                <textarea
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#49BCE2] resize-none"
                  placeholder="Vui lòng nhập lý do hủy lịch của bạn (bắt buộc)..."
                  rows={3}
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  required
                />
              </div>
              <div className="flex gap-2.5">
                <button
                  type="button"
                  className="flex-1 py-2 border border-gray-250 rounded-lg text-sm text-gray-600 font-semibold hover:bg-gray-50 cursor-pointer"
                  onClick={() => setCancellingAppointmentId(null)}
                  disabled={cancelMutation.isPending}
                >
                  Không, giữ lại
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-red-500 text-white rounded-lg text-sm font-semibold hover:bg-red-600 cursor-pointer"
                  disabled={!cancelReason.trim() || cancelMutation.isPending}
                >
                  {cancelMutation.isPending ? 'Đang hủy...' : 'Hủy lịch hẹn'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Review Modal */}
      <ReviewModal
        isOpen={isReviewModalOpen}
        onClose={() => {
          setIsReviewModalOpen(false);
          setAppointmentToReview(null);
        }}
        appointment={appointmentToReview}
        onSuccess={(appointmentId) => {
          setReviewedAppointments(prev => ({
            ...prev,
            [appointmentId]: true
          }));
        }}
      />
    </div>
  );
}
