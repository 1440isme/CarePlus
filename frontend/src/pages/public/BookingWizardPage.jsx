import { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../shared/hooks/useAuth.js';
import { useSpecialties } from '../../features/specialty/hooks/useSpecialties.js';
import { useDoctorList } from '../../features/doctor/hooks/useDoctorList.js';
import { useTimeSlots } from '../../features/timeslot/hooks/useTimeSlots.js';
import { useBookingRules } from '../../features/admin/clinic-settings/hooks/useBookingRules.js';
import {
  buildVirtualSlots,
  filterSlotGroupsBySchedules,
  mergePersistedSlots,
} from '../../features/timeslot/virtual-slot.service.js';
import { usePatientProfiles } from '../../features/patient-profile/hooks/usePatientProfiles.js';
import { useMe } from '../../features/user/hooks/useMe.js';
import { useBookAppointment } from '../../features/appointment/hooks/useAppointments.js';
import LoadingBlock from '../../shared/components/feedback/LoadingBlock.jsx';
import StateBlock from '../../shared/components/feedback/StateBlock.jsx';
import './booking-wizard.css';

export default function BookingWizardPage() {
  const navigate = useNavigate();
  const { isAuthenticated, user: authUser } = useAuth();

  // Core Steps: 1 to 5
  const [step, setStep] = useState(1);
  const [specialtySearch, setSpecialtySearch] = useState('');
  const [doctorSearch, setDoctorSearch] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Core Booking Selections
  const [bookingData, setBookingData] = useState({
    specialty: null,      // Selected specialty object
    doctor: null,         // Selected doctor object
    date: new Date().toLocaleDateString('sv').slice(0, 10), // Selected date YYYY-MM-DD
    timeSlot: null,       // Selected timeslot object
    forSelf: true,        // forSelf boolean
    patientProfileId: '', // Selected relative profile ID (if forSelf === false)
    reason: '',           // Reason for visit
    note: ''              // Note (optional)
  });

  const [bookingResult, setBookingResult] = useState(null);

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

  // 4. Fetch Current User Details (for "Bản thân")
  const { data: meResponse } = useMe({ enabled: isAuthenticated });
  const currentUserData = meResponse?.data || meResponse || null;

  // 5. Fetch Relative Profiles (for "Người thân")
  const patientProfilesQuery = usePatientProfiles({}, { enabled: isAuthenticated && !bookingData.forSelf });
  const relativeProfiles = patientProfilesQuery.data?.data || [];

  // 6. Book Appointment Mutation
  const bookMutation = useBookAppointment();

  // Check sessionStorage for pending booking on mount
  useEffect(() => {
    const pending = sessionStorage.getItem('pending_booking');
    if (pending) {
      try {
        const parsed = JSON.parse(pending);
        setBookingData((prev) => ({
          ...prev,
          specialty: parsed.specialty,
          doctor: parsed.doctor,
          date: parsed.date,
          timeSlot: parsed.timeSlot,
        }));
        setStep(parsed.step || 1);
      } catch (err) {
        console.error('Failed to parse pending booking state', err);
      } finally {
        sessionStorage.removeItem('pending_booking');
      }
    }
  }, []);

  // Specialty emojis mapping matching design
  const getSpecialtyEmoji = (slug) => {
    const mapping = {
      'tim-mach': '🫀',
      'nhi-khoa': '🧒',
      'da-lieu': '🧴',
      'noi-khoa': '🧠',
      'co-xuong-khop': '🦴',
      'tai-mui-hong': '👂',
      'tieu-hoa': '💊',
      'san-phu-khoa': '🤰',
      'noi-tong-quat': '🧠'
    };
    return mapping[slug || ''] || '🩺';
  };

  // Next 7 Days list for Step 2 Date Slider
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

  // Filter specialties list based on search query
  const specialtiesList = useMemo(() => {
    const list = specialtiesQuery.data?.data || [];
    if (!specialtySearch.trim()) return list;
    return list.filter((s) =>
      s.name.toLowerCase().includes(specialtySearch.toLowerCase())
    );
  }, [specialtiesQuery.data, specialtySearch]);

  // Filter doctors list based on search query
  const doctorsList = useMemo(() => {
    const list = doctorsQuery.data?.data || [];
    if (!doctorSearch.trim()) return list;
    return list.filter((doc) =>
      doc.name.toLowerCase().includes(doctorSearch.toLowerCase())
    );
  }, [doctorsQuery.data, doctorSearch]);

  // Active timeslots list. Virtual slots are generated from system settings and materialized by backend on booking.
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

  // Selected patient details (either self or selected relative)
  const selectedPatientDetails = useMemo(() => {
    if (bookingData.forSelf) {
      if (!currentUserData) return null;
      return {
        fullName: currentUserData.name || '',
        phone: currentUserData.phone || '',
        email: currentUserData.email || '',
        gender: currentUserData.gender === 'MALE' ? 'Nam' : currentUserData.gender === 'FEMALE' ? 'Nữ' : 'Khác',
        dateOfBirth: currentUserData.dateOfBirth || '',
        address: currentUserData.address || '—'
      };
    } else {
      const profile = relativeProfiles.find((p) => p.id === bookingData.patientProfileId);
      if (!profile) return null;
      
      let dobStr = '';
      if (profile.dateOfBirth) {
        const dob = new Date(profile.dateOfBirth);
        if (!isNaN(dob.getTime())) {
          const d = String(dob.getUTCDate()).padStart(2, '0');
          const m = String(dob.getUTCMonth() + 1).padStart(2, '0');
          const y = dob.getUTCFullYear();
          dobStr = `${d}/${m}/${y}`;
        }
      }
      
      return {
        fullName: profile.fullName || '',
        phone: profile.phone || '',
        email: profile.email || '—',
        gender: profile.gender === 'MALE' ? 'Nam' : profile.gender === 'FEMALE' ? 'Nữ' : 'Khác',
        dateOfBirth: dobStr,
        address: profile.address || '—'
      };
    }
  }, [bookingData.forSelf, bookingData.patientProfileId, currentUserData, relativeProfiles]);

  // Handle specialty click in Step 1
  const handleSelectSpecialty = (specialty) => {
    setBookingData((prev) => ({
      ...prev,
      specialty,
      doctor: null, // Reset doctor/timeslot when specialty changes
      timeSlot: null
    }));
  };

  // Handle doctor selection in Step 2
  const handleSelectDoctor = (doctor) => {
    setBookingData((prev) => ({
      ...prev,
      doctor,
      timeSlot: null // Reset slot when doctor changes
    }));
  };

  // Handle date selection in Step 2 date bar
  const handleSelectDate = (dateStr) => {
    setBookingData((prev) => ({
      ...prev,
      date: dateStr,
      timeSlot: null // Reset slot when date changes
    }));
  };

  // Handle timeslot click in Step 2
  const handleSelectTimeSlot = (timeSlot) => {
    setBookingData((prev) => ({
      ...prev,
      timeSlot
    }));
  };

  // Navigation handlers
  const handleNextStep = () => {
    if (step === 1) {
      if (bookingData.specialty) setStep(2);
    } else if (step === 2) {
      if (bookingData.doctor && bookingData.timeSlot) {
        // Authenticity Check before going to Step 3
        if (!isAuthenticated) {
          // Save pending booking in session storage
          sessionStorage.setItem('pending_booking', JSON.stringify({
            specialty: bookingData.specialty,
            doctor: bookingData.doctor,
            date: bookingData.date,
            timeSlot: bookingData.timeSlot,
            step: 3
          }));
          navigate('/dang-nhap?redirect=/dat-lich');
        } else {
          setStep(3);
        }
      }
    } else if (step === 3) {
      if (bookingData.forSelf) {
        if (bookingData.reason.trim()) setStep(4);
      } else {
        if (bookingData.patientProfileId && bookingData.reason.trim()) setStep(4);
      }
    }
  };

  const handlePrevStep = () => {
    if (step > 1 && step < 5) {
      setStep((prev) => prev - 1);
      setErrorMessage('');
    }
  };

  // Execute Booking Mutation in Step 4
  const handleConfirmBooking = async () => {
    setErrorMessage('');
    try {
      const payload = {
        timeSlotId: bookingData.timeSlot.id,
        doctorId: bookingData.doctor?.id,
        date: bookingData.date,
        workingShift: bookingData.timeSlot.workingShift,
        startTime: bookingData.timeSlot.startTime,
        endTime: bookingData.timeSlot.endTime,
        forSelf: bookingData.forSelf,
        reason: bookingData.reason.trim(),
        ...(bookingData.forSelf ? {} : { patientProfileId: bookingData.patientProfileId })
      };

      const response = await bookMutation.mutateAsync(payload);
      
      // Save result and proceed to Step 5
      setBookingResult(response.data || response);
      setStep(5);
    } catch (err) {
      setErrorMessage(
        err.response?.data?.error?.message || 
        err.message || 
        'Có lỗi xảy ra trong quá trình đặt lịch. Vui lòng thử lại.'
      );
    }
  };

  const handleResetBooking = () => {
    setBookingData({
      specialty: null,
      doctor: null,
      date: new Date().toLocaleDateString('sv').slice(0, 10),
      timeSlot: null,
      forSelf: true,
      patientProfileId: '',
      reason: '',
      note: ''
    });
    setBookingResult(null);
    setStep(1);
    setErrorMessage('');
  };

  // Format date display (e.g. 14/06/2026)
  const formatDisplayDate = (dateStr) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  };

  // Format price (e.g. 350,000đ)
  const formatPrice = (price) => {
    if (price === undefined || price === null) return '0đ';
    return price.toLocaleString('vi-VN') + 'đ';
  };

  return (
    <div className="page-shell">
      <div className={`booking-wizard-container ${step === 5 ? 'step-5-layout' : ''}`}>
        
        {/* Title Section (Hide in step 5) */}
        {step < 5 && (
          <div className="booking-title-section" style={{ marginBottom: 20 }}>
            <h1>Đặt lịch khám</h1>
            <p>Chọn chuyên khoa → Bác sĩ & lịch → Thông tin → Xác nhận</p>
          </div>
        )}

        {/* Stepper Progress bar (Hide in step 5) */}
        {step < 5 && (
          <div className="booking-stepper">
            <div className={`step-item ${step === 1 ? 'active' : step > 1 ? 'completed' : ''}`}>
              <div className="step-node">
                <div className="step-circle">
                  {step > 1 ? '✓' : '1'}
                </div>
                <div className="step-label">Chuyên khoa</div>
              </div>
            </div>
            <div className="step-line"></div>
            
            <div className={`step-item ${step === 2 ? 'active' : step > 2 ? 'completed' : ''}`}>
              <div className="step-node">
                <div className="step-circle">
                  {step > 2 ? '✓' : '2'}
                </div>
                <div className="step-label">Bác sĩ & Lịch</div>
              </div>
            </div>
            <div className="step-line"></div>
            
            <div className={`step-item ${step === 3 ? 'active' : step > 3 ? 'completed' : ''}`}>
              <div className="step-node">
                <div className="step-circle">
                  {step > 3 ? '✓' : '3'}
                </div>
                <div className="step-label">Thông tin</div>
              </div>
            </div>
            <div className="step-line"></div>
            
            <div className={`step-item ${step === 4 ? 'active' : ''}`}>
              <div className="step-node">
                <div className="step-circle">4</div>
                <div className="step-label">Xác nhận</div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 1: Specialty List */}
        {step === 1 && (
          <div className="booking-card">
            <h3>Chọn chuyên khoa</h3>
            
            <div className="search-wrapper">
              <span className="search-icon">🔍</span>
              <input
                type="text"
                className="booking-search-input"
                placeholder="Tìm chuyên khoa..."
                value={specialtySearch}
                onChange={(e) => setSpecialtySearch(e.target.value)}
              />
            </div>

            {specialtiesQuery.isLoading ? (
              <LoadingBlock description="Đang tải danh sách chuyên khoa..." />
            ) : specialtiesQuery.isError ? (
              <StateBlock
                variant="error"
                title="Lỗi tải dữ liệu"
                description="Không thể kết nối tới máy chủ để lấy danh sách chuyên khoa."
              />
            ) : specialtiesList.length === 0 ? (
              <StateBlock
                variant="empty"
                title="Không tìm thấy chuyên khoa"
                description="Không tìm thấy chuyên khoa nào phù hợp với từ khóa tìm kiếm của bạn."
              />
            ) : (
              <div className="specialty-grid">
                {specialtiesList.map((spec) => (
                  <button
                    key={spec.id}
                    type="button"
                    className={`specialty-card-button ${bookingData.specialty?.id === spec.id ? 'selected' : ''}`}
                    onClick={() => handleSelectSpecialty(spec)}
                  >
                    <span className="specialty-emoji">{getSpecialtyEmoji(spec.slug)}</span>
                    <span className="specialty-name">{spec.name}</span>
                    <span className="specialty-count">
                      {spec.doctorsCount !== undefined ? `${spec.doctorsCount} bác sĩ` : 'Xem lịch'}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* STEP 2: Doctor & Timeslot Selection */}
        {step === 2 && (
          <div className="booking-card">
            <h3>Xem lịch làm việc và chọn khung giờ</h3>
            
            <div className="booking-title-section" style={{ marginBottom: 14 }}>
              <p style={{ color: '#4A5565' }}>
                Chuyên khoa: <strong style={{ color: '#101828' }}>{bookingData.specialty?.name}</strong>{' '}
                <span 
                  onClick={() => setStep(1)} 
                  style={{ textDecoration: 'underline', color: '#888888', cursor: 'pointer', fontSize: '11px', marginLeft: '4px' }}
                >
                  Đổi
                </span>
              </p>
            </div>

            {/* Date Slider Horizontal */}
            <div className="date-selector-row">
              {next7Days.map((item) => (
                <button
                  key={item.dateStr}
                  type="button"
                  className={`date-card-button ${bookingData.date === item.dateStr ? 'selected' : ''}`}
                  onClick={() => handleSelectDate(item.dateStr)}
                >
                  <span className="date-card-label">{item.dayLabel}</span>
                  <span className="date-card-num">{item.dayNum}</span>
                </button>
              ))}
            </div>

            {/* Search doctor */}
            <div className="search-wrapper">
              <span className="search-icon">🔍</span>
              <input
                type="text"
                className="booking-search-input"
                placeholder="Tìm bác sĩ..."
                value={doctorSearch}
                onChange={(e) => setDoctorSearch(e.target.value)}
              />
            </div>

            {/* Doctor listing */}
            {doctorsQuery.isLoading ? (
              <LoadingBlock description="Đang tải danh sách bác sĩ..." />
            ) : doctorsQuery.isError ? (
              <StateBlock
                variant="error"
                title="Lỗi tải danh sách bác sĩ"
                description="Không thể lấy danh sách bác sĩ thuộc chuyên khoa này."
              />
            ) : doctorsList.length === 0 ? (
              <StateBlock
                variant="empty"
                title="Không có bác sĩ khả dụng"
                description="Không tìm thấy bác sĩ nào thuộc chuyên khoa này phù hợp."
              />
            ) : (
              <div className="doctor-list-container">
                {doctorsList.map((doc) => {
                  const isSelected = bookingData.doctor?.id === doc.id;
                  
                  return (
                    <div 
                      key={doc.id} 
                      className={`doctor-item-card ${isSelected ? 'selected-doctor' : ''}`}
                    >
                      <div className="doctor-main-info" onClick={() => handleSelectDoctor(doc)}>
                        <div className="doctor-avatar-wrapper">
                          <img 
                            src={doc.avatar || '/placeholder-doctor.jpg'} 
                            alt={doc.name}
                            onError={(e) => { e.target.src = 'https://placehold.co/100x100?text=Dr'; }} 
                          />
                        </div>
                        <div className="doctor-details-wrapper">
                          <div className="doctor-name-text">{doc.name}</div>
                          <div className="doctor-specialty-text">{bookingData.specialty?.name}</div>
                          <div className="doctor-meta-row">
                            <span className="doctor-rating">⭐ {doc.rating || '5.0'}</span>
                            <span>•</span>
                            <span>{doc.experience || '5'} năm KN</span>
                            <span>•</span>
                            <span className="doctor-price-tag">{formatPrice(doc.price)}</span>
                          </div>
                        </div>
                      </div>

                      {/* Display timeslots inside the selected doctor card */}
                      {isSelected && (
                        <div className="timeslot-selection-area">
                          <div className="timeslot-date-title">
                            Chọn khung giờ — {formatDisplayDate(bookingData.date)}:
                          </div>

                          {timeSlotsQuery.isLoading ? (
                            <div style={{ padding: '8px 0', fontSize: '11px', color: '#888888' }}>
                              Đang tải khung giờ...
                            </div>
                          ) : slotsList.length === 0 ? (
                            <div style={{ padding: '8px 0', fontSize: '11px', color: '#FF9800' }}>
                              Bác sĩ không có lịch làm việc hoặc đã hết giờ trống trong ngày này.
                            </div>
                          ) : (
                            <>
                              {/* Ca sang */}
                              {morningSlots.length > 0 && (
                                <div className="timeslot-shift-group">
                                  <span className="timeslot-shift-label">☀️ Ca sáng</span>
                                  <div className="timeslots-button-grid">
                                    {morningSlots.map((slot) => (
                                      <button
                                        key={slot.id}
                                        type="button"
                                        disabled={slot.status !== 'AVAILABLE'}
                                        className={`timeslot-btn ${bookingData.timeSlot?.id === slot.id ? 'selected' : ''}`}
                                        onClick={() => handleSelectTimeSlot(slot)}
                                      >
                                        {slot.startTime.slice(0, 5)} - {slot.endTime.slice(0, 5)}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Ca chieu */}
                              {afternoonSlots.length > 0 && (
                                <div className="timeslot-shift-group">
                                  <span className="timeslot-shift-label">🌤️ Ca chiều</span>
                                  <div className="timeslots-button-grid">
                                    {afternoonSlots.map((slot) => (
                                      <button
                                        key={slot.id}
                                        type="button"
                                        disabled={slot.status !== 'AVAILABLE'}
                                        className={`timeslot-btn ${bookingData.timeSlot?.id === slot.id ? 'selected' : ''}`}
                                        onClick={() => handleSelectTimeSlot(slot)}
                                      >
                                        {slot.startTime.slice(0, 5)} - {slot.endTime.slice(0, 5)}
                                      </button>
                                    ))}
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

        {/* STEP 3: Patient Profile / Information */}
        {step === 3 && (
          <div className="booking-card">
            <div className="patient-switch-header">
              <h3>Thông tin người được khám</h3>
              
              <button
                type="button"
                className="patient-profile-toggle-btn"
                onClick={() => setBookingData((prev) => ({ 
                  ...prev, 
                  forSelf: !prev.forSelf,
                  patientProfileId: !prev.forSelf ? '' : (relativeProfiles[0]?.id || '')
                }))}
              >
                {bookingData.forSelf ? 'Đổi sang Người thân ✎' : 'Đổi sang Bản thân ✎'}
              </button>
            </div>

            {/* If choosing relative but no profiles exist */}
            {!bookingData.forSelf && relativeProfiles.length === 0 && !patientProfilesQuery.isLoading && (
              <div className="warning-banner" style={{ margin: '0 0 16px', borderColor: '#49BCE2', backgroundColor: '#EBF7FD', color: '#007a9b' }}>
                Bạn chưa đăng ký hồ sơ người thân nào. Bạn có thể đặt cho Bản thân, hoặc vào mục{' '}
                <Link to="/patient/nguoi-than" style={{ fontWeight: 'bold', textDecoration: 'underline', color: '#0092B8' }}>
                  Hồ sơ người thân
                </Link>{' '}
                để thêm mới rồi quay lại đặt lịch.
              </div>
            )}

            <div className="form-container-wizard">
              
              {/* Relative Selector Dropdown */}
              {!bookingData.forSelf && relativeProfiles.length > 0 && (
                <div className="form-group" style={{ marginBottom: 16 }}>
                  <label htmlFor="relativeSelector">Chọn hồ sơ người thân <span>*</span></label>
                  <select
                    id="relativeSelector"
                    className="form-control-select"
                    value={bookingData.patientProfileId}
                    onChange={(e) => setBookingData((prev) => ({ ...prev, patientProfileId: e.target.value }))}
                  >
                    <option value="" disabled>-- Chọn người thân --</option>
                    {relativeProfiles.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.fullName} ({p.relationship === 'SELF' ? 'Bản thân' : p.relationship || 'Khác'})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Patient Fields Display (Prefilled & Read-only to keep profile integrity) */}
              <div className="form-row">
                <div className="form-group">
                  <label>Họ tên <span>*</span></label>
                  <input
                    type="text"
                    className="form-control-input"
                    disabled
                    value={selectedPatientDetails?.fullName || ''}
                    placeholder="Họ và tên bệnh nhân"
                  />
                </div>
                <div className="form-group">
                  <label>Số điện thoại <span>*</span></label>
                  <input
                    type="text"
                    className="form-control-input"
                    disabled
                    value={selectedPatientDetails?.phone || ''}
                    placeholder="Số điện thoại"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group full-width">
                  <label>Email <span>*</span></label>
                  <input
                    type="email"
                    className="form-control-input"
                    disabled
                    value={selectedPatientDetails?.email || ''}
                    placeholder="Địa chỉ Email"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Giới tính <span>*</span></label>
                  <input
                    type="text"
                    className="form-control-input"
                    disabled
                    value={selectedPatientDetails?.gender || ''}
                  />
                </div>
                <div className="form-group">
                  <label>Ngày sinh <span>*</span></label>
                  <input
                    type="text"
                    className="form-control-input"
                    disabled
                    value={selectedPatientDetails?.dateOfBirth || ''}
                    placeholder="dd/mm/yyyy"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group full-width">
                  <label>Địa chỉ</label>
                  <input
                    type="text"
                    className="form-control-input"
                    disabled
                    value={selectedPatientDetails?.address || ''}
                    placeholder="Địa chỉ liên hệ"
                  />
                </div>
              </div>

              {/* Reason for visit (Editable & Required) */}
              <div className="form-row">
                <div className="form-group full-width">
                  <label htmlFor="reasonInput">Lý do khám <span>*</span></label>
                  <textarea
                    id="reasonInput"
                    className="form-control-textarea"
                    placeholder="Mô tả triệu chứng hoặc lý do khám..."
                    value={bookingData.reason}
                    onChange={(e) => setBookingData((prev) => ({ ...prev, reason: e.target.value }))}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: Review Booking Details & Confirm */}
        {step === 4 && (
          <div className="booking-card">
            <h3>Xác nhận thông tin đặt lịch</h3>

            {/* Error Message block */}
            {errorMessage && (
              <div style={{ marginBottom: 16 }}>
                <StateBlock
                  variant="error"
                  title="Đặt lịch không thành công"
                  description={errorMessage}
                />
              </div>
            )}

            {/* Doctor Info */}
            <div className="confirm-section-title">THÔNG TIN BÁC SĨ</div>
            <div className="confirm-details-box">
              <div className="confirm-detail-row">
                <span className="confirm-detail-label">Bác sĩ</span>
                <span className="confirm-detail-val bold-text">{bookingData.doctor?.name}</span>
              </div>
              <div className="confirm-detail-row">
                <span className="confirm-detail-label">Chuyên khoa</span>
                <span className="confirm-detail-val bold-text">{bookingData.specialty?.name}</span>
              </div>
              <div className="confirm-detail-row">
                <span className="confirm-detail-label">Giá khám tham khảo</span>
                <span className="confirm-detail-val bold-text">{formatPrice(bookingData.doctor?.price)}</span>
              </div>
            </div>

            {/* Date time Info */}
            <div className="confirm-section-title">THÔNG TIN LỊCH KHÁM</div>
            <div className="confirm-details-box">
              <div className="confirm-detail-row">
                <span className="confirm-detail-label">Ngày khám</span>
                <span className="confirm-detail-val">{formatDisplayDate(bookingData.date)}</span>
              </div>
              <div className="confirm-detail-row">
                <span className="confirm-detail-label">Giờ khám</span>
                <span className="confirm-detail-val">
                  {bookingData.timeSlot?.startTime.slice(0, 5)} - {bookingData.timeSlot?.endTime.slice(0, 5)}
                </span>
              </div>
            </div>

            {/* Patient Info */}
            <div className="confirm-section-title">THÔNG TIN BỆNH NHÂN</div>
            <div className="confirm-details-box">
              <div className="confirm-detail-row">
                <span className="confirm-detail-label">Người được khám</span>
                <span className="confirm-detail-val">
                  {selectedPatientDetails?.fullName} ({bookingData.forSelf ? 'Bản thân' : 'Người thân'})
                </span>
              </div>
              <div className="confirm-detail-row">
                <span className="confirm-detail-label">Ngày sinh</span>
                <span className="confirm-detail-val">{selectedPatientDetails?.dateOfBirth}</span>
              </div>
              <div className="confirm-detail-row">
                <span className="confirm-detail-label">Giới tính</span>
                <span className="confirm-detail-val">{selectedPatientDetails?.gender}</span>
              </div>
              <div className="confirm-detail-row">
                <span className="confirm-detail-label">Số điện thoại</span>
                <span className="confirm-detail-val">{selectedPatientDetails?.phone}</span>
              </div>
              <div className="confirm-detail-row">
                <span className="confirm-detail-label">Email</span>
                <span className="confirm-detail-val">{selectedPatientDetails?.email}</span>
              </div>
              <div className="confirm-detail-row">
                <span className="confirm-detail-label">Địa chỉ</span>
                <span className="confirm-detail-val">{selectedPatientDetails?.address}</span>
              </div>
              <div className="confirm-detail-row" style={{ alignItems: 'flex-start' }}>
                <span className="confirm-detail-label" style={{ paddingTop: '2px' }}>Lý do khám</span>
                <span className="confirm-detail-val" style={{ maxWidth: '70%', wordBreak: 'break-word' }}>
                  {bookingData.reason}
                </span>
              </div>
            </div>

            {/* Yellow Disclaimer Banner */}
            <div className="warning-banner">
              Chi phí chỉ mang tính tham khảo. Bệnh nhân thanh toán trực tiếp tại quầy khi đến khám.
            </div>
          </div>
        )}

        {/* STEP 5: Success Screen */}
        {step === 5 && (
          <div className="booking-card success-card-content">
            <div className="success-icon-circle">✓</div>
            <h2 className="success-title">Đặt lịch thành công</h2>
            <div className="success-badge">ĐÃ XÁC NHẬN</div>

            <div className="success-receipt-box">
              <div className="receipt-row">
                <span className="receipt-label">Mã lịch hẹn</span>
                <span className="receipt-value highlight-code">
                  {bookingResult?.code || 'CP' + Math.floor(1000000000 + Math.random() * 9000000000)}
                </span>
              </div>
              <div className="receipt-row">
                <span className="receipt-label">Người được khám</span>
                <span className="receipt-value">
                  {selectedPatientDetails?.fullName} ({bookingData.forSelf ? 'Bản thân' : 'Người thân'})
                </span>
              </div>
              <div className="receipt-row">
                <span className="receipt-label">Ngày sinh</span>
                <span className="receipt-value">{selectedPatientDetails?.dateOfBirth}</span>
              </div>
              <div className="receipt-row">
                <span className="receipt-label">Giới tính</span>
                <span className="receipt-value">{selectedPatientDetails?.gender}</span>
              </div>
              <div className="receipt-row">
                <span className="receipt-label">Số điện thoại</span>
                <span className="receipt-value">{selectedPatientDetails?.phone}</span>
              </div>
              <div className="receipt-row">
                <span className="receipt-label">Bác sĩ</span>
                <span className="receipt-value">{bookingData.doctor?.name}</span>
              </div>
              <div className="receipt-row">
                <span className="receipt-label">Chuyên khoa</span>
                <span className="receipt-value">{bookingData.specialty?.name}</span>
              </div>
              <div className="receipt-row">
                <span className="receipt-label">Ngày giờ khám</span>
                <span className="receipt-value">
                  {formatDisplayDate(bookingData.date)} — {bookingData.timeSlot?.startTime.slice(0, 5)} - {bookingData.timeSlot?.endTime.slice(0, 5)}
                </span>
              </div>
              <div className="receipt-row">
                <span className="receipt-label">Trạng thái</span>
                <span className="receipt-value green-text">Đã xác nhận</span>
              </div>
            </div>

            <div className="success-email-notice">
              📧 Email xác nhận đã được gửi đến {selectedPatientDetails?.email}.
            </div>

            <div className="success-actions">
              <Link to="/patient/lich-hen" className="btn-primary-action">
                Xem chi tiết lịch hẹn
              </Link>
              <button 
                type="button" 
                className="btn-outline-action"
                onClick={handleResetBooking}
              >
                Đặt lịch mới
              </button>
              <Link to="/patient/lich-hen" className="btn-grey-action">
                Quay về Quản lý lịch hẹn
              </Link>
            </div>
          </div>
        )}

        {/* Wizard Navigation Footer Actions (Step 1-4 only) */}
        {step < 5 && (
          <div className="wizard-footer-actions">
            <button
              type="button"
              className="btn-wizard-back"
              disabled={step === 1}
              onClick={handlePrevStep}
            >
              <span>←</span> Quay lại
            </button>
            
            {step === 4 ? (
              <button
                type="button"
                className="btn-confirm-booking"
                disabled={bookMutation.isPending}
                onClick={handleConfirmBooking}
              >
                {bookMutation.isPending ? 'Đang đặt lịch...' : 'Xác nhận đặt lịch'}
              </button>
            ) : (
              <button
                type="button"
                className="btn-wizard-next"
                disabled={
                  (step === 1 && !bookingData.specialty) ||
                  (step === 2 && (!bookingData.doctor || !bookingData.timeSlot)) ||
                  (step === 3 && (
                    (!bookingData.forSelf && !bookingData.patientProfileId) ||
                    !bookingData.reason.trim()
                  ))
                }
                onClick={handleNextStep}
              >
                Tiếp theo <span>→</span>
              </button>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
