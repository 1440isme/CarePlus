import { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { Check, ChevronRight, ChevronLeft, Calendar, Clock, User, Users, CheckCircle, Mail, Star, MapPin, Search, AlertCircle, X, Plus, Info, Shield, Phone, Sparkles, Heart, Bone, Baby, Activity, HeartPulse, Stethoscope, Ear } from 'lucide-react';
import { useAuth } from '../../shared/hooks/useAuth.js';
import { useSpecialties } from '../../features/specialty/hooks/useSpecialties.js';
import { useDoctorList } from '../../features/doctor/hooks/useDoctorList.js';
import { useTimeSlots } from '../../features/timeslot/hooks/useTimeSlots.js';
import { useBookingRules } from '../../features/admin/clinic-settings/hooks/useBookingRules.js';
import {
  buildVirtualSlotsForSchedules,
  filterSlotGroupsBySchedules,
  mergePersistedSlots,
} from '../../features/timeslot/virtual-slot.service.js';
import { usePatientProfiles } from '../../features/patient-profile/hooks/usePatientProfiles.js';
import { useCreatePatientProfile } from '../../features/patient-profile/hooks/useCreatePatientProfile.js';
import { useMe } from '../../features/user/hooks/useMe.js';
import { useBookAppointment, useMyAppointments } from '../../features/appointment/hooks/useAppointments.js';
import LoadingBlock from '../../shared/components/feedback/LoadingBlock.jsx';
import StateBlock from '../../shared/components/feedback/StateBlock.jsx';
import { lockTimeSlot, unlockTimeSlot } from '../../features/timeslot/services/timeslot.service.js';
import './booking-wizard.css';

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

export default function BookingWizardPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
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
    const isLoginError = typeof stepError === 'string' && stepError.toLowerCase().includes('đăng nhập');
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
        gap: '12px',
        animation: 'fadeIn 0.2s ease-out'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <span>⚠️ {stepError}</span>
          {isLoginError && (
            <button
              type="button"
              onClick={() => {
                sessionStorage.setItem('pending_booking', JSON.stringify({
                  specialty: bookingData.specialty,
                  doctor: bookingData.doctor,
                  date: bookingData.date,
                  timeSlot: bookingData.timeSlot,
                  step: 3
                }));
                navigate('/dang-nhap?redirect=/dat-lich');
              }}
              style={{
                background: primary,
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                padding: '4px 10px',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '0.8rem',
              }}
            >
              Đăng nhập ngay
            </button>
          )}
        </div>
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
  const [lockedSlotId, setLockedSlotId] = useState(null);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const [lockClientId] = useState(() => {
    let id = sessionStorage.getItem('booking_lock_client_id');
    if (!id) {
      id = 'client_' + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
      sessionStorage.setItem('booking_lock_client_id', id);
    }
    return id;
  });

  const hasProcessedQueryParams = useRef(false);

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

  // Fetch current user appointments for limit checking
  const myAppointmentsQuery = useMyAppointments({}, { enabled: isAuthenticated });
  const appointmentsList = myAppointmentsQuery.data?.data || [];

  // 6. Book Appointment Mutation
  const bookMutation = useBookAppointment();
  const createProfileMutation = useCreatePatientProfile();

  const primary = '#0092B8';
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
  const Req = () => <span style={{ color: '#EF4444', marginLeft: 2 }}>*</span>;

  const selectedPerson = useMemo(() => {
    if (bookingData.forSelf) {
      return {
        id: 'self',
        name: currentUserData?.name || 'Bản thân',
        relation: 'Bản thân'
      };
    } else {
      const profile = relativeProfiles.find((p) => p.id === bookingData.patientProfileId);
      if (!profile) return null;

      const relLabel = {
        'SELF': 'Bản thân',
        'CHA': 'Cha/Bố',
        'ME': 'Mẹ',
        'CON': 'Con',
        'VO': 'Vợ',
        'CHONG': 'Chồng',
        'ANH': 'Anh',
        'CHI': 'Chị',
        'EM': 'Em',
        'ONG': 'Ông',
        'BA': 'Bà',
        'KHAC': 'Khác'
      }[profile.relationship] || 'Người thân';

      return {
        id: profile.id,
        name: profile.fullName,
        relation: relLabel
      };
    }
  }, [bookingData.forSelf, bookingData.patientProfileId, currentUserData, relativeProfiles]);

  const selectPerson = (person) => {
    if (person.id === 'self') {
      setBookingData((prev) => ({
        ...prev,
        forSelf: true,
        patientProfileId: ''
      }));
    } else {
      setBookingData((prev) => ({
        ...prev,
        forSelf: false,
        patientProfileId: person.id
      }));
    }
    setValidationErrors((prev) => {
      const next = { ...prev };
      delete next.patientProfileId;
      return next;
    });
    setStepError(null);
    setShowPersonPicker(false);
  };

  const handleAddRelativeInline = async () => {
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
        if (isAuthenticated) {
          setStep(parsed.step || 1);
        } else {
          setStep(2);
          setStepError('Vui lòng đăng nhập để tiếp tục đặt lịch.');
        }
      } catch (err) {
        console.error('Failed to parse pending booking state', err);
      } finally {
        sessionStorage.removeItem('pending_booking');
      }
    }
  }, [isAuthenticated]);

  // Protect step 3 and 4: prevent unauthenticated users from entering
  useEffect(() => {
    if (!isAuthenticated && (step === 3 || step === 4)) {
      setStep(2);
      setStepError('Vui lòng đăng nhập để tiếp tục đặt lịch.');
    }
  }, [step, isAuthenticated]);

  const lockedSlotIdRef = useRef(lockedSlotId);
  useEffect(() => {
    lockedSlotIdRef.current = lockedSlotId;
  }, [lockedSlotId]);

  useEffect(() => {
    return () => {
      if (lockedSlotIdRef.current) {
        unlockTimeSlot(lockedSlotIdRef.current, lockClientId).catch((err) => {
          console.error('Failed to unlock slot on unmount:', err);
        });
      }
    };
  }, [lockClientId]);

  // Handle query parameters (?doctorId=...&date=...&slot=...) on mount/load
  useEffect(() => {
    const queryDoctorId = searchParams.get('doctorId');
    const queryDate = searchParams.get('date');
    
    if (queryDoctorId && doctorsQuery.data?.data && specialtiesQuery.data?.data) {
      const doc = doctorsQuery.data.data.find(d => String(d.id) === String(queryDoctorId));
      if (doc) {
        const spec = specialtiesQuery.data.data.find(s => s.id === doc.specialtyId);
        const selectedDate = queryDate || new Date().toLocaleDateString('sv').slice(0, 10);
        
        setBookingData(prev => ({
          ...prev,
          specialty: spec || null,
          doctor: doc,
          date: selectedDate,
        }));
        
        const querySlot = searchParams.get('slot');
        if (!querySlot) {
          setStep(2);
        }
      }
    }
  }, [searchParams, doctorsQuery.data, specialtiesQuery.data]);

  // Next Days list for Step 2 Date Slider (based on system settings)
  const next7Days = useMemo(() => {
    const dates = [];
    const weekdays = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
    const limit = systemSettingsResponse?.data?.maxBookingDaysAhead || 7;
    for (let i = 0; i < limit; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      const dayNum = d.getDate();
      const dayLabel = i === 0 ? 'Hôm nay' : weekdays[d.getDay()];
      const dateStr = d.toLocaleDateString('sv').slice(0, 10); // YYYY-MM-DD
      dates.push({ dateStr, dayLabel, dayNum });
    }
    return dates;
  }, [systemSettingsResponse?.data?.maxBookingDaysAhead]);

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

  // Calculate current active appointments count for the selected patient
  const currentActiveCount = useMemo(() => {
    if (!isAuthenticated) return 0;
    
    // Filter active appointments (CONFIRMED or CHECKED_IN)
    const activeAppts = appointmentsList.filter(
      (appt) => appt.status === 'CONFIRMED' || appt.status === 'CHECKED_IN'
    );

    if (bookingData.forSelf) {
      // For self
      return activeAppts.filter((appt) => appt.forSelf === true).length;
    } else {
      // For relative
      return activeAppts.filter(
        (appt) => appt.patientProfileId === bookingData.patientProfileId
      ).length;
    }
  }, [appointmentsList, bookingData.forSelf, bookingData.patientProfileId, isAuthenticated]);

  // Selected patient details (either self or selected relative)
  const selectedPatientDetails = useMemo(() => {
    if (bookingData.forSelf) {
      if (!currentUserData) return null;

      let dobStr = '';
      if (currentUserData.dateOfBirth) {
        const dob = new Date(currentUserData.dateOfBirth);
        if (!isNaN(dob.getTime())) {
          const d = String(dob.getUTCDate()).padStart(2, '0');
          const m = String(dob.getUTCMonth() + 1).padStart(2, '0');
          const y = dob.getUTCFullYear();
          dobStr = `${d}/${m}/${y}`;
        }
      }

      return {
        fullName: currentUserData.name || '',
        phone: currentUserData.phone || '',
        email: currentUserData.email || '',
        gender: currentUserData.gender === 'MALE' ? 'Nam' : currentUserData.gender === 'FEMALE' ? 'Nữ' : 'Khác',
        dateOfBirth: dobStr || currentUserData.dateOfBirth || '',
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
    if (lockedSlotId) {
      unlockTimeSlot(lockedSlotId, lockClientId).catch((err) => {
        console.error('Failed to unlock previous slot:', err);
      });
      setLockedSlotId(null);
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
    if (lockedSlotId) {
      unlockTimeSlot(lockedSlotId, lockClientId).catch((err) => {
        console.error('Failed to unlock previous slot:', err);
      });
      setLockedSlotId(null);
    }
    setBookingData((prev) => ({
      ...prev,
      date: dateStr,
      timeSlot: null // Reset slot when date changes
    }));
    setStepError(null);
  };

  // Handle timeslot click in Step 2
  const handleSelectTimeSlot = (timeSlot) => {
    if (bookingData.timeSlot?.id === timeSlot.id) {
      return;
    }
    setStepError(null);

    // If we have a previously locked slot and it's different, unlock it
    if (lockedSlotId && lockedSlotId !== timeSlot.id) {
      unlockTimeSlot(lockedSlotId, lockClientId).catch((err) => {
        console.error('Failed to unlock previous slot:', err);
      });
      setLockedSlotId(null);
    }

    setBookingData((prev) => ({
      ...prev,
      timeSlot
    }));
  };

  // Automatically select the first doctor in Step 2 if none is selected
  useEffect(() => {
    if (step === 2 && doctorsList.length > 0 && !bookingData.doctor) {
      handleSelectDoctor(doctorsList[0]);
    }
  }, [step, doctorsList, bookingData.doctor]);

  // Select matching slot from query params once slots are loaded and skip directly to Step 3
  const querySlot = searchParams.get('slot');
  useEffect(() => {
    const processQuerySlot = async (matchedSlot) => {
      hasProcessedQueryParams.current = true;
      setBookingData((prev) => ({
        ...prev,
        timeSlot: matchedSlot
      }));

      if (isAuthenticated) {
        try {
          setIsTransitioning(true);
          await lockTimeSlot(matchedSlot.id, lockClientId);
          setLockedSlotId(matchedSlot.id);
          setStep(3);
        } catch (err) {
          const msg = err.response?.data?.error?.message ||
            err.message ||
            'Không thể giữ khung giờ khám từ liên kết. Vui lòng chọn lại.';
          setStepError(msg);
          setStep(2);
        } finally {
          setIsTransitioning(false);
        }
      } else {
        setStep(2);
        setStepError('Vui lòng đăng nhập để tiếp tục đặt lịch.');
      }
    };

    if (querySlot && slotsList.length > 0 && !bookingData.timeSlot && !hasProcessedQueryParams.current) {
      const matchedSlot = slotsList.find(s => 
        s.startTime === querySlot || 
        `${s.startTime}-${s.endTime}` === querySlot
      );
      if (matchedSlot && matchedSlot.status === 'AVAILABLE') {
        processQuerySlot(matchedSlot);
      }
    }
  }, [querySlot, slotsList, bookingData.timeSlot, isAuthenticated, searchParams, doctorsQuery.data, specialtiesQuery.data, lockClientId]);

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
      // Authenticity Check before going to Step 3
      if (!isAuthenticated) {
        setStepError('Vui lòng đăng nhập để tiếp tục đặt lịch.');
        return;
      }

      // Lock the slot and proceed to Step 3
      const attemptLockAndProceed = async () => {
        try {
          setIsTransitioning(true);
          if (lockedSlotId !== bookingData.timeSlot.id) {
            if (lockedSlotId) {
              await unlockTimeSlot(lockedSlotId, lockClientId).catch(err => console.error(err));
            }
            await lockTimeSlot(bookingData.timeSlot.id, lockClientId);
            setLockedSlotId(bookingData.timeSlot.id);
          }
          setStep(3);
        } catch (err) {
          const msg = err.response?.data?.error?.message ||
            err.message ||
            'Không thể giữ khung giờ khám. Vui lòng thử lại.';
          setStepError(msg);
          timeSlotsQuery.refetch();
        } finally {
          setIsTransitioning(false);
        }
      };

      attemptLockAndProceed();
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

      // Check max active appointments limit
      const maxActiveLimit = systemSettingsResponse?.data?.maxActiveAppointmentsPerUser ?? 5;
      if (currentActiveCount >= maxActiveLimit) {
        const patientName = bookingData.forSelf
          ? 'của bạn'
          : `của người thân "${selectedPerson?.name || 'được chọn'}"`;
        setStepError(
          `Tài khoản ${patientName} đã đạt số lượng lịch hẹn hoạt động tối đa theo quy định (${maxActiveLimit} lịch hẹn). Vui lòng hoàn thành hoặc hủy bớt lịch hẹn cũ để đặt tiếp.`
        );
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

      // Save result and proceed to Step 5
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
    if (lockedSlotId) {
      unlockTimeSlot(lockedSlotId, lockClientId).catch((err) => {
        console.error('Failed to unlock slot:', err);
      });
      setLockedSlotId(null);
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

  // Block non-patient authenticated users
  const userRole = authUser?.role;
  if (isAuthenticated && userRole && userRole !== 'PATIENT') {
    return (
      <div className="page-shell">
        <div className="booking-wizard-container">
          <div style={{
            maxWidth: 520,
            margin: '60px auto',
            padding: '40px 32px',
            background: '#fff',
            borderRadius: 16,
            border: '1.5px solid #FCA5A5',
            boxShadow: '0 4px 24px rgba(0,0,0,0.07)',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🔒</div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#111827', marginBottom: 8 }}>
              Chức năng này chỉ dành cho bệnh nhân
            </h2>
            <p style={{ color: '#6B7280', fontSize: '0.95rem', marginBottom: 24, lineHeight: 1.6 }}>
              Tài khoản của bạn có vai trò <strong style={{ color: '#374151' }}>
                {userRole === 'DOCTOR' ? 'Bác sĩ' : userRole === 'RECEPTIONIST' ? 'Lễ tân' : 'Quản trị viên'}
              </strong>. Vui lòng sử dụng tài khoản bệnh nhân để đặt lịch khám.
            </p>
            <button
              type="button"
              onClick={() => navigate(-1)}
              style={{
                padding: '10px 28px',
                background: '#0092B8',
                color: '#fff',
                border: 'none',
                borderRadius: 10,
                fontWeight: 600,
                fontSize: '0.95rem',
                cursor: 'pointer'
              }}
            >
              ← Quay lại
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-shell">
      <div className="booking-wizard-container">

        {/* Title Section */}
        <div className="booking-title-section" style={{ marginBottom: 20 }}>
          <h1>Đặt lịch khám</h1>
          <p>Chọn chuyên khoa → Bác sĩ & lịch → Thông tin → Xác nhận</p>
        </div>

        {/* Stepper Progress bar */}
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

          <div className={`step-item ${step === 4 ? 'active' : step > 4 ? 'completed' : ''}`}>
            <div className="step-node">
              <div className="step-circle">
                {step > 4 ? '✓' : '4'}
              </div>
              <div className="step-label">Xác nhận</div>
            </div>
          </div>
        </div>

        {/* STEP 1: Specialty List */}
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
                {specialtiesList.map((spec, idx) => (
                  <button
                    key={spec.id}
                    type="button"
                    className={`specialty-card-button ${bookingData.specialty?.id === spec.id ? 'selected' : ''}`}
                    onClick={() => handleSelectSpecialty(spec)}
                  >
                    <div className={`w-10 h-10 rounded-lg ${colorClasses[idx % colorClasses.length]} flex items-center justify-center mb-2`}>
                      {specialtyIconMap[spec.icon] || <Stethoscope className="w-5 h-5" />}
                    </div>
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

        {/* STEP 2: Doctor & Timeslot Selection */}
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
                                    {morningSlots.map((slot) => {
                                      const isBooked = slot.status === 'BOOKED' || slot.status === 'LOCKED';
                                      const isExpired = slot.status === 'EXPIRED' || (() => {
                                        const now = new Date();
                                        const [year, month, day] = bookingData.date.split('-').map(Number);
                                        const [hours, minutes] = slot.endTime.split(':').map(Number);
                                        const slotEndTime = new Date(year, month - 1, day, hours, minutes, 0, 0);
                                        return now > slotEndTime;
                                      })();
                                      const isDisabled = isBooked || isExpired;
                                      return (
                                        <button
                                          key={slot.id}
                                          type="button"
                                          disabled={isDisabled}
                                          className={`timeslot-btn ${bookingData.timeSlot?.id === slot.id ? 'selected' : ''} ${isBooked ? 'line-through' : ''}`}
                                          onClick={() => handleSelectTimeSlot(slot)}
                                        >
                                          {slot.startTime.slice(0, 5)} - {slot.endTime.slice(0, 5)}
                                        </button>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}

                              {/* Ca chieu */}
                              {afternoonSlots.length > 0 && (
                                <div className="timeslot-shift-group">
                                  <span className="timeslot-shift-label">🌤️ Ca chiều</span>
                                  <div className="timeslots-button-grid">
                                    {afternoonSlots.map((slot) => {
                                      const isBooked = slot.status === 'BOOKED' || slot.status === 'LOCKED';
                                      const isExpired = slot.status === 'EXPIRED' || (() => {
                                        const now = new Date();
                                        const [year, month, day] = bookingData.date.split('-').map(Number);
                                        const [hours, minutes] = slot.endTime.split(':').map(Number);
                                        const slotEndTime = new Date(year, month - 1, day, hours, minutes, 0, 0);
                                        return now > slotEndTime;
                                      })();
                                      const isDisabled = isBooked || isExpired;
                                      return (
                                        <button
                                          key={slot.id}
                                          type="button"
                                          disabled={isDisabled}
                                          className={`timeslot-btn ${bookingData.timeSlot?.id === slot.id ? 'selected' : ''} ${isBooked ? 'line-through' : ''}`}
                                          onClick={() => handleSelectTimeSlot(slot)}
                                        >
                                          {slot.startTime.slice(0, 5)} - {slot.endTime.slice(0, 5)}
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

        {/* STEP 3: Patient Profile / Information */}
        {step === 3 && (
          <div className="booking-card">
            {/* Header with current person + change button */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: '#333', margin: 0 }}>Thông tin người được khám</h3>
              <button
                type="button"
                onClick={() => setShowPersonPicker(true)}
                style={{
                  fontSize: 12,
                  color: primary,
                  background: validationErrors.patientProfileId ? '#FEF2F2' : '#EBF7FD',
                  border: `1px solid ${validationErrors.patientProfileId ? '#EF4444' : primary}`,
                  borderRadius: 6,
                  padding: '5px 12px',
                  cursor: 'pointer',
                  fontWeight: 500
                }}
              >
                {selectedPerson ? `${selectedPerson.name} (${selectedPerson.relation}) ✎` : 'Chọn người khám'}
              </button>
            </div>

            <ErrorBanner />

            {currentActiveCount >= (systemSettingsResponse?.data?.maxActiveAppointmentsPerUser || 5) && (
              <div style={{
                backgroundColor: '#FEF2F2',
                color: '#EF4444',
                border: '1.5px solid #FCA5A5',
                padding: '10px 14px',
                borderRadius: '8px',
                marginBottom: '16px',
                fontSize: '0.85rem',
                fontWeight: 500,
                lineHeight: 1.5
              }}>
                ⚠️ Bệnh nhân này đã đạt số lượng lịch hẹn hoạt động tối đa theo quy định ({systemSettingsResponse?.data?.maxActiveAppointmentsPerUser || 5} lịch hẹn). Vui lòng hoàn thành hoặc hủy bớt lịch cũ để tiếp tục.
              </div>
            )}

            {/* Person picker popup */}
            {showPersonPicker && createPortal(
              <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
                <div style={{ background: '#fff', borderRadius: 8, padding: 24, maxWidth: 440, width: '100%', maxHeight: '80vh', overflowY: 'auto', boxShadow: '0 8px 32px rgba(0,0,0,0.14)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <h3 style={{ fontSize: 15, fontWeight: 700, color: '#333', margin: 0 }}>Chọn người được khám</h3>
                    <button
                      type="button"
                      onClick={() => { setShowPersonPicker(false); setShowAddRelative(false); }}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#aaa', fontSize: '1.25rem', fontWeight: 'bold' }}
                    >
                      ✕
                    </button>
                  </div>

                  {/* Self option */}
                  <button
                    type="button"
                    onClick={() => selectPerson({ id: 'self' })}
                    style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', border: `2px solid ${bookingData.forSelf ? primary : '#E5E5E5'}`, borderRadius: 8, background: bookingData.forSelf ? '#EBF7FD' : '#fff', cursor: 'pointer', marginBottom: 8, textAlign: 'left' }}
                  >
                    <div style={{ width: 34, height: 34, background: '#EBF7FD', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '1.1rem' }}>
                      👤
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#333' }}>{currentUserData?.name || 'Bản thân'}</div>
                      <div style={{ fontSize: 11, color: '#888' }}>Bản thân</div>
                    </div>
                  </button>

                  {/* Relatives list */}
                  {relativeProfiles.map(r => {
                    const relLabel = {
                      'SELF': 'Bản thân',
                      'CHA': 'Cha/Bố',
                      'ME': 'Mẹ',
                      'CON': 'Con',
                      'VO': 'Vợ',
                      'CHONG': 'Chồng',
                      'ANH': 'Anh',
                      'CHI': 'Chị',
                      'EM': 'Em',
                      'ONG': 'Ông',
                      'BA': 'Bà',
                      'KHAC': 'Khác'
                    }[r.relationship] || 'Người thân';

                    let dobStr = '';
                    if (r.dateOfBirth) {
                      const dob = new Date(r.dateOfBirth);
                      if (!isNaN(dob.getTime())) {
                        const d = String(dob.getUTCDate()).padStart(2, '0');
                        const m = String(dob.getUTCMonth() + 1).padStart(2, '0');
                        const y = dob.getUTCFullYear();
                        dobStr = `${d}/${m}/${y}`;
                      }
                    }

                    return (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => selectPerson(r)}
                        style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', border: `2px solid ${!bookingData.forSelf && bookingData.patientProfileId === r.id ? primary : '#E5E5E5'}`, borderRadius: 8, background: !bookingData.forSelf && bookingData.patientProfileId === r.id ? '#EBF7FD' : '#fff', cursor: 'pointer', marginBottom: 8, textAlign: 'left' }}
                      >
                        <div style={{ width: 34, height: 34, background: '#F3E8FF', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '1.1rem' }}>
                          👥
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: '#333' }}>{r.fullName}</div>
                          <div style={{ fontSize: 11, color: '#888' }}>{relLabel} · {dobStr} {r.phone && `· ${r.phone}`}</div>
                        </div>
                      </button>
                    );
                  })}

                  {/* Add relative */}
                  {!showAddRelative ? (
                    <button
                      type="button"
                      onClick={() => setShowAddRelative(true)}
                      style={{ width: '100%', padding: '9px 0', border: `1px dashed ${primary}`, color: primary, borderRadius: 8, background: '#fff', cursor: 'pointer', fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 4, fontWeight: 500 }}
                    >
                      ＋ Thêm người thân
                    </button>
                  ) : (
                    <div style={{ marginTop: 12, padding: '14px', border: '1px solid #E5E5E5', borderRadius: 8, background: '#F9FAFB' }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#333', marginBottom: 10 }}>Thêm người thân mới</div>
                      {formErrors.submit && (
                        <div style={{ color: '#EF4444', fontSize: 12, fontWeight: 500, backgroundColor: '#FEF2F2', border: '1px solid #FCA5A5', padding: '8px 12px', borderRadius: 6, marginBottom: 8 }}>
                          ⚠️ {formErrors.submit}
                        </div>
                      )}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                          <div>
                            <label style={{ fontSize: 11, color: '#555', display: 'block', marginBottom: 3 }}>Họ tên<Req /></label>
                            <input
                              value={newRelative.name}
                              onChange={e => { setNewRelative({ ...newRelative, name: e.target.value }); setFormErrors(prev => ({ ...prev, name: '' })); }}
                              style={{ ...inp, borderColor: formErrors.name ? '#EF4444' : '#ddd' }}
                              placeholder="Nhập họ tên"
                            />
                            {formErrors.name && <div style={{ fontSize: 10, color: '#EF4444', marginTop: 2 }}>{formErrors.name}</div>}
                          </div>
                          <div>
                            <label style={{ fontSize: 11, color: '#555', display: 'block', marginBottom: 3 }}>Quan hệ</label>
                            <select
                              value={newRelative.relationship}
                              onChange={e => setNewRelative({ ...newRelative, relationship: e.target.value })}
                              style={inp}
                            >
                              <option value="CHA">Cha/Bố</option>
                              <option value="ME">Mẹ</option>
                              <option value="CON">Con</option>
                              <option value="VO">Vợ</option>
                              <option value="CHONG">Chồng</option>
                              <option value="ANH">Anh</option>
                              <option value="CHI">Chị</option>
                              <option value="EM">Em</option>
                              <option value="ONG">Ông</option>
                              <option value="BA">Bà</option>
                              <option value="KHAC">Khác</option>
                            </select>
                          </div>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                          <div>
                            <label style={{ fontSize: 11, color: '#555', display: 'block', marginBottom: 3 }}>SĐT<Req /></label>
                            <input
                              value={newRelative.phone}
                              onChange={e => { setNewRelative({ ...newRelative, phone: e.target.value }); setFormErrors(prev => ({ ...prev, phone: '' })); }}
                              style={{ ...inp, borderColor: formErrors.phone ? '#EF4444' : '#ddd' }}
                              placeholder="09..."
                            />
                            {formErrors.phone && <div style={{ fontSize: 10, color: '#EF4444', marginTop: 2 }}>{formErrors.phone}</div>}
                          </div>
                          <div>
                            <label style={{ fontSize: 11, color: '#555', display: 'block', marginBottom: 3 }}>Ngày sinh<Req /></label>
                            <input
                              type="date"
                              value={newRelative.dateOfBirth}
                              onChange={e => { setNewRelative({ ...newRelative, dateOfBirth: e.target.value }); setFormErrors(prev => ({ ...prev, dob: '' })); }}
                              style={{ ...inp, borderColor: formErrors.dob ? '#EF4444' : '#ddd' }}
                            />
                            {formErrors.dob && <div style={{ fontSize: 10, color: '#EF4444', marginTop: 2 }}>{formErrors.dob}</div>}
                          </div>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                          <div>
                            <label style={{ fontSize: 11, color: '#555', display: 'block', marginBottom: 3 }}>Giới tính</label>
                            <select
                              value={newRelative.gender}
                              onChange={e => setNewRelative({ ...newRelative, gender: e.target.value })}
                              style={inp}
                            >
                              <option value="MALE">Nam</option>
                              <option value="FEMALE">Nữ</option>
                              <option value="OTHER">Khác</option>
                            </select>
                          </div>
                          <div>
                            <label style={{ fontSize: 11, color: '#555', display: 'block', marginBottom: 3 }}>Địa chỉ</label>
                            <input
                              value={newRelative.address || ''}
                              onChange={e => setNewRelative({ ...newRelative, address: e.target.value })}
                              style={inp}
                              placeholder="Tùy chọn"
                            />
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                          <button
                            type="button"
                            onClick={() => setShowAddRelative(false)}
                            style={{ flex: 1, padding: '7px 0', border: '1px solid #ddd', borderRadius: 6, fontSize: 12, color: '#555', background: '#fff', cursor: 'pointer' }}
                          >
                            Hủy
                          </button>
                          <button
                            type="button"
                            onClick={handleAddRelativeInline}
                            style={{ flex: 1, padding: '7px 0', background: primary, color: '#fff', border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
                          >
                            Thêm
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>,
              document.body
            )}

            {/* Read-only inputs representing the selected person */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {/* Họ tên + SĐT */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, color: '#555', marginBottom: 4, fontWeight: 500 }}>Họ tên<Req /></label>
                  <input
                    value={selectedPatientDetails?.fullName || ''}
                    disabled
                    style={{
                      ...inp,
                      backgroundColor: validationErrors.patientProfileId ? '#FEF2F2' : '#F9FAFB',
                      borderColor: validationErrors.patientProfileId ? '#EF4444' : '#ddd',
                      cursor: 'not-allowed'
                    }}
                    placeholder="Chưa chọn người khám"
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, color: '#555', marginBottom: 4, fontWeight: 500 }}>Số điện thoại<Req /></label>
                  <input
                    value={selectedPatientDetails?.phone || ''}
                    disabled
                    style={{
                      ...inp,
                      backgroundColor: validationErrors.patientProfileId ? '#FEF2F2' : '#F9FAFB',
                      borderColor: validationErrors.patientProfileId ? '#EF4444' : '#ddd',
                      cursor: 'not-allowed'
                    }}
                    placeholder="Chưa chọn người khám"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label style={{ display: 'block', fontSize: 12, color: '#555', marginBottom: 4, fontWeight: 500 }}>Email</label>
                <input
                  type="email"
                  value={selectedPatientDetails?.email || ''}
                  disabled
                  style={{ ...inp, backgroundColor: '#F9FAFB', cursor: 'not-allowed' }}
                  placeholder="Chưa chọn người khám"
                />
              </div>

              {/* Giới tính + Ngày sinh */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, color: '#555', marginBottom: 4, fontWeight: 500 }}>Giới tính<Req /></label>
                  <input
                    value={selectedPatientDetails?.gender || ''}
                    disabled
                    style={{ ...inp, backgroundColor: '#F9FAFB', cursor: 'not-allowed' }}
                    placeholder="Chưa chọn người khám"
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, color: '#555', marginBottom: 4, fontWeight: 500 }}>Ngày sinh<Req /></label>
                  <div style={{ position: 'relative' }}>
                    <input
                      value={selectedPatientDetails?.dateOfBirth || ''}
                      disabled
                      placeholder="dd/mm/yyyy"
                      style={{ ...inp, backgroundColor: '#F9FAFB', cursor: 'not-allowed' }}
                    />
                    <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 14, color: '#aaa', pointerEvents: 'none' }}>📅</span>
                  </div>
                </div>
              </div>

              {/* Địa chỉ */}
              <div>
                <label style={{ display: 'block', fontSize: 12, color: '#555', marginBottom: 4, fontWeight: 500 }}>Địa chỉ</label>
                <input
                  value={selectedPatientDetails?.address || ''}
                  disabled
                  style={{ ...inp, backgroundColor: '#F9FAFB', cursor: 'not-allowed' }}
                  placeholder="Địa chỉ liên hệ"
                />
              </div>

              {/* Lý do khám */}
              <div>
                <label style={{ display: 'block', fontSize: 12, color: '#555', marginBottom: 4, fontWeight: 500 }}>Lý do khám<Req /></label>
                <textarea
                  rows={3}
                  value={bookingData.reason}
                  onChange={e => {
                    setBookingData(prev => ({ ...prev, reason: e.target.value }));
                    setStepError(null);
                    if (e.target.value.trim() && validationErrors.reason) {
                      setValidationErrors(prev => {
                        const next = { ...prev };
                        delete next.reason;
                        return next;
                      });
                    }
                  }}
                  placeholder="Mô tả triệu chứng hoặc lý do khám..."
                  style={{
                    ...inp,
                    resize: 'none',
                    borderColor: validationErrors.reason ? '#EF4444' : '#ddd',
                    backgroundColor: validationErrors.reason ? '#FEF2F2' : '#fff'
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: Review Booking Details & Confirm */}
        {step === 4 && (
          <div className="booking-card">
            <h3>Xác nhận thông tin đặt lịch</h3>
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
                onClick={handleNextStep}
                disabled={isTransitioning}
              >
                {isTransitioning ? 'Đang xử lý...' : <>Tiếp theo <span>→</span></>}
              </button>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
