const DoctorRepository = require('../doctor/doctor.repository');
const ScheduleRepository = require('../schedule/schedule.repository');
const TimeSlotRepository = require('./timeslot.repository');
const redis = require('../../infrastructure/cache/redis.client');
const ClinicSettingsRepository = require('../clinic-settings/clinic-settings.repository');
const { toTimeSlotDto } = require('./timeslot.dto');
const { TIMESLOT_ERROR_CODES } = require('./timeslot.types');
const { CLINIC_SETTINGS_DEFAULTS } = require('../clinic-settings/clinic-settings.types');
const { WORKING_SHIFTS } = require('../schedule/schedule.types');

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
      const schedules = await this.scheduleRepository.findSchedulesByDoctorAndDate(query.doctorId, workingDate);

      if (schedules.length === 0) {
        return {
          doctorId: query.doctorId,
          workingDate: query.date,
          scheduleId: null,
          scheduleStatus: null,
          scheduleIds: [],
          schedules: [],
          morning: [],
          afternoon: [],
          slots: [],
        };
      }

      const slots = schedules.flatMap((schedule) => (
        schedule.timeSlots.map((slot) => toTimeSlotDto(slot, schedule))
      ));

      const slotKeys = slots.map((slot) => `lock:slot:${slot.id}`);
      let lockedValues = [];
      if (slotKeys.length > 0) {
        try {
          lockedValues = await redis.mget(slotKeys);
        } catch (err) {
          console.error('Failed to fetch slot locks from Redis:', err.message);
          lockedValues = new Array(slotKeys.length).fill(null);
        }
      }

      slots.forEach((slot, index) => {
        const lockedBy = lockedValues[index];
        if (lockedBy) {
          if (lockedBy !== query.lockClientId) {
            slot.status = 'LOCKED';
          }
        }
      });

      return {
        doctorId: schedules[0].doctorId,
        workingDate: schedules[0].workingDate.toISOString().slice(0, 10),
        scheduleId: schedules[0].id,
        scheduleStatus: schedules.length === 1 ? schedules[0].status : null,
        scheduleIds: schedules.map((schedule) => schedule.id),
        schedules: schedules.map((schedule) => ({
          id: schedule.id,
          scheduleId: schedule.id,
          doctorId: schedule.doctorId,
          workingDate: schedule.workingDate instanceof Date ? schedule.workingDate.toISOString().slice(0, 10) : schedule.workingDate,
          workingShift: schedule.workingShift,
          shift: schedule.workingShift,
          status: schedule.status,
          morningShiftStart: schedule.morningShiftStart,
          morningShiftEnd: schedule.morningShiftEnd,
          afternoonShiftStart: schedule.afternoonShiftStart,
          afternoonShiftEnd: schedule.afternoonShiftEnd,
        })),
        morning: slots.filter((slot) => slot.workingShift === WORKING_SHIFTS.MORNING),
        afternoon: slots.filter((slot) => slot.workingShift === WORKING_SHIFTS.AFTERNOON),
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
    const schedules = await this._findSchedulesForScope(scope, dbClient);
    if (schedules.length === 0) {
      throw new TimeSlotServiceError({
        code: TIMESLOT_ERROR_CODES.NO_SCHEDULE_FOR_DATE,
        message: 'Bác sĩ chưa có lịch làm việc trong ngày yêu cầu nghỉ',
        statusCode: 404,
      });
    }

    const systemSetting = await this._getSystemSetting();
    const scheduleByShift = this._buildScheduleByShift(schedules);
    const targetSlots = this._buildSlotsByScope(scope, systemSetting)
      .filter((slot) => scheduleByShift.has(slot.workingShift));
    if (targetSlots.length === 0) {
      throw new TimeSlotServiceError({
        code: TIMESLOT_ERROR_CODES.NO_MATCHING_SLOT,
        message: 'Không tìm thấy khung giờ phù hợp với yêu cầu nghỉ',
        statusCode: 400,
      });
    }

    const existingSlotByTime = new Map(
      schedules.flatMap((schedule) => (
        schedule.timeSlots.map((slot) => [this._getSlotKey(slot), { ...slot, schedule }])
      )),
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
      const slotsBySchedule = new Map();
      for (const slot of slotsToCreate) {
        const targetSchedule = scheduleByShift.get(slot.workingShift);
        if (!targetSchedule) {
          continue;
        }
        const currentSlots = slotsBySchedule.get(targetSchedule.id) || [];
        currentSlots.push(slot);
        slotsBySchedule.set(targetSchedule.id, currentSlots);
      }

      for (const [scheduleId, slots] of slotsBySchedule.entries()) {
        await this.timeSlotRepository.bulkCreateSlots(scheduleId, slots, dbClient);
      }
    }

    return {
      schedule: schedules[0],
      affectedSlotIds: slotIds,
      createdSlotCount: slotsToCreate.length,
    };
  }

  async unlockSlotsForScheduleException(scope, dbClient) {
    const schedules = await this._findSchedulesForScope(scope, dbClient);
    if (schedules.length === 0) {
      return { schedule: null, affectedSlotIds: [] };
    }

    const matchedSlots = schedules.flatMap((schedule) => this._filterSlotsByScope(schedule.timeSlots, scope));
    const slotIds = matchedSlots
      .filter((slot) => slot.status === 'LOCKED')
      .map((slot) => slot.id);

    if (slotIds.length > 0) {
      await this.timeSlotRepository.bulkDeleteSlots(slotIds, dbClient);
    }

    return {
      schedule: schedules[0],
      affectedSlotIds: slotIds,
    };
  }

  _filterSlotsByScope(slots, scope) {
    if (scope.exceptionType === 'ALL_DAY') {
      return slots;
    }

    if (scope.exceptionType === 'SHIFT') {
      return slots.filter((slot) => this._resolveSlotShift(slot) === scope.shift);
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
    let systemSetting = null;

    try {
      systemSetting = await this.clinicSettingsRepository.getSystemSetting();
    } catch (error) {
      if (!this._isMissingClinicSettingColumnError(error)) {
        throw error;
      }

      console.warn(
        '[TimeSlotService] SystemSetting schema is missing new shift columns. Falling back to default shift config.',
      );
    }

    return systemSetting || {
      slotDurationMinutes: CLINIC_SETTINGS_DEFAULTS.SLOT_DURATION_MINUTES,
      morningShiftStart: CLINIC_SETTINGS_DEFAULTS.MORNING_SHIFT_START,
      morningShiftEnd: CLINIC_SETTINGS_DEFAULTS.MORNING_SHIFT_END,
      afternoonShiftStart: CLINIC_SETTINGS_DEFAULTS.AFTERNOON_SHIFT_START,
      afternoonShiftEnd: CLINIC_SETTINGS_DEFAULTS.AFTERNOON_SHIFT_END,
    };
  }

  _isMissingClinicSettingColumnError(error) {
    const message = String(error?.message || '');

    return error?.code === 'P2022'
      || message.includes('SystemSetting')
      || message.includes('singletonKey')
      || message.includes('morningShiftStart')
      || message.includes('morningShiftEnd')
      || message.includes('afternoonShiftStart')
      || message.includes('afternoonShiftEnd');
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
        WORKING_SHIFTS.MORNING,
      ),
      ...this._buildShiftSlots(
        normalizedSetting.afternoonShiftStart,
        normalizedSetting.afternoonShiftEnd,
        normalizedSetting.slotDurationMinutes,
        WORKING_SHIFTS.AFTERNOON,
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
          WORKING_SHIFTS.MORNING,
        );
      }

      return this._buildShiftSlots(
        normalizedSetting.afternoonShiftStart,
        normalizedSetting.afternoonShiftEnd,
        normalizedSetting.slotDurationMinutes,
        WORKING_SHIFTS.AFTERNOON,
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

  _buildShiftSlots(startTime, endTime, duration, workingShift) {
    const startMinutes = timeToMinutes(startTime);
    const endMinutes = timeToMinutes(endTime);

    if (!Number.isInteger(startMinutes) || !Number.isInteger(endMinutes) || startMinutes >= endMinutes) {
      return [];
    }

    const slots = [];
    for (let cursor = startMinutes; cursor + duration <= endMinutes; cursor += duration) {
      slots.push({
        workingShift,
        startTime: minutesToTime(cursor),
        endTime: minutesToTime(cursor + duration),
      });
    }

    return slots;
  }

  async _findSchedulesForScope(scope, dbClient) {
    const schedules = await this.scheduleRepository.findSchedulesByDoctorAndDate(
      scope.doctorId,
      scope.date,
      dbClient,
    );

    return schedules.filter((schedule) => this._scheduleMatchesScope(schedule, scope));
  }

  _scheduleMatchesScope(schedule, scope) {
    if (scope.exceptionType === 'ALL_DAY') {
      return true;
    }

    if (scope.exceptionType === 'SHIFT') {
      return schedule.workingShift === WORKING_SHIFTS.ALL_DAY || schedule.workingShift === scope.shift;
    }

    const targetShift = this._resolveTimeRangeShift(scope);
    return !targetShift
      || schedule.workingShift === WORKING_SHIFTS.ALL_DAY
      || schedule.workingShift === targetShift;
  }

  _buildScheduleByShift(schedules) {
    const scheduleByShift = new Map();

    schedules.forEach((schedule) => {
      if (schedule.workingShift === WORKING_SHIFTS.ALL_DAY) {
        scheduleByShift.set(WORKING_SHIFTS.MORNING, schedule);
        scheduleByShift.set(WORKING_SHIFTS.AFTERNOON, schedule);
        return;
      }

      scheduleByShift.set(schedule.workingShift, schedule);
    });

    return scheduleByShift;
  }

  _getSlotKey(slot) {
    return `${slot.startTime}-${slot.endTime}`;
  }

  _resolveSlotShift(slot) {
    if (slot.workingShift) {
      return slot.workingShift;
    }

    return timeToMinutes(slot.startTime) < (12 * 60) ? WORKING_SHIFTS.MORNING : WORKING_SHIFTS.AFTERNOON;
  }

  _resolveTimeRangeShift(scope) {
    if (!scope.startTime) {
      return null;
    }

    return timeToMinutes(scope.startTime) < (12 * 60) ? WORKING_SHIFTS.MORNING : WORKING_SHIFTS.AFTERNOON;
  }

  async lockTimeSlot(slotId, lockClientId) {
    try {
      let slot;
      let targetSlotId = slotId;

      if (slotId.startsWith('virtual_')) {
        const parts = slotId.split('_');
        if (parts.length >= 6) {
          const doctorId = parts[1];
          const dateStr = parts[2];
          const startTime = parts[3];
          const endTime = parts[4];
          const workingShift = parts[5];
          const workingDate = parseDateOnly(dateStr);

          const schedule = await this.scheduleRepository.prisma.schedule.findFirst({
            where: {
              doctorId,
              workingDate,
              workingShift: {
                in: [workingShift, 'ALL_DAY'],
              },
            },
          });
          if (!schedule) {
            throw new TimeSlotServiceError({
              code: TIMESLOT_ERROR_CODES.NO_SCHEDULE_FOR_DATE,
              message: 'Bác sĩ không có lịch làm việc trong ca yêu cầu',
              statusCode: 404,
            });
          }

          const existingSlot = await this.timeSlotRepository.prisma.timeSlot.findFirst({
            where: {
              scheduleId: schedule.id,
              startTime,
              endTime,
            },
          });

          if (existingSlot) {
            slot = existingSlot;
            targetSlotId = slot.id;
          } else {
            slot = await this.timeSlotRepository.prisma.timeSlot.create({
              data: {
                scheduleId: schedule.id,
                workingShift,
                startTime,
                endTime,
                status: 'AVAILABLE',
              },
            });
            targetSlotId = slot.id;
          }
        }
      } else {
        slot = await this.timeSlotRepository.findById(slotId);
      }

      if (!slot) {
        throw new TimeSlotServiceError({
          code: TIMESLOT_ERROR_CODES.SLOT_NOT_FOUND,
          message: 'Khung giờ khám không tồn tại',
          statusCode: 404,
        });
      }

      if (slot.status !== 'AVAILABLE') {
        throw new TimeSlotServiceError({
          code: TIMESLOT_ERROR_CODES.BOOKED_SLOT_IN_EXCEPTION_SCOPE,
          message: 'Khung giờ này đã được đặt hoặc khóa.',
          statusCode: 409,
        });
      }

      const key = `lock:slot:${targetSlotId}`;
      const existingLock = await redis.get(key);

      if (existingLock) {
        if (existingLock === lockClientId) {
          await redis.expire(key, 120);
          return { slotId: targetSlotId, lockClientId, success: true };
        } else {
          throw new TimeSlotServiceError({
            code: TIMESLOT_ERROR_CODES.SLOT_ALREADY_LOCKED,
            message: 'Khung giờ này đã được giữ bởi người khác.',
            statusCode: 409,
          });
        }
      }

      const acquired = await redis.set(key, lockClientId, 'NX', 'EX', 120);
      if (!acquired) {
        throw new TimeSlotServiceError({
          code: TIMESLOT_ERROR_CODES.SLOT_ALREADY_LOCKED,
          message: 'Khung giờ này đã được giữ bởi người khác.',
          statusCode: 409,
        });
      }

      return { slotId: targetSlotId, lockClientId, success: true };
    } catch (error) {
      if (error instanceof TimeSlotServiceError || (error && error.code && error.statusCode)) {
        throw error;
      }
      throw this._wrapUnexpectedError(
        error,
        TIMESLOT_ERROR_CODES.LOCK_SLOT_FAILED,
        'Không thể giữ khung giờ khám',
      );
    }
  }

  async unlockTimeSlot(slotId, lockClientId) {
    try {
      let targetSlotId = slotId;

      if (slotId.startsWith('virtual_')) {
        const parts = slotId.split('_');
        if (parts.length >= 6) {
          const doctorId = parts[1];
          const dateStr = parts[2];
          const startTime = parts[3];
          const endTime = parts[4];
          const workingDate = parseDateOnly(dateStr);

          const slot = await this.timeSlotRepository.prisma.timeSlot.findFirst({
            where: {
              schedule: {
                doctorId,
                workingDate,
              },
              startTime,
              endTime,
            },
          });
          if (slot) {
            targetSlotId = slot.id;
          }
        }
      }

      const key = `lock:slot:${targetSlotId}`;
      const existingLock = await redis.get(key);

      if (existingLock) {
        if (existingLock === lockClientId) {
          await redis.del(key);

          const slot = await this.timeSlotRepository.prisma.timeSlot.findUnique({
            where: { id: targetSlotId },
            include: { appointment: true }
          });
          if (slot && slot.status === 'AVAILABLE' && !slot.appointment) {
            await this.timeSlotRepository.prisma.timeSlot.delete({
              where: { id: targetSlotId }
            });
          }
        } else {
          throw new TimeSlotServiceError({
            code: TIMESLOT_ERROR_CODES.SLOT_ALREADY_LOCKED,
            message: 'Không thể giải phóng khung giờ do đang bị giữ bởi người khác.',
            statusCode: 403,
          });
        }
      }

      return { slotId: targetSlotId, lockClientId, success: true };
    } catch (error) {
      if (error instanceof TimeSlotServiceError || (error && error.code && error.statusCode)) {
        throw error;
      }
      throw this._wrapUnexpectedError(
        error,
        TIMESLOT_ERROR_CODES.UNLOCK_SLOT_FAILED,
        'Không thể giải phóng khung giờ khám',
      );
    }
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
