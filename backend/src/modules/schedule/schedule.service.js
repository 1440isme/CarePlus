const DoctorRepository = require('../doctor/doctor.repository');
const ScheduleRepository = require('./schedule.repository');
const { toScheduleDto, toScheduleCalendarDto } = require('./schedule.dto');
const {
  SCHEDULE_ERROR_CODES,
  SCHEDULE_PAGINATION,
  SCHEDULE_STATUSES,
  SCHEDULE_VIEWS,
  SHIFT_TIME_WINDOWS,
  SLOT_DURATION_MINUTES,
  WORKING_SHIFTS,
} = require('./schedule.types');
const { USER_ROLES } = require('../../shared/constants/roles');

class ScheduleServiceError extends Error {
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

function formatDateOnly(date) {
  return date.toISOString().slice(0, 10);
}

function getTodayDateOnly() {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

function getViewRange(view, value) {
  const baseDate = parseDateOnly(value || formatDateOnly(getTodayDateOnly()));

  if (view === SCHEDULE_VIEWS.WEEK) {
    const day = baseDate.getUTCDay();
    const diffToMonday = day === 0 ? -6 : 1 - day;
    const start = new Date(baseDate);
    start.setUTCDate(baseDate.getUTCDate() + diffToMonday);
    const end = new Date(start);
    end.setUTCDate(start.getUTCDate() + 6);
    return { startDate: start, endDate: end };
  }

  if (view === SCHEDULE_VIEWS.MONTH) {
    const start = new Date(Date.UTC(baseDate.getUTCFullYear(), baseDate.getUTCMonth(), 1));
    const end = new Date(Date.UTC(baseDate.getUTCFullYear(), baseDate.getUTCMonth() + 1, 0));
    return { startDate: start, endDate: end };
  }

  return { startDate: baseDate, endDate: baseDate };
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

class ScheduleService {
  constructor(doctorRepository, scheduleRepository) {
    this.doctorRepository = doctorRepository;
    this.scheduleRepository = scheduleRepository;
  }

  async createSchedules(payload) {
    try {
      if (payload.workingDate) {
        return this._createSingleSchedule(payload);
      }

      return this._createBatchSchedules(payload);
    } catch (error) {
      throw this._wrapUnexpectedError(
        error,
        SCHEDULE_ERROR_CODES.CREATE_SCHEDULE_FAILED,
        'Không thể tạo lịch làm việc',
      );
    }
  }

  async listSchedules(currentUser, query) {
    try {
      const doctorId = await this._resolveDoctorFilter(currentUser, query.doctorId);
      const normalizedQuery = this._normalizeListQuery(query);

      const [schedules, total] = await Promise.all([
        this.scheduleRepository.findSchedulesByRange({
          doctorId,
          status: normalizedQuery.status,
          startDate: normalizedQuery.startDate,
          endDate: normalizedQuery.endDate,
          skip: (normalizedQuery.page - 1) * normalizedQuery.limit,
          take: normalizedQuery.limit,
        }),
        this.scheduleRepository.countSchedulesByRange({
          doctorId,
          status: normalizedQuery.status,
          startDate: normalizedQuery.startDate,
          endDate: normalizedQuery.endDate,
        }),
      ]);

      return {
        data: toScheduleCalendarDto(schedules),
        meta: {
          page: normalizedQuery.page,
          limit: normalizedQuery.limit,
          total,
          totalPages: Math.ceil(total / normalizedQuery.limit),
        },
      };
    } catch (error) {
      throw this._wrapUnexpectedError(
        error,
        SCHEDULE_ERROR_CODES.LIST_SCHEDULES_FAILED,
        'Không thể lấy danh sách lịch làm việc',
      );
    }
  }

  async getDoctorSchedules(doctorId, query) {
    try {
      await this._getDoctorOrThrow(doctorId, { activeOnly: true });
      const normalizedQuery = this._normalizeListQuery(query);
      const schedules = await this.scheduleRepository.findSchedulesByRange({
        doctorId,
        status: normalizedQuery.status,
        startDate: normalizedQuery.startDate,
        endDate: normalizedQuery.endDate,
        skip: 0,
        take: normalizedQuery.limit,
      });

      return toScheduleCalendarDto(schedules);
    } catch (error) {
      throw this._wrapUnexpectedError(
        error,
        SCHEDULE_ERROR_CODES.GET_DOCTOR_SCHEDULES_FAILED,
        'Không thể lấy lịch làm việc của bác sĩ',
      );
    }
  }

  generateTimeSlots(shifts = [WORKING_SHIFTS.MORNING, WORKING_SHIFTS.AFTERNOON]) {
    const selectedShifts = Array.from(new Set(shifts));
    const slots = [];

    for (const shift of selectedShifts) {
      const window = SHIFT_TIME_WINDOWS[shift];
      let cursor = timeToMinutes(window.start);
      const endMinutes = timeToMinutes(window.end);

      while ((cursor + SLOT_DURATION_MINUTES) <= endMinutes) {
        slots.push({
          startTime: minutesToTime(cursor),
          endTime: minutesToTime(cursor + SLOT_DURATION_MINUTES),
          status: 'AVAILABLE',
        });
        cursor += SLOT_DURATION_MINUTES;
      }
    }

    return slots;
  }

  async _createSingleSchedule(payload) {
    const doctor = await this._getDoctorOrThrow(payload.doctorId);
    const workingDate = parseDateOnly(payload.workingDate);
    this._assertNotPastDate(workingDate);

    const existingSchedule = await this.scheduleRepository.findByDoctorAndDate(doctor.id, workingDate);
    if (existingSchedule) {
      throw new ScheduleServiceError({
        code: SCHEDULE_ERROR_CODES.SCHEDULE_ALREADY_EXISTS,
        message: 'Lịch làm việc của bác sĩ trong ngày này đã tồn tại',
        statusCode: 409,
      });
    }

    const slots = this.generateTimeSlots(payload.shifts);
    const createdSchedule = await this.scheduleRepository.prisma.$transaction((dbClient) => (
      this.scheduleRepository.createScheduleWithSlots({
        doctorId: doctor.id,
        workingDate,
        status: SCHEDULE_STATUSES.WORKING,
        slots,
      }, dbClient)
    ));

    return {
      message: 'Tạo lịch làm việc thành công',
      schedules: [toScheduleDto(createdSchedule)],
    };
  }

  async _createBatchSchedules(payload) {
    const doctor = await this._getDoctorOrThrow(payload.doctorId);
    const fromDate = parseDateOnly(payload.fromDate);
    const toDate = parseDateOnly(payload.toDate);

    if (fromDate > toDate) {
      throw new ScheduleServiceError({
        code: SCHEDULE_ERROR_CODES.INVALID_DATE_RANGE,
        message: 'fromDate phải nhỏ hơn hoặc bằng toDate',
        statusCode: 400,
      });
    }

    const targetDates = this._buildBatchDates(fromDate, toDate, payload.weekdays);
    if (targetDates.length === 0) {
      throw new ScheduleServiceError({
        code: SCHEDULE_ERROR_CODES.EMPTY_BATCH_RANGE,
        message: 'Không có ngày hợp lệ để tạo lịch',
        statusCode: 400,
      });
    }

    targetDates.forEach((date) => this._assertNotPastDate(date));

    const existingSchedules = await this.scheduleRepository.findSchedulesByRange({
      doctorId: doctor.id,
      startDate: fromDate,
      endDate: toDate,
      skip: 0,
      take: 366,
    });
    const existingDateSet = new Set(existingSchedules.map((schedule) => formatDateOnly(schedule.workingDate)));
    const conflictedDates = targetDates
      .map((date) => formatDateOnly(date))
      .filter((date) => existingDateSet.has(date));

    if (conflictedDates.length > 0) {
      throw new ScheduleServiceError({
        code: SCHEDULE_ERROR_CODES.SCHEDULE_ALREADY_EXISTS,
        message: 'Một số ngày đã có lịch làm việc',
        statusCode: 409,
        details: conflictedDates.map((date) => ({
          field: 'workingDate',
          message: `Schedule already exists on ${date}`,
        })),
      });
    }

    const slots = this.generateTimeSlots(payload.shifts);
    const createdSchedules = await this.scheduleRepository.prisma.$transaction(async (dbClient) => {
      const records = [];
      for (const workingDate of targetDates) {
        const createdSchedule = await this.scheduleRepository.createScheduleWithSlots({
          doctorId: doctor.id,
          workingDate,
          status: SCHEDULE_STATUSES.WORKING,
          slots,
        }, dbClient);
        records.push(createdSchedule);
      }
      return records;
    });

    return {
      message: 'Tạo lịch làm việc hàng loạt thành công',
      schedules: createdSchedules.map(toScheduleDto),
    };
  }

  async _getDoctorOrThrow(doctorId, options = {}) {
    const doctor = await this.doctorRepository.findDoctorByIdWithRelations(doctorId, options);

    if (!doctor) {
      throw new ScheduleServiceError({
        code: SCHEDULE_ERROR_CODES.DOCTOR_NOT_FOUND,
        message: 'Không tìm thấy bác sĩ',
        statusCode: 404,
      });
    }

    return doctor;
  }

  async _resolveDoctorFilter(currentUser, requestedDoctorId) {
    if (currentUser?.role !== USER_ROLES.DOCTOR) {
      return requestedDoctorId || undefined;
    }

    const doctor = await this.doctorRepository.findDoctorByUserId(currentUser.userId);
    if (!doctor) {
      throw new ScheduleServiceError({
        code: SCHEDULE_ERROR_CODES.DOCTOR_NOT_FOUND,
        message: 'Không tìm thấy hồ sơ bác sĩ',
        statusCode: 404,
      });
    }

    return doctor.id;
  }

  _normalizeListQuery(query) {
    const page = query.page || SCHEDULE_PAGINATION.DEFAULT_PAGE;
    const limit = Math.min(query.limit || SCHEDULE_PAGINATION.DEFAULT_LIMIT, SCHEDULE_PAGINATION.MAX_LIMIT);
    const status = query.status || undefined;

    if (query.startDate && query.endDate) {
      return {
        page,
        limit,
        status,
        startDate: parseDateOnly(query.startDate),
        endDate: parseDateOnly(query.endDate),
      };
    }

    const { startDate, endDate } = getViewRange(query.view, query.date);
    return { page, limit, status, startDate, endDate };
  }

  _assertNotPastDate(date) {
    const today = getTodayDateOnly();

    if (date < today) {
      throw new ScheduleServiceError({
        code: SCHEDULE_ERROR_CODES.PAST_WORKING_DATE,
        message: 'Không thể tạo lịch làm việc cho ngày trong quá khứ',
        statusCode: 400,
      });
    }
  }

  _buildBatchDates(fromDate, toDate, weekdays) {
    const dates = [];
    const cursor = new Date(fromDate);

    while (cursor <= toDate) {
      if (weekdays.includes(cursor.getUTCDay())) {
        dates.push(new Date(cursor));
      }
      cursor.setUTCDate(cursor.getUTCDate() + 1);
    }

    return dates;
  }

  _wrapUnexpectedError(error, code, message) {
    if (error instanceof ScheduleServiceError || (error && error.code && error.statusCode)) {
      return error;
    }

    return new ScheduleServiceError({
      code,
      message,
      statusCode: 500,
      details: error?.message ? [{ message: error.message }] : [],
    });
  }
}

module.exports = new ScheduleService(DoctorRepository, ScheduleRepository);
