import { z } from 'zod';

export const leaveRequestSchema = z.object({
  type: z.literal('SCHEDULE_EXCEPTION'),
  date: z.string().min(1, 'Vui lòng chọn ngày nghỉ'),
  exceptionType: z.enum(['ALL_DAY', 'SHIFT', 'TIME_RANGE']),
  shift: z.string().optional(),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  reason: z.string().trim().min(5, 'Vui lòng nhập lý do nghỉ'),
}).superRefine((value, ctx) => {
  if (value.exceptionType === 'SHIFT' && !value.shift) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['shift'],
      message: 'Vui lòng chọn ca làm việc',
    });
  }

  if (value.exceptionType === 'TIME_RANGE') {
    if (!value.startTime) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['startTime'],
        message: 'Vui lòng nhập giờ bắt đầu',
      });
    }

    if (!value.endTime) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['endTime'],
        message: 'Vui lòng nhập giờ kết thúc',
      });
    }
  }
});
