import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Star, Clock, MapPin, Heart, Calendar, Briefcase } from 'lucide-react';

function formatPrice(price) {
  if (!price && price !== 0) return 'Liên hệ';
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(price);
}

const primary = '#49BCE2';

const MORNING = ['08:00-08:30', '08:30-09:00', '09:00-09:30', '09:30-10:00', '10:00-10:30', '10:30-11:00'];
const AFTERNOON = ['13:30-14:00', '14:00-14:30', '14:30-15:00', '15:00-15:30'];

function getSlots(seed) {
  const n = seed.charCodeAt(seed.length - 1) % 4;
  const morning = MORNING.slice(0, 4).map((time, i) => ({ time, avail: i !== n }));
  const afternoon = AFTERNOON.map((time, i) => ({ time, avail: i !== (n % 2) }));
  return [...morning, ...afternoon];
}

function VerticalCard({ doctor, showBooking }) {
  return (
    <div style={{ background: '#fff', border: '1px solid #E5E5E5', borderRadius: 8, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', transition: 'box-shadow 0.15s' }}
      className="hover:shadow-md">
      <div style={{ position: 'relative' }}>
        <img src={doctor.avatar} alt={`${doctor.title} ${doctor.name}`}
          style={{ width: '100%', height: 192, objectFit: 'cover', objectPosition: 'top', display: 'block' }} />
        <div style={{ position: 'absolute', top: 10, right: 10, background: 'rgba(255,255,255,0.92)', borderRadius: 20, padding: '3px 10px', display: 'flex', alignItems: 'center', gap: 3 }}>
          <Star style={{ width: 12, height: 12, color: '#F59E0B', fill: '#F59E0B' }} />
          <span style={{ fontSize: 12, fontWeight: 600, color: '#555' }}>{doctor.rating}</span>
        </div>
      </div>
      <div style={{ padding: '14px 16px' }}>
        <div style={{ fontSize: 11, color: primary, fontWeight: 600, marginBottom: 2 }}>{doctor.specialtyName}</div>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#333', marginBottom: 6 }}>{doctor.title} {doctor.name}</div>
        <div style={{ display: 'flex', gap: 12, fontSize: 11, color: '#888', marginBottom: 10 }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <Briefcase style={{ width: 11, height: 11 }} />{doctor.experience} năm KN
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <Clock style={{ width: 11, height: 11 }} />30 phút/lần
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 10, color: '#aaa' }}>Giá khám</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: primary }}>{formatPrice(doctor.price)}</div>
          </div>
          {showBooking && (
            <Link to={`/bac-si/${doctor.id}`}
              style={{ padding: '6px 14px', background: primary, color: '#fff', borderRadius: 6, fontSize: 12, fontWeight: 600, textDecoration: 'none' }}>
              Xem lịch
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

function HorizontalCard({ doctor, showBooking }) {
  const [fav, setFav] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const slots = getSlots(doctor.id);

  const bio = `Bác sĩ chuyên khoa với ${doctor.experience} năm kinh nghiệm tại CarePlus Clinic. Chuyên điều trị các bệnh lý phức tạp với phương pháp hiện đại.`;
  const shortBio = bio.slice(0, 80) + '...';

  return (
    <div style={{ background: '#fff', border: '1px solid #E5E5E5', borderRadius: 8, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap' }}>

        {/* LEFT 50% */}
        <div style={{ flex: '1 1 50%', minWidth: 0, padding: '16px 18px', borderBottom: '1px solid #F0F0F0', borderRight: '1px solid #F0F0F0' }}>
          <div style={{ display: 'flex', gap: 12, marginBottom: 10 }}>
            <div style={{ flexShrink: 0, position: 'relative' }}>
              <img src={doctor.avatar} alt={doctor.name}
                style={{ width: 72, height: 72, borderRadius: '50%', objectFit: 'cover', objectPosition: 'top', border: '2px solid #E5E5E5' }} />
              <button onClick={() => setFav(!fav)}
                style={{ position: 'absolute', top: -3, right: -3, width: 22, height: 22, background: '#fff', borderRadius: '50%', border: '1px solid #E5E5E5', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                <Heart style={{ width: 11, height: 11, color: fav ? '#EF4444' : '#ccc', fill: fav ? '#EF4444' : 'none' }} />
              </button>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, color: primary, fontWeight: 500, marginBottom: 2 }}>{doctor.specialtyName}</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#333', marginBottom: 3 }}>{doctor.title} {doctor.name}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#F59E0B', marginBottom: 4 }}>
                <Star style={{ width: 11, height: 11, fill: '#F59E0B' }} />
                <span style={{ fontWeight: 600 }}>{doctor.rating}</span>
                <span style={{ color: '#aaa' }}>({doctor.reviewCount})</span>
              </div>
              <div style={{ display: 'flex', gap: 10, fontSize: 11, color: '#666' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                  <Clock style={{ width: 11, height: 11, color: '#aaa' }} />{doctor.experience} năm KN
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                  <MapPin style={{ width: 11, height: 11, color: '#aaa' }} />TP.HCM
                </span>
              </div>
            </div>
          </div>
          <div style={{ fontSize: 12, color: '#666', lineHeight: 1.6, marginBottom: 8 }}>
            {expanded ? bio : shortBio}
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button onClick={() => setExpanded(!expanded)}
              style={{ fontSize: 12, color: primary, background: '#fff', border: `1px solid ${primary}`, borderRadius: 4, padding: '4px 10px', cursor: 'pointer' }}>
              {expanded ? 'Thu gọn' : 'Xem thêm'}
            </button>
            <button style={{ fontSize: 12, color: '#555', background: '#F5F5F5', border: 'none', borderRadius: 4, padding: '4px 10px', cursor: 'pointer' }}>
              Tư vấn sâu
            </button>
          </div>
        </div>

        {/* RIGHT 50% */}
        <div style={{ flex: '1 1 50%', minWidth: 0, padding: '14px 16px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#333', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 5 }}>
            <Calendar style={{ width: 12, height: 12, color: primary }} />
            Hôm nay — {new Date().toLocaleDateString('vi-VN')}
          </div>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#aaa', letterSpacing: 0.5, marginBottom: 6 }}>LỊCH KHÁM</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 4, marginBottom: 8 }}>
            {slots.map(slot => (
              <button key={slot.time}
                style={{ padding: '5px 2px', fontSize: 10, borderRadius: 4, textAlign: 'center', cursor: slot.avail ? 'pointer' : 'not-allowed', border: `1px solid ${slot.avail ? '#D1D5DB' : '#F0F0F0'}`, background: slot.avail ? '#F9FAFB' : '#F5F5F5', color: slot.avail ? '#333' : '#ccc' }}
                className={slot.avail ? 'hover:bg-[#EBF7FD] hover:border-[#49BCE2] hover:text-[#49BCE2]' : ''}>
                {slot.time}
              </button>
            ))}
          </div>
          <div style={{ borderTop: '1px solid #F0F0F0', paddingTop: 8, marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 10, color: '#aaa' }}>Giá khám tham khảo</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: primary }}>{formatPrice(doctor.price)}</div>
            </div>
            {showBooking && (
              <Link to={`/bac-si/${doctor.id}`}
                style={{ padding: '6px 14px', background: primary, color: '#fff', borderRadius: 6, fontSize: 12, fontWeight: 600, textDecoration: 'none' }}>
                Đặt lịch
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function DoctorCard({ doctor, showBooking = true, variant = 'vertical' }) {
  if (variant === 'horizontal') {
    return <HorizontalCard doctor={doctor} showBooking={showBooking} />;
  }
  return <VerticalCard doctor={doctor} showBooking={showBooking} />;
}
