const DoctorRepository = require('../doctor/doctor.repository');
const ScheduleRepository = require('../schedule/schedule.repository');
const TimeSlotRepository = require('./timeslot.repository');
const { toTimeSlotDto } = require('./timeslot.dto');
const { TIMESLOT_ERROR_CODES } = require('./timeslot.types');

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

class TimeSlotService {
  constructor(doctorRepository, scheduleRepository, timeSlotRepository) {
    this.doctorRepository = doctorRepository;
    this.scheduleRepository = scheduleRepository;
    this.timeSlotRepository = timeSlotRepository;
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

    const matchedSlots = this._filterSlotsByScope(schedule.timeSlots, scope);
    if (matchedSlots.length === 0) {
      throw new TimeSlotServiceError({
        code: TIMESLOT_ERROR_CODES.NO_MATCHING_SLOT,
        message: 'Không tìm thấy khung giờ phù hợp với yêu cầu nghỉ',
        statusCode: 400,
      });
    }

    const bookedSlot = matchedSlots.find((slot) => slot.status === 'BOOKED');
    if (bookedSlot) {
      throw new TimeSlotServiceError({
        code: TIMESLOT_ERROR_CODES.BOOKED_SLOT_IN_EXCEPTION_SCOPE,
        message: 'Không thể gửi yêu cầu nghỉ vì đã có lịch hẹn được đặt trong khung giờ này',
        statusCode: 409,
      });
    }

    const slotIds = matchedSlots
      .filter((slot) => slot.status === 'AVAILABLE')
      .map((slot) => slot.id);

    if (slotIds.length === 0) {
      throw new TimeSlotServiceError({
        code: TIMESLOT_ERROR_CODES.NO_MATCHING_SLOT,
        message: 'Không có khung giờ khả dụng để khóa',
        statusCode: 400,
      });
    }

    await this.timeSlotRepository.bulkLockSlots(slotIds, dbClient);

    return {
      schedule,
      affectedSlotIds: slotIds,
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
      await this.timeSlotRepository.bulkUnlockSlots(slotIds, dbClient);
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

module.exports = new TimeSlotService(DoctorRepository, ScheduleRepository, TimeSlotRepository);
