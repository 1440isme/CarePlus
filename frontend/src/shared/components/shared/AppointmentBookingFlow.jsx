/**
 * AppointmentBookingFlow
 * Shared 6-step booking wizard for:
 *   mode="PATIENT_SELF_BOOKING"  — Patient books for self/relative
 *   mode="RECEPTIONIST_BOOKING"  — Receptionist books on behalf of a patient
 */
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ChevronLeft, ChevronRight, CheckCircle, Search, Star,
  User, Users, Calendar, Clock, Info, Plus
} from 'lucide-react';
import { specialties, doctors, morningSlots, afternoonSlots, formatPrice } from '../../data/mockData';

const primary = '#49BCE2';
const accent = '#FFC10E';
const required = '#E53935';

const STEP_LABELS = ['Chuyên khoa', 'Bác sĩ', 'Lịch khám', 'Người khám', 'Xác nhận', 'Hoàn tất'];
const dayNames = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
const Req = () => <span style={{ color: required, marginLeft: 2 }}>*</span>;

function getDates() {
  const d = [];
  for (let i = 0; i < 7; i++) {
    const x = new Date(); x.setDate(x.getDate() + i); d.push(x);
  }
  return d;
}

const inp = {
  width: '100%', border: '1px solid #ddd', borderRadius: 6,
  padding: '8px 10px', fontSize: 13, color: '#333', outline: 'none',
  fontFamily: 'Roboto, Arial, sans-serif', boxSizing: 'border-box',
};

// Mock patient lookup for receptionist
const mockPatients = [
  { id: 'p1', name: 'Nguyễn Văn A', phone: '0901234567', email: 'a@email.com' },
  { id: 'p2', name: 'Phạm Thị B', phone: '0934567890', email: 'b@email.com' },
  { id: 'p3', name: 'Trần Lê Quốc Đại', phone: '0912345678', email: 'dai@email.com' },
];

const mockRelatives = [
  { id: 'r1', name: 'Nguyễn Thị Bích', relationship: 'Mẹ', phone: '0909123456' },
  { id: 'r2', name: 'Nguyễn Minh Tuấn', relationship: 'Con', phone: '' },
];

