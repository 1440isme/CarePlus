import { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
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
import '../public/booking-wizard.css';

export default function ReceptionistBookingPage() {
  const [step, setStep] = useState(1);
  const [patientSearch, setPatientSearch] = useState('');
  const [successBookingData, setSuccessBookingData] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});
  const [stepError, setStepError] = useState(null);
  const [specialtySearch, setSpecialtySearch] = useState('');
  const [doctorSearch, setDoctorSearch] = useState('');

  const ErrorBanner = () => {
    if (!stepError) return null;
    return (
      <div style={{
        backgroundColor: '#FEE2E2',
        color: '#DC2626',
        border: '1.5px solid #FCA5A5',
        padding: '12px 16px',
        borderRadius: '8px',
        marginBottom: '20px',
        fontSize: '0.9rem',
        fontWeight: 600,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        animation: 'fadeIn 0.2s ease-out'
      }}>
        <span>⚠️ {stepError}</span>
        <button 
          type="button" 
          onClick={() => setStepError(null)}
          style={{ background: 'none', border: 'none', color: '#DC2626', cursor: 'pointer', fontWeight: 'bold', fontSize: '1.1rem', padding: 0 }}
        >
          ✕
        </button>
      </div>
    );
  };

  // Core Booking State
  const [bookingData, setBookingData] = useState({
    specialty: null,      // Selected specialty object
    doctor: null,         // Selected doctor object
    date: new Date().toLocaleDateString('sv').slice(0, 10), // Selected date YYYY-MM-DD
    timeSlot: null,       // Selected timeslot object
    patientUser: null,    // Selected patient user object
    forSelf: true,
    patientProfileId: '', // Selected relative profile ID (if forSelf === false)
    name: '',
    phone: '',
    email: '',
    gender: 'MALE',
    dateOfBirth: '',
    address: '',
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

  // Helper component for required asterisk in form labels
  const Req = () => <span style={{ color: '#EF4444', marginLeft: 2 }}>*</span>;

  // Patient-matching input styling constant
  const inp = {
    width: '100%',
    padding: '8px 12px',
    border: '1px solid #ddd',
    borderRadius: 6,
    fontSize: 13,
    fontFamily: 'inherit',
    outline: 'none',
    backgroundColor: '#fff'
  };

  // Patient-matching label styling constant
  const lbl = {
    display: 'block',
    fontSize: '12px',
    color: '#555',
    marginBottom: '4px',
    fontWeight: 500,
    fontFamily: 'inherit'
  };

  const handleSelectSpecialty = (specialty) => {
    setBookingData((prev) => ({
      ...prev,
      specialty,
      doctor: null, // Reset doctor when specialty changes
      timeSlot: null
    }));
    setStepError(null);
  };

  const handleSelectDoctor = (doctor) => {
    setBookingData((prev) => ({
      ...prev,
      doctor,
      timeSlot: null // Reset slot when doctor changes
    }));
    setStepError(null);
  };

  const handleSelectDate = (dateStr) => {
    setBookingData((prev) => ({
      ...prev,
      date: dateStr,
      timeSlot: null // Reset slot when date changes
    }));
    setStepError(null);
  };

  const handleSelectTimeSlot = (timeSlot) => {
    setBookingData((prev) => ({
      ...prev,
      timeSlot
    }));
    setStepError(null);
  };

  const handleSelectPatientUser = (patientUser) => {
    setBookingData((prev) => ({
      ...prev,
      patientUser,
      forSelf: true,
      patientProfileId: '',
      name: patientUser.name || '',
      phone: patientUser.phone || '',
      email: patientUser.email || '',
      gender: patientUser.gender || 'MALE',
      dateOfBirth: patientUser.dateOfBirth || '',
      address: patientUser.address || '',
    }));
    setPatientSearch('');
  };



  const handleStepSubmit = async () => {
    setStepError(null);
    if (step === 1) {
      if (!bookingData.specialty) {
        setStepError('Vui lòng chọn chuyên khoa để tiếp tục.');
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (!bookingData.doctor) {
        setStepError('Vui lòng chọn bác sĩ để tiếp tục.');
        return;
      }
      if (!bookingData.timeSlot) {
        setStepError('Vui lòng chọn khung giờ khám để tiếp tục.');
        return;
      }
      setStep(3);
    } else if (step === 3) {
      const newErrors = {};
      if (!bookingData.name.trim()) {
        newErrors.name = 'Họ tên bệnh nhân không được để trống';
      }
      if (!bookingData.phone.trim()) {
        newErrors.phone = 'Số điện thoại không được để trống';
      } else if (!/^(0|\+84)(3|5|7|8|9)\d{8}$/.test(bookingData.phone.trim())) {
        newErrors.phone = 'Số điện thoại không hợp lệ';
      }
      if (bookingData.email.trim()) {
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(bookingData.email.trim())) {
          newErrors.email = 'Email không hợp lệ';
        }
      }
      if (!bookingData.dateOfBirth) {
        newErrors.dateOfBirth = 'Vui lòng chọn ngày sinh';
      }
      if (!bookingData.reason.trim()) {
        newErrors.reason = 'Vui lòng nhập triệu chứng & lý do khám bệnh';
      }

      if (Object.keys(newErrors).length > 0) {
        setValidationErrors(newErrors);
        setStepError('Vui lòng điền đầy đủ các thông tin bắt buộc màu đỏ phía dưới.');
        return;
      }
      setValidationErrors({});
      setStep(4);
    } else if (step === 4) {
      if (bookMutation.isPending) return;
      // Execute booking request
      try {
        const payload = {
          patientId: bookingData.patientUser?.id || undefined,
          name: bookingData.name.trim(),
          phone: bookingData.phone.trim(),
          email: bookingData.email.trim() || undefined,
          gender: bookingData.gender,
          dateOfBirth: bookingData.dateOfBirth,
          address: bookingData.address.trim() || undefined,
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
        setStepError(`Lỗi đặt lịch: ${error.message || 'Đã có lỗi xảy ra'}`);
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
      name: '',
      phone: '',
      email: '',
      gender: 'MALE',
      dateOfBirth: '',
      address: '',
      reason: '',
      note: ''
    });
    setSuccessBookingData(null);
    setStepError(null);
    setValidationErrors({});
    setSpecialtySearch('');
    setDoctorSearch('');
    setStep(1);
  };

  // Autocomplete patient matches
  const patientMatches = searchPatientsQuery.data?.data || [];

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

  // Automatically select the first doctor in Step 2 if none is selected
  useEffect(() => {
    if (step === 2 && doctorsList.length > 0 && !bookingData.doctor) {
      handleSelectDoctor(doctorsList[0]);
    }
  }, [step, doctorsList, bookingData.doctor]);

  return (
    <div className={`booking-wizard-container receptionist-page ${step === 5 ? 'step-5-layout' : ''}`}>
      {/* Title Section (Hide in step 5) */}
      {step < 5 && (
        <div className="booking-title-section" style={{ marginBottom: 20 }}>
          <h1>Đặt lịch khám</h1>
          <p>Đăng ký lịch khám và đặt lịch khám hộ bệnh nhân tại quầy</p>
        </div>
      )}

      {/* Stepper Progress bar (Hide in step 5) */}
      {step < 5 && (
        <div className="booking-stepper">
          <div className={`step-item ${step === 1 ? 'active' : step > 1 ? 'completed' : ''}`}>
            <div className="step-node">
              <div className="step-circle">{step > 1 ? '✓' : '1'}</div>
              <div className="step-label">Chuyên khoa</div>
            </div>
          </div>
          <div className="step-line"></div>

          <div className={`step-item ${step === 2 ? 'active' : step > 2 ? 'completed' : ''}`}>
            <div className="step-node">
              <div className="step-circle">{step > 2 ? '✓' : '2'}</div>
              <div className="step-label">Bác sĩ & Lịch</div>
            </div>
          </div>
          <div className="step-line"></div>

          <div className={`step-item ${step === 3 ? 'active' : step > 3 ? 'completed' : ''}`}>
            <div className="step-node">
              <div className="step-circle">{step > 3 ? '✓' : '3'}</div>
              <div className="step-label">Bệnh nhân</div>
            </div>
          </div>
          <div className="step-line"></div>

          <div className={`step-item ${step === 4 ? 'active' : step > 4 ? 'completed' : ''}`}>
            <div className="step-node">
              <div className="step-circle">{step > 4 ? '✓' : '4'}</div>
              <div className="step-label">Xác nhận</div>
            </div>
          </div>
        </div>
      )}

      {/* STEP 1: CHỌN CHUYÊN KHOA */}
      {step === 1 && (
        <div className="booking-card">
          <h3>Chọn chuyên khoa</h3>
          <ErrorBanner />

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
            <LoadingBlock label="Đang tải danh sách chuyên khoa..." />
          ) : specialtiesQuery.error ? (
            <StateBlock
              variant="error"
              title="Lỗi tải chuyên khoa"
              description={specialtiesQuery.error.message}
            />
          ) : specialtiesList.length === 0 ? (
            <StateBlock
              variant="empty"
              title="Không tìm thấy chuyên khoa"
              description="Không tìm thấy chuyên khoa nào phù hợp với từ khóa tìm kiếm."
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
                    {spec.doctorCount ? `${spec.doctorCount} bác sĩ` : ''}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* STEP 2: BÁC SĨ & LỊCH */}
      {step === 2 && (
        <div className="booking-card">
          <h3>Xem lịch làm việc và chọn khung giờ</h3>
          <ErrorBanner />

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
          ) : doctorsQuery.error ? (
            <StateBlock
              variant="error"
              title="Lỗi tải danh sách bác sĩ"
              description={doctorsQuery.error.message}
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

      {/* STEP 3: THÔNG TIN BỆNH NHÂN */}
      {step === 3 && (
        <div className="booking-card">
          <h3>Thông tin bệnh nhân</h3>
          <ErrorBanner />

          {/* Quick search input */}
          <div className="patient-search-container">
            <label htmlFor="patientSearchInput" style={lbl}>
              Tra cứu nhanh bệnh nhân hoặc người nhà
            </label>
            
            <div className="patient-search-input-wrapper">
              <span className="search-icon">🔍</span>
              {bookingData.patientUser ? (
                <>
                  <input
                    type="text"
                    disabled
                    className="patient-search-input selected"
                    value={
                      bookingData.forSelf
                        ? `${bookingData.patientUser.name} (Bệnh nhân chính)`
                        : `${selectedProfile?.fullName || 'Người thân'} (Người thân của ${bookingData.patientUser.name})`
                    }
                    style={{
                      ...inp,
                      paddingLeft: '30px',
                      paddingRight: '30px',
                      backgroundColor: '#F9FAFB',
                      cursor: 'not-allowed',
                      color: '#555',
                      fontWeight: 500
                    }}
                  />
                  <button
                    type="button"
                    className="clear-search-btn"
                    onClick={() => {
                      setBookingData((prev) => ({
                        ...prev,
                        patientUser: null,
                        forSelf: true,
                        patientProfileId: '',
                        name: '',
                        phone: '',
                        email: '',
                        gender: 'MALE',
                        dateOfBirth: '',
                        address: '',
                      }));
                      setPatientSearch('');
                    }}
                  >
                    ✕
                  </button>
                </>
              ) : (
                <input
                  id="patientSearchInput"
                  type="text"
                  className="patient-search-input"
                  placeholder="Nhập tên, số điện thoại hoặc email để tra cứu..."
                  value={patientSearch}
                  onChange={(e) => setPatientSearch(e.target.value)}
                  style={{
                    ...inp,
                    paddingLeft: '30px'
                  }}
                />
              )}
            </div>

            {/* Autocomplete dropdown suggestion */}
            {!bookingData.patientUser && patientSearch.trim().length >= 2 && (
              <div className="patient-autocomplete-dropdown">
                {searchPatientsQuery.isLoading ? (
                  <div style={{ padding: '12px', textAlign: 'center' }} className="helper-text">Đang tra cứu bệnh nhân...</div>
                ) : searchPatientsQuery.error ? (
                  <div style={{ padding: '12px', textAlign: 'center', color: 'var(--danger)', fontWeight: 600 }} className="helper-text">
                    Lỗi tra cứu: {searchPatientsQuery.error.message}
                  </div>
                ) : patientMatches.length === 0 ? (
                  <div style={{ padding: '12px', textAlign: 'center' }} className="helper-text">Không tìm thấy bệnh nhân nào khớp.</div>
                ) : (
                  patientMatches.flatMap((p) => {
                    const items = [];
                    // 1. Patient Option
                    items.push(
                      <div
                        key={`user-${p.id}`}
                        className="patient-autocomplete-item"
                        onClick={() => handleSelectPatientUser(p)}
                      >
                        <div className="patient-item-name">👤 {p.name} (Bệnh nhân chính)</div>
                        <div className="patient-item-meta">
                          SĐT: {p.phone || 'N/A'} · Email: {p.email}
                        </div>
                      </div>
                    );

                    // 2. Relative Options
                    p.profiles?.forEach((profile) => {
                      items.push(
                        <div
                          key={`profile-${profile.id}`}
                          className="patient-autocomplete-item patient-profile-item"
                          style={{ paddingLeft: '28px', backgroundColor: '#FDFDFD' }}
                          onClick={() => {
                            setBookingData((prev) => ({
                              ...prev,
                              patientUser: p,
                              forSelf: false,
                              patientProfileId: profile.id,
                              name: profile.fullName || '',
                              phone: profile.phone || p.phone || '',
                              email: profile.email || p.email || '',
                              gender: profile.gender || 'MALE',
                              dateOfBirth: profile.dateOfBirth ? profile.dateOfBirth.slice(0, 10) : '',
                              address: profile.address || p.address || '',
                            }));
                            setPatientSearch('');
                            setStepError(null);
                            setValidationErrors({});
                          }}
                        >
                          <div className="patient-item-name" style={{ fontSize: '0.85rem', color: '#555' }}>
                            👥 {profile.fullName} (Người thân: {profile.relationship === 'PARENT' ? 'Bố/Mẹ' : profile.relationship === 'CHILD' ? 'Con' : profile.relationship === 'SPOUSE' ? 'Vợ/Chồng' : 'Khác'})
                          </div>
                          <div className="patient-item-meta" style={{ fontSize: '0.75rem' }}>
                            SĐT: {profile.phone || p.phone || 'N/A'} · Email: {profile.email || p.email || 'N/A'}
                          </div>
                        </div>
                      );
                    });
                    return items;
                  })
                )}
              </div>
            )}
          </div>

          {/* Patient Form Fields (Always Visible & Editable) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: '20px' }}>
            
            {/* Họ tên + SĐT */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label htmlFor="patientNameInput" style={lbl}>Họ tên bệnh nhân<Req /></label>
                <input
                  id="patientNameInput"
                  type="text"
                  placeholder="Nhập họ tên bệnh nhân..."
                  value={bookingData.name}
                  onChange={(e) => {
                    setBookingData(prev => ({ ...prev, name: e.target.value }));
                    setStepError(null);
                    if (validationErrors.name) {
                      setValidationErrors(prev => ({ ...prev, name: null }));
                    }
                  }}
                  style={{
                    ...inp,
                    ...(validationErrors.name ? { borderColor: '#EF4444', backgroundColor: '#FEF2F2' } : {})
                  }}
                />
              </div>

              <div>
                <label htmlFor="patientPhoneInput" style={lbl}>Số điện thoại<Req /></label>
                <input
                  id="patientPhoneInput"
                  type="text"
                  placeholder="Nhập số điện thoại..."
                  value={bookingData.phone}
                  onChange={(e) => {
                    setBookingData(prev => ({ ...prev, phone: e.target.value }));
                    setStepError(null);
                    if (validationErrors.phone) {
                      setValidationErrors(prev => ({ ...prev, phone: null }));
                    }
                  }}
                  style={{
                    ...inp,
                    ...(validationErrors.phone ? { borderColor: '#EF4444', backgroundColor: '#FEF2F2' } : {})
                  }}
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label htmlFor="patientEmailInput" style={lbl}>Email tài khoản</label>
              <input
                id="patientEmailInput"
                type="email"
                placeholder="Nhập email tài khoản (không bắt buộc)..."
                value={bookingData.email}
                onChange={(e) => {
                  setBookingData(prev => ({ ...prev, email: e.target.value }));
                  setStepError(null);
                  if (validationErrors.email) {
                    setValidationErrors(prev => ({ ...prev, email: null }));
                  }
                }}
                style={{
                  ...inp,
                  ...(validationErrors.email ? { borderColor: '#EF4444', backgroundColor: '#FEF2F2' } : {})
                }}
              />
            </div>

            {/* Giới tính + Ngày sinh */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label htmlFor="patientGenderSelect" style={lbl}>Giới tính<Req /></label>
                <select
                  id="patientGenderSelect"
                  value={bookingData.gender}
                  onChange={(e) => {
                    setBookingData(prev => ({ ...prev, gender: e.target.value }));
                    setStepError(null);
                  }}
                  style={inp}
                >
                  <option value="MALE">Nam</option>
                  <option value="FEMALE">Nữ</option>
                  <option value="OTHER">Khác</option>
                </select>
              </div>

              <div>
                <label htmlFor="patientDobInput" style={lbl}>Ngày sinh<Req /></label>
                <input
                  id="patientDobInput"
                  type="date"
                  value={bookingData.dateOfBirth}
                  onChange={(e) => {
                    setBookingData(prev => ({ ...prev, dateOfBirth: e.target.value }));
                    setStepError(null);
                    if (validationErrors.dateOfBirth) {
                      setValidationErrors(prev => ({ ...prev, dateOfBirth: null }));
                    }
                  }}
                  style={{
                    ...inp,
                    ...(validationErrors.dateOfBirth ? { borderColor: '#EF4444', backgroundColor: '#FEF2F2' } : {})
                  }}
                />
              </div>
            </div>

            {/* Địa chỉ */}
            <div>
              <label htmlFor="patientAddressInput" style={lbl}>Địa chỉ</label>
              <input
                id="patientAddressInput"
                type="text"
                placeholder="Nhập địa chỉ..."
                value={bookingData.address}
                onChange={(e) => {
                  setBookingData(prev => ({ ...prev, address: e.target.value }));
                  setStepError(null);
                }}
                style={inp}
              />
            </div>

            {/* Lý do khám */}
            <div>
              <label htmlFor="reasonTextarea" style={lbl}>Triệu chứng & Lý do khám bệnh<Req /></label>
              <textarea
                id="reasonTextarea"
                rows={3}
                placeholder="Mô tả triệu chứng chính hoặc lý do đến khám..."
                value={bookingData.reason}
                onChange={(e) => {
                  setBookingData((prev) => ({ ...prev, reason: e.target.value }));
                  setStepError(null);
                  if (validationErrors.reason) {
                    setValidationErrors(prev => ({ ...prev, reason: null }));
                  }
                }}
                style={{
                  ...inp,
                  resize: 'none',
                  minHeight: '76px',
                  ...(validationErrors.reason ? { borderColor: '#EF4444', backgroundColor: '#FEF2F2' } : {})
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* STEP 4: XÁC NHẬN */}
      {step === 4 && (
        <div className="booking-card">
          <h3>Xác nhận đặt lịch</h3>
          <ErrorBanner />

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
                {bookingData.name} {bookingData.patientUser ? (bookingData.forSelf ? '(Bệnh nhân chính)' : '(Người thân)') : ''}
              </span>
            </div>
            <div className="confirm-detail-row">
              <span className="confirm-detail-label">Ngày sinh</span>
              <span className="confirm-detail-val">
                {bookingData.dateOfBirth ? formatDisplayDate(bookingData.dateOfBirth) : '—'}
              </span>
            </div>
            <div className="confirm-detail-row">
              <span className="confirm-detail-label">Giới tính</span>
              <span className="confirm-detail-val">
                {bookingData.gender === 'MALE' ? 'Nam' : bookingData.gender === 'FEMALE' ? 'Nữ' : 'Khác'}
              </span>
            </div>
            <div className="confirm-detail-row">
              <span className="confirm-detail-label">Số điện thoại</span>
              <span className="confirm-detail-val">{bookingData.phone}</span>
            </div>
            <div className="confirm-detail-row">
              <span className="confirm-detail-label">Email</span>
              <span className="confirm-detail-val">{bookingData.email || '—'}</span>
            </div>
            <div className="confirm-detail-row">
              <span className="confirm-detail-label">Địa chỉ</span>
              <span className="confirm-detail-val">{bookingData.address || '—'}</span>
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

      {/* STEP 5: ĐẶT LỊCH THÀNH CÔNG */}
      {step === 5 && successBookingData && (
        <div className="booking-card success-card-content">
          <div className="success-icon-circle">✓</div>
          <h2 className="success-title">Đặt lịch thành công</h2>
          <div className="success-badge">ĐÃ XÁC NHẬN</div>

          <div className="success-receipt-box">
            <div className="receipt-row">
              <span className="receipt-label">Mã lịch hẹn</span>
              <span className="receipt-value highlight-code">
                {successBookingData.code}
              </span>
            </div>
            <div className="receipt-row">
              <span className="receipt-label">Người được khám</span>
              <span className="receipt-value">
                {successBookingData.name} {successBookingData.patientUser ? (successBookingData.forSelf ? '(Bản thân)' : '(Người thân)') : ''}
              </span>
            </div>
            <div className="receipt-row">
              <span className="receipt-label">Ngày sinh</span>
              <span className="receipt-value">
                {successBookingData.dateOfBirth ? formatDisplayDate(successBookingData.dateOfBirth) : '—'}
              </span>
            </div>
            <div className="receipt-row">
              <span className="receipt-label">Giới tính</span>
              <span className="receipt-value">
                {successBookingData.gender === 'MALE' ? 'Nam' : successBookingData.gender === 'FEMALE' ? 'Nữ' : 'Khác'}
              </span>
            </div>
            <div className="receipt-row">
              <span className="receipt-label">Số điện thoại</span>
              <span className="receipt-value">{successBookingData.phone}</span>
            </div>
            <div className="receipt-row">
              <span className="receipt-label">Bác sĩ</span>
              <span className="receipt-value">{successBookingData.doctor?.name}</span>
            </div>
            <div className="receipt-row">
              <span className="receipt-label">Chuyên khoa</span>
              <span className="receipt-value">{successBookingData.specialty?.name}</span>
            </div>
            <div className="receipt-row">
              <span className="receipt-label">Ngày giờ khám</span>
              <span className="receipt-value">
                {formatDisplayDate(successBookingData.date)} — {successBookingData.timeSlot?.startTime.slice(0, 5)} - {successBookingData.timeSlot?.endTime.slice(0, 5)}
              </span>
            </div>
            <div className="receipt-row">
              <span className="receipt-label">Trạng thái</span>
              <span className="receipt-value green-text">Đã xác nhận</span>
            </div>
          </div>

          {successBookingData.email && (
            <div className="success-email-notice">
              📧 Email xác nhận đã được gửi đến {successBookingData.email}.
            </div>
          )}

          <div className="success-actions">
            <button 
              type="button" 
              className="btn-primary-action"
              onClick={handleResetBooking}
            >
              Đặt lịch mới
            </button>
            <Link to="/portal/le-tan/lich-hen" className="btn-outline-action">
              Quản lý lịch hẹn
            </Link>
            <Link to="/portal/le-tan" className="btn-grey-action">
              Quay về Tổng quan
            </Link>
          </div>
        </div>
      )}

      {/* Stepper Footer actions */}
      {step < 5 && (
        <div className="wizard-footer-actions">
          <button
            type="button"
            className="btn-wizard-back"
            disabled={step === 1 || bookMutation.isPending}
            onClick={() => {
              setStepError(null);
              setValidationErrors({});
              setStep(s => s - 1);
            }}
          >
            <span>←</span> Quay lại
          </button>

          {step === 4 ? (
            <button
              type="button"
              className="btn-confirm-booking"
              disabled={bookMutation.isPending}
              onClick={handleStepSubmit}
            >
              {bookMutation.isPending ? 'Đang đặt lịch...' : 'Xác nhận đặt lịch'}
            </button>
          ) : (
            <button
              type="button"
              className="btn-wizard-next"
              onClick={handleStepSubmit}
            >
              Tiếp theo <span>→</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
