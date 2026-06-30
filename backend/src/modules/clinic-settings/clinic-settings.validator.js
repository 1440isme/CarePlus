const { z } = require('zod');
const {
  CLINIC_SETTINGS_ERROR_CODES,
  SYSTEM_SETTING_LIMITS,
} = require('./clinic-settings.types');

function sendValidationError(res, details, code = CLINIC_SETTINGS_ERROR_CODES.VALIDATION_ERROR, message = 'Validation failed') {
  return res.status(400).json({
    success: false,
    error: {
      code,
      message,
      details,
    },
  });
}

function isValidVietnamPhone(phone) {
  return /^(?:(?:0|\+84)(?:3|5|7|8|9)\d{8}|1900\d{4}|028\d{7})$/.test(phone);
}

function isValidTimeValue(value) {
  return /^([01]\d|2[0-3]):([0-5]\d)$/.test(value);
}

function convertTimeValueToMinutes(value) {
  const [hours, minutes] = value.split(':').map((part) => Number.parseInt(part, 10));
  return (hours * 60) + minutes;
}

const updateClinicInfoSchema = z.object({
  name: z.string()
    .trim()
    .min(1, 'name must not be empty')
    .max(255, 'name must be at most 255 characters')
    .optional(),
  address: z.string()
    .trim()
    .min(1, 'address must not be empty')
    .max(1000, 'address must be at most 1000 characters')
    .optional(),
  hotline: z.string()
    .trim()
    .refine((value) => isValidVietnamPhone(value), {
      message: 'hotline must be a valid Vietnamese phone number',
    })
    .optional(),
  email: z.string()
    .trim()
    .email('email must be a valid email')
    .optional(),
  workingHours: z.string()
    .trim()
    .min(1, 'workingHours must not be empty')
    .max(255, 'workingHours must be at most 255 characters')
    .optional(),
  description: z.string()
    .trim()
    .min(1, 'description must not be empty')
    .max(5000, 'description must be at most 5000 characters')
    .optional(),
}).strict().refine(
  (data) => Object.keys(data).length > 0,
  {
    message: 'At least one allowed field is required',
  },
);

