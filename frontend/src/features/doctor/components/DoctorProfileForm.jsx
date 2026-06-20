import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { doctorProfileSchema } from '../schemas/doctor.schema.js';

export default function DoctorProfileForm({
  doctor,
  onSubmit,
  isSubmitting,
  submitError,
}) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
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

  return (
    <form className="surface-card form-grid" onSubmit={handleSubmit(onSubmit)}>
      <div className="form-grid two-columns">
        <div className="form-field">
          <label htmlFor="name">Họ tên</label>
          <input id="name" {...register('name')} />
          {errors.name ? <span className="field-error">{errors.name.message}</span> : null}
        </div>

        <div className="form-field">
          <label htmlFor="phone">Số điện thoại</label>
          <input id="phone" {...register('phone')} />
          {errors.phone ? <span className="field-error">{errors.phone.message}</span> : null}
        </div>

        <div className="form-field">
          <label htmlFor="title">Học vị</label>
          <input id="title" {...register('title')} />
          {errors.title ? <span className="field-error">{errors.title.message}</span> : null}
        </div>

        <div className="form-field">
          <label htmlFor="experience">Số năm kinh nghiệm</label>
          <input id="experience" type="number" {...register('experience')} />
          {errors.experience ? <span className="field-error">{errors.experience.message}</span> : null}
        </div>
      </div>

      <div className="form-grid two-columns">
        <div className="form-field">
          <label>Email</label>
          <input value={doctor?.user?.email || ''} disabled readOnly />
          <span className="helper-text">Email là trường chỉ đọc theo nghiệp vụ.</span>
        </div>

        <div className="form-field">
          <label>Chuyên khoa</label>
          <input value={doctor?.specialtyName || ''} disabled readOnly />
          <span className="helper-text">Chuyên khoa do hệ thống quản lý, bác sĩ không tự chỉnh sửa.</span>
        </div>
      </div>

      <div className="form-field">
        <label htmlFor="position">Chức vụ</label>
        <input id="position" {...register('position')} />
        {errors.position ? <span className="field-error">{errors.position.message}</span> : null}
      </div>

      <div className="form-field">
        <label htmlFor="description">Giới thiệu</label>
        <textarea id="description" {...register('description')} />
        {errors.description ? <span className="field-error">{errors.description.message}</span> : null}
      </div>

      {submitError ? <div className="field-error">{submitError}</div> : null}

      <div>
        <button type="submit" className="button-primary" disabled={isSubmitting}>
          {isSubmitting ? 'Đang lưu...' : 'Lưu thay đổi'}
        </button>
      </div>
    </form>
  );
}