function StepIndicator({ current }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', marginBottom: 24, overflowX: 'auto', paddingBottom: 4 }}>
      {STEP_LABELS.map((label, i) => (
        <React.Fragment key={i}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
            <div style={{
              width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 12, fontWeight: 600,
              background: i < current ? primary : i === current ? primary : '#F0F0F0',
              color: i <= current ? '#fff' : '#aaa',
              boxShadow: i === current ? `0 0 0 4px ${primary}22` : 'none',
            }}>
              {i < current ? '✓' : i + 1}
            </div>
            <div style={{ fontSize: 10, marginTop: 3, color: i <= current ? primary : '#bbb', fontWeight: i === current ? 600 : 400, whiteSpace: 'nowrap' }}>
              {label}
            </div>
          </div>
          {i < STEP_LABELS.length - 1 && (
            <div style={{ flex: 1, height: 2, background: i < current ? primary : '#E5E5E5', margin: '0 4px 18px', minWidth: 20 }} />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

export function AppointmentBookingFlow({ mode, currentUserName = '', currentUserEmail = '', preselectedDoctorId, preselectedSpecialtyId, onSuccess, onCancel }) {
  const [step, setStep] = useState(0);

  const [selectedSpecId, setSelectedSpecId] = useState(preselectedSpecialtyId || '');
  const [specSearch, setSpecSearch] = useState('');

  const [selectedDoctorId, setSelectedDoctorId] = useState(preselectedDoctorId || '');

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedSlot, setSelectedSlot] = useState('');
  const dates = getDates();

  const [forSelf, setForSelf] = useState(true);
  const [selectedRelativeId, setSelectedRelativeId] = useState('');
  const [showAddRelative, setShowAddRelative] = useState(false);
  const [newRelative, setNewRelative] = useState({ name: '', phone: '', email: '', gender: 'MALE', dob: '', address: '', relationship: 'Con' });
  const [relErrors, setRelErrors] = useState({});

  const [patientQuery, setPatientQuery] = useState('');
  const [patientResults, setPatientResults] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [patientForm, setPatientForm] = useState({ name: '', phone: '', email: '', gender: 'MALE', dob: '', address: '', relationship: 'Bản thân' });
  const [pErrors, setPErrors] = useState({});

  const [note, setNote] = useState('');
  const [errors4, setErrors4] = useState({});

  const [aptCode] = useState(`CP${Date.now().toString().slice(-10)}`);

  const selectedSpec = specialties.find(s => s.id === selectedSpecId);
  const selectedDoctor = doctors.find(d => d.id === selectedDoctorId);
  const docsForSpec = selectedSpecId ? doctors.filter(d => d.specialtyId === selectedSpecId) : doctors;
  const filteredSpecs = specSearch ? specialties.filter(s => s.name.toLowerCase().includes(specSearch.toLowerCase())) : specialties;
  const selectedRelative = mockRelatives.find(r => r.id === selectedRelativeId);

  const getSlots = (shift) => {
    const base = shift === 'morning' ? morningSlots : afternoonSlots;
    const n = (selectedDoctorId.charCodeAt(selectedDoctorId.length - 1) || 0) % base.length;
    return base.map((t, i) => ({ time: t, avail: i !== n }));
  };

  const getPatientInfo = () => {
    if (mode === 'RECEPTIONIST_BOOKING') return patientForm;
    if (forSelf) return { name: currentUserName, phone: '', email: currentUserEmail, gender: '', dob: '', address: '', relationship: 'Bản thân' };
    if (selectedRelativeId && selectedRelative) return { name: selectedRelative.name, phone: selectedRelative.phone, email: '', gender: '', dob: '', address: '', relationship: selectedRelative.relationship };
    return newRelative;
  };

  const handlePatientSearch = (q) => {
    setPatientQuery(q);
    setPatientResults(q.trim() ? mockPatients.filter(p =>
      p.name.toLowerCase().includes(q.toLowerCase()) || p.phone.includes(q) || p.email.includes(q)
    ) : []);
  };

  const autoFillPatient = (p) => {
    setSelectedPatient(p);
    setPatientForm({ ...patientForm, name: p.name, phone: p.phone, email: p.email });
    setPatientQuery(p.name);
    setPatientResults([]);
  };

  const validateStep3 = () => {
    if (mode === 'PATIENT_SELF_BOOKING') {
      if (!forSelf && !selectedRelativeId && !showAddRelative) return false;
      if (showAddRelative) {
        const e = {};
        if (!newRelative.name.trim()) e.name = 'Vui lòng nhập họ tên.';
        if (!newRelative.phone.trim()) e.phone = 'Vui lòng nhập số điện thoại.';
        setRelErrors(e);
        return Object.keys(e).length === 0;
      }
      return true;
    } else {
      const e = {};
      if (!patientForm.name.trim()) e.name = 'Vui lòng nhập họ tên.';
      if (!patientForm.phone.trim()) e.phone = 'Vui lòng nhập số điện thoại.';
      if (!patientForm.gender) e.gender = 'Vui lòng chọn giới tính.';
      if (!patientForm.dob.trim()) e.dob = 'Vui lòng nhập ngày sinh.';
      setPErrors(e);
      return Object.keys(e).length === 0;
    }
  };

  const handleNext = () => {
    if (step === 3 && !validateStep3()) return;
    if (step === 4) {
      const result = {
        code: aptCode,
        doctorId: selectedDoctorId,
        doctorName: selectedDoctor ? `${selectedDoctor.title} ${selectedDoctor.name}` : '',
        specialty: selectedSpec?.name || '',
        date: selectedDate.toLocaleDateString('vi-VN'),
        slot: selectedSlot,
        patient: getPatientInfo(),
        bookingSource: mode === 'RECEPTIONIST_BOOKING' ? 'RECEPTIONIST' : 'PATIENT_WEB',
      };
      onSuccess?.(result);
      setStep(5);
      return;
    }
    setStep(s => s + 1);
  };

  const canNext = () => {
    if (step === 0) return !!selectedSpecId;
    if (step === 1) return !!selectedDoctorId;
    if (step === 2) return !!selectedSlot;
    return true;
  };

  const stepContent = () => {
    switch (step) {
      case 0: return (
        <div>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: '#333', marginBottom: 14 }}>Chọn chuyên khoa</h3>
          <div style={{ position: 'relative', marginBottom: 14 }}>
            <Search style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', width: 14, height: 14, color: '#bbb' }} />
            <input value={specSearch} onChange={e => setSpecSearch(e.target.value)} placeholder="Tìm chuyên khoa..."
              style={{ ...inp, paddingLeft: 30 }} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 10 }}>
            {filteredSpecs.map(s => (
              <button key={s.id} onClick={() => setSelectedSpecId(s.id)}
                style={{ padding: '14px 10px', borderRadius: 8, border: `2px solid ${selectedSpecId === s.id ? primary : '#E5E5E5'}`, background: selectedSpecId === s.id ? '#EBF7FD' : '#fff', cursor: 'pointer', textAlign: 'left' }}>
                <div style={{ fontSize: 22, marginBottom: 6 }}>{s.icon === 'Heart' ? '❤️' : s.icon === 'Baby' ? '👶' : s.icon === 'Brain' ? '🧠' : '🩺'}</div>
                <div style={{ fontSize: 12, fontWeight: selectedSpecId === s.id ? 700 : 500, color: selectedSpecId === s.id ? primary : '#333' }}>{s.name}</div>
                <div style={{ fontSize: 10, color: '#aaa', marginTop: 2 }}>{s.doctorCount} bác sĩ</div>
              </button>
            ))}
          </div>
          {filteredSpecs.length === 0 && <div style={{ textAlign: 'center', color: '#aaa', fontSize: 13, padding: '24px 0' }}>Không tìm thấy chuyên khoa.</div>}
        </div>
      );

      case 1: return (
        <div>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: '#333', marginBottom: 6 }}>Chọn bác sĩ</h3>
          <p style={{ fontSize: 12, color: '#888', marginBottom: 14 }}>Chuyên khoa: <strong style={{ color: primary }}>{selectedSpec?.name}</strong></p>
          {docsForSpec.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px', color: '#aaa', fontSize: 13 }}>Không có bác sĩ nào cho chuyên khoa này.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {docsForSpec.map(d => (
                <div key={d.id} onClick={() => setSelectedDoctorId(d.id)}
                  style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 14px', border: `2px solid ${selectedDoctorId === d.id ? primary : '#E5E5E5'}`, borderRadius: 8, background: selectedDoctorId === d.id ? '#EBF7FD' : '#fff', cursor: 'pointer', transition: 'all 0.12s' }}>
                  <img src={d.avatar} alt={d.name} style={{ width: 52, height: 52, borderRadius: '50%', objectFit: 'cover', objectPosition: 'top', flexShrink: 0, border: '2px solid #E5E5E5' }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#333' }}>{d.title} {d.name}</div>
                    <div style={{ fontSize: 12, color: primary, marginBottom: 4 }}>{d.specialtyName}</div>
                    <div style={{ display: 'flex', gap: 12, fontSize: 12, color: '#888' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Star style={{ width: 11, height: 11, fill: '#F59E0B', color: '#F59E0B' }} />{d.rating} ({d.reviewCount})
                      </span>
                      <span>{d.experience} năm KN</span>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: primary }}>{formatPrice(d.price)}</div>
                    {selectedDoctorId === d.id && <div style={{ fontSize: 11, color: primary, marginTop: 2 }}>✓ Đã chọn</div>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      );

      case 2: return (
        <div>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: '#333', marginBottom: 6 }}>Chọn ngày và khung giờ</h3>
          {selectedDoctor && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: '#EBF7FD', borderRadius: 8, marginBottom: 14 }}>
              <img src={selectedDoctor.avatar} alt="" style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover', objectPosition: 'top' }} />
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#333' }}>{selectedDoctor.title} {selectedDoctor.name}</div>
                <div style={{ fontSize: 11, color: primary }}>{selectedDoctor.specialtyName}</div>
              </div>
            </div>
          )}
          <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 8, marginBottom: 16 }}>
            {dates.map(d => {
              const sel = selectedDate.toDateString() === d.toDateString();
              const isToday = d.toDateString() === new Date().toDateString();
              return (
                <button key={d.toISOString()} onClick={() => { setSelectedDate(d); setSelectedSlot(''); }}
                  style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '8px 12px', borderRadius: 8, border: 'none', background: sel ? primary : '#F7F7F7', color: sel ? '#fff' : '#333', cursor: 'pointer', transition: 'all 0.12s' }}>
                  <span style={{ fontSize: 10, color: sel ? 'rgba(255,255,255,0.8)' : '#aaa' }}>{isToday ? 'Hôm nay' : dayNames[d.getDay()]}</span>
                  <span style={{ fontSize: 17, fontWeight: 700 }}>{d.getDate()}</span>
                  <span style={{ fontSize: 10, color: sel ? 'rgba(255,255,255,0.8)' : '#aaa' }}>T{d.getMonth() + 1}</span>
                </button>
              );
            })}
          </div>
          {(['morning', 'afternoon']).map(shift => {
            const slots = getSlots(shift);
            return (
              <div key={shift} style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#555', marginBottom: 8 }}>{shift === 'morning' ? '☀️ Ca sáng' : '🌤️ Ca chiều'}</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
                  {slots.map(slot => {
                    const isSel = selectedSlot === slot.time;
                    return (
                      <button key={slot.time} onClick={() => slot.avail && setSelectedSlot(slot.time)}
                        style={{ padding: '7px 4px', fontSize: 11, borderRadius: 6, textAlign: 'center', cursor: slot.avail ? 'pointer' : 'not-allowed', border: isSel ? 'none' : slot.avail ? `1px solid ${primary}` : '1px solid #E5E5E5', background: isSel ? primary : slot.avail ? '#fff' : '#F5F5F5', color: isSel ? '#fff' : slot.avail ? primary : '#ccc', fontWeight: isSel ? 600 : 400 }}>
                        {slot.time}
                        {!slot.avail && <div style={{ fontSize: 9 }}>Đã đặt</div>}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
          {!selectedSlot && <div style={{ fontSize: 12, color: '#F59E0B', display: 'flex', alignItems: 'center', gap: 5 }}><Info style={{ width: 13, height: 13 }} />Vui lòng chọn một khung giờ.</div>}
        </div>
      );

      case 3: return mode === 'PATIENT_SELF_BOOKING' ? (
        <div>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: '#333', marginBottom: 14 }}>Người được khám</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
            <button onClick={() => { setForSelf(true); setShowAddRelative(false); }}
              style={{ padding: '16px 10px', borderRadius: 8, border: `2px solid ${forSelf ? primary : '#E5E5E5'}`, background: forSelf ? '#EBF7FD' : '#fff', cursor: 'pointer', textAlign: 'center' }}>
              <User style={{ width: 24, height: 24, color: forSelf ? primary : '#ccc', margin: '0 auto 6px' }} />
              <div style={{ fontSize: 13, fontWeight: 600, color: '#333' }}>Bản thân</div>
              <div style={{ fontSize: 11, color: '#888', marginTop: 2 }}>{currentUserName}</div>
            </button>
            <button onClick={() => setForSelf(false)}
              style={{ padding: '16px 10px', borderRadius: 8, border: `2px solid ${!forSelf ? primary : '#E5E5E5'}`, background: !forSelf ? '#EBF7FD' : '#fff', cursor: 'pointer', textAlign: 'center' }}>
              <Users style={{ width: 24, height: 24, color: !forSelf ? primary : '#ccc', margin: '0 auto 6px' }} />
              <div style={{ fontSize: 13, fontWeight: 600, color: '#333' }}>Người thân</div>
              <div style={{ fontSize: 11, color: '#888', marginTop: 2 }}>Chọn hồ sơ người thân</div>
            </button>
          </div>

          {!forSelf && (
            <div>
              {mockRelatives.map(r => (
                <div key={r.id} onClick={() => { setSelectedRelativeId(r.id); setShowAddRelative(false); }}
                  style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', border: `2px solid ${selectedRelativeId === r.id ? primary : '#E5E5E5'}`, borderRadius: 8, background: selectedRelativeId === r.id ? '#EBF7FD' : '#fff', cursor: 'pointer', marginBottom: 8 }}>
                  <div style={{ width: 36, height: 36, background: '#F3E8FF', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <User style={{ width: 16, height: 16, color: '#7C3AED' }} />
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#333' }}>{r.name}</div>
                    <div style={{ fontSize: 12, color: '#888' }}>{r.relationship} · {r.phone || 'Chưa có SĐT'}</div>
                  </div>
                </div>
              ))}
              {!showAddRelative ? (
                <button onClick={() => { setShowAddRelative(true); setSelectedRelativeId(''); }}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 14px', border: `1px dashed ${primary}`, borderRadius: 8, background: '#fff', color: primary, fontSize: 12, cursor: 'pointer', width: '100%', justifyContent: 'center' }}>
                  <Plus style={{ width: 13, height: 13 }} />Thêm người thân mới
                </button>
              ) : (
                <div style={{ border: '1px solid #E5E5E5', borderRadius: 8, padding: '14px 16px', marginTop: 8 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#333', marginBottom: 12 }}>Thông tin người thân</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {[{ label: 'Họ và tên', key: 'name', req: true }, { label: 'Số điện thoại', key: 'phone', req: true }, { label: 'Ngày sinh', key: 'dob', placeholder: 'dd/mm/yyyy' }].map(f => (
                      <div key={f.key}>
                        <label style={{ display: 'block', fontSize: 12, color: '#555', marginBottom: 4, fontWeight: 500 }}>{f.label}{f.req && <Req />}</label>
                        <input value={newRelative[f.key]} placeholder={f.placeholder}
                          onChange={e => { setNewRelative({ ...newRelative, [f.key]: e.target.value }); setRelErrors({ ...relErrors, [f.key]: '' }); }}
                          style={{ ...inp, borderColor: relErrors[f.key] ? '#EF4444' : '#ddd' }} />
                        {relErrors[f.key] && <div style={{ fontSize: 11, color: '#EF4444', marginTop: 2 }}>{relErrors[f.key]}</div>}
                      </div>
                    ))}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                      <div>
                        <label style={{ display: 'block', fontSize: 12, color: '#555', marginBottom: 4, fontWeight: 500 }}>Quan hệ<Req /></label>
                        <select value={newRelative.relationship} onChange={e => setNewRelative({ ...newRelative, relationship: e.target.value })} style={inp}>
                          {['Cha', 'Mẹ', 'Con', 'Vợ', 'Chồng', 'Anh', 'Chị', 'Em', 'Khác'].map(r => <option key={r}>{r}</option>)}
                        </select>
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: 12, color: '#555', marginBottom: 4, fontWeight: 500 }}>Giới tính</label>
                        <select value={newRelative.gender} onChange={e => setNewRelative({ ...newRelative, gender: e.target.value })} style={inp}>
                          <option value="MALE">Nam</option><option value="FEMALE">Nữ</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        <div>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: '#333', marginBottom: 14 }}>Thông tin bệnh nhân</h3>
          <div style={{ position: 'relative', marginBottom: 6 }}>
            <Search style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', width: 14, height: 14, color: '#bbb' }} />
            <input value={patientQuery} onChange={e => handlePatientSearch(e.target.value)}
              placeholder="Tìm theo SĐT, email hoặc họ tên..." style={{ ...inp, paddingLeft: 30 }} />
          </div>
          {patientResults.length > 0 && (
            <div style={{ border: '1px solid #E5E5E5', borderRadius: 8, overflow: 'hidden', marginBottom: 10 }}>
              {patientResults.map(p => (
                <div key={p.id} onClick={() => autoFillPatient(p)}
                  style={{ display: 'flex', alignItems: 'center', padding: '9px 14px', borderBottom: '1px solid #F5F5F5', cursor: 'pointer', background: '#fff' }}
                  className="hover:bg-[#EBF7FD]">
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#333' }}>{p.name}</div>
                    <div style={{ fontSize: 12, color: '#888' }}>{p.phone} · {p.email}</div>
                  </div>
                  <span style={{ fontSize: 11, padding: '2px 6px', background: '#DCFCE7', color: '#16A34A', borderRadius: 3 }}>Chọn</span>
                </div>
              ))}
            </div>
          )}
          {patientQuery && patientResults.length === 0 && (
            <div style={{ fontSize: 12, color: '#aaa', marginBottom: 10 }}>Không tìm thấy — điền thông tin bên dưới để tạo hồ sơ mới.</div>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, color: '#555', marginBottom: 4, fontWeight: 500 }}>Họ và tên<Req /></label>
                <input value={patientForm.name} onChange={e => { setPatientForm({ ...patientForm, name: e.target.value }); setPErrors({ ...pErrors, name: '' }); }}
                  style={{ ...inp, borderColor: pErrors.name ? '#EF4444' : '#ddd' }} />
                {pErrors.name && <div style={{ fontSize: 11, color: '#EF4444', marginTop: 2 }}>{pErrors.name}</div>}
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, color: '#555', marginBottom: 4, fontWeight: 500 }}>Số điện thoại<Req /></label>
                <input value={patientForm.phone} onChange={e => { setPatientForm({ ...patientForm, phone: e.target.value }); setPErrors({ ...pErrors, phone: '' }); }}
                  style={{ ...inp, borderColor: pErrors.phone ? '#EF4444' : '#ddd' }} />
                {pErrors.phone && <div style={{ fontSize: 11, color: '#EF4444', marginTop: 2 }}>{pErrors.phone}</div>}
              </div>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, color: '#555', marginBottom: 4, fontWeight: 500 }}>Email</label>
              <input value={patientForm.email} onChange={e => setPatientForm({ ...patientForm, email: e.target.value })} style={inp} placeholder="Tùy chọn" />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, color: '#555', marginBottom: 4, fontWeight: 500 }}>Giới tính<Req /></label>
                <select value={patientForm.gender} onChange={e => { setPatientForm({ ...patientForm, gender: e.target.value }); setPErrors({ ...pErrors, gender: '' }); }}
                  style={{ ...inp, borderColor: pErrors.gender ? '#EF4444' : '#ddd' }}>
                  <option value="">-- Chọn --</option>
                  <option value="MALE">Nam</option><option value="FEMALE">Nữ</option><option value="OTHER">Khác</option>
                </select>
                {pErrors.gender && <div style={{ fontSize: 11, color: '#EF4444', marginTop: 2 }}>{pErrors.gender}</div>}
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, color: '#555', marginBottom: 4, fontWeight: 500 }}>Ngày sinh<Req /></label>
                <input value={patientForm.dob} onChange={e => { setPatientForm({ ...patientForm, dob: e.target.value }); setPErrors({ ...pErrors, dob: '' }); }}
                  placeholder="dd/mm/yyyy" style={{ ...inp, borderColor: pErrors.dob ? '#EF4444' : '#ddd' }} />
                {pErrors.dob && <div style={{ fontSize: 11, color: '#EF4444', marginTop: 2 }}>{pErrors.dob}</div>}
              </div>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, color: '#555', marginBottom: 4, fontWeight: 500 }}>Địa chỉ</label>
              <input value={patientForm.address} onChange={e => setPatientForm({ ...patientForm, address: e.target.value })} style={inp} placeholder="Tùy chọn" />
            </div>
          </div>
        </div>
      );

      case 4: {
        const patient = getPatientInfo();
        return (
          <div>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: '#333', marginBottom: 16 }}>Xác nhận thông tin</h3>

            <div style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 11, color: '#aaa', fontWeight: 700, marginBottom: 6, letterSpacing: 0.5 }}>THÔNG TIN LỊCH KHÁM</div>
              <div style={{ background: '#F7F9FC', borderRadius: 8, padding: '10px 14px' }}>
                {[
                  { label: 'Chuyên khoa', value: selectedSpec?.name || '' },
                  { label: 'Bác sĩ', value: selectedDoctor ? `${selectedDoctor.title} ${selectedDoctor.name}` : '' },
                  { label: 'Ngày khám', value: selectedDate.toLocaleDateString('vi-VN') },
                  { label: 'Giờ khám', value: selectedSlot },
                  { label: 'Địa chỉ', value: '123 Nguyễn Thị Minh Khai, Q.3, TP.HCM' },
                  { label: 'Giá khám tham khảo', value: selectedDoctor ? formatPrice(selectedDoctor.price) : '' },
                ].map(r => (
                  <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid #EAEAEA', fontSize: 13 }}>
                    <span style={{ color: '#888' }}>{r.label}</span>
                    <span style={{ fontWeight: 500, color: '#333' }}>{r.value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 11, color: '#aaa', fontWeight: 700, marginBottom: 6, letterSpacing: 0.5 }}>NGƯỜI ĐƯỢC KHÁM</div>
              <div style={{ background: '#F7F9FC', borderRadius: 8, padding: '10px 14px' }}>
                {[
                  { label: 'Họ tên', value: patient.name || '—' },
                  { label: 'Quan hệ', value: patient.relationship || 'Bản thân' },
                  { label: 'SĐT', value: patient.phone || '—' },
                  { label: 'Email', value: patient.email || '—' },
                  { label: 'Giới tính', value: patient.gender === 'MALE' ? 'Nam' : patient.gender === 'FEMALE' ? 'Nữ' : patient.gender || '—' },
                  { label: 'Ngày sinh', value: patient.dob || '—' },
                ].map(r => (
                  <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid #EAEAEA', fontSize: 13 }}>
                    <span style={{ color: '#888' }}>{r.label}</span>
                    <span style={{ fontWeight: 500, color: '#333' }}>{r.value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', fontSize: 12, color: '#555', marginBottom: 5, fontWeight: 500 }}>Ghi chú</label>
              <textarea rows={2} value={note} onChange={e => setNote(e.target.value)} placeholder="Triệu chứng, yêu cầu đặc biệt... (tùy chọn)"
                style={{ ...inp, resize: 'none' }} />
            </div>

            <div style={{ padding: '9px 12px', background: '#FFF9E6', borderRadius: 6, fontSize: 12, color: '#92620C', display: 'flex', alignItems: 'flex-start', gap: 6 }}>
              <Info style={{ width: 13, height: 13, flexShrink: 0, marginTop: 1 }} />
              Giá khám chỉ mang tính tham khảo. Bệnh nhân thanh toán trực tiếp tại quầy.
            </div>
          </div>
        );
      }

      case 5: return (
        <div style={{ textAlign: 'center', padding: '8px 0' }}>
          <div style={{ width: 60, height: 60, background: '#DCFCE7', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <CheckCircle style={{ width: 30, height: 30, color: '#16A34A' }} />
          </div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: '#333', marginBottom: 6 }}>Đặt lịch thành công!</h2>
          <span style={{ display: 'inline-block', padding: '2px 12px', background: '#DCFCE7', color: '#16A34A', borderRadius: 4, fontSize: 12, fontWeight: 700, marginBottom: 20 }}>ĐÃ XÁC NHẬN</span>

          <div style={{ background: '#F7F9FC', borderRadius: 8, padding: 14, textAlign: 'left', marginBottom: 14, fontSize: 13 }}>
            {[
              { label: 'Mã lịch hẹn', value: aptCode, bold: true },
              { label: 'Bác sĩ', value: selectedDoctor ? `${selectedDoctor.title} ${selectedDoctor.name}` : '' },
              { label: 'Chuyên khoa', value: selectedSpec?.name || '' },
              { label: 'Ngày giờ khám', value: `${selectedDate.toLocaleDateString('vi-VN')} — ${selectedSlot}` },
              { label: 'Người được khám', value: getPatientInfo().name },
              { label: 'Giá khám tham khảo', value: selectedDoctor ? formatPrice(selectedDoctor.price) : '' },
            ].map(r => (
              <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #EAEAEA', padding: '6px 0' }}>
                <span style={{ color: '#888' }}>{r.label}</span>
                <span style={{ fontWeight: r.bold ? 700 : 500, color: r.bold ? primary : '#333' }}>{r.value}</span>
              </div>
            ))}
          </div>

          <div style={{ fontSize: 12, color: '#666', background: '#F7F9FC', borderRadius: 6, padding: '8px 12px', marginBottom: 20 }}>
            📧 Email xác nhận lịch hẹn đã được gửi đến bệnh nhân.
          </div>

          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to={mode === 'RECEPTIONIST_BOOKING' ? '/le-tan/lich-hen' : '/benh-nhan/lich-hen'}
              style={{ padding: '9px 18px', border: `1px solid ${primary}`, color: primary, borderRadius: 6, fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>
              Xem lịch hẹn
            </Link>
            <button onClick={() => { setStep(0); setSelectedSpecId(''); setSelectedDoctorId(''); setSelectedSlot(''); setForSelf(true); setPatientForm({ name: '', phone: '', email: '', gender: 'MALE', dob: '', address: '', relationship: 'Bản thân' }); }}
              style={{ padding: '9px 18px', background: accent, color: '#fff', border: 'none', borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
              Tạo lịch hẹn mới
            </button>
            {onCancel && (
              <button onClick={onCancel}
                style={{ padding: '9px 18px', border: '1px solid #ddd', color: '#555', borderRadius: 6, fontSize: 13, background: '#fff', cursor: 'pointer' }}>
                Về trang quản lý
              </button>
            )}
          </div>
        </div>
      );

      default: return null;
    }
  };

  return (
    <div style={{ maxWidth: 700, margin: '0 auto', fontFamily: 'Roboto, Arial, sans-serif' }}>
      {step < 5 && <StepIndicator current={step} />}

      <div style={{ background: '#fff', border: '1px solid #E5E5E5', borderRadius: 8, padding: '22px 24px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
        {stepContent()}
      </div>

      {step < 5 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 16 }}>
          <button onClick={() => step === 0 ? onCancel?.() : setStep(s => s - 1)}
            style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '9px 16px', border: '1px solid #ddd', borderRadius: 6, fontSize: 13, color: '#555', background: '#fff', cursor: 'pointer' }}>
            <ChevronLeft style={{ width: 14, height: 14 }} />{step === 0 ? 'Hủy' : 'Quay lại'}
          </button>
          {step < 4 ? (
            <button onClick={handleNext} disabled={!canNext()}
              style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '9px 20px', background: canNext() ? primary : '#E5E5E5', color: '#fff', border: 'none', borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: canNext() ? 'pointer' : 'not-allowed', transition: 'background 0.15s' }}>
              Tiếp theo <ChevronRight style={{ width: 14, height: 14 }} />
            </button>
          ) : (
            <button onClick={handleNext}
              style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '9px 20px', background: accent, color: '#fff', border: 'none', borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
              <CheckCircle style={{ width: 14, height: 14 }} />Xác nhận đặt lịch
            </button>
          )}
        </div>
      )}
    </div>
  );
}
