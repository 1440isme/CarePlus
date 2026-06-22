const DoctorRepository = require('../doctor/doctor.repository');
const ScheduleRepository = require('../schedule/schedule.repository');
const TimeSlotRepository = require('./timeslot.repository');
const ClinicSettingsRepository = require('../clinic-settings/clinic-settings.repository');
const { toTimeSlotDto } = require('./timeslot.dto');
const { TIMESLOT_ERROR_CODES } = require('./timeslot.types');
const { CLINIC_SETTINGS_DEFAULTS } = require('../clinic-settings/clinic-settings.types');

class TimeSlotServiceError extends Error {
  constructor({ code, message, statusCode, details = [] }) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
  }
}

function parseDateOnly(value) {
  return new Date(`${value}T00:00:00.000Z`);
}

function timeToMinutes(value) {
  const [hours, minutes] = value.split(':').map((item) => Number.parseInt(item, 10));
  return (hours * 60) + minutes;
}

function minutesToTime(value) {
  const hours = String(Math.floor(value / 60)).padStart(2, '0');
  const minutes = String(value % 60).padStart(2, '0');
  return `${hours}:${minutes}`;
}

class TimeSlotService {
  constructor(doctorRepository, scheduleRepository, timeSlotRepository, clinicSettingsRepository) {
    this.doctorRepository = doctorRepository;
    this.scheduleRepository = scheduleRepository;
    this.timeSlotRepository = timeSlotRepository;
    this.clinicSettingsRepository = clinicSettingsRepository;
  }

  async getSlotsByDoctorAndDate(query) {
    try {
      const doctor = await this.doctorRepository.findDoctorByIdWithRelations(query.doctorId, { activeOnly: true });
      if (!doctor) {
        throw new TimeSlotServiceError({
          code: TIMESLOT_ERROR_CODES.DOCTOR_NOT_FOUND,
          message: 'Không tìm thấy bác sĩ',
          statusCode: 404,
        });
      }

      const workingDate = parseDateOnly(query.date);
      const schedule = await this.scheduleRepository.findByDoctorAndDate(query.doctorId, workingDate);

      if (!schedule) {
        return {
          doctorId: query.doctorId,
          workingDate: query.date,
          scheduleId: null,
          scheduleStatus: null,
          morning: [],
          afternoon: [],
          slots: [],
        };
      }

      const slots = schedule.timeSlots.map((slot) => toTimeSlotDto(slot, schedule));
      return {
        doctorId: schedule.doctorId,
        workingDate: schedule.workingDate.toISOString().slice(0, 10),
        scheduleId: schedule.id,
        scheduleStatus: schedule.status,
        morning: slots.filter((slot) => timeToMinutes(slot.startTime) < (12 * 60)),
        afternoon: slots.filter((slot) => timeToMinutes(slot.startTime) >= (12 * 60)),
        slots,
      };
    } catch (error) {
      throw this._wrapUnexpectedError(
        error,
        TIMESLOT_ERROR_CODES.GET_TIMESLOTS_FAILED,
        'Không thể lấy danh sách khung giờ khám',
      );
    }
  }

  async lockSlotsForScheduleException(scope, dbClient) {
    const schedule = await this.scheduleRepository.findByDoctorAndDate(scope.doctorId, scope.date, dbClient);
    if (!schedule) {
      throw new TimeSlotServiceError({
        code: TIMESLOT_ERROR_CODES.NO_SCHEDULE_FOR_DATE,
        message: 'Bác sĩ chưa có lịch làm việc trong ngày yêu cầu nghỉ',
        statusCode: 404,
      });
    }

    const systemSetting = await this._getSystemSetting();
    const targetSlots = this._buildSlotsByScope(scope, systemSetting);
    if (targetSlots.length === 0) {
      throw new TimeSlotServiceError({
        code: TIMESLOT_ERROR_CODES.NO_MATCHING_SLOT,
        message: 'Không tìm thấy khung giờ phù hợp với yêu cầu nghỉ',
        statusCode: 400,
      });
    }

    const existingSlotByTime = new Map(
      schedule.timeSlots.map((slot) => [`${slot.startTime}-${slot.endTime}`, slot]),
    );
    const bookedSlot = targetSlots
      .map((slot) => existingSlotByTime.get(`${slot.startTime}-${slot.endTime}`))
      .find((slot) => slot?.status === 'BOOKED');
    if (bookedSlot) {
      throw new TimeSlotServiceError({
        code: TIMESLOT_ERROR_CODES.BOOKED_SLOT_IN_EXCEPTION_SCOPE,
        message: 'Không thể gửi yêu cầu nghỉ vì đã có lịch hẹn được đặt trong khung giờ này',
        statusCode: 409,
      });
    }

    const slotIds = targetSlots
      .map((slot) => existingSlotByTime.get(`${slot.startTime}-${slot.endTime}`))
      .filter((slot) => slot?.status === 'AVAILABLE')
      .map((slot) => slot.id);
    const slotsToCreate = targetSlots
      .filter((slot) => !existingSlotByTime.has(`${slot.startTime}-${slot.endTime}`))
      .map((slot) => ({
        ...slot,
        status: 'LOCKED',
      }));

    if (slotIds.length === 0 && slotsToCreate.length === 0) {
      throw new TimeSlotServiceError({
        code: TIMESLOT_ERROR_CODES.NO_MATCHING_SLOT,
        message: 'Không có khung giờ khả dụng để khóa',
        statusCode: 400,
      });
    }

    if (slotIds.length > 0) {
      await this.timeSlotRepository.bulkLockSlots(slotIds, dbClient);
    }

    if (slotsToCreate.length > 0) {
      await this.timeSlotRepository.bulkCreateSlots(schedule.id, slotsToCreate, dbClient);
    }

    return {
      schedule,
      affectedSlotIds: slotIds,
      createdSlotCount: slotsToCreate.length,
    };
  }

