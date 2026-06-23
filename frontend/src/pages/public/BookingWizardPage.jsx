import { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Check, ChevronRight, ChevronLeft, Calendar, Clock, User, CheckCircle, Mail, Star, MapPin, Search, AlertCircle, X, Plus, Info, Shield, Phone, Sparkles } from 'lucide-react';
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
import { useCreatePatientProfile } from '../../features/patient-profile/hooks/useCreatePatientProfile.js';
import { useMe } from '../../features/user/hooks/useMe.js';
import { useBookAppointment } from '../../features/appointment/hooks/useAppointments.js';
import LoadingBlock from '../../shared/components/feedback/LoadingBlock.jsx';
import StateBlock from '../../shared/components/feedback/StateBlock.jsx';
import { lockTimeSlot, unlockTimeSlot } from '../../features/timeslot/services/timeslot.service.js';

export default function BookingWizardPage() {
  const navigate = useNavigate();
  const { isAuthenticated, user: authUser } = useAuth();

  // Core Steps: 1 to 5
  const [step, setStep] = useState(1);
  const [showPersonPicker, setShowPersonPicker] = useState(false);
  const [showAddRelative, setShowAddRelative] = useState(false);
  const [newRelative, setNewRelative] = useState({
    name: '',
    relationship: 'CON',
    phone: '',
    gender: 'MALE',
    dateOfBirth: '',
    address: ''
  });
  const [formErrors, setFormErrors] = useState({});
  const [specialtySearch, setSpecialtySearch] = useState('');
  const [doctorSearch, setDoctorSearch] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [stepError, setStepError] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});

  const ErrorBanner = () => {
    if (!stepError) return null;
    return (
      <div className="flex items-center justify-between p-4 mb-5 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600 font-semibold animate-fade-in">
        <span>⚠️ {stepError}</span>
        <button 
          type="button" 
          onClick={() => setStepError(null)}
          className="text-red-600 hover:text-red-800 cursor-pointer font-bold text-lg leading-none"
        >
          ✕
        </button>
      </div>
    );
  };

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

  const [lockClientId] = useState(() => {
    let id = sessionStorage.getItem('booking_lock_client_id');
    if (!id) {
      id = 'client_' + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
      sessionStorage.setItem('booking_lock_client_id', id);
    }
    return id;
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
      ? { doctorId: bookingData.doctor.id, date: bookingData.date, lockClientId } 
      : null
  );
  const { data: systemSettingsResponse } = useBookingRules();

  // 4. Fetch Current User Details (for "Bản thân")
  const { data: meResponse } = useMe({ enabled: isAuthenticated });
  const currentUserData = meResponse?.data || meResponse || null;

  // 5. Fetch Relative Profiles (for "Người thân")
  const patientProfilesQuery = usePatientProfiles({}, { enabled: isAuthenticated });
  const relativeProfiles = patientProfilesQuery.data?.data || [];

  // Mutations
  const createProfileMutation = useCreatePatientProfile();
  const bookMutation = useBookAppointment();

  // Handle adding relative profile
  const handleAddRelative = async (e) => {
    e.preventDefault();
    setFormErrors({});
    const errors = {};
    if (!newRelative.name.trim()) errors.name = 'Họ tên là bắt buộc';
    if (!newRelative.phone.trim()) errors.phone = 'SĐT là bắt buộc';
    if (!newRelative.dateOfBirth) errors.dob = 'Ngày sinh là bắt buộc';
    
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    try {
      const response = await createProfileMutation.mutateAsync({
        fullName: newRelative.name.trim(),
        phone: newRelative.phone.trim(),
        gender: newRelative.gender,
        dateOfBirth: newRelative.dateOfBirth,
        relationship: newRelative.relationship,
        address: newRelative.address.trim() || undefined
      });
      const created = response.data || response;
      setBookingData((prev) => ({
        ...prev,
        forSelf: false,
        patientProfileId: created.id
      }));
      setValidationErrors((prev) => {
        const next = { ...prev };
        delete next.patientProfileId;
        return next;
      });
      setStepError(null);
      setShowAddRelative(false);
      setShowPersonPicker(false);
      setNewRelative({
        name: '',
        relationship: 'CON',
        phone: '',
        gender: 'MALE',
        dateOfBirth: '',
        address: ''
      });
    } catch (err) {
      setFormErrors(prev => ({
        ...prev,
        submit: `Lỗi thêm người thân: ${err.response?.data?.error?.message || err.message}`
      }));
    }
  };

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
      'co-xuong-khop': 'Bone',
      'tai-mui-hong': 'Ear',
      'tieu-hoa': '💊',
      'san-phu-khoa': '🤰',
      'noi-tong-quat': '🧠'
    };
    return mapping[slug || ''] || 'Stethoscope';
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
      dates.push({ dateStr, dayLabel, dayNum, month: d.getMonth() + 1 });
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

  // Active timeslots list.
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
    setStepError(null);
  };

  // Handle doctor selection in Step 2
  const handleSelectDoctor = (doctor) => {
    if (bookingData.timeSlot) {
      unlockTimeSlot(bookingData.timeSlot.id, lockClientId).catch((err) => {
        console.error('Failed to unlock previous slot:', err);
      });
    }
    setBookingData((prev) => ({
      ...prev,
      doctor,
      timeSlot: null // Reset slot when doctor changes
    }));
    setStepError(null);
  };

  // Handle date selection in Step 2 date bar
  const handleSelectDate = (dateStr) => {
    if (bookingData.timeSlot) {
      unlockTimeSlot(bookingData.timeSlot.id, lockClientId).catch((err) => {
        console.error('Failed to unlock previous slot:', err);
      });
    }
    setBookingData((prev) => ({
      ...prev,
      date: dateStr,
      timeSlot: null // Reset slot when date changes
    }));
    setStepError(null);
  };

  // Handle timeslot click in Step 2
  const handleSelectTimeSlot = async (timeSlot) => {
    if (bookingData.timeSlot?.id === timeSlot.id) {
      return;
    }
    setStepError(null);
    try {
      await lockTimeSlot(timeSlot.id, lockClientId);
      
      if (bookingData.timeSlot) {
        unlockTimeSlot(bookingData.timeSlot.id, lockClientId).catch((err) => {
          console.error('Failed to unlock previous slot:', err);
        });
      }

      setBookingData((prev) => ({
        ...prev,
        timeSlot
      }));
    } catch (err) {
      const msg = err.response?.data?.error?.message || 
        err.message || 
        'Không thể giữ khung giờ khám. Vui lòng thử lại.';
      setStepError(msg);
      timeSlotsQuery.refetch();
    }
  };

  // Automatically select the first doctor in Step 2 if none is selected
  useEffect(() => {
    if (step === 2 && doctorsList.length > 0 && !bookingData.doctor) {
      handleSelectDoctor(doctorsList[0]);
    }
  }, [step, doctorsList, bookingData.doctor]);

  // Navigation handlers
  const handleNextStep = () => {
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
      if (!isAuthenticated) {
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
    } else if (step === 3) {
      const newErrors = {};
      if (!bookingData.forSelf && !bookingData.patientProfileId) {
        newErrors.patientProfileId = true;
      }
      if (!bookingData.reason.trim()) {
        newErrors.reason = true;
      }

      if (Object.keys(newErrors).length > 0) {
        setValidationErrors(newErrors);
        setStepError('Vui lòng điền đầy đủ các thông tin bắt buộc màu đỏ phía dưới.');
        return;
      }
      setValidationErrors({});
      setStep(4);
    }
  };

  const handlePrevStep = () => {
    if (step > 1 && step < 5) {
      setStep((prev) => prev - 1);
      setErrorMessage('');
      setStepError(null);
      setValidationErrors({});
    }
  };

  // Execute Booking Mutation in Step 4
  const handleConfirmBooking = async () => {
    setErrorMessage('');
    setStepError(null);
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
        lockClientId,
        ...(bookingData.forSelf ? {} : { patientProfileId: bookingData.patientProfileId })
      };

      const response = await bookMutation.mutateAsync(payload);
      
      setBookingResult(response.data || response);
      setStep(5);
    } catch (err) {
      const msg = err.response?.data?.error?.message || 
        err.message || 
        'Có lỗi xảy ra trong quá trình đặt lịch. Vui lòng thử lại.';
      setErrorMessage(msg);
      setStepError(`Đặt lịch không thành công: ${msg}`);
    }
  };

  const handleResetBooking = () => {
    if (bookingData.timeSlot) {
      unlockTimeSlot(bookingData.timeSlot.id, lockClientId).catch((err) => {
        console.error('Failed to unlock slot:', err);
      });
    }
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
    setStepError(null);
    setValidationErrors({});
  };

  const formatDisplayDate = (dateStr) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  };

  const formatPrice = (price) => {
    if (price === undefined || price === null) return '0đ';
    return price.toLocaleString('vi-VN') + 'đ';
  };

  const STEPS = ['Chuyên khoa', 'Bác sĩ & Lịch', 'Thông tin', 'Xác nhận', 'Hoàn tất'];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
      
      {/* Title */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Đặt lịch khám bệnh</h1>
        <p className="text-sm text-gray-500">Chỉ 5 bước đặt khám dễ dàng với bác sĩ chuyên khoa CarePlus</p>
      </div>

      {/* Stepper progress */}
      <div className="flex items-center justify-between mb-8 overflow-x-auto pb-2 select-none">
        {STEPS.map((s, i) => {
          const stepNumber = i + 1;
          const isActive = step === stepNumber;
          const isCompleted = step > stepNumber;
          return (
            <div key={i} className="flex items-center flex-1 last:flex-initial">
              <div className="flex flex-col items-center flex-shrink-0">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all shadow-sm ${
                  isCompleted 
                    ? 'bg-cyan-600 text-white' 
                    : isActive 
                    ? 'bg-cyan-600 text-white ring-4 ring-cyan-100' 
                    : 'bg-gray-100 text-gray-400'
                }`}>
                  {isCompleted ? <Check className="w-4 h-4" /> : stepNumber}
                </div>
                <span className={`text-[10px] mt-1.5 font-bold tracking-wide whitespace-nowrap ${
                  isActive || isCompleted ? 'text-cyan-600' : 'text-gray-400'
                }`}>
                  {s}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`h-0.5 flex-1 mx-2 -mt-4 transition-colors ${
                  isCompleted ? 'bg-cyan-600' : 'bg-gray-200'
                }`} />
              )}
            </div>
          );
        })}
      </div>

      {/* STEP 1: Specialty List */}
      {step === 1 && (
        <div className="bg-white rounded-2xl border border-gray-150 p-6 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Chọn chuyên khoa</h3>
          <ErrorBanner />
          
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm chuyên khoa nhanh..."
              value={specialtySearch}
              onChange={(e) => setSpecialtySearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 bg-white text-gray-800"
            />
          </div>

          {specialtiesQuery.isLoading ? (
            <LoadingBlock label="Đang tải danh sách chuyên khoa..." />
          ) : specialtiesQuery.isError ? (
            <StateBlock
              variant="error"
              title="Lỗi tải dữ liệu"
              description="Không thể lấy danh sách chuyên khoa từ máy chủ."
            />
          ) : specialtiesList.length === 0 ? (
            <StateBlock
              variant="empty"
              title="Không tìm thấy chuyên khoa"
              description="Không tìm thấy chuyên khoa nào phù hợp."
            />
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {specialtiesList.map((spec) => {
                const isSelected = bookingData.specialty?.id === spec.id;
                return (
                  <button
                    key={spec.id}
                    type="button"
                    onClick={() => handleSelectSpecialty(spec)}
                    className={`flex flex-col items-center text-center p-4 border rounded-2xl cursor-pointer transition-all hover:shadow-md ${
                      isSelected 
                        ? 'border-cyan-600 bg-cyan-50/20 shadow-sm text-cyan-700 ring-2 ring-cyan-500/20' 
                        : 'border-gray-150 bg-white hover:border-cyan-300 text-gray-800'
                    }`}
                  >
                    <span className="text-3xl mb-2 select-none">
                      {getSpecialtyEmoji(spec.slug) === 'Bone' ? '🦴' : 
                       getSpecialtyEmoji(spec.slug) === 'Heart' ? '❤️' :
                       getSpecialtyEmoji(spec.slug) === 'Ear' ? '👂' :
                       getSpecialtyEmoji(spec.slug) === 'Baby' ? '👶' :
                       getSpecialtyEmoji(spec.slug) === 'Sparkles' ? '✨' :
                       getSpecialtyEmoji(spec.slug) === 'Activity' ? '⚡' :
                       getSpecialtyEmoji(spec.slug) === 'HeartPulse' ? '❤️' :
                       getSpecialtyEmoji(spec.slug) === 'Stethoscope' ? '🩺' : '🩺'}
                    </span>
                    <span className="text-xs font-bold block truncate max-w-full">{spec.name}</span>
                    <span className="text-[10px] text-gray-400 mt-1">{spec.doctorCount ? `${spec.doctorCount} bác sĩ` : '0 bác sĩ'}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* STEP 2: Doctor & Timeslot Selection */}
      {step === 2 && (
        <div className="bg-white rounded-2xl border border-gray-150 p-6 shadow-sm">
          <div className="flex justify-between items-start gap-4 mb-4">
            <div>
              <h3 className="text-lg font-bold text-gray-900">Xem lịch và chọn khung giờ khám</h3>
              <p className="text-xs text-gray-500 mt-1">
                Chuyên khoa: <span className="font-bold text-cyan-600">{bookingData.specialty?.name}</span>
                <button type="button" onClick={() => setStep(1)} className="text-[10px] text-gray-400 hover:text-cyan-600 underline font-semibold ml-2">Đổi</button>
              </p>
            </div>
          </div>
          
          <ErrorBanner />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
            
            {/* Left: Doctor picker */}
            <div className="md:col-span-1 border-r border-gray-100 pr-2">
              <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">BÁC SĨ CHUYÊN KHOA</div>
              <div className="relative mb-3">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Tìm bác sĩ..."
                  value={doctorSearch}
                  onChange={(e) => setDoctorSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-cyan-500 bg-white"
                />
              </div>

              {doctorsQuery.isLoading ? (
                <div className="text-xs text-gray-400 py-3 text-center">Đang tải danh sách bác sĩ...</div>
              ) : doctorsList.length === 0 ? (
                <div className="text-xs text-gray-400 py-3 text-center">Không tìm thấy bác sĩ nào.</div>
              ) : (
                <div className="space-y-1.5 max-h-[300px] overflow-y-auto pr-1">
                  {doctorsList.map((doc) => {
                    const isSelected = bookingData.doctor?.id === doc.id;
                    const docAvatar = doc.avatar || (doc.gender === 'FEMALE' 
                      ? 'https://images.unsplash.com/photo-1594824813573-246434de83fb?auto=format&fit=crop&w=256&h=256&q=80'
                      : 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=256&h=256&q=80'
                    );
                    return (
                      <button
                        key={doc.id}
                        type="button"
                        onClick={() => handleSelectDoctor(doc)}
                        className={`w-full flex items-center gap-2.5 p-2 rounded-xl text-left border cursor-pointer transition-all ${
                          isSelected 
                            ? 'border-cyan-600 bg-cyan-50/20 text-cyan-700' 
                            : 'border-gray-100 bg-white hover:border-cyan-200'
                        }`}
                      >
                        <img src={docAvatar} alt={doc.name} className="w-9 h-9 rounded-full object-cover object-top flex-shrink-0" />
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-gray-900 truncate">{doc.title} {doc.name}</div>
                          <div className="text-[10px] text-gray-400 truncate mt-0.5">{doc.experience} năm KN • ⭐ {doc.rating ? Number(doc.rating).toFixed(1) : '5.0'}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Right: Date and timeslots selector */}
            <div className="md:col-span-2 space-y-4">
              {/* Date slider */}
              <div>
                <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">CHỌN NGÀY HẸN</div>
                <div className="flex gap-1.5 overflow-x-auto pb-1.5">
                  {next7Days.map((d) => {
                    const isSelected = bookingData.date === d.dateStr;
                    return (
                      <button
                        key={d.dateStr}
                        type="button"
                        onClick={() => handleSelectDate(d.dateStr)}
                        className={`flex-shrink-0 flex flex-col items-center px-3.5 py-2.5 rounded-xl border cursor-pointer transition-all ${
                          isSelected 
                            ? 'bg-cyan-600 text-white border-cyan-600 shadow-sm' 
                            : 'border-gray-200 bg-white hover:border-cyan-300 text-gray-700'
                        }`}
                      >
                        <span className={`text-[9px] uppercase font-bold ${isSelected ? 'text-cyan-100' : 'text-gray-400'}`}>{d.dayLabel}</span>
                        <span className="text-base font-extrabold mt-0.5">{d.dayNum}</span>
                        <span className={`text-[9px] ${isSelected ? 'text-cyan-100' : 'text-gray-400'}`}>Th{d.month}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Time slots */}
              <div>
                <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">CHỌN GIỜ KHÁM</div>
                
                {timeSlotsQuery.isLoading ? (
                  <div className="text-xs text-gray-400 py-6 text-center">Đang tải lịch khám...</div>
                ) : slotsList.length === 0 ? (
                  <div className="py-8 text-center text-xs text-gray-500 bg-gray-50 rounded-2xl border border-gray-150">
                    Bác sĩ không có lịch khám trống trong ngày này. Vui lòng chọn ngày khác.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {morningSlots.length > 0 && (
                      <div>
                        <div className="text-[10px] font-bold text-gray-400 mb-1.5">BUỔI SÁNG</div>
                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                          {morningSlots.map((slot) => {
                            const isBooked = ['BOOKED', 'EXPIRED'].includes(slot.status);
                            const isSelected = bookingData.timeSlot?.id === slot.id;
                            return (
                              <button
                                key={slot.id}
                                type="button"
                                disabled={isBooked}
                                onClick={() => handleSelectTimeSlot(slot)}
                                className={`py-2 px-2 text-xs rounded-xl font-medium border text-center transition-all ${
                                  isBooked 
                                    ? 'border-gray-100 bg-gray-50 text-gray-300 cursor-not-allowed line-through' 
                                    : isSelected 
                                    ? 'border-cyan-600 bg-cyan-600 text-white shadow-sm'
                                    : 'border-gray-200 bg-white hover:border-cyan-500 hover:text-cyan-600 cursor-pointer shadow-sm'
                                }`}
                              >
                                {slot.startTime}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {afternoonSlots.length > 0 && (
                      <div>
                        <div className="text-[10px] font-bold text-gray-400 mb-1.5">BUỔI CHIỀU</div>
                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                          {afternoonSlots.map((slot) => {
                            const isBooked = ['BOOKED', 'EXPIRED'].includes(slot.status);
                            const isSelected = bookingData.timeSlot?.id === slot.id;
                            return (
                              <button
                                key={slot.id}
                                type="button"
                                disabled={isBooked}
                                onClick={() => handleSelectTimeSlot(slot)}
                                className={`py-2 px-2 text-xs rounded-xl font-medium border text-center transition-all ${
                                  isBooked 
                                    ? 'border-gray-100 bg-gray-50 text-gray-300 cursor-not-allowed line-through' 
                                    : isSelected 
                                    ? 'border-cyan-600 bg-cyan-600 text-white shadow-sm'
                                    : 'border-gray-200 bg-white hover:border-cyan-500 hover:text-cyan-600 cursor-pointer shadow-sm'
                                }`}
                              >
                                {slot.startTime}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* STEP 3: Patient Info Form */}
      {step === 3 && (
        <div className="bg-white rounded-2xl border border-gray-150 p-6 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Thông tin người khám bệnh</h3>
          <ErrorBanner />

          <div className="space-y-6">
            
            {/* Person picker options */}
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Người đi khám</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setBookingData(prev => ({ ...prev, forSelf: true, patientProfileId: '' }));
                    setValidationErrors(prev => { const n = { ...prev }; delete n.patientProfileId; return n; });
                  }}
                  className={`flex-1 py-3 px-4 rounded-xl border text-sm font-semibold flex items-center justify-center gap-2 cursor-pointer transition-colors ${
                    bookingData.forSelf 
                      ? 'border-cyan-600 bg-cyan-50/20 text-cyan-700' 
                      : 'border-gray-200 hover:border-cyan-300 text-gray-700 bg-white'
                  }`}
                >
                  <User className="w-4 h-4" />
                  Bản thân (Tôi)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setBookingData(prev => ({ ...prev, forSelf: false }));
                    setShowPersonPicker(true);
                  }}
                  className={`flex-1 py-3 px-4 rounded-xl border text-sm font-semibold flex items-center justify-center gap-2 cursor-pointer transition-colors ${
                    !bookingData.forSelf 
                      ? 'border-cyan-600 bg-cyan-50/20 text-cyan-700' 
                      : 'border-gray-200 hover:border-cyan-300 text-gray-700 bg-white'
                  }`}
                >
                  <Users className="w-4 h-4" />
                  Người thân
                </button>
              </div>
            </div>

            {/* Display Selected Patient Box */}
            {selectedPatientDetails && (
              <div className="p-4 bg-gray-50 border border-gray-150 rounded-2xl shadow-inner relative">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-[10px] font-bold text-cyan-600 uppercase tracking-wider">HỒ SƠ KHÁM</span>
                  {!bookingData.forSelf && (
                    <button 
                      type="button"
                      onClick={() => setShowPersonPicker(true)}
                      className="text-xs text-cyan-600 hover:underline font-semibold"
                    >
                      Thay đổi
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-xs font-semibold text-gray-800">
                  <div><strong>Họ tên:</strong> {selectedPatientDetails.fullName}</div>
                  <div><strong>Mối quan hệ:</strong> {bookingData.forSelf ? 'Bản thân' : 'Người thân'}</div>
                  <div><strong>Số điện thoại:</strong> {selectedPatientDetails.phone}</div>
                  <div><strong>Ngày sinh:</strong> {selectedPatientDetails.dateOfBirth || '—'}</div>
                  <div><strong>Giới tính:</strong> {selectedPatientDetails.gender}</div>
                  <div className="col-span-2"><strong>Địa chỉ:</strong> {selectedPatientDetails.address}</div>
                </div>
              </div>
            )}

            {/* Person Selector Modal Portal */}
            {showPersonPicker && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-2xl border border-gray-200 p-6 max-w-md w-full shadow-xl relative max-h-[90vh] overflow-y-auto">
                  <div className="flex justify-between items-center mb-4 pb-2 border-b border-gray-100">
                    <h4 className="font-bold text-gray-900 text-base">Chọn người thân khám</h4>
                    <button type="button" onClick={() => setShowPersonPicker(false)} className="text-gray-400 hover:text-gray-600">
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {patientProfilesQuery.isLoading ? (
                    <div className="text-xs text-gray-400 py-4 text-center">Đang tải danh sách người thân...</div>
                  ) : relativeProfiles.length === 0 ? (
                    <div className="text-xs text-gray-400 py-4 text-center">Bạn chưa thêm người thân nào.</div>
                  ) : (
                    <div className="space-y-2 mb-4">
                      {relativeProfiles.map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => {
                            setBookingData(prev => ({ ...prev, patientProfileId: p.id }));
                            setValidationErrors(prev => { const n = { ...prev }; delete n.patientProfileId; return n; });
                            setShowPersonPicker(false);
                          }}
                          className={`w-full p-3 rounded-xl border text-left cursor-pointer transition-colors ${
                            bookingData.patientProfileId === p.id 
                              ? 'border-cyan-600 bg-cyan-50/20 text-cyan-700' 
                              : 'border-gray-100 bg-white hover:border-cyan-200'
                          }`}
                        >
                          <div className="font-bold text-gray-900 text-xs">{p.fullName}</div>
                          <div className="text-[10px] text-gray-500 mt-1">Mối quan hệ: {p.relationship} • SĐT: {p.phone}</div>
                        </button>
                      ))}
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => setShowAddRelative(true)}
                    className="w-full py-2.5 border border-cyan-400 text-cyan-600 hover:bg-cyan-50 rounded-xl text-xs font-bold cursor-pointer transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Plus className="w-4 h-4" />
                    Thêm người thân mới
                  </button>
                </div>
              </div>
            )}

            {/* Add Relative Profile Modal Portal */}
            {showAddRelative && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-2xl border border-gray-200 p-6 max-w-md w-full shadow-xl relative max-h-[90vh] overflow-y-auto">
                  <div className="flex justify-between items-center mb-4 pb-2 border-b border-gray-100">
                    <h4 className="font-bold text-gray-900 text-base">Thêm hồ sơ người thân</h4>
                    <button type="button" onClick={() => setShowAddRelative(false)} className="text-gray-400 hover:text-gray-600">
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <form onSubmit={handleAddRelative} className="space-y-4">
                    {formErrors.submit && (
                      <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-xs text-red-600 font-semibold">
                        {formErrors.submit}
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                      <div className="col-span-2">
                        <label className="block text-[10px] font-bold text-gray-500 mb-1.5">HỌ TÊN <span className="text-red-500">*</span></label>
                        <input 
                          type="text" 
                          placeholder="Nhập họ tên" 
                          value={newRelative.name}
                          onChange={(e) => setNewRelative(prev => ({ ...prev, name: e.target.value }))}
                          className={`w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 bg-white ${
                            formErrors.name ? 'border-red-500' : 'border-gray-200'
                          }`}
                        />
                        {formErrors.name && <p className="text-red-500 text-[10px] mt-1">{formErrors.name}</p>}
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-gray-500 mb-1.5">QUAN HỆ <span className="text-red-500">*</span></label>
                        <select 
                          value={newRelative.relationship}
                          onChange={(e) => setNewRelative(prev => ({ ...prev, relationship: e.target.value }))}
                          className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 bg-white"
                        >
                          <option value="CON">Con</option>
                          <option value="VO_CHONG">Vợ/Chồng</option>
                          <option value="CHA_ME">Cha/Mẹ</option>
                          <option value="ONG_BA">Ông/Bà</option>
                          <option value="ANH_CHI_EM">Anh/Chị/Em</option>
                          <option value="KHAC">Khác</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-gray-500 mb-1.5">SỐ ĐIỆN THOẠI <span className="text-red-500">*</span></label>
                        <input 
                          type="tel" 
                          placeholder="Số điện thoại" 
                          value={newRelative.phone}
                          onChange={(e) => setNewRelative(prev => ({ ...prev, phone: e.target.value }))}
                          className={`w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 bg-white ${
                            formErrors.phone ? 'border-red-500' : 'border-gray-200'
                          }`}
                        />
                        {formErrors.phone && <p className="text-red-500 text-[10px] mt-1">{formErrors.phone}</p>}
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-gray-500 mb-1.5">NGÀY SINH <span className="text-red-500">*</span></label>
                        <input 
                          type="date" 
                          value={newRelative.dateOfBirth}
                          onChange={(e) => setNewRelative(prev => ({ ...prev, dateOfBirth: e.target.value }))}
                          className={`w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 bg-white ${
                            formErrors.dob ? 'border-red-500' : 'border-gray-200'
                          }`}
                        />
                        {formErrors.dob && <p className="text-red-500 text-[10px] mt-1">{formErrors.dob}</p>}
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-gray-500 mb-1.5">GIỚI TÍNH <span className="text-red-500">*</span></label>
                        <select 
                          value={newRelative.gender}
                          onChange={(e) => setNewRelative(prev => ({ ...prev, gender: e.target.value }))}
                          className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 bg-white"
                        >
                          <option value="MALE">Nam</option>
                          <option value="FEMALE">Nữ</option>
                          <option value="OTHER">Khác</option>
                        </select>
                      </div>

                      <div className="col-span-2">
                        <label className="block text-[10px] font-bold text-gray-500 mb-1.5">ĐỊA CHỈ</label>
                        <input 
                          type="text" 
                          placeholder="Địa chỉ thường trú" 
                          value={newRelative.address}
                          onChange={(e) => setNewRelative(prev => ({ ...prev, address: e.target.value }))}
                          className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 bg-white"
                        />
                      </div>
                    </div>

                    <button 
                      type="submit" 
                      disabled={createProfileMutation.isPending}
                      className="w-full py-3 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl text-sm font-semibold transition-colors shadow-sm mt-2"
                    >
                      {createProfileMutation.isPending ? 'Đang thêm...' : 'Lưu thông tin'}
                    </button>
                  </form>
                </div>
              </div>
            )}

            {/* Consultation Description */}
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Lý do khám / Triệu chứng bệnh <span className="text-red-500">*</span></label>
              <textarea
                rows={4}
                value={bookingData.reason}
                onChange={(e) => {
                  setBookingData(prev => ({ ...prev, reason: e.target.value }));
                  setValidationErrors(prev => { const n = { ...prev }; delete n.reason; return n; });
                }}
                placeholder="Ví dụ: Đau mỏi vai gáy, sốt phát ban nhẹ từ hôm qua, khám sức khỏe định kỳ..."
                className={`w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 resize-none bg-white ${
                  validationErrors.reason ? 'border-red-500' : 'border-gray-200'
                }`}
              />
              {validationErrors.reason && <p className="text-red-500 text-[10px] mt-1">Lý do khám là thông tin bắt buộc.</p>}
            </div>

            {/* Note text field */}
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Ghi chú thêm (Nếu có)</label>
              <input
                type="text"
                value={bookingData.note}
                onChange={(e) => setBookingData(prev => ({ ...prev, note: e.target.value }))}
                placeholder="Yêu cầu khác nếu có..."
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 bg-white text-gray-800"
              />
            </div>

          </div>
        </div>
      )}

      {/* STEP 4: Confirm Booking details */}
      {step === 4 && (
        <div className="bg-white rounded-2xl border border-gray-150 p-6 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Xác nhận thông tin đặt khám</h3>
          <ErrorBanner />

          <div className="space-y-6">
            
            {/* Receipt layout */}
            <div className="border border-gray-200 rounded-2xl overflow-hidden shadow-inner bg-gray-50/50">
              <div className="bg-gradient-to-r from-cyan-600 to-teal-500 text-white p-4">
                <h4 className="font-bold text-sm">Tóm tắt dịch vụ hẹn</h4>
              </div>
              <div className="p-4 space-y-3.5 text-xs text-gray-600 font-medium">
                <div className="flex justify-between">
                  <span>Bác sĩ điều trị</span>
                  <span className="text-gray-900 font-bold">{bookingData.doctor?.title} {bookingData.doctor?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span>Chuyên khoa khám</span>
                  <span className="text-gray-900 font-semibold">{bookingData.specialty?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span>Thời gian khám</span>
                  <span className="text-gray-900 font-bold">
                    {bookingData.timeSlot?.startTime} – {bookingData.timeSlot?.endTime} ngày {formatDisplayDate(bookingData.date)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Người khám bệnh</span>
                  <span className="text-gray-900 font-bold">
                    {selectedPatientDetails?.fullName} ({bookingData.forSelf ? 'Bản thân' : 'Người thân'})
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>SĐT người khám</span>
                  <span className="text-gray-900 font-semibold">{selectedPatientDetails?.phone}</span>
                </div>
                <div className="flex justify-between">
                  <span>Email xác nhận</span>
                  <span className="text-gray-900 font-semibold">{selectedPatientDetails?.email}</span>
                </div>
                <div className="flex justify-between">
                  <span>Lý do khám bệnh</span>
                  <span className="text-gray-900 truncate max-w-[250px]">{bookingData.reason}</span>
                </div>
                
                <hr className="border-gray-200 my-2" />
                
                <div className="flex justify-between items-center text-sm font-bold text-gray-900">
                  <span>Giá khám tham khảo</span>
                  <span className="text-cyan-600 text-base">{formatPrice(bookingData.doctor?.price)}</span>
                </div>
              </div>
            </div>

            {/* Disclaimer disclaimer alert banner */}
            <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 text-xs text-amber-800 flex items-start gap-2.5">
              <Info className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-600" />
              <span>Giá khám trên chỉ mang tính chất tham khảo. Bệnh nhân sẽ thanh toán chi phí khám chữa bệnh thực tế trực tiếp tại quầy thu ngân phòng khám sau khi kết thúc buổi khám bệnh.</span>
            </div>
          </div>
        </div>
      )}

      {/* STEP 5: Success Screen */}
      {step === 5 && (
        <div className="bg-white rounded-2xl border border-gray-150 p-8 shadow-sm text-center">
          <div className="w-16 h-16 bg-cyan-100 rounded-full flex items-center justify-center mx-auto mb-4 text-cyan-600">
            <CheckCircle className="w-10 h-10" />
          </div>
          <h2 className="text-2xl font-extrabold text-gray-900 mb-1">Đặt lịch thành công!</h2>
          <div className="inline-block px-3 py-1 bg-green-50 text-green-700 rounded-full text-xs font-bold mb-6 border border-green-100">
            ĐÃ XÁC NHẬN
          </div>

          {/* Receipt box detail */}
          <div className="bg-gray-50 border border-gray-150 rounded-2xl p-5 max-w-md mx-auto text-left space-y-3.5 mb-6 text-xs text-gray-600 font-medium">
            <div className="flex justify-between border-b border-gray-200 pb-2">
              <span className="text-gray-500 font-bold uppercase tracking-wide">Mã lịch hẹn</span>
              <span className="text-gray-900 font-extrabold text-sm tracking-wider select-all highlight-code px-2 py-0.5 bg-gray-200 rounded">
                {bookingResult?.code || 'CP' + Math.floor(1000000000 + Math.random() * 9000000000)}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Người được khám</span>
              <span className="text-gray-900 font-bold">{selectedPatientDetails?.fullName} ({bookingData.forSelf ? 'Bản thân' : 'Người thân'})</span>
            </div>
            <div className="flex justify-between">
              <span>Ngày sinh</span>
              <span className="text-gray-900 font-semibold">{selectedPatientDetails?.dateOfBirth}</span>
            </div>
            <div className="flex justify-between">
              <span>Bác sĩ khám</span>
              <span className="text-gray-900 font-bold">{bookingData.doctor?.title} {bookingData.doctor?.name}</span>
            </div>
            <div className="flex justify-between">
              <span>Chuyên khoa</span>
              <span className="text-gray-900 font-semibold">{bookingData.specialty?.name}</span>
            </div>
            <div className="flex justify-between">
              <span>Thời gian khám</span>
              <span className="text-gray-900 font-bold">
                {bookingData.timeSlot?.startTime.slice(0, 5)} - {bookingData.timeSlot?.endTime.slice(0, 5)} ngày {formatDisplayDate(bookingData.date)}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Email nhận tin</span>
              <span className="text-gray-900 font-semibold">{selectedPatientDetails?.email}</span>
            </div>
            <div className="flex justify-between">
              <span>Trạng thái</span>
              <span className="text-green-600 font-bold">Đã xác nhận</span>
            </div>
          </div>

          <div className="p-3 bg-cyan-50/50 rounded-2xl border border-cyan-100 max-w-md mx-auto text-xs text-cyan-800 mb-8">
            📧 Hướng dẫn check-in và chi tiết lịch hẹn đã được gửi đến email <strong>{selectedPatientDetails?.email}</strong>.
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
            <Link 
              to="/benh-nhan/lich-hen" 
              className="w-full sm:w-auto px-6 py-3 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl text-sm font-semibold transition-colors shadow-sm"
            >
              Xem chi tiết lịch hẹn
            </Link>
            <button 
              type="button" 
              onClick={handleResetBooking}
              className="w-full sm:w-auto px-6 py-3 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-xl text-sm font-semibold transition-colors shadow-sm cursor-pointer"
            >
              Đặt lịch hẹn mới
            </button>
            <Link 
              to="/benh-nhan/lich-hen" 
              className="w-full sm:w-auto px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-sm font-semibold transition-colors"
            >
              Quản lý lịch khám
            </Link>
          </div>
        </div>
      )}

      {/* Wizard Footer Navigation Actions */}
      {step < 5 && (
        <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-150">
          <button
            type="button"
            disabled={step === 1}
            onClick={handlePrevStep}
            className={`px-5 py-2.5 border rounded-xl text-sm font-semibold transition-all flex items-center gap-1.5 ${
              step === 1 
                ? 'border-gray-200 text-gray-300 cursor-not-allowed bg-gray-50' 
                : 'border-cyan-500 text-cyan-600 hover:bg-cyan-50 bg-white cursor-pointer'
            }`}
          >
            <span>←</span> Quay lại
          </button>
          
          {step === 4 ? (
            <button
              type="button"
              disabled={bookMutation.isPending}
              onClick={handleConfirmBooking}
              className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-sm font-bold shadow-sm transition-colors cursor-pointer"
            >
              {bookMutation.isPending ? 'Đang đặt lịch...' : 'Xác nhận đặt hẹn'}
            </button>
          ) : (
            <button
              type="button"
              onClick={handleNextStep}
              className="px-6 py-2.5 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl text-sm font-semibold shadow-sm transition-colors cursor-pointer flex items-center gap-1.5"
            >
              Tiếp theo <span>→</span>
            </button>
          )}
        </div>
      )}

    </div>
  );
}
