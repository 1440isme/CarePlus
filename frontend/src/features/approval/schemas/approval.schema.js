import { z } from 'zod';

export const leaveRequestSchema = z.object({
  type: z.literal('SCHEDULE_EXCEPTION'),
  date: z.string().min(1, 'Vui lòng chọn ngày nghỉ'),
  exceptionType: z.enum(['ALL_DAY', 'SHIFT']),
  shift: z.string().optional(),
  reason: z.string().trim().min(5, 'Vui lòng nhập lý do nghỉ'),
}).superRefine((value, ctx) => {
  if (value.exceptionType === 'SHIFT' && !value.shift) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['shift'],
      message: 'Vui lòng chọn ca làm việc',
    });
  }

});