  async unlockSlotsForScheduleException(scope, dbClient) {
    const schedule = await this.scheduleRepository.findByDoctorAndDate(scope.doctorId, scope.date, dbClient);
    if (!schedule) {
      return { schedule: null, affectedSlotIds: [] };
    }

    const matchedSlots = this._filterSlotsByScope(schedule.timeSlots, scope);
    const slotIds = matchedSlots
      .filter((slot) => slot.status === 'LOCKED')
      .map((slot) => slot.id);

    if (slotIds.length > 0) {
      await this.timeSlotRepository.bulkDeleteSlots(slotIds, dbClient);
    }

    return {
      schedule,
      affectedSlotIds: slotIds,
    };
  }

  _filterSlotsByScope(slots, scope) {
    if (scope.exceptionType === 'ALL_DAY') {
      return slots;
    }

    if (scope.exceptionType === 'SHIFT') {
      if (scope.shift === 'MORNING') {
        return slots.filter((slot) => timeToMinutes(slot.startTime) < (12 * 60));
      }

      return slots.filter((slot) => timeToMinutes(slot.startTime) >= (12 * 60));
    }

    const startMinutes = timeToMinutes(scope.startTime);
    const endMinutes = timeToMinutes(scope.endTime);

    return slots.filter((slot) => {
      const slotStart = timeToMinutes(slot.startTime);
      const slotEnd = timeToMinutes(slot.endTime);
      return slotStart < endMinutes && slotEnd > startMinutes;
    });
  }

  async _getSystemSetting() {
    const systemSetting = await this.clinicSettingsRepository.getSystemSetting();

    return systemSetting || {
      slotDurationMinutes: CLINIC_SETTINGS_DEFAULTS.SLOT_DURATION_MINUTES,
      morningShiftStart: CLINIC_SETTINGS_DEFAULTS.MORNING_SHIFT_START,
      morningShiftEnd: CLINIC_SETTINGS_DEFAULTS.MORNING_SHIFT_END,
      afternoonShiftStart: CLINIC_SETTINGS_DEFAULTS.AFTERNOON_SHIFT_START,
      afternoonShiftEnd: CLINIC_SETTINGS_DEFAULTS.AFTERNOON_SHIFT_END,
    };
  }

  _buildSlotsByScope(scope, systemSetting) {
    const normalizedSetting = {
      slotDurationMinutes: systemSetting.slotDurationMinutes || CLINIC_SETTINGS_DEFAULTS.SLOT_DURATION_MINUTES,
      morningShiftStart: systemSetting.morningShiftStart || CLINIC_SETTINGS_DEFAULTS.MORNING_SHIFT_START,
      morningShiftEnd: systemSetting.morningShiftEnd || CLINIC_SETTINGS_DEFAULTS.MORNING_SHIFT_END,
      afternoonShiftStart: systemSetting.afternoonShiftStart || CLINIC_SETTINGS_DEFAULTS.AFTERNOON_SHIFT_START,
      afternoonShiftEnd: systemSetting.afternoonShiftEnd || CLINIC_SETTINGS_DEFAULTS.AFTERNOON_SHIFT_END,
    };
    const allSlots = [
      ...this._buildShiftSlots(
        normalizedSetting.morningShiftStart,
        normalizedSetting.morningShiftEnd,
        normalizedSetting.slotDurationMinutes,
      ),
      ...this._buildShiftSlots(
        normalizedSetting.afternoonShiftStart,
        normalizedSetting.afternoonShiftEnd,
        normalizedSetting.slotDurationMinutes,
      ),
    ];

    if (scope.exceptionType === 'ALL_DAY') {
      return allSlots;
    }

    if (scope.exceptionType === 'SHIFT') {
      if (scope.shift === 'MORNING') {
        return this._buildShiftSlots(
          normalizedSetting.morningShiftStart,
          normalizedSetting.morningShiftEnd,
          normalizedSetting.slotDurationMinutes,
        );
      }

      return this._buildShiftSlots(
        normalizedSetting.afternoonShiftStart,
        normalizedSetting.afternoonShiftEnd,
        normalizedSetting.slotDurationMinutes,
      );
    }

    const startMinutes = timeToMinutes(scope.startTime);
    const endMinutes = timeToMinutes(scope.endTime);

    if (startMinutes == null || endMinutes == null || startMinutes >= endMinutes) {
      return [];
    }

    return allSlots.filter((slot) => {
      const slotStart = timeToMinutes(slot.startTime);
      const slotEnd = timeToMinutes(slot.endTime);
      return slotStart < endMinutes && slotEnd > startMinutes;
    });
  }

  _buildShiftSlots(startTime, endTime, duration) {
    const startMinutes = timeToMinutes(startTime);
    const endMinutes = timeToMinutes(endTime);

    if (!Number.isInteger(startMinutes) || !Number.isInteger(endMinutes) || startMinutes >= endMinutes) {
      return [];
    }

    const slots = [];
    for (let cursor = startMinutes; cursor + duration <= endMinutes; cursor += duration) {
      slots.push({
        startTime: minutesToTime(cursor),
        endTime: minutesToTime(cursor + duration),
      });
    }

    return slots;
  }

  _wrapUnexpectedError(error, code, message) {
    if (error instanceof TimeSlotServiceError || (error && error.code && error.statusCode)) {
      return error;
    }

    return new TimeSlotServiceError({
      code,
      message,
      statusCode: 500,
      details: error?.message ? [{ message: error.message }] : [],
    });
  }
}

module.exports = new TimeSlotService(
  DoctorRepository,
  ScheduleRepository,
  TimeSlotRepository,
  ClinicSettingsRepository,
);
