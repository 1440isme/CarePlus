import { useState, useMemo } from 'react';
import { useSpecialties } from '../../features/specialty/hooks/useSpecialties.js';
import { useDoctorList } from '../../features/doctor/hooks/useDoctorList.js';
import { useTimeSlots } from '../../features/timeslot/hooks/useTimeSlots.js';
import { useBookingRules } from '../../features/admin/clinic-settings/hooks/useBookingRules.js';
import {
  buildVirtualSlots,
  filterSlotGroupsBySchedules,
  mergePersistedSlots,
} from '../../features/timeslot/virtual-slot.service.js';
import { useSearchPatients, useBookAppointmentByReceptionist } from '../../features/appointment/hooks/useAppointments.js';
import LoadingBlock from '../../shared/components/feedback/LoadingBlock.jsx';
import StateBlock from '../../shared/components/feedback/StateBlock.jsx';
import './receptionist.css';

export default function ReceptionistBookingPage() {
  const [step, setStep] = useState(1);
  const [patientSearch, setPatientSearch] = useState('');
  const [successBookingData, setSuccessBookingData] = useState(null);

  // Core Booking State
  const [bookingData, setBookingData] = useState({
    specialty: null,      // Selected specialty object
    doctor: null,         // Selected doctor object
    date: new Date().toLocaleDateString('sv').slice(0, 10), // Selected date YYYY-MM-DD
    timeSlot: null,       // Selected timeslot object
    patientUser: null,    // Selected patient user object
    forSelf: true,
    patientProfileId: '', // Selected relative profile ID (if forSelf === false)
    reason: '',
    note: ''
  });

  // 1. Fetch Specialties
  const specialtiesQuery = useSpecialties();

  // 2. Fetch Doctors (Filtered by specialty)
  const doctorsQuery = useDoctorList(
    bookingData.specialty ? { specialtyId: bookingData.specialty.id, limit: 100 } : { limit: 100 }
  );

  // 3. Fetch Timeslots (Filtered by doctor & date)
  const timeSlotsQuery = useTimeSlots(
    bookingData.doctor && bookingData.date
      ? { doctorId: bookingData.doctor.id, date: bookingData.date }
      : null
  );
  const { data: systemSettingsResponse } = useBookingRules();

  // 4. Fetch Patient Search Results (Autocomplete)
  const searchPatientsQuery = useSearchPatients(
    { search: patientSearch },
    { enabled: Boolean(patientSearch.trim().length >= 2) }
  );

  // 5. Booking Mutation
  const bookMutation = useBookAppointmentByReceptionist();

  // Next 7 Days list for Step 2
  const next7Days = useMemo(() => {
    const dates = [];
    const weekdays = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      const dayNum = d.getDate();
      const dayLabel = i === 0 ? 'Hôm nay' : weekdays[d.getDay()];
      const dateStr = d.toLocaleDateString('sv').slice(0, 10); // YYYY-MM-DD
      dates.push({ dateStr, dayLabel, dayNum });
    }
    return dates;
  }, []);

  // Specialty emojis mapping for rich design
  const getSpecialtyEmoji = (slug) => {
    const mapping = {
      'tim-mach': '🫀',
      'nhi-khoa': '👶',
      'da-lieu': '🧴',
      'noi-khoa': '🧠',
      'co-xuong-khop': '🦴',
      'tai-mui-hong': '👂',
      'tieu-hoa': '🧪',
      'san-phu-khoa': '🤰'
    };
    return mapping[slug] || '🩺';
  };

  const handleSelectSpecialty = (specialty) => {
    setBookingData((prev) => ({
      ...prev,
      specialty,
      doctor: null, // Reset doctor when specialty changes
      timeSlot: null
    }));
  };

  const handleSelectDoctor = (doctor) => {
    setBookingData((prev) => ({
      ...prev,
      doctor,
      timeSlot: null // Reset slot when doctor changes
    }));
  };

  const handleSelectDate = (dateStr) => {
    setBookingData((prev) => ({
      ...prev,
      date: dateStr,
      timeSlot: null // Reset slot when date changes
    }));
  };

  const handleSelectTimeSlot = (timeSlot) => {
    setBookingData((prev) => ({
      ...prev,
      timeSlot
    }));
  };

  const handleSelectPatientUser = (patientUser) => {
    setBookingData((prev) => ({
      ...prev,
      patientUser,
      forSelf: true,
      patientProfileId: '',
    }));
    setPatientSearch('');
  };

  const handleSelectPatientProfile = (profileId) => {
    setBookingData((prev) => ({
      ...prev,
      forSelf: profileId === 'self',
      patientProfileId: profileId === 'self' ? '' : profileId
    }));
  };

  const handleStepSubmit = async () => {
    if (step === 1) {
      if (bookingData.specialty) setStep(2);
    } else if (step === 2) {
      if (bookingData.doctor && bookingData.timeSlot) setStep(3);
    } else if (step === 3) {
      if (bookingData.patientUser && bookingData.reason.trim()) setStep(4);
    } else if (step === 4) {
      // Execute booking request
      try {
        const payload = {
          patientId: bookingData.patientUser.id,
          timeSlotId: bookingData.timeSlot.id,
          doctorId: bookingData.doctor?.id,
          date: bookingData.date,
          workingShift: bookingData.timeSlot.workingShift,
          startTime: bookingData.timeSlot.startTime,
          endTime: bookingData.timeSlot.endTime,
          forSelf: bookingData.forSelf,
          ...(bookingData.forSelf ? {} : { patientProfileId: bookingData.patientProfileId }),
          reason: bookingData.reason.trim(),
          note: bookingData.note.trim()
        };

        const response = await bookMutation.mutateAsync(payload);

        // Save success data for step 5
        setSuccessBookingData({
          ...bookingData,
          code: response.data?.code || 'CP' + Math.floor(100000000 + Math.random() * 900000000),
          id: response.data?.id
        });

        setStep(5);
      } catch (error) {
        alert(`Lỗi đặt lịch: ${error.response?.data?.error?.message || error.message}`);
      }
    }
  };

  const handleResetBooking = () => {
    setBookingData({
      specialty: null,
      doctor: null,
      date: new Date().toLocaleDateString('sv').slice(0, 10),
      timeSlot: null,
      patientUser: null,
      forSelf: true,
      patientProfileId: '',
      reason: '',
      note: ''
    });
    setSuccessBookingData(null);
    setStep(1);
  };

  // Autocomplete patient matches
  const patientMatches = searchPatientsQuery.data?.data || [];

  // Filter doctors by selected specialty and query
  const specialtiesList = specialtiesQuery.data?.data || [];
  const doctorsList = doctorsQuery.data?.data || [];

  // Active timeslots list. Virtual slots come from system settings and are saved only when booked.
  const slotData = timeSlotsQuery.data?.data || null;
  const slotGroups = useMemo(() => {
    const schedules = slotData?.schedules || [];
    if (schedules.length === 0) {
      return { morning: [], afternoon: [] };
    }

    return mergePersistedSlots(
      filterSlotGroupsBySchedules(buildVirtualSlots(systemSettingsResponse?.data), schedules),
      slotData.slots || [],
    );
  }, [slotData, systemSettingsResponse?.data]);
  const slotsList = useMemo(() => [
    ...(slotGroups.morning || []),
    ...(slotGroups.afternoon || []),
  ], [slotGroups]);
  const morningSlots = slotGroups.morning || [];
  const afternoonSlots = slotGroups.afternoon || [];

  // Selected relative profile details
  const selectedProfile = useMemo(() => {
    if (bookingData.forSelf || !bookingData.patientUser?.profiles) return null;
    return bookingData.patientUser.profiles.find(p => p.id === bookingData.patientProfileId);
  }, [bookingData.forSelf, bookingData.patientUser, bookingData.patientProfileId]);

  return (
    <div className="booking-wizard-container receptionist-page">
      {/* Header Info */}
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '1.6rem', marginBottom: '4px', fontWeight: 700 }}>Đặt lịch khám</h2>
        <p className="helper-text">Đăng ký lịch khám và đặt lịch khám hộ bệnh nhân tại quầy</p>
      </div>

      {/* Stepper Progress bar */}
      <div className="booking-stepper">
        <div className={`stepper-item ${step >= 1 ? 'completed' : ''} ${step === 1 ? 'active' : ''}`}>
          <div className="step-circle">{step > 1 ? '✓' : '1'}</div>
          <div className="step-label">Chuyên khoa</div>
        </div>
        <div className={`stepper-item ${step >= 2 ? 'completed' : ''} ${step === 2 ? 'active' : ''}`}>
          <div className="step-circle">{step > 2 ? '✓' : '2'}</div>
          <div className="step-label">Bác sĩ & Lịch</div>
        </div>
        <div className={`stepper-item ${step >= 3 ? 'completed' : ''} ${step === 3 ? 'active' : ''}`}>
          <div className="step-circle">{step > 3 ? '✓' : '3'}</div>
          <div className="step-label">Bệnh nhân</div>
        </div>
        <div className={`stepper-item ${step >= 4 ? 'completed' : ''} ${step === 4 ? 'active' : ''}`}>
          <div className="step-circle">{step > 4 ? '✓' : '4'}</div>
          <div className="step-label">Xác nhận</div>
        </div>
        <div className="stepper-connector">
          <div
            className="stepper-connector-progress"
            style={{ width: `${((step - 1) / 3) * 100}%` }}
          />
        </div>
      </div>

      {/* Main step container */}
      <div className="surface-card booking-step-card" style={{ marginBottom: '24px' }}>
        {/* STEP 1: CHỌN CHUYÊN KHOA */}
        {step === 1 && (
          <div className="fade-in">
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '16px' }}>Chọn chuyên khoa</h3>

            {specialtiesQuery.isLoading ? (
              <LoadingBlock label="Đang tải danh sách chuyên khoa..." />
            ) : specialtiesQuery.error ? (
              <StateBlock
                variant="error"
                title="Lỗi tải chuyên khoa"
                description={specialtiesQuery.error.message}
              />
            ) : specialtiesList.length === 0 ? (
              <p className="helper-text">Không tìm thấy chuyên khoa nào khả dụng.</p>
            ) : (
              <div className="specialty-select-grid">
                {specialtiesList.map((specialty) => {
                  const isSelected = bookingData.specialty?.id === specialty.id;
                  return (
                    <button
                      key={specialty.id}
                      type="button"
                      className={`specialty-select-btn ${isSelected ? 'selected' : ''}`}
                      onClick={() => handleSelectSpecialty(specialty)}
                    >
                      <span className="specialty-emoji">{getSpecialtyEmoji(specialty.slug)}</span>
                      <span className="specialty-name">{specialty.name}</span>
                      <span className="specialty-count">Chuyên khoa khám</span>
                    </button>
                  );
                })}
              </div>
            )}

            {bookingData.specialty && (
              <div className="selected-alert">
                ✓ Đã chọn chuyên khoa: <strong>{bookingData.specialty.name}</strong>
              </div>
            )}
          </div>
        )}

        {/* STEP 2: BÁC SĨ & LỊCH */}
        {step === 2 && (
          <div className="fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0 }}>Xem lịch làm việc và chọn khung giờ</h3>
              <p className="helper-text" style={{ fontSize: '0.85rem', margin: 0 }}>
                Chuyên khoa: <strong>{bookingData.specialty?.name}</strong>{' '}
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  style={{ border: 'none', background: 'none', color: 'var(--cyan)', fontWeight: 600, cursor: 'pointer', textDecoration: 'underline', padding: 0 }}
                >
                  Đổi
                </button>
              </p>
            </div>

            {/* Date Row selectors */}
            <div className="date-selector-row">
              {next7Days.map((d) => {
                const isSelected = bookingData.date === d.dateStr;
                return (
                  <button
                    key={d.dateStr}
                    type="button"
                    className={`date-selector-btn ${isSelected ? 'selected' : ''}`}
                    onClick={() => handleSelectDate(d.dateStr)}
                  >
                    <span className="date-day-label">{d.dayLabel}</span>
                    <span className="date-num-label">{d.dayNum}</span>
                  </button>
                );
              })}
            </div>

            {/* Doctor Select Section */}
            <h4 style={{ fontSize: '0.9rem', fontWeight: 700, margin: '20px 0 10px 0' }}>Bác sĩ khả dụng</h4>
            {doctorsQuery.isLoading ? (
              <LoadingBlock label="Đang tải danh sách bác sĩ..." />
            ) : doctorsList.length === 0 ? (
              <p className="helper-text">Không có bác sĩ nào thuộc chuyên khoa này hoạt động.</p>
            ) : (
              <div className="doctor-select-list">
                {doctorsList.map((doctor) => {
                  const isSelected = bookingData.doctor?.id === doctor.id;
                  const selectedSlotTime = bookingData.doctor?.id === doctor.id && bookingData.timeSlot
                    ? bookingData.timeSlot.startTime.slice(0, 5)
                    : null;

                  return (
                    <div key={doctor.id} className={`doctor-row-card ${isSelected ? 'selected' : ''}`}>
                      <div
                        className="doctor-row-header"
                        onClick={() => handleSelectDoctor(doctor)}
                        style={{ cursor: 'pointer' }}
                      >
                        <div className="doctor-avatar-placeholder">👨‍⚕️</div>
                        <div className="doctor-row-title-info">
                          <span className="doctor-row-name">{doctor.name}</span>
                          <div className="doctor-row-meta">
                            {doctor.title || 'Bác sĩ chuyên khoa'} · {doctor.experience || 5} năm kinh nghiệm
                          </div>
                        </div>
                        <div style={{ textAlign: 'right', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-h)' }}>
                            {(doctor.price || 0).toLocaleString('vi-VN')} VNĐ
                          </span>
                          {selectedSlotTime && (
                            <span className="doctor-selected-slot-badge">✓ {selectedSlotTime}</span>
                          )}
                        </div>
                      </div>

                      {/* If doctor is selected, display available timeslots */}
                      {isSelected && (
                        <div className="slots-grid-section">
                          {timeSlotsQuery.isLoading ? (
                            <LoadingBlock label="Đang kiểm tra lịch trống..." />
                          ) : slotsList.length === 0 ? (
                            <p className="helper-text" style={{ fontSize: '0.85rem', margin: '8px 0 0 0' }}>
                              Không có ca làm việc trống vào ngày {new Date(bookingData.date).toLocaleDateString('vi-VN')}.
                            </p>
                          ) : (
                            <>
                              <p className="helper-text" style={{ fontSize: '0.82rem', marginBottom: '10px' }}>
                                Khung giờ ngày {new Date(bookingData.date).toLocaleDateString('vi-VN')}:
                              </p>

                              {/* Morning Shift */}
                              {morningSlots.length > 0 && (
                                <div style={{ marginBottom: '12px' }}>
                                  <div className="slots-shift-title">☀️ Ca sáng</div>
                                  <div className="slots-grid">
                                    {morningSlots.map((s) => {
                                      const isSlotSelected = bookingData.timeSlot?.id === s.id;
                                      const isBooked = s.status === 'BOOKED';
                                      return (
                                        <button
                                          key={s.id}
                                          type="button"
                                          disabled={isBooked}
                                          className={`timeslot-btn ${isSlotSelected ? 'selected' : ''} ${isBooked ? 'booked' : ''}`}
                                          onClick={() => handleSelectTimeSlot(s)}
                                        >
                                          {s.startTime.slice(0, 5)} {isBooked && '✕'}
                                        </button>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}

                              {/* Afternoon Shift */}
                              {afternoonSlots.length > 0 && (
                                <div>
                                  <div className="slots-shift-title">🌤️ Ca chiều</div>
                                  <div className="slots-grid">
                                    {afternoonSlots.map((s) => {
                                      const isSlotSelected = bookingData.timeSlot?.id === s.id;
                                      const isBooked = s.status === 'BOOKED';
                                      return (
                                        <button
                                          key={s.id}
                                          type="button"
                                          disabled={isBooked}
                                          className={`timeslot-btn ${isSlotSelected ? 'selected' : ''} ${isBooked ? 'booked' : ''}`}
                                          onClick={() => handleSelectTimeSlot(s)}
                                        >
                                          {s.startTime.slice(0, 5)} {isBooked && '✕'}
                                        </button>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* STEP 3: THÔNG TIN BỆNH NHÂN */}
        {step === 3 && (
          <div className="fade-in">
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '16px' }}>Thông tin bệnh nhân</h3>

            {/* Quick search input */}
            <div className="patient-search-container">
              <label htmlFor="patientSearchInput" style={{ fontWeight: 600, fontSize: '0.9rem', display: 'block', marginBottom: '6px' }}>
                Tra cứu nhanh bệnh nhân chính
              </label>
              <input
                id="patientSearchInput"
                type="text"
                placeholder="Nhập tên, số điện thoại hoặc email để tra cứu..."
                value={patientSearch}
                onChange={(e) => setPatientSearch(e.target.value)}
                style={{ width: '100%', padding: '10px 14px', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '0.95rem' }}
              />

              {/* Autocomplete dropdown suggestion */}
              {patientSearch.trim().length >= 2 && (
                <div className="patient-autocomplete-dropdown">
                  {searchPatientsQuery.isLoading ? (
                    <div style={{ padding: '12px', textAlign: 'center' }} className="helper-text">Đang tra cứu bệnh nhân...</div>
                  ) : patientMatches.length === 0 ? (
                    <div style={{ padding: '12px', textAlign: 'center' }} className="helper-text">Không tìm thấy bệnh nhân nào khớp.</div>
                  ) : (
                    patientMatches.map((p) => (
                      <div
                        key={p.id}
                        className="patient-autocomplete-item"
                        onClick={() => handleSelectPatientUser(p)}
                      >
                        <div className="patient-item-name">{p.name}</div>
                        <div className="patient-item-meta">
                          SĐT: {p.phone || 'N/A'} · Email: {p.email}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Selected patient pill */}
            {bookingData.patientUser && (
              <div className="selected-patient-pill">
                <span>
                  ✓ Đang đặt cho bệnh nhân chính:{' '}
                  <strong>{bookingData.patientUser.name}</strong> ({bookingData.patientUser.phone || 'N/A'})
                </span>
                <button
                  type="button"
                  className="remove-patient-pill-btn"
                  onClick={() => setBookingData((prev) => ({ ...prev, patientUser: null, patientProfileId: '', forSelf: true }))}
                >
                  &times;
                </button>
              </div>
            )}

            {/* Patient Form Fields */}
            {bookingData.patientUser ? (
              <div className="form-grid two-columns" style={{ animation: 'fadeIn 0.3s ease-out' }}>
                {/* Book for dropdown (Self vs Relative) */}
                <div className="form-field" style={{ gridColumn: 'span 2' }}>
                  <label htmlFor="bookForSelect">Đặt lịch khám cho*</label>
                  <select
                    id="bookForSelect"
                    value={bookingData.forSelf ? 'self' : bookingData.patientProfileId}
                    onChange={(e) => handleSelectPatientProfile(e.target.value)}
                  >
                    <option value="self">Chính bệnh nhân chính ({bookingData.patientUser.name})</option>
                    {bookingData.patientUser.profiles?.map((p) => (
                      <option key={p.id} value={p.id}>
                        Người thân: {p.fullName} ({p.relationship === 'PARENT' ? 'Bố/Mẹ' : p.relationship === 'CHILD' ? 'Con' : p.relationship === 'SPOUSE' ? 'Vợ/Chồng' : 'Khác'})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Display active patient details */}
                <div className="form-field">
                  <label>Họ tên bệnh nhân</label>
                  <input
                    type="text"
                    disabled
                    value={bookingData.forSelf ? bookingData.patientUser.name : (selectedProfile?.fullName || '')}
                    style={{ backgroundColor: '#F9FAFB', cursor: 'not-allowed' }}
                  />
                </div>

                <div className="form-field">
                  <label>Số điện thoại</label>
                  <input
                    type="text"
                    disabled
                    value={bookingData.forSelf ? (bookingData.patientUser.phone || 'N/A') : (selectedProfile?.phone || bookingData.patientUser.phone || 'N/A')}
                    style={{ backgroundColor: '#F9FAFB', cursor: 'not-allowed' }}
                  />
                </div>

                <div className="form-field">
                  <label>Email tài khoản</label>
                  <input
                    type="text"
                    disabled
                    value={bookingData.patientUser.email}
                    style={{ backgroundColor: '#F9FAFB', cursor: 'not-allowed' }}
                  />
                </div>

                <div className="form-field">
                  <label>Ngày sinh</label>
                  <input
                    type="text"
                    disabled
                    value={bookingData.forSelf
                      ? (bookingData.patientUser.dateOfBirth ? new Date(bookingData.patientUser.dateOfBirth).toLocaleDateString('vi-VN') : 'N/A')
                      : 'Hồ sơ người thân'}
                    style={{ backgroundColor: '#F9FAFB', cursor: 'not-allowed' }}
                  />
                </div>

                <div className="form-field" style={{ gridColumn: 'span 2' }}>
                  <label htmlFor="reasonTextarea">Triệu chứng & Lý do khám bệnh*</label>
                  <textarea
                    id="reasonTextarea"
                    placeholder="Mô tả triệu chứng chính hoặc lý do đến khám..."
                    value={bookingData.reason}
                    onChange={(e) => setBookingData((prev) => ({ ...prev, reason: e.target.value }))}
                  />
                </div>

                <div className="form-field" style={{ gridColumn: 'span 2' }}>
                  <label htmlFor="noteTextarea">Ghi chú thêm (Không bắt buộc)</label>
                  <textarea
                    id="noteTextarea"
                    placeholder="Ghi chú thêm từ lễ tân..."
                    value={bookingData.note}
                    onChange={(e) => setBookingData((prev) => ({ ...prev, note: e.target.value }))}
                    style={{ minHeight: '80px' }}
                  />
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '36px 0', border: '1.5px dashed var(--border)', borderRadius: '12px' }}>
                <p className="helper-text">Vui lòng tìm kiếm bệnh nhân chính bằng Số điện thoại/Email để hiển thị biểu mẫu điền thông tin.</p>
              </div>
            )}
          </div>
        )}

        {/* STEP 4: XÁC NHẬN */}
        {step === 4 && (
          <div className="fade-in">
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '16px' }}>Xác nhận đặt lịch</h3>

            {bookMutation.isPending ? (
              <LoadingBlock label="Đang gửi yêu cầu đặt lịch..." />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {/* Doctor section */}
                <div>
                  <h4 className="drawer-section-title">THÔNG TIN BÁC SĨ</h4>
                  <div className="drawer-info-group">
                    <div className="info-row">
                      <span className="info-label">Bác sĩ khám</span>
                      <span className="info-value">{bookingData.doctor?.name}</span>
                    </div>
                    <div className="info-row">
                      <span className="info-label">Chuyên khoa</span>
                      <span className="info-value">{bookingData.specialty?.name}</span>
                    </div>
                    <div className="info-row">
                      <span className="info-label">Giá khám tham khảo</span>
                      <span className="info-value">
                        {(bookingData.doctor?.price || 0).toLocaleString('vi-VN')} VNĐ
                      </span>
                    </div>
                  </div>
                </div>

                {/* Schedule section */}
                <div>
                  <h4 className="drawer-section-title">THÔNG TIN LỊCH KHÁM</h4>
                  <div className="drawer-info-group">
                    <div className="info-row">
                      <span className="info-label">Ngày khám</span>
                      <span className="info-value">
                        {new Date(bookingData.date).toLocaleDateString('vi-VN')}
                      </span>
                    </div>
                    <div className="info-row">
                      <span className="info-label">Giờ khám</span>
                      <span className="info-value">
                        {bookingData.timeSlot?.startTime.slice(0, 5)} - {bookingData.timeSlot?.endTime.slice(0, 5)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Patient section */}
                <div>
                  <h4 className="drawer-section-title">THÔNG TIN BỆNH NHÂN</h4>
                  <div className="drawer-info-group">
                    <div className="info-row">
                      <span className="info-label">Bệnh nhân</span>
                      <span className="info-value">
                        {bookingData.forSelf ? bookingData.patientUser.name : (selectedProfile?.fullName + ' (Người thân)')}
                      </span>
                    </div>
                    <div className="info-row">
                      <span className="info-label">SĐT liên hệ</span>
                      <span className="info-value">
                        {bookingData.forSelf ? (bookingData.patientUser.phone || 'N/A') : (selectedProfile?.phone || bookingData.patientUser.phone || 'N/A')}
                      </span>
                    </div>
                    <div className="info-row">
                      <span className="info-label">Email chính</span>
                      <span className="info-value">{bookingData.patientUser.email}</span>
                    </div>
                    <div className="info-row" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
                      <span className="info-label" style={{ marginBottom: '4px' }}>Triệu chứng / Lý do khám</span>
                      <span className="info-value" style={{ textAlign: 'left', maxWidth: '100%' }}>
                        {bookingData.reason}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* STEP 5: ĐẶT LỊCH THÀNH CÔNG */}
        {step === 5 && successBookingData && (
          <div className="fade-in booking-success-card">
            <div className="success-icon-circle">✓</div>
            <h3 className="booking-success-title">Đặt lịch thành công</h3>
            <span className="booking-success-badge">ĐÃ XÁC NHẬN</span>

            <div className="drawer-info-group" style={{ textAlign: 'left', margin: '20px 0' }}>
              <div className="info-row">
                <span className="info-label">Mã lịch</span>
                <span className="info-value" style={{ color: 'var(--cyan)', fontFamily: 'monospace' }}>
                  {successBookingData.code}
                </span>
              </div>
              <div className="info-row">
                <span className="info-label">Bệnh nhân</span>
                <span className="info-value">
                  {successBookingData.forSelf ? successBookingData.patientUser.name : (successBookingData.patientUser.profiles.find(p => p.id === successBookingData.patientProfileId)?.fullName)}
                </span>
              </div>
              <div className="info-row">
                <span className="info-label">Bác sĩ khám</span>
                <span className="info-value">{successBookingData.doctor?.name}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Chuyên khoa</span>
                <span className="info-value">{successBookingData.specialty?.name}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Thời gian khám</span>
                <span className="info-value">
                  {successBookingData.timeSlot?.startTime.slice(0, 5)} —{' '}
                  {new Date(successBookingData.date).toLocaleDateString('vi-VN')}
                </span>
              </div>
            </div>

            <button
              type="button"
              className="button-primary"
              onClick={handleResetBooking}
              style={{ width: '100%', marginTop: '10px' }}
            >
              Tạo lịch hẹn mới
            </button>
          </div>
        )}
      </div>

      {/* Stepper Footer actions */}
      {step < 5 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button
            type="button"
            className="button-secondary"
            disabled={step === 1 || bookMutation.isPending}
            onClick={() => setStep(s => s - 1)}
            style={{ width: '120px' }}
          >
            Quay lại
          </button>

          <button
            type="button"
            className="button-primary"
            disabled={
              bookMutation.isPending ||
              (step === 1 && !bookingData.specialty) ||
              (step === 2 && (!bookingData.doctor || !bookingData.timeSlot)) ||
              (step === 3 && (!bookingData.patientUser || !bookingData.reason.trim()))
            }
            onClick={handleStepSubmit}
            style={{ width: '120px' }}
          >
            {step === 4 ? 'Xác nhận' : 'Tiếp theo'}
          </button>
        </div>
      )}
    </div>
  );
}
