import { useState, useMemo, useEffect, Fragment, useRef } from 'react';
import { Heart, Bone, Baby, Sparkles, Activity, HeartPulse, Stethoscope, Ear } from 'lucide-react';
import { Link } from 'react-router-dom';
import '../public/booking-wizard.css';
import { useSpecialties } from '../../features/specialty/hooks/useSpecialties.js';
import { useDoctorList } from '../../features/doctor/hooks/useDoctorList.js';
import { useTimeSlots } from '../../features/timeslot/hooks/useTimeSlots.js';
import { useBookingRules } from '../../features/admin/clinic-settings/hooks/useBookingRules.js';
import {
  buildVirtualSlotsForSchedules,
  filterSlotGroupsBySchedules,
  mergePersistedSlots,
} from '../../features/timeslot/virtual-slot.service.js';
import { useSearchPatients, useBookAppointmentByReceptionist } from '../../features/appointment/hooks/useAppointments.js';
import LoadingBlock from '../../shared/components/feedback/LoadingBlock.jsx';
import StateBlock from '../../shared/components/feedback/StateBlock.jsx';

const specialtyIconMap = {
  Heart: <Heart className="w-5 h-5" />,
  Bone: <Bone className="w-5 h-5" />,
  Baby: <Baby className="w-5 h-5" />,
  Sparkles: <Sparkles className="w-5 h-5" />,
  Activity: <Activity className="w-5 h-5" />,
  HeartPulse: <HeartPulse className="w-5 h-5" />,
  Stethoscope: <Stethoscope className="w-5 h-5" />,
  Ear: <Ear className="w-5 h-5" />,
};

const colorClasses = [
  'bg-red-50 text-red-600',
  'bg-blue-50 text-blue-600',
  'bg-green-50 text-green-600',
  'bg-purple-50 text-purple-600',
  'bg-amber-50 text-amber-600',
  'bg-pink-50 text-pink-600',
  'bg-cyan-50 text-cyan-600',
  'bg-indigo-50 text-indigo-600',
];

