import { z } from 'zod';

const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

function toMinutes(value) {
  const [hours, minutes] = value.split(':').map(Number);
  return (hours * 60) + minutes;
}

const integerField = (label, min, max) => {
  let schema = z.coerce
    .number({
      invalid_type_error: `${label} không hợp lệ`,
    })
    .int(`${label} phải là số nguyên`)
    .min(min, `${label} phải lớn hơn hoặc bằng ${min}`);

  if (typeof max === 'number') {
    schema = schema.max(max, `${label} phải nhỏ hơn hoặc bằng ${max}`);
  }

  return schema;
};

const timeField = (label) => z
  .string()
  .trim()
  .regex(timeRegex, `${label} phải theo định dạng HH:mm`);

export const systemSettingsFormSchema = z.object({
  maxBookingDaysAhead: integerField('Đặt lịch trước tối đa (ngày)', 1),
  slotDurationMinutes: integerField('Thời lượng mỗi khung giờ khám (phút)', 1),
  cancelBeforeHours: integerField('Thời gian hủy lịch tối thiểu (giờ)', 0),
  maxNoShowBeforeLock: integerField('Số lần vắng mặt tối đa', 1),
  maxActiveAppointmentsPerUser: integerField('Số lịch hẹn active tối đa / người dùng', 1, 50),
  morningShiftStart: timeField('Ca sáng bắt đầu'),
  morningShiftEnd: timeField('Ca sáng kết thúc'),
  afternoonShiftStart: timeField('Ca chiều bắt đầu'),
  afternoonShiftEnd: timeField('Ca chiều kết thúc'),
}).strict()
  .superRefine((values, ctx) => {
    const morningStart = toMinutes(values.morningShiftStart);
    const morningEnd = toMinutes(values.morningShiftEnd);
    const afternoonStart = toMinutes(values.afternoonShiftStart);
    const afternoonEnd = toMinutes(values.afternoonShiftEnd);

    if (morningStart >= morningEnd) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['morningShiftEnd'],
        message: 'Ca sáng kết thúc phải sau ca sáng bắt đầu',
      });
    }

    if (afternoonStart >= afternoonEnd) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['afternoonShiftEnd'],
        message: 'Ca chiều kết thúc phải sau ca chiều bắt đầu',
      });
    }

    if (morningEnd > afternoonStart) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['afternoonShiftStart'],
        message: 'Ca chiều bắt đầu phải sau hoặc bằng ca sáng kết thúc',
      });
    }
  });

export const updateSystemSettingsSchema = systemSettingsFormSchema;
