const DoctorRepository = require('./doctor.repository');
const AppointmentRepository = require('../appointment/appointment.repository');
const ScheduleRepository = require('../schedule/schedule.repository');
const SearchService = require('../search/search.service');
const { toDoctorDto, toDoctorListDto, toDoctorDashboardDto } = require('./doctor.dto');
const { DOCTOR_ERROR_CODES, DOCTOR_PAGINATION } = require('./doctor.types');

class DoctorServiceError extends Error {
  constructor({ code, message, statusCode, details = [] }) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
  }
}

function formatDateOnly(date) {
  return date.toISOString().slice(0, 10);
}

function getTodayDateOnly() {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

function getWeekRange(date) {
  const current = new Date(date);
  const day = current.getUTCDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const start = new Date(current);
  start.setUTCDate(current.getUTCDate() + diffToMonday);
  const end = new Date(start);
  end.setUTCDate(start.getUTCDate() + 6);
  return { start, end };
}

class DoctorService {
  constructor(doctorRepository, appointmentRepository, scheduleRepository) {
    this.doctorRepository = doctorRepository;
    this.appointmentRepository = appointmentRepository;
    this.scheduleRepository = scheduleRepository;
  }

  async listDoctors(query) {
    try {
      const normalizedQuery = this._normalizeListQuery(query);
      const filters = {
        page: normalizedQuery.page,
        limit: normalizedQuery.limit,
        specialtyId: normalizedQuery.specialtyId,
        active: normalizedQuery.active,
        search: normalizedQuery.search,
      };

      const [doctors, total] = await Promise.all([
        this.doctorRepository.findDoctors(filters),
        this.doctorRepository.countDoctors(filters),
      ]);

      return {
        data: toDoctorListDto(doctors),
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
        DOCTOR_ERROR_CODES.LIST_DOCTORS_FAILED,
        'Không thể lấy danh sách bác sĩ',
      );
    }
  }

  async getDoctorById(doctorId) {
    try {
      const doctor = await this._getDoctorByIdOrThrow(doctorId, { activeOnly: true });
      return toDoctorDto(doctor);
    } catch (error) {
      throw this._wrapUnexpectedError(
        error,
        DOCTOR_ERROR_CODES.GET_DOCTOR_FAILED,
        'Không thể lấy thông tin bác sĩ',
      );
    }
  }

  async getMyDoctorProfile(currentUser) {
    try {
      const doctor = await this._getDoctorByUserIdOrThrow(currentUser.userId);
      return toDoctorDto(doctor);
    } catch (error) {
      throw this._wrapUnexpectedError(
        error,
        DOCTOR_ERROR_CODES.GET_MY_DOCTOR_PROFILE_FAILED,
        'Không thể lấy hồ sơ bác sĩ hiện tại',
      );
    }
  }

  async updateMyDoctorProfile(currentUser, dto) {
    try {
      const doctor = await this._getDoctorByUserIdOrThrow(currentUser.userId);
      const updatePayload = this._buildSelfProfileUpdateData(dto);

      const updatedDoctor = await this.doctorRepository.updateDoctorProfile(doctor.id, updatePayload);
      this._syncDoctorToSearch(updatedDoctor);

      return {
        message: 'Cập nhật hồ sơ bác sĩ thành công',
        doctor: toDoctorDto(updatedDoctor),
      };
    } catch (error) {
      throw this._wrapUnexpectedError(
        error,
        DOCTOR_ERROR_CODES.UPDATE_MY_DOCTOR_PROFILE_FAILED,
        'Không thể cập nhật hồ sơ bác sĩ',
      );
    }
  }

  async updateDoctorPrice(doctorId, dto) {
    try {
      await this._getDoctorByIdOrThrow(doctorId);
      const updatedDoctor = await this.doctorRepository.updateDoctorPrice(doctorId, dto.price);
      this._syncDoctorToSearch(updatedDoctor);

      return {
        message: 'Cập nhật giá khám tham khảo thành công',
        doctor: toDoctorDto(updatedDoctor),
      };
    } catch (error) {
      throw this._wrapUnexpectedError(
        error,
        DOCTOR_ERROR_CODES.UPDATE_DOCTOR_PRICE_FAILED,
        'Không thể cập nhật giá khám bác sĩ',
      );
    }
  }

  async updateDoctorByAdmin(doctorId, dto) {
    try {
      await this._getDoctorByIdOrThrow(doctorId);
      const updatedDoctor = await this.doctorRepository.updateDoctorByAdmin(doctorId, dto);
      this._syncDoctorToSearch(updatedDoctor);

      return {
        message: 'Cập nhật hồ sơ bác sĩ thành công',
        doctor: toDoctorDto(updatedDoctor),
      };
    } catch (error) {
      throw this._wrapUnexpectedError(
        error,
        DOCTOR_ERROR_CODES.UPDATE_DOCTOR_PROFILE_FAILED,
        'Không thể cập nhật hồ sơ bác sĩ',
      );
    }
  }

  async getDoctorDashboard(currentUser) {
    try {
      const doctor = await this._getDoctorByUserIdOrThrow(currentUser.userId);
      const today = getTodayDateOnly();
      const { start, end } = getWeekRange(today);

      const [appointments, todaySchedule, weeklySchedules] = await Promise.all([
        this.appointmentRepository.findDoctorAppointmentsByDate(doctor.id, today),
        this.scheduleRepository.findByDoctorAndDate(doctor.id, today),
        this.scheduleRepository.findSchedulesByRange({
          doctorId: doctor.id,
          startDate: start,
          endDate: end,
          skip: 0,
          take: 31,
        }),
      ]);

      const dashboardPayload = {
        doctorId: doctor.id,
        today: formatDateOnly(today),
        totalAppointments: appointments.length,
        checkedInAppointments: appointments.filter((item) => item.status === 'CHECKED_IN').length,
        completedAppointments: appointments.filter((item) => item.status === 'COMPLETED').length,
        noShowAppointments: appointments.filter((item) => item.status === 'NO_SHOW').length,
        todaySchedule: todaySchedule
          ? {
              scheduleId: todaySchedule.id,
              workingDate: formatDateOnly(todaySchedule.workingDate),
              status: todaySchedule.status,
            }
          : null,
        weeklySchedule: weeklySchedules.map((schedule) => ({
          scheduleId: schedule.id,
          workingDate: formatDateOnly(schedule.workingDate),
          status: schedule.status,
          totalSlots: schedule.timeSlots.length,
          availableSlots: schedule.timeSlots.filter((slot) => slot.status === 'AVAILABLE').length,
          bookedSlots: schedule.timeSlots.filter((slot) => slot.status === 'BOOKED').length,
          lockedSlots: schedule.timeSlots.filter((slot) => slot.status === 'LOCKED').length,
          expiredSlots: schedule.timeSlots.filter((slot) => slot.status === 'EXPIRED').length,
        })),
        timeline: appointments.map((appointment) => ({
          appointmentId: appointment.id,
          code: appointment.code,
          patientName: appointment.patientName,
          startTime: appointment.startTime,
          endTime: appointment.endTime,
          status: appointment.status,
          bookingChannel: appointment.bookingChannel,
          scheduleId: appointment.scheduleId,
          timeSlotId: appointment.timeSlotId,
        })),
      };

      return toDoctorDashboardDto(dashboardPayload);
    } catch (error) {
      throw this._wrapUnexpectedError(
        error,
        DOCTOR_ERROR_CODES.DOCTOR_DASHBOARD_FAILED,
        'Không thể lấy dữ liệu dashboard bác sĩ',
      );
    }
  }

  async _getDoctorByIdOrThrow(doctorId, options = {}) {
    const doctor = await this.doctorRepository.findDoctorByIdWithRelations(doctorId, options);

    if (!doctor) {
      throw new DoctorServiceError({
        code: DOCTOR_ERROR_CODES.DOCTOR_NOT_FOUND,
        message: 'Không tìm thấy bác sĩ',
        statusCode: 404,
      });
    }

    return doctor;
  }

  async _getDoctorByUserIdOrThrow(userId) {
    const doctor = await this.doctorRepository.findDoctorByUserId(userId);

    if (!doctor) {
      throw new DoctorServiceError({
        code: DOCTOR_ERROR_CODES.DOCTOR_PROFILE_NOT_FOUND,
        message: 'Không tìm thấy hồ sơ bác sĩ',
        statusCode: 404,
      });
    }

    return doctor;
  }

  _buildSelfProfileUpdateData(dto) {
    const doctorData = {};
    const userData = {};

    if (typeof dto.name === 'string') {
      doctorData.name = dto.name.trim();
      userData.name = dto.name.trim();
    }

    if (typeof dto.phone === 'string') {
      userData.phone = dto.phone.trim();
    }

    if (typeof dto.title === 'string') {
      doctorData.title = dto.title.trim();
    }

    if (typeof dto.experience === 'number') {
      doctorData.experience = dto.experience;
    }

    if (typeof dto.description === 'string') {
      doctorData.description = dto.description.trim();
    }

    if (typeof dto.position === 'string') {
      doctorData.position = dto.position.trim();
    }

    return { doctorData, userData };
  }

  _normalizeListQuery(query) {
    const page = query.page || DOCTOR_PAGINATION.DEFAULT_PAGE;
    const limit = Math.min(query.limit || DOCTOR_PAGINATION.DEFAULT_LIMIT, DOCTOR_PAGINATION.MAX_LIMIT);

    return {
      page,
      limit,
      specialtyId: query.specialtyId || undefined,
      active: query.active === undefined ? true : query.active,
      search: query.search || '',
    };
  }

  _syncDoctorToSearch(doctor) {
    SearchService.indexDocument('doctors', doctor.id, {
      name: doctor.name,
      specialtyName: doctor.specialtyName,
      description: doctor.description,
      title: doctor.title,
      experience: doctor.experience,
      price: doctor.price,
      rating: doctor.rating,
      active: doctor.active,
    }).catch(() => {});
  }

  _wrapUnexpectedError(error, code, message) {
    if (error instanceof DoctorServiceError || (error && error.code && error.statusCode)) {
      return error;
    }

    return new DoctorServiceError({
      code,
      message,
      statusCode: 500,
      details: error?.message ? [{ message: error.message }] : [],
    });
  }
}

module.exports = new DoctorService(DoctorRepository, AppointmentRepository, ScheduleRepository);