const updateSystemSettingSchema = z.object({
  maxBookingDaysAhead: z.number()
    .int('maxBookingDaysAhead must be an integer')
    .min(
      SYSTEM_SETTING_LIMITS.MIN_MAX_BOOKING_DAYS_AHEAD,
      `maxBookingDaysAhead must be greater than or equal to ${SYSTEM_SETTING_LIMITS.MIN_MAX_BOOKING_DAYS_AHEAD}`,
    )
    .optional(),
  slotDurationMinutes: z.number()
    .int('slotDurationMinutes must be an integer')
    .min(
      SYSTEM_SETTING_LIMITS.MIN_SLOT_DURATION_MINUTES,
      `slotDurationMinutes must be greater than or equal to ${SYSTEM_SETTING_LIMITS.MIN_SLOT_DURATION_MINUTES}`,
    )
    .optional(),
  cancelBeforeHours: z.number()
    .int('cancelBeforeHours must be an integer')
    .min(
      SYSTEM_SETTING_LIMITS.MIN_CANCEL_BEFORE_HOURS,
      `cancelBeforeHours must be greater than or equal to ${SYSTEM_SETTING_LIMITS.MIN_CANCEL_BEFORE_HOURS}`,
    )
    .optional(),
  maxNoShowBeforeLock: z.number()
    .int('maxNoShowBeforeLock must be an integer')
    .min(
      SYSTEM_SETTING_LIMITS.MIN_MAX_NO_SHOW_BEFORE_LOCK,
      `maxNoShowBeforeLock must be greater than or equal to ${SYSTEM_SETTING_LIMITS.MIN_MAX_NO_SHOW_BEFORE_LOCK}`,
    )
    .optional(),
  maxActiveAppointmentsPerUser: z.number()
    .int('maxActiveAppointmentsPerUser must be an integer')
    .min(
      SYSTEM_SETTING_LIMITS.MIN_MAX_ACTIVE_APPOINTMENTS_PER_USER,
      `maxActiveAppointmentsPerUser must be greater than or equal to ${SYSTEM_SETTING_LIMITS.MIN_MAX_ACTIVE_APPOINTMENTS_PER_USER}`,
    )
    .max(
      SYSTEM_SETTING_LIMITS.MAX_MAX_ACTIVE_APPOINTMENTS_PER_USER,
      `maxActiveAppointmentsPerUser must be less than or equal to ${SYSTEM_SETTING_LIMITS.MAX_MAX_ACTIVE_APPOINTMENTS_PER_USER}`,
    )
    .optional(),
  morningShiftStart: z.string()
    .trim()
    .refine((value) => isValidTimeValue(value), {
      message: 'morningShiftStart must be in HH:mm format',
    })
    .optional(),
  morningShiftEnd: z.string()
    .trim()
    .refine((value) => isValidTimeValue(value), {
      message: 'morningShiftEnd must be in HH:mm format',
    })
    .optional(),
  afternoonShiftStart: z.string()
    .trim()
    .refine((value) => isValidTimeValue(value), {
      message: 'afternoonShiftStart must be in HH:mm format',
    })
    .optional(),
  afternoonShiftEnd: z.string()
    .trim()
    .refine((value) => isValidTimeValue(value), {
      message: 'afternoonShiftEnd must be in HH:mm format',
    })
    .optional(),
}).strict().refine(
  (data) => Object.keys(data).length > 0,
  {
    message: 'At least one allowed field is required',
  },
).superRefine((data, ctx) => {
  if (data.morningShiftStart && data.morningShiftEnd) {
    const morningStart = convertTimeValueToMinutes(data.morningShiftStart);
    const morningEnd = convertTimeValueToMinutes(data.morningShiftEnd);

    if (morningStart >= morningEnd) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['morningShiftEnd'],
        message: 'morningShiftEnd must be later than morningShiftStart',
      });
    }
  }

  if (data.afternoonShiftStart && data.afternoonShiftEnd) {
    const afternoonStart = convertTimeValueToMinutes(data.afternoonShiftStart);
    const afternoonEnd = convertTimeValueToMinutes(data.afternoonShiftEnd);

    if (afternoonStart >= afternoonEnd) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['afternoonShiftEnd'],
        message: 'afternoonShiftEnd must be later than afternoonShiftStart',
      });
    }
  }

  if (
    data.morningShiftEnd
    && data.afternoonShiftStart
    && convertTimeValueToMinutes(data.morningShiftEnd) > convertTimeValueToMinutes(data.afternoonShiftStart)
  ) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['afternoonShiftStart'],
      message: 'afternoonShiftStart must be later than or equal to morningShiftEnd',
    });
  }
});

function validateUpdateClinicInfo(req, res, next) {
  const parsedResult = updateClinicInfoSchema.safeParse(req.body || {});

  if (!parsedResult.success) {
    const details = parsedResult.error.issues.map((issue) => ({
      field: issue.path.length > 0 ? issue.path.join('.') : 'body',
      message: issue.message,
    }));

    return sendValidationError(res, details, CLINIC_SETTINGS_ERROR_CODES.VALIDATION_ERROR, 'Dữ liệu không hợp lệ');
  }

  req.body = parsedResult.data;
  return next();
}

function validateUpdateSystemSetting(req, res, next) {
  const parsedResult = updateSystemSettingSchema.safeParse(req.body || {});

  if (!parsedResult.success) {
    const details = parsedResult.error.issues.map((issue) => ({
      field: issue.path.length > 0 ? issue.path.join('.') : 'body',
      message: issue.message,
    }));

    return sendValidationError(res, details, CLINIC_SETTINGS_ERROR_CODES.VALIDATION_ERROR, 'Dữ liệu không hợp lệ');
  }

  req.body = parsedResult.data;
  return next();
}

module.exports = {
  validateUpdateClinicInfo,
  validateUpdateSystemSetting,
  updateClinicInfoSchema,
  updateSystemSettingSchema,
};
