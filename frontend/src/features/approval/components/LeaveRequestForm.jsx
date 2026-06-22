import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { leaveRequestSchema } from '../schemas/approval.schema.js';

const defaultValues = {
  type: 'SCHEDULE_EXCEPTION',
  date: '',
  exceptionType: 'ALL_DAY',
  shift: '',
  startTime: '',
  endTime: '',
  reason: '',
};

export default function LeaveRequestForm({ onSubmit, onCancel, isSubmitting, submitError }) {
  const {
    control,
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(leaveRequestSchema),
    defaultValues,
  });

  const exceptionType = useWatch({
    control,
    name: 'exceptionType',
  });

  return (
    <form className="doctor-leave-form" onSubmit={handleSubmit(onSubmit)}>
      <div className="doctor-profile-grid two-columns">
        <div className="doctor-profile-field">
          <label htmlFor="date">Ngày nghỉ</label>
          <input id="date" type="date" {...register('date')} />
          {errors.date ? <span className="field-error">{errors.date.message}</span> : null}
        </div>

        <div className="doctor-profile-field">
          <label htmlFor="exceptionType">Loại nghỉ</label>
          <select id="exceptionType" {...register('exceptionType')}>
            <option value="ALL_DAY">Cả ngày</option>
            <option value="SHIFT">Theo ca</option>
            <option value="TIME_RANGE">Theo khoảng giờ</option>
          </select>
        </div>
      </div>

      {exceptionType === 'SHIFT' ? (
        <div className="doctor-profile-field">
          <label htmlFor="shift">Ca làm việc</label>
          <select id="shift" {...register('shift')}>
            <option value="">Chọn ca</option>
            <option value="MORNING">Ca sáng</option>
            <option value="AFTERNOON">Ca chiều</option>
          </select>
          {errors.shift ? <span className="field-error">{errors.shift.message}</span> : null}
        </div>
      ) : null}

      {exceptionType === 'TIME_RANGE' ? (
        <div className="doctor-profile-grid two-columns">
          <div className="doctor-profile-field">
            <label htmlFor="startTime">Giờ bắt đầu</label>
            <input id="startTime" type="time" {...register('startTime')} />
            {errors.startTime ? <span className="field-error">{errors.startTime.message}</span> : null}
          </div>

          <div className="doctor-profile-field">
            <label htmlFor="endTime">Giờ kết thúc</label>
            <input id="endTime" type="time" {...register('endTime')} />
            {errors.endTime ? <span className="field-error">{errors.endTime.message}</span> : null}
          </div>
        </div>
      ) : null}

      <div className="doctor-profile-field">
        <label htmlFor="reason">Lý do nghỉ</label>
        <textarea id="reason" {...register('reason')} />
        {errors.reason ? <span className="field-error">{errors.reason.message}</span> : null}
      </div>

      {submitError ? <div className="field-error">{submitError}</div> : null}

      <div className="doctor-leave-actions">
        <button type="button" className="button-secondary" onClick={onCancel} disabled={isSubmitting}>
          Hủy bỏ
        </button>
        <button type="submit" className="button-primary" disabled={isSubmitting}>
          {isSubmitting ? 'Đang gửi...' : 'Gửi yêu cầu nghỉ'}
        </button>
      </div>
    </form>
  );
}
