import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { doctorProfileSchema } from '../schemas/doctor.schema.js';

function getInitials(name) {
  if (!name) return 'BS';
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'BS';
}

export default function DoctorProfileForm({
  doctor,
  onSubmit,
  isSubmitting,
  submitError,
}) {
  const [isEditMode, setIsEditMode] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm({
    resolver: zodResolver(doctorProfileSchema),
    defaultValues: {
      name: doctor?.user?.name || doctor?.name || '',
      phone: doctor?.user?.phone || '',
      title: doctor?.title || '',
      experience: doctor?.experience || 0,
      description: doctor?.description || '',
      position: doctor?.position || '',
    },
  });

  useEffect(() => {
    if (doctor) {
      reset({
        name: doctor.user?.name || doctor.name || '',
        phone: doctor.user?.phone || '',
        title: doctor.title || '',
        experience: doctor.experience || 0,
        description: doctor.description || '',
        position: doctor.position || '',
      });
    }
  }, [doctor, reset]);

  const handleCancel = () => {
    setIsEditMode(false);
    reset({
      name: doctor?.user?.name || doctor?.name || '',
      phone: doctor?.user?.phone || '',
      title: doctor?.title || '',
      experience: doctor?.experience || 0,
      description: doctor?.description || '',
      position: doctor?.position || '',
    });
  };

  const submitWithExit = async (values) => {
    await onSubmit(values);
    setIsEditMode(false);
  };

  return (
    <form className="doctor-profile-shell" onSubmit={handleSubmit(submitWithExit)}>
      <section className="doctor-profile-summary">
        <div className="doctor-profile-topbar" />
        <div className="doctor-profile-summary-inner">
          <div className="doctor-avatar">{getInitials(doctor?.user?.name || doctor?.name)}</div>
          <div className="doctor-profile-summary-meta">
            <h2>{doctor?.user?.name || doctor?.name || 'Bác sĩ CarePlus'}</h2>
            <p>{doctor?.specialtyName || 'Chuyên khoa'}</p>
            <span className="doctor-meta-pill">
              <span className="doctor-status-dot active" />
              Hồ sơ đang hoạt động
            </span>
          </div>

          {!isEditMode ? (
            <button type="button" className="profile-edit-action-btn" onClick={() => setIsEditMode(true)} style={{ marginLeft: 'auto' }}>
              Chỉnh sửa
            </button>
          ) : null}
        </div>
      </section>

      <section className="doctor-profile-details">
        <div className="doctor-section-title">
          <div>
            <h3>Thông tin cá nhân bác sĩ</h3>
            <p>Chỉ chỉnh sửa các trường cho phép theo nghiệp vụ của Doctor Portal.</p>
          </div>
        </div>

        <div className="doctor-profile-grid two-columns">
          <div className="doctor-profile-field">
            <label htmlFor="name">Họ tên</label>
            <input id="name" {...register('name')} disabled={!isEditMode} />
            {errors.name ? <span className="field-error">{errors.name.message}</span> : null}
          </div>

          <div className="doctor-profile-field">
            <label htmlFor="phone">Số điện thoại</label>
            <input id="phone" {...register('phone')} disabled={!isEditMode} />
            {errors.phone ? <span className="field-error">{errors.phone.message}</span> : null}
          </div>

          <div className="doctor-profile-field">
            <label htmlFor="title">Học vị</label>
            <input id="title" {...register('title')} disabled={!isEditMode} />
            {errors.title ? <span className="field-error">{errors.title.message}</span> : null}
          </div>

          <div className="doctor-profile-field">
            <label htmlFor="experience">Số năm kinh nghiệm</label>
            <input id="experience" type="number" {...register('experience')} disabled={!isEditMode} />
            {errors.experience ? <span className="field-error">{errors.experience.message}</span> : null}
          </div>
        </div>

        <div className="doctor-profile-grid two-columns" style={{ marginTop: 16 }}>
          <div className="doctor-profile-field">
            <label>Email</label>
            <input value={doctor?.user?.email || ''} disabled readOnly />
            <span className="doctor-profile-helper">Email là trường chỉ đọc theo nghiệp vụ.</span>
          </div>

          <div className="doctor-profile-field">
            <label>Chuyên khoa</label>
            <input value={doctor?.specialtyName || ''} disabled readOnly />
            <span className="doctor-profile-helper">Chuyên khoa do hệ thống quản lý, bác sĩ không tự chỉnh sửa.</span>
          </div>
        </div>

        <div className="doctor-profile-grid" style={{ marginTop: 16 }}>
          <div className="doctor-profile-field">
            <label htmlFor="position">Chức vụ</label>
            <input id="position" {...register('position')} disabled={!isEditMode} />
            {errors.position ? <span className="field-error">{errors.position.message}</span> : null}
          </div>

          <div className="doctor-profile-field">
            <label htmlFor="description">Giới thiệu bản thân</label>
            <textarea id="description" {...register('description')} disabled={!isEditMode} />
            {errors.description ? <span className="field-error">{errors.description.message}</span> : null}
          </div>
        </div>

        {submitError ? <div className="field-error" style={{ marginTop: 12 }}>{submitError}</div> : null}

        {isEditMode ? (
          <div className="doctor-profile-actions">
            <button type="button" className="profile-btn-cancel" onClick={handleCancel} disabled={isSubmitting}>
              Hủy
            </button>
            <button type="submit" className="profile-btn-save" disabled={isSubmitting || !isDirty}>
              {isSubmitting ? 'Đang lưu...' : 'Lưu thay đổi'}
            </button>
          </div>
        ) : null}
      </section>
    </form>
  );
}