export default function ReceptionistBookingPage() {
  const [step, setStep] = useState(1);
  const [patientSearch, setPatientSearch] = useState('');
  const [successBookingData, setSuccessBookingData] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});
  const [stepError, setStepError] = useState(null);
  const [specialtySearch, setSpecialtySearch] = useState('');
  const [doctorSearch, setDoctorSearch] = useState('');

  // Core Booking State
  const [bookingData, setBookingData] = useState({
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

  const [dobInputVal, setDobInputVal] = useState('');
  const nativeDobPickerRef = useRef(null);

  const parseDisplayDateToIso = (displayStr) => {
    if (!displayStr) return '';
    const parts = displayStr.trim().split('/');
    if (parts.length !== 3) return '';
    const [d, m, y] = parts;
    const day = d.padStart(2, '0');
    const month = m.padStart(2, '0');
    const year = y;
    if (day.length !== 2 || month.length !== 2 || year.length !== 4) return '';
    return `${year}-${month}-${day}`;
  };

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

  // Next Days list for Step 2 (based on system settings)
  const next7Days = useMemo(() => {
    const dates = [];
    const weekdays = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
    const limit = systemSettingsResponse?.data?.maxBookingDaysAhead || 7;
    for (let i = 0; i < limit; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      const dayNum = d.getDate();
      const dayLabel = i === 0 ? 'Hôm nay' : weekdays[d.getDay()];
      const dateStr = d.toLocaleDateString('sv').slice(0, 10);
      dates.push({ dateStr, dayLabel, dayNum });
    }
    return dates;
  }, [systemSettingsResponse?.data?.maxBookingDaysAhead]);



  // Format date display (e.g. 14/06/2026)
  const formatDisplayDate = (dateStr) => {
    if (!dateStr) return '';
    const cleanDateStr = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr;
    const parts = cleanDateStr.split('-');
    if (parts.length !== 3) return dateStr;
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  };

  // Format price (e.g. 350,000đ)
  const formatPrice = (price) => {
    if (price === undefined || price === null) return '0đ';
    return price.toLocaleString('vi-VN') + 'đ';
  };

  // Helper component for required asterisk
  const Req = () => <span className="text-red-500 ml-0.5">*</span>;

  const handleSelectSpecialty = (specialty) => {
    setBookingData((prev) => ({
      ...prev,
      specialty,
      doctor: null,
      timeSlot: null
    }));
    setStepError(null);
  };

  const handleSelectDoctor = (doctor) => {
    setBookingData((prev) => ({
      ...prev,
      doctor,
      timeSlot: null
    }));
    setStepError(null);
  };

  const handleSelectDate = (dateStr) => {
    setBookingData((prev) => ({
      ...prev,
      date: dateStr,
      timeSlot: null
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
    const dob = patientUser.dateOfBirth ? patientUser.dateOfBirth.slice(0, 10) : '';
    setBookingData((prev) => ({
      ...prev,
      patientUser,
      forSelf: true,
      patientProfileId: '',
      name: patientUser.name || '',
      phone: patientUser.phone || '',
      email: patientUser.email || '',
      gender: patientUser.gender || 'MALE',
      dateOfBirth: dob,
      address: patientUser.address || '',
    }));
    if (dob) {
      const [y, m, d] = dob.split('-');
      setDobInputVal(`${d}/${m}/${y}`);
    } else {
      setDobInputVal('');
    }
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
      if (bookingData.phone.trim()) {
        if (!/^(0|\+84)(3|5|7|8|9)\d{8}$/.test(bookingData.phone.trim())) {
          newErrors.phone = 'Số điện thoại không hợp lệ';
        }
      }
      if (bookingData.email.trim()) {
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(bookingData.email.trim())) {
          newErrors.email = 'Email không hợp lệ';
        }
      }
      if (!dobInputVal.trim()) {
        newErrors.dateOfBirth = 'Vui lòng chọn ngày sinh';
      } else {
        const isoDate = parseDisplayDateToIso(dobInputVal);
        if (!isoDate) {
          newErrors.dateOfBirth = 'Ngày sinh không đúng định dạng dd/mm/yyyy';
        } else {
          const [year, month, day] = isoDate.split('-').map(Number);
          const parsedDate = new Date(year, month - 1, day);
          const today = new Date();
          today.setHours(23, 59, 59, 999);

          if (
            parsedDate.getFullYear() !== year ||
            parsedDate.getMonth() !== month - 1 ||
            parsedDate.getDate() !== day
          ) {
            newErrors.dateOfBirth = 'Ngày sinh không hợp lệ';
          } else if (parsedDate > today) {
            newErrors.dateOfBirth = 'Ngày sinh không được ở trong tương lai';
          } else {
            bookingData.dateOfBirth = isoDate;
          }
        }
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

        setSuccessBookingData({
          ...bookingData,
          code: response.data?.code || 'CP' + Math.floor(100000000 + Math.random() * 900000000),
          id: response.data?.id
        });

        setStep(5);
      } catch (error) {
        const msg = error.response?.data?.error?.message ||
          error.message ||
          'Đã có lỗi xảy ra';
        setStepError(`Lỗi đặt lịch: ${msg}`);
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
    setDobInputVal('');
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

  // Active timeslots list
  const slotData = timeSlotsQuery.data?.data || null;
  const slotGroups = useMemo(() => {
    const schedules = slotData?.schedules || [];
    if (schedules.length === 0) {
      return { morning: [], afternoon: [] };
    }
    return mergePersistedSlots(
      filterSlotGroupsBySchedules(buildVirtualSlotsForSchedules(systemSettingsResponse?.data, schedules), schedules),
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

  // Automatically select first doctor in Step 2
  useEffect(() => {
    if (step === 2 && doctorsList.length > 0 && !bookingData.doctor) {
      handleSelectDoctor(doctorsList[0]);
    }
  }, [step, doctorsList, bookingData.doctor]);

  // ─── Shared input class ────────────────────────────────────────────────────
  const inputCls = (hasError) =>
    `w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#49BCE2] bg-white font-inherit transition disabled:bg-gray-50 disabled:cursor-not-allowed disabled:text-gray-500 ${hasError
      ? 'border-red-400 bg-red-50'
      : 'border-gray-200'
    }`;

  // ─── Error Banner ──────────────────────────────────────────────────────────
  const ErrorBanner = () => {
    if (!stepError) return null;
    return (
      <div className="flex items-center justify-between gap-3 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 mb-5 text-sm font-semibold">
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <circle cx="12" cy="12" r="10" strokeWidth="2" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01" />
          </svg>
          <span>{stepError}</span>
        </div>
        <button
          type="button"
          onClick={() => setStepError(null)}
          className="text-red-400 hover:text-red-600 transition shrink-0"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    );
  };

  // ─── Step indicator config ─────────────────────────────────────────────────
  const STEPS = [
    { num: 1, label: 'Chuyên khoa' },
    { num: 2, label: 'Bác sĩ & Lịch' },
    { num: 3, label: 'Bệnh nhân' },
    { num: 4, label: 'Xác nhận' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-6">
      <div className="max-w-3xl mx-auto space-y-5">

        {/* Stepper Progress bar */}
        {step < 5 && (
          <div className="booking-stepper">
            {STEPS.map((s, idx) => (
              <Fragment key={s.num}>
                <div className={`step-item ${step === s.num ? 'active' : step > s.num ? 'completed' : ''}`}>
                  <div className="step-node">
                    <div className="step-circle">
                      {step > s.num ? '✓' : s.num}
                    </div>
                    <div className="step-label">{s.label}</div>
                  </div>
                </div>
                {idx < STEPS.length - 1 && <div className="step-line"></div>}
              </Fragment>
            ))}
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════ */}
        {/* STEP 1: CHỌN CHUYÊN KHOA                                       */}
        {/* ════════════════════════════════════════════════════════════════ */}
        {step === 1 && (
          <div className="bg-white border border-gray-200 rounded-xl shadow-xs p-6">
            <h2 className="text-base font-bold text-gray-800 mb-4">Chọn chuyên khoa</h2>
            <ErrorBanner />

            {/* Search */}
            <div className="relative mb-5">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
              </svg>
              <input
                type="text"
                className="w-full border border-gray-200 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#49BCE2] bg-white"
                placeholder="Tìm chuyên khoa..."
                value={specialtySearch}
                onChange={(e) => setSpecialtySearch(e.target.value)}
              />
            </div>

            {/* Specialty Grid */}
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
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {specialtiesList.map((spec, idx) => {
                  const isSelected = bookingData.specialty?.id === spec.id;
                  const colorClass = colorClasses[idx % colorClasses.length];
                  return (
                    <button
                      key={spec.id}
                      type="button"
                      onClick={() => handleSelectSpecialty(spec)}
                      className={`flex flex-col items-center gap-1.5 p-4 rounded-xl border-2 text-center transition-all cursor-pointer ${isSelected
                        ? 'border-[#49BCE2] bg-[#49BCE2]/5 shadow-sm'
                        : 'border-gray-200 hover:border-[#49BCE2]/50 hover:bg-gray-50'
                        }`}
                    >
                      <div className={`w-10 h-10 rounded-lg ${colorClass} flex items-center justify-center mb-1`}>
                        {specialtyIconMap[spec.icon] || <Stethoscope className="w-5 h-5" />}
                      </div>
                      <span className={`text-sm font-semibold leading-tight ${isSelected ? 'text-[#49BCE2]' : 'text-gray-700'}`}>
                        {spec.name}
                      </span>
                      {spec.doctorCount ? (
                        <span className="text-xs text-gray-400">{spec.doctorCount} bác sĩ</span>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════ */}
        {/* STEP 2: BÁC SĨ & LỊCH                                         */}
        {/* ════════════════════════════════════════════════════════════════ */}
        {step === 2 && (
          <div className="bg-white border border-gray-200 rounded-xl shadow-xs p-6">
            <h2 className="text-base font-bold text-gray-800 mb-1">Xem lịch làm việc và chọn khung giờ</h2>
            <p className="text-sm text-gray-500 mb-4">
              Chuyên khoa: <strong className="text-gray-800">{bookingData.specialty?.name}</strong>{' '}
              <button
                type="button"
                onClick={() => setStep(1)}
                className="text-xs text-gray-400 underline hover:text-[#49BCE2] ml-1 transition"
              >
                Đổi
              </button>
            </p>
            <ErrorBanner />

            {/* Date Picker */}
            <div className="flex gap-2 overflow-x-auto pb-1 mb-5 scrollbar-hide">
              {next7Days.map((item) => {
                const isDateSel = bookingData.date === item.dateStr;
                return (
                  <button
                    key={item.dateStr}
                    type="button"
                    onClick={() => handleSelectDate(item.dateStr)}
                    className={`flex flex-col items-center justify-center min-w-[60px] px-3 py-2.5 rounded-xl border-2 transition-all shrink-0 ${isDateSel
                      ? 'border-[#49BCE2] bg-[#49BCE2] text-white shadow-sm'
                      : 'border-gray-200 hover:border-[#49BCE2]/50 text-gray-600 hover:bg-gray-50'
                      }`}
                  >
                    <span className="text-[10px] font-semibold uppercase tracking-wide">{item.dayLabel}</span>
                    <span className="text-lg font-bold leading-tight">{item.dayNum}</span>
                  </button>
                );
              })}
            </div>

            {/* Doctor Search */}
            <div className="relative mb-4">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
              </svg>
              <input
                type="text"
                className="w-full border border-gray-200 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#49BCE2] bg-white"
                placeholder="Tìm bác sĩ..."
                value={doctorSearch}
                onChange={(e) => setDoctorSearch(e.target.value)}
              />
            </div>

            {/* Doctor List */}
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
              <div className="space-y-3">
                {doctorsList.map((doc) => {
                  const isSelected = bookingData.doctor?.id === doc.id;
                  return (
                    <div
                      key={doc.id}
                      className={`border-2 rounded-xl transition-all overflow-hidden ${isSelected
                        ? 'border-[#49BCE2] shadow-sm'
                        : 'border-gray-200 hover:border-gray-300'
                        }`}
                    >
                      {/* Doctor Info Row */}
                      <div
                        className="flex items-center gap-4 p-4 cursor-pointer"
                        onClick={() => handleSelectDoctor(doc)}
                      >
                        <img
                          src={doc.avatar || '/placeholder-doctor.jpg'}
                          alt={doc.name}
                          onError={(e) => { e.target.src = 'https://placehold.co/100x100?text=Dr'; }}
                          className="w-14 h-14 rounded-full object-cover shrink-0 border-2 border-gray-100"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="font-bold text-gray-800 text-sm">{doc.name}</div>
                          <div className="text-xs text-gray-500 mt-0.5">{bookingData.specialty?.name}</div>
                          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                            <span className="text-xs text-yellow-600 font-medium">⭐ {doc.rating || '5.0'}</span>
                            <span className="text-gray-300">•</span>
                            <span className="text-xs text-gray-500">{doc.experience || '5'} năm KN</span>
                            <span className="text-gray-300">•</span>
                            <span className="inline-block bg-[#49BCE2]/10 text-[#49BCE2] text-xs font-semibold px-2 py-0.5 rounded-full">
                              {formatPrice(doc.price)}
                            </span>
                          </div>
                        </div>
                        <div className={`w-5 h-5 rounded-full border-2 shrink-0 flex items-center justify-center transition-all ${isSelected ? 'border-[#49BCE2] bg-[#49BCE2]' : 'border-gray-300'
                          }`}>
                          {isSelected && (
                            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                      </div>

                      {/* Timeslot Panel (only for selected doctor) */}
                      {isSelected && (
                        <div className="border-t border-gray-100 bg-gray-50/60 px-4 py-4">
                          <div className="text-xs font-semibold text-gray-600 mb-3">
                            📅 Chọn khung giờ — <span className="text-[#49BCE2]">{formatDisplayDate(bookingData.date)}</span>
                          </div>

                          {timeSlotsQuery.isLoading ? (
                            <p className="text-xs text-gray-400 py-2">Đang tải khung giờ...</p>
                          ) : slotsList.length === 0 ? (
                            <p className="text-xs text-amber-600 font-medium py-2">
                              Bác sĩ không có lịch làm việc hoặc đã hết giờ trống trong ngày này.
                            </p>
                          ) : (
                            <div className="space-y-3">
                              {/* Ca sáng */}
                              {morningSlots.length > 0 && (
                                <div>
                                  <div className="text-xs font-semibold text-gray-500 mb-2">☀️ Ca sáng</div>
                                  <div className="flex flex-wrap gap-2">
                                    {morningSlots.map((slot) => {
                                      const isSlotSel = bookingData.timeSlot?.id === slot.id;
                                      const isBooked = slot.status === 'BOOKED' || slot.status === 'LOCKED';
                                      const isExpired = slot.status === 'EXPIRED' || (() => {
                                        const now = new Date();
                                        const [year, month, day] = bookingData.date.split('-').map(Number);
                                        const [hours, minutes] = slot.endTime.split(':').map(Number);
                                        const slotEndTime = new Date(year, month - 1, day, hours, minutes, 0, 0);
                                        return now > slotEndTime;
                                      })();
                                      const isAvailable = slot.status === 'AVAILABLE' && !isExpired;
                                      return (
                                        <button
                                          key={slot.id}
                                          type="button"
                                          disabled={!isAvailable}
                                          onClick={() => handleSelectTimeSlot(slot)}
                                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${isSlotSel
                                            ? 'bg-[#49BCE2] text-white border-[#49BCE2] shadow-sm'
                                            : isAvailable
                                              ? 'bg-white text-gray-700 border-gray-200 hover:border-[#49BCE2] hover:text-[#49BCE2]'
                                              : isBooked
                                                ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed line-through'
                                                : 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                                            }`}
                                        >
                                          {slot.startTime.slice(0, 5)} - {slot.endTime.slice(0, 5)}
                                        </button>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}

                              {/* Ca chiều */}
                              {afternoonSlots.length > 0 && (
                                <div>
                                  <div className="text-xs font-semibold text-gray-500 mb-2">🌤️ Ca chiều</div>
                                  <div className="flex flex-wrap gap-2">
                                    {afternoonSlots.map((slot) => {
                                      const isSlotSel = bookingData.timeSlot?.id === slot.id;
                                      const isBooked = slot.status === 'BOOKED' || slot.status === 'LOCKED';
                                      const isExpired = slot.status === 'EXPIRED' || (() => {
                                        const now = new Date();
                                        const [year, month, day] = bookingData.date.split('-').map(Number);
                                        const [hours, minutes] = slot.endTime.split(':').map(Number);
                                        const slotEndTime = new Date(year, month - 1, day, hours, minutes, 0, 0);
                                        return now > slotEndTime;
                                      })();
                                      const isAvailable = slot.status === 'AVAILABLE' && !isExpired;
                                      return (
                                        <button
                                          key={slot.id}
                                          type="button"
                                          disabled={!isAvailable}
                                          onClick={() => handleSelectTimeSlot(slot)}
                                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${isSlotSel
                                            ? 'bg-[#49BCE2] text-white border-[#49BCE2] shadow-sm'
                                            : isAvailable
                                              ? 'bg-white text-gray-700 border-gray-200 hover:border-[#49BCE2] hover:text-[#49BCE2]'
                                              : isBooked
                                                ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed line-through'
                                                : 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                                            }`}
                                        >
                                          {slot.startTime.slice(0, 5)} - {slot.endTime.slice(0, 5)}
                                        </button>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}
                            </div>
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

        {/* ════════════════════════════════════════════════════════════════ */}
        {/* STEP 3: THÔNG TIN BỆNH NHÂN                                    */}
        {/* ════════════════════════════════════════════════════════════════ */}
        {step === 3 && (
          <div className="bg-white border border-gray-200 rounded-xl shadow-xs p-6">
            <h2 className="text-base font-bold text-gray-800 mb-4">Thông tin bệnh nhân</h2>
            <ErrorBanner />

            {/* Patient Quick Search */}
            <div className="mb-5">
              <label className="block text-xs font-medium text-gray-600 mb-1.5">
                Tra cứu nhanh bệnh nhân hoặc người nhà
              </label>
              <div className="relative">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 z-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
                </svg>

                {bookingData.patientUser ? (
                  <>
                    <input
                      type="text"
                      disabled
                      className="w-full border border-gray-200 rounded-lg pl-9 pr-9 py-2 text-sm bg-gray-50 text-gray-600 font-medium cursor-not-allowed"
                      value={
                        bookingData.forSelf
                          ? `${bookingData.patientUser.name} (Bệnh nhân chính)`
                          : `${selectedProfile?.fullName || 'Người thân'} (Người thân của ${bookingData.patientUser.name})`
                      }
                    />
                    <button
                      type="button"
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
                        setDobInputVal('');
                        setPatientSearch('');
                      }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </>
                ) : (
                  <input
                    id="patientSearchInput"
                    type="text"
                    className="w-full border border-gray-200 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#49BCE2] bg-white"
                    placeholder="Nhập tên, số điện thoại hoặc email để tra cứu..."
                    value={patientSearch}
                    onChange={(e) => setPatientSearch(e.target.value)}
                  />
                )}

                {/* Autocomplete Dropdown */}
                {!bookingData.patientUser && patientSearch.trim().length >= 2 && (
                  <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden max-h-64 overflow-y-auto">
                    {searchPatientsQuery.isLoading ? (
                      <div className="px-4 py-3 text-xs text-gray-400 text-center">Đang tra cứu bệnh nhân...</div>
                    ) : searchPatientsQuery.error ? (
                      <div className="px-4 py-3 text-xs text-red-500 font-semibold text-center">
                        Lỗi tra cứu: {searchPatientsQuery.error.message}
                      </div>
                    ) : patientMatches.length === 0 ? (
                      <div className="px-4 py-3 text-xs text-gray-400 text-center">Không tìm thấy bệnh nhân nào khớp.</div>
                    ) : (
                      patientMatches.flatMap((p) => {
                        const items = [];
                        items.push(
                          <div
                            key={`user-${p.id}`}
                            className="flex flex-col px-4 py-2.5 cursor-pointer hover:bg-[#49BCE2]/5 border-b border-gray-100 last:border-0 transition"
                            onClick={() => handleSelectPatientUser(p)}
                          >
                            <div className="text-sm font-semibold text-gray-700">👤 {p.name} <span className="font-normal text-gray-400 text-xs">(Bệnh nhân chính)</span></div>
                            <div className="text-xs text-gray-400 mt-0.5">SĐT: {p.phone || 'N/A'} · Email: {p.email}</div>
                          </div>
                        );
                        p.profiles?.forEach((profile) => {
                          items.push(
                            <div
                              key={`profile-${profile.id}`}
                              className="flex flex-col pl-8 pr-4 py-2.5 cursor-pointer hover:bg-[#49BCE2]/5 bg-gray-50/60 border-b border-gray-100 last:border-0 transition"
                              onClick={() => {
                                const dob = profile.dateOfBirth ? profile.dateOfBirth.slice(0, 10) : '';
                                setBookingData((prev) => ({
                                  ...prev,
                                  patientUser: p,
                                  forSelf: false,
                                  patientProfileId: profile.id,
                                  name: profile.fullName || '',
                                  phone: profile.phone || p.phone || '',
                                  email: profile.email || p.email || '',
                                  gender: profile.gender || 'MALE',
                                  dateOfBirth: dob,
                                  address: profile.address || p.address || '',
                                }));
                                if (dob) {
                                  const [y, m, d] = dob.split('-');
                                  setDobInputVal(`${d}/${m}/${y}`);
                                } else {
                                  setDobInputVal('');
                                }
                                setPatientSearch('');
                                setStepError(null);
                                setValidationErrors({});
                              }}
                            >
                              <div className="text-xs font-semibold text-gray-600">
                                👥 {profile.fullName} <span className="font-normal text-gray-400">(Người thân: {profile.relationship === 'PARENT' ? 'Bố/Mẹ' : profile.relationship === 'CHILD' ? 'Con' : profile.relationship === 'SPOUSE' ? 'Vợ/Chồng' : 'Khác'})</span>
                              </div>
                              <div className="text-xs text-gray-400 mt-0.5">SĐT: {profile.phone || p.phone || 'N/A'} · Email: {profile.email || p.email || 'N/A'}</div>
                            </div>
                          );
                        });
                        return items;
                      })
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Patient Form Fields */}
            <div className="space-y-4">
              {/* Họ tên + SĐT */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="patientNameInput" className="block text-xs font-medium text-gray-600 mb-1.5">
                    Họ tên bệnh nhân<Req />
                  </label>
                  <input
                    id="patientNameInput"
                    type="text"
                    placeholder="Nhập họ tên bệnh nhân..."
                    value={bookingData.name}
                    onChange={(e) => {
                      setBookingData(prev => ({ ...prev, name: e.target.value }));
                      setStepError(null);
                      if (validationErrors.name) setValidationErrors(prev => ({ ...prev, name: null }));
                    }}
                    className={inputCls(validationErrors.name)}
                    disabled={Boolean(bookingData.patientUser)}
                  />
                  {validationErrors.name && (
                    <p className="text-xs text-red-500 mt-1">{validationErrors.name}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="patientPhoneInput" className="block text-xs font-medium text-gray-600 mb-1.5">
                    Số điện thoại
                  </label>
                  <input
                    id="patientPhoneInput"
                    type="text"
                    placeholder="Nhập số điện thoại..."
                    value={bookingData.phone}
                    onChange={(e) => {
                      setBookingData(prev => ({ ...prev, phone: e.target.value }));
                      setStepError(null);
                      if (validationErrors.phone) setValidationErrors(prev => ({ ...prev, phone: null }));
                    }}
                    className={inputCls(validationErrors.phone)}
                    disabled={Boolean(bookingData.patientUser)}
                  />
                  {validationErrors.phone && (
                    <p className="text-xs text-red-500 mt-1">{validationErrors.phone}</p>
                  )}
                </div>
              </div>

              {/* Email */}
              <div>
                <label htmlFor="patientEmailInput" className="block text-xs font-medium text-gray-600 mb-1.5">
                  Email tài khoản
                </label>
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
                  className={inputCls(validationErrors.email)}
                  disabled={Boolean(bookingData.patientUser)}
                />
              </div>

              {/* Giới tính + Ngày sinh */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="patientGenderSelect" className="block text-xs font-medium text-gray-600 mb-1.5">
                    Giới tính<Req />
                  </label>
                  <select
                    id="patientGenderSelect"
                    value={bookingData.gender}
                    onChange={(e) => {
                      setBookingData(prev => ({ ...prev, gender: e.target.value }));
                      setStepError(null);
                    }}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#49BCE2] bg-white disabled:bg-gray-50 disabled:cursor-not-allowed disabled:text-gray-500"
                    disabled={Boolean(bookingData.patientUser)}
                  >
                    <option value="MALE">Nam</option>
                    <option value="FEMALE">Nữ</option>
                    <option value="OTHER">Khác</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="patientDobInput" className="block text-xs font-medium text-gray-600 mb-1.5">
                    Ngày sinh<Req />
                  </label>
                  <div className="relative">
                    <input
                      id="patientDobInput"
                      type="text"
                      placeholder="dd/mm/yyyy"
                      value={dobInputVal}
                      onChange={(e) => {
                        const val = e.target.value;
                        setDobInputVal(val);
                        setStepError(null);
                        if (validationErrors.dateOfBirth) setValidationErrors(prev => ({ ...prev, dateOfBirth: null }));
                        
                        // Parse and sync to bookingData.dateOfBirth if it is a valid date
                        const isoDate = parseDisplayDateToIso(val);
                        if (isoDate) {
                          const [year, month, day] = isoDate.split('-').map(Number);
                          const parsedDate = new Date(year, month - 1, day);
                          const today = new Date();
                          today.setHours(23, 59, 59, 999);
                          if (
                            parsedDate.getFullYear() === year &&
                            parsedDate.getMonth() === month - 1 &&
                            parsedDate.getDate() === day &&
                            parsedDate <= today
                          ) {
                            setBookingData(prev => ({ ...prev, dateOfBirth: isoDate }));
                          }
                        } else {
                          setBookingData(prev => ({ ...prev, dateOfBirth: '' }));
                        }
                      }}
                      className={`${inputCls(validationErrors.dateOfBirth)} pr-10`}
                      disabled={Boolean(bookingData.patientUser)}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (!bookingData.patientUser && nativeDobPickerRef.current) {
                          if (typeof nativeDobPickerRef.current.showPicker === 'function') {
                            nativeDobPickerRef.current.showPicker();
                          } else {
                            nativeDobPickerRef.current.click();
                          }
                        }
                      }}
                      disabled={Boolean(bookingData.patientUser)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className="text-sm">📅</span>
                    </button>
                    <input
                      ref={nativeDobPickerRef}
                      type="date"
                      value={bookingData.dateOfBirth || ''}
                      max={new Date().toLocaleDateString('sv').slice(0, 10)}
                      onChange={(e) => {
                        const selectedDate = e.target.value;
                        setBookingData(prev => ({ ...prev, dateOfBirth: selectedDate }));
                        if (selectedDate) {
                          const [y, m, d] = selectedDate.split('-');
                          setDobInputVal(`${d}/${m}/${y}`);
                        }
                        setStepError(null);
                        if (validationErrors.dateOfBirth) setValidationErrors(prev => ({ ...prev, dateOfBirth: null }));
                      }}
                      className="absolute w-0 h-0 opacity-0 pointer-events-none"
                    />
                  </div>
                  {validationErrors.dateOfBirth && (
                    <p className="text-xs text-red-500 mt-1">{validationErrors.dateOfBirth}</p>
                  )}
                </div>
              </div>

              {/* Địa chỉ */}
              <div>
                <label htmlFor="patientAddressInput" className="block text-xs font-medium text-gray-600 mb-1.5">
                  Địa chỉ
                </label>
                <input
                  id="patientAddressInput"
                  type="text"
                  placeholder="Nhập địa chỉ..."
                  value={bookingData.address}
                  onChange={(e) => {
                    setBookingData(prev => ({ ...prev, address: e.target.value }));
                    setStepError(null);
                  }}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#49BCE2] bg-white disabled:bg-gray-50 disabled:cursor-not-allowed disabled:text-gray-500"
                  disabled={Boolean(bookingData.patientUser)}
                />
              </div>

              {/* Lý do khám */}
              <div>
                <label htmlFor="reasonTextarea" className="block text-xs font-medium text-gray-600 mb-1.5">
                  Triệu chứng &amp; Lý do khám bệnh<Req />
                </label>
                <textarea
                  id="reasonTextarea"
                  rows={3}
                  placeholder="Mô tả triệu chứng chính hoặc lý do đến khám..."
                  value={bookingData.reason}
                  onChange={(e) => {
                    setBookingData((prev) => ({ ...prev, reason: e.target.value }));
                    setStepError(null);
                    if (validationErrors.reason) setValidationErrors(prev => ({ ...prev, reason: null }));
                  }}
                  className={`${inputCls(validationErrors.reason)} resize-none`}
                />
                {validationErrors.reason && (
                  <p className="text-xs text-red-500 mt-1">{validationErrors.reason}</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════ */}
        {/* STEP 4: XÁC NHẬN                                               */}
        {/* ════════════════════════════════════════════════════════════════ */}
        {step === 4 && (
          <div className="bg-white border border-gray-200 rounded-xl shadow-xs p-6">
            <h2 className="text-base font-bold text-gray-800 mb-4">Xác nhận đặt lịch</h2>
            <ErrorBanner />

            <div className="space-y-4">
              {/* Doctor Info */}
              <div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Thông tin bác sĩ</div>
                <div className="bg-gray-50 rounded-xl border border-gray-100 divide-y divide-gray-100">
                  <ConfirmRow label="Bác sĩ" value={bookingData.doctor?.name} bold />
                  <ConfirmRow label="Chuyên khoa" value={bookingData.specialty?.name} bold />
                  <ConfirmRow label="Giá khám tham khảo" value={formatPrice(bookingData.doctor?.price)} bold />
                </div>
              </div>

              {/* Schedule Info */}
              <div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Thông tin lịch khám</div>
                <div className="bg-gray-50 rounded-xl border border-gray-100 divide-y divide-gray-100">
                  <ConfirmRow label="Ngày khám" value={formatDisplayDate(bookingData.date)} />
                  <ConfirmRow
                    label="Giờ khám"
                    value={`${bookingData.timeSlot?.startTime.slice(0, 5)} - ${bookingData.timeSlot?.endTime.slice(0, 5)}`}
                  />
                </div>
              </div>

              {/* Patient Info */}
              <div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Thông tin bệnh nhân</div>
                <div className="bg-gray-50 rounded-xl border border-gray-100 divide-y divide-gray-100">
                  <ConfirmRow
                    label="Người được khám"
                    value={`${bookingData.name}${bookingData.patientUser ? (bookingData.forSelf ? ' (Bệnh nhân chính)' : ' (Người thân)') : ''}`}
                  />
                  <ConfirmRow label="Ngày sinh" value={bookingData.dateOfBirth ? formatDisplayDate(bookingData.dateOfBirth) : '—'} />
                  <ConfirmRow label="Giới tính" value={bookingData.gender === 'MALE' ? 'Nam' : bookingData.gender === 'FEMALE' ? 'Nữ' : 'Khác'} />
                  <ConfirmRow label="Số điện thoại" value={bookingData.phone} />
                  <ConfirmRow label="Email" value={bookingData.email || '—'} />
                  <ConfirmRow label="Địa chỉ" value={bookingData.address || '—'} />
                  <ConfirmRow label="Lý do khám" value={bookingData.reason} multiline />
                </div>
              </div>

              {/* Disclaimer */}
              <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-xs text-amber-700">
                <svg className="w-4 h-4 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                </svg>
                <span>Chi phí chỉ mang tính tham khảo. Bệnh nhân thanh toán trực tiếp tại quầy khi đến khám.</span>
              </div>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════ */}
        {/* STEP 5: THÀNH CÔNG                                             */}
        {/* ════════════════════════════════════════════════════════════════ */}
        {step === 5 && successBookingData && (
          <div className="bg-white border border-gray-200 rounded-xl shadow-xs p-8 text-center">
            {/* Success icon */}
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">Đặt lịch thành công!</h2>
            <span className="inline-block bg-green-100 text-green-700 text-xs font-bold px-3 py-1 rounded-full mb-6 tracking-wide uppercase">
              Đã xác nhận
            </span>

            {/* Receipt */}
            <div className="bg-gray-50 rounded-xl border border-gray-100 divide-y divide-gray-100 text-left mb-5">
              <div className="flex items-center justify-between px-4 py-3">
                <span className="text-xs text-gray-500">Mã lịch hẹn</span>
                <span className="text-sm font-bold text-[#49BCE2] tracking-wider">{successBookingData.code}</span>
              </div>
              <ConfirmRow
                label="Người được khám"
                value={`${successBookingData.name}${successBookingData.patientUser ? (successBookingData.forSelf ? ' (Bản thân)' : ' (Người thân)') : ''}`}
              />
              <ConfirmRow label="Ngày sinh" value={successBookingData.dateOfBirth ? formatDisplayDate(successBookingData.dateOfBirth) : '—'} />
              <ConfirmRow label="Giới tính" value={successBookingData.gender === 'MALE' ? 'Nam' : successBookingData.gender === 'FEMALE' ? 'Nữ' : 'Khác'} />
              <ConfirmRow label="Số điện thoại" value={successBookingData.phone} />
              <ConfirmRow label="Bác sĩ" value={successBookingData.doctor?.name} />
              <ConfirmRow label="Chuyên khoa" value={successBookingData.specialty?.name} />
              <ConfirmRow
                label="Ngày giờ khám"
                value={`${formatDisplayDate(successBookingData.date)} — ${successBookingData.timeSlot?.startTime.slice(0, 5)} - ${successBookingData.timeSlot?.endTime.slice(0, 5)}`}
              />
              <div className="flex items-center justify-between px-4 py-3">
                <span className="text-xs text-gray-500">Trạng thái</span>
                <span className="text-sm font-semibold text-green-600">✓ Đã xác nhận</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                type="button"
                onClick={handleResetBooking}
                className="bg-[#49BCE2] text-white rounded-lg px-5 py-2.5 text-sm font-semibold hover:bg-[#3ca4c5] transition"
              >
                Đặt lịch mới
              </button>
              <Link
                to="/portal/le-tan/lich-hen"
                className="border border-[#49BCE2] text-[#49BCE2] rounded-lg px-5 py-2.5 text-sm font-semibold hover:bg-[#49BCE2]/5 transition"
              >
                Quản lý lịch hẹn
              </Link>
              <Link
                to="/portal/le-tan"
                className="border border-gray-200 text-gray-500 rounded-lg px-5 py-2.5 text-sm font-semibold hover:bg-gray-50 transition"
              >
                Quay về Tổng quan
              </Link>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════ */}
        {/* WIZARD FOOTER ACTIONS                                          */}
        {/* ════════════════════════════════════════════════════════════════ */}
        {step < 5 && (
          <div className="flex items-center justify-between gap-3 pt-1">
            <button
              type="button"
              disabled={step === 1 || bookMutation.isPending}
              onClick={() => {
                setStepError(null);
                setValidationErrors({});
                setStep(s => s - 1);
              }}
              className="flex items-center gap-1.5 border border-gray-200 text-gray-500 rounded-lg px-5 py-2.5 text-sm font-semibold hover:bg-gray-50 transition disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
              </svg>
              Quay lại
            </button>

            {step === 4 ? (
              <button
                type="button"
                disabled={bookMutation.isPending}
                onClick={handleStepSubmit}
                className="flex items-center gap-1.5 bg-[#49BCE2] text-white rounded-lg px-6 py-2.5 text-sm font-semibold hover:bg-[#3ca4c5] transition disabled:opacity-60 disabled:cursor-not-allowed shadow-sm"
              >
                {bookMutation.isPending ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Đang đặt lịch...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                    Xác nhận đặt lịch
                  </>
                )}
              </button>
            ) : (
              <button
                type="button"
                onClick={handleStepSubmit}
                className="flex items-center gap-1.5 bg-[#49BCE2] text-white rounded-lg px-6 py-2.5 text-sm font-semibold hover:bg-[#3ca4c5] transition shadow-sm"
              >
                Tiếp theo
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Helper: Confirmation Row ─────────────────────────────────────────────────
function ConfirmRow({ label, value, bold, multiline }) {
  return (
    <div className={`flex ${multiline ? 'items-start' : 'items-center'} justify-between gap-4 px-4 py-3`}>
      <span className="text-xs text-gray-500 shrink-0">{label}</span>
      <span className={`text-sm text-right ${bold ? 'font-semibold text-gray-800' : 'text-gray-700'} ${multiline ? 'max-w-[65%] break-words' : ''}`}>
        {value}
      </span>
    </div>
  );
}
