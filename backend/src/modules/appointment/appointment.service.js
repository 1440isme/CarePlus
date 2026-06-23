const bcrypt = require('bcrypt');
const AppointmentRepository = require('./appointment.repository');
const UserRepository = require('../user/user.repository');
const PatientProfileRepository = require('../patient-profile/patient-profile.repository');
const ClinicSettingsRepository = require('../clinic-settings/clinic-settings.repository');
const { mailService } = require('../../infrastructure/mail/mail.service');
const prisma = require('../../infrastructure/database/prisma.client');
const redis = require('../../infrastructure/cache/redis.client');
const { toAppointmentDto, toAppointmentListDto } = require('./appointment.dto');
const { APPOINTMENT_ERROR_CODES, APPOINTMENT_PAGINATION } = require('./appointment.types');
const { WORKING_SHIFTS } = require('../schedule/schedule.types');

class AppointmentServiceError extends Error {
  constructor({ code, message, statusCode, details = [] }) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
  }
}

class AppointmentService {
  constructor(appointmentRepository, userRepository, patientProfileRepository, clinicSettingsRepository) {
    this.appointmentRepository = appointmentRepository;
    this.userRepository = userRepository;
    this.patientProfileRepository = patientProfileRepository;
    this.clinicSettingsRepository = clinicSettingsRepository;
    this.prisma = prisma;
    this.mailService = mailService;
  }

  async createAppointment(currentUser, bookingData) {
    try {
      const patientId = currentUser.userId;

      // 1. Get and check patient user status
      const user = await this.userRepository.findUserById(patientId);
      if (!user) {
        throw new AppointmentServiceError({
          code: APPOINTMENT_ERROR_CODES.PATIENT_NOT_FOUND,
          message: 'Không tìm thấy thông tin bệnh nhân',
          statusCode: 404,
        });
      }

      if (user.status === 'LOCKED') {
        throw new AppointmentServiceError({
          code: APPOINTMENT_ERROR_CODES.PATIENT_LOCKED,
          message: 'Tài khoản của bạn đã bị khóa. Vui lòng liên hệ phòng khám để biết thêm chi tiết.',
          statusCode: 403,
        });
      }

      if (!user.emailVerified) {
        throw new AppointmentServiceError({
          code: APPOINTMENT_ERROR_CODES.EMAIL_NOT_VERIFIED,
          message: 'Vui lòng xác minh địa chỉ email của bạn trước khi đặt lịch.',
          statusCode: 403,
        });
      }

      if (user.noShowCount >= 3) {
        throw new AppointmentServiceError({
          code: APPOINTMENT_ERROR_CODES.MAX_NO_SHOW_REACHED,
          message: 'Tài khoản của bạn đã bị tạm khóa chức năng đặt lịch online do vắng mặt quá 3 lần.',
          statusCode: 403,
        });
      }

      // 2. Resolve persisted slot or create one lazily from a frontend virtual slot.
      const timeSlot = await this._resolveBookableTimeSlot(bookingData);

      // 3. Verify Patient Relative Profile if forSelf === false
      let relativeName = null;
      let patientProfileId = null;
      if (bookingData.forSelf === false) {
        const profile = await this.patientProfileRepository.findProfileByIdAndUserId(
          bookingData.patientProfileId,
          patientId
        );
        if (!profile) {
          throw new AppointmentServiceError({
            code: APPOINTMENT_ERROR_CODES.PATIENT_PROFILE_NOT_FOUND,
            message: 'Không tìm thấy hồ sơ người thân',
            statusCode: 404,
          });
        }
        if (!profile.isActive) {
          throw new AppointmentServiceError({
            code: APPOINTMENT_ERROR_CODES.PATIENT_PROFILE_NOT_FOUND,
            message: 'Hồ sơ người thân đã bị xóa',
            statusCode: 400,
          });
        }
        relativeName = profile.fullName;
        patientProfileId = profile.id;
      }

      // 4. Verify Spam booking rules
      const appointmentDate = timeSlot.schedule.workingDate;
      const doctor = timeSlot.schedule.doctor;

      // Check same day booking for this person
      const sameDayBooking = await this.appointmentRepository.findActiveAppointmentOnDate(
        patientId,
        patientProfileId,
        appointmentDate
      );
      if (sameDayBooking) {
        throw new AppointmentServiceError({
          code: APPOINTMENT_ERROR_CODES.SAME_DAY_BOOKING_EXISTS,
          message: 'Bệnh nhân này đã có lịch hẹn hoạt động trong ngày này.',
          statusCode: 409,
        });
      }

      // Check active booking with this doctor
      const activeDoctorBooking = await this.appointmentRepository.findActiveAppointmentWithDoctor(
        patientId,
        patientProfileId,
        doctor.id
      );
      if (activeDoctorBooking) {
        throw new AppointmentServiceError({
          code: APPOINTMENT_ERROR_CODES.ACTIVE_BOOKING_WITH_DOCTOR_EXISTS,
          message: 'Bệnh nhân này đã có lịch hẹn hoạt động với bác sĩ này.',
          statusCode: 409,
        });
      }

      // 5. Generate unique Code: CP + 10 digits
      let code = '';
      let isCodeUnique = false;
      while (!isCodeUnique) {
        const randomDigits = Math.floor(1000000000 + Math.random() * 9000000000).toString();
        code = `CP${randomDigits}`;
        const existing = await this.prisma.appointment.findUnique({
          where: { code },
          select: { id: true },
        });
        if (!existing) {
          isCodeUnique = true;
        }
      }

      // 6. Perform booking transaction
      const appointment = await this.appointmentRepository.createAppointmentWithTransaction({
        code,
        patientId,
        patientProfileId,
        doctorId: doctor.id,
        specialtyId: doctor.specialtyId,
        scheduleId: timeSlot.scheduleId,
        timeSlotId: timeSlot.id,
        appointmentDate,
        startTime: timeSlot.startTime,
        endTime: timeSlot.endTime,
        status: 'CONFIRMED',
        bookingChannel: 'ONLINE',
        bookingSource: 'PATIENT_WEB',
        createdBy: patientId,
        forSelf: bookingData.forSelf,
        relativeName,
        consultationFee: doctor.price,
        patientEmail: user.email,
        reason: bookingData.reason,
        note: null,
      });

      if (bookingData.lockClientId) {
        const lockKey = `lock:slot:${timeSlot.id}`;
        await redis.del(lockKey).catch((err) => {
          console.error(`Failed to delete Redis lock ${lockKey}:`, err.message);
        });
      }

      // Socket realtime event emit
      try {
        const socketService = require('../../infrastructure/realtime/socket.service');
        const appointmentDto = toAppointmentDto(appointment);
        socketService.emitToUser(doctor.id, 'appointment:created', appointmentDto);
        socketService.emitToRole('admin', 'appointment:created', appointmentDto);
      } catch (socketErr) {
        console.error('Failed to emit appointment:created socket event:', socketErr.message);
      }

      // 7. Send success email asynchronously
      const emailRecipient = user.email;
      const timeStr = `${appointment.startTime} - ${appointment.endTime}`;
      const dateStr = appointmentDate.toISOString().slice(0, 10).split('-').reverse().join('/'); // Format DD/MM/YYYY

      this.mailService.sendBookingSuccessEmail({
        to: emailRecipient,
        name: user.name,
        code: appointment.code,
        doctorName: doctor.name,
        specialtyName: doctor.specialtyName,
        date: dateStr,
        time: timeStr,
        fee: doctor.price,
      }).catch((err) => console.error('Failed to send booking success email:', err.message));

      return toAppointmentDto(appointment);
    } catch (error) {
      if (error.code === 'SLOT_NOT_AVAILABLE') {
        throw new AppointmentServiceError({
          code: APPOINTMENT_ERROR_CODES.SLOT_NOT_AVAILABLE,
          message: 'Khung giờ khám này vừa mới được đặt bởi người khác',
          statusCode: 409,
        });
      }
      if (error instanceof AppointmentServiceError) {
        throw error;
      }
      throw this._wrapUnexpectedError(
        error,
        APPOINTMENT_ERROR_CODES.CREATE_APPOINTMENT_FAILED,
        'Không thể đặt lịch khám'
      );
    }
  }

  async createReceptionistAppointment(currentUser, bookingData) {
    try {
      let patientId = bookingData.patientId;
      let user;

      // 1. Get and check patient user status
      if (!patientId && (bookingData.email || bookingData.phone)) {
        if (bookingData.email) {
          user = await this.userRepository.findUserByEmail(bookingData.email.trim());
        }
        if (!user && bookingData.phone) {
          user = await this.prisma.user.findFirst({
            where: { phone: bookingData.phone.trim(), role: 'PATIENT' }
          });
        }
        if (user) {
          patientId = user.id;
        }
      } else if (patientId) {
        user = await this.userRepository.findUserById(patientId);
      }

      if (user) {
        if (user.status === 'LOCKED') {
          throw new AppointmentServiceError({
            code: APPOINTMENT_ERROR_CODES.PATIENT_LOCKED,
            message: 'Tài khoản bệnh nhân đang bị khóa.',
            statusCode: 403,
          });
        }

        if (user.noShowCount >= 3) {
          throw new AppointmentServiceError({
            code: APPOINTMENT_ERROR_CODES.MAX_NO_SHOW_REACHED,
            message: 'Tài khoản bệnh nhân đã bị tạm khóa chức năng đặt lịch do vắng mặt quá 3 lần.',
            statusCode: 403,
          });
        }
      }

      // 2. Resolve persisted slot or create one lazily from a frontend virtual slot.
      const timeSlot = await this._resolveBookableTimeSlot(bookingData);

      // 3. Verify Patient Relative Profile if forSelf === false
      let relativeName = null;
      let patientProfileId = null;
      if (bookingData.forSelf === false) {
        const profile = await this.patientProfileRepository.findProfileByIdAndUserId(
          bookingData.patientProfileId,
          patientId
        );
        if (!profile) {
          throw new AppointmentServiceError({
            code: APPOINTMENT_ERROR_CODES.PATIENT_PROFILE_NOT_FOUND,
            message: 'Không tìm thấy hồ sơ người thân của bệnh nhân này',
            statusCode: 404,
          });
        }
        if (!profile.isActive) {
          throw new AppointmentServiceError({
            code: APPOINTMENT_ERROR_CODES.PATIENT_PROFILE_NOT_FOUND,
            message: 'Hồ sơ người thân đã bị xóa',
            statusCode: 400,
          });
        }
        relativeName = profile.fullName;
        patientProfileId = profile.id;
      }

      // 4. Verify Spam booking rules
      const appointmentDate = timeSlot.schedule.workingDate;
      const doctor = timeSlot.schedule.doctor;

      // Check same day booking for this person (only if patientId is present)
      if (patientId) {
        const sameDayBooking = await this.appointmentRepository.findActiveAppointmentOnDate(
          patientId,
          patientProfileId,
          appointmentDate
        );
        if (sameDayBooking) {
          throw new AppointmentServiceError({
            code: APPOINTMENT_ERROR_CODES.SAME_DAY_BOOKING_EXISTS,
            message: 'Bệnh nhân này đã có lịch hẹn hoạt động trong ngày này.',
            statusCode: 409,
          });
        }

        // Check active booking with this doctor
        const activeDoctorBooking = await this.appointmentRepository.findActiveAppointmentWithDoctor(
          patientId,
          patientProfileId,
          doctor.id
        );
        if (activeDoctorBooking) {
          throw new AppointmentServiceError({
            code: APPOINTMENT_ERROR_CODES.ACTIVE_BOOKING_WITH_DOCTOR_EXISTS,
            message: 'Bệnh nhân này đã có lịch hẹn hoạt động với bác sĩ này.',
            statusCode: 409,
          });
        }
      }

      // 5. Generate unique Code: CP + 10 digits
      let code = '';
      let isCodeUnique = false;
      while (!isCodeUnique) {
        const randomDigits = Math.floor(1000000000 + Math.random() * 9000000000).toString();
        code = `CP${randomDigits}`;
        const existing = await this.prisma.appointment.findUnique({
          where: { code },
          select: { id: true },
        });
        if (!existing) {
          isCodeUnique = true;
        }
      }

      // 6. Perform booking transaction
      const appointment = await this.appointmentRepository.createAppointmentWithTransaction({
        code,
        patientId,
        patientName: user ? null : bookingData.name.trim(),
        patientPhone: user ? null : bookingData.phone.trim(),
        patientGender: user ? null : (bookingData.gender || null),
        patientDob: user ? null : (bookingData.dateOfBirth ? new Date(`${bookingData.dateOfBirth}T00:00:00.000Z`) : null),
        patientAddress: user ? null : (bookingData.address?.trim() || null),
        patientProfileId,
        doctorId: doctor.id,
        specialtyId: doctor.specialtyId,
        scheduleId: timeSlot.scheduleId,
        timeSlotId: timeSlot.id,
        appointmentDate,
        startTime: timeSlot.startTime,
        endTime: timeSlot.endTime,
        status: 'CONFIRMED',
        bookingChannel: 'RECEPTION',
        bookingSource: 'RECEPTIONIST',
        createdBy: currentUser.userId,
        forSelf: bookingData.forSelf,
        relativeName,
        consultationFee: doctor.price,
        patientEmail: user ? user.email : (bookingData.email?.trim() || null),
        reason: bookingData.reason,
        note: bookingData.note,
      });

      if (bookingData.lockClientId) {
        const lockKey = `lock:slot:${timeSlot.id}`;
        await redis.del(lockKey).catch((err) => {
          console.error(`Failed to delete Redis lock ${lockKey}:`, err.message);
        });
      }

      // Socket realtime event emit
      try {
        const socketService = require('../../infrastructure/realtime/socket.service');
        const appointmentDto = toAppointmentDto(appointment);
        socketService.emitToUser(doctor.id, 'appointment:created', appointmentDto);
        socketService.emitToRole('admin', 'appointment:created', appointmentDto);
      } catch (socketErr) {
        console.error('Failed to emit appointment:created socket event:', socketErr.message);
      }

      // 7. Send success email asynchronously
      const emailRecipient = user ? user.email : (bookingData.email?.trim() || null);
      if (emailRecipient) {
        const timeStr = `${appointment.startTime} - ${appointment.endTime}`;
        const dateStr = appointmentDate.toISOString().slice(0, 10).split('-').reverse().join('/');

        this.mailService.sendBookingSuccessEmail({
          to: emailRecipient,
          name: user ? user.name : bookingData.name.trim(),
          code: appointment.code,
          doctorName: doctor.name,
          specialtyName: doctor.specialtyName,
          date: dateStr,
          time: timeStr,
          fee: doctor.price,
        }).catch((err) => console.error('Failed to send booking success email:', err.message));
      }

      return toAppointmentDto(appointment);
    } catch (error) {
      if (error.code === 'SLOT_NOT_AVAILABLE') {
        throw new AppointmentServiceError({
          code: APPOINTMENT_ERROR_CODES.SLOT_NOT_AVAILABLE,
          message: 'Khung giờ khám này vừa mới được đặt',
          statusCode: 409,
        });
      }
      if (error instanceof AppointmentServiceError) {
        throw error;
      }
      throw this._wrapUnexpectedError(
        error,
        APPOINTMENT_ERROR_CODES.CREATE_APPOINTMENT_FAILED,
        'Không thể đặt lịch khám hộ bệnh nhân'
      );
    }
  }

  async listMyAppointments(currentUser, query) {
    try {
      const page = Number.parseInt(query.page, 10) || APPOINTMENT_PAGINATION.DEFAULT_PAGE;
      const rawLimit = Number.parseInt(query.limit, 10) || APPOINTMENT_PAGINATION.DEFAULT_LIMIT;
      const limit = Math.min(rawLimit, APPOINTMENT_PAGINATION.MAX_LIMIT);
      
      const where = {
        patientId: currentUser.userId,
      };

      if (query.status) {
        where.status = query.status.trim().toUpperCase();
      }

      const [appointments, total] = await this.prisma.$transaction([
        this.prisma.appointment.findMany({
          where,
          include: {
            doctor: true,
            specialty: true,
            patientProfile: true,
          },
          orderBy: [
            { appointmentDate: 'desc' },
            { startTime: 'desc' },
          ],
          skip: (page - 1) * limit,
          take: limit,
        }),
        this.prisma.appointment.count({ where }),
      ]);

      return {
        data: toAppointmentListDto(appointments),
        meta: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      throw this._wrapUnexpectedError(
        error,
        APPOINTMENT_ERROR_CODES.LIST_APPOINTMENTS_FAILED,
        'Không thể lấy danh sách lịch hẹn của bạn'
      );
    }
  }

  async listAllAppointments(currentUser, query) {
    try {
      const page = Number.parseInt(query.page, 10) || APPOINTMENT_PAGINATION.DEFAULT_PAGE;
      const rawLimit = Number.parseInt(query.limit, 10) || APPOINTMENT_PAGINATION.DEFAULT_LIMIT;
      const limit = Math.min(rawLimit, APPOINTMENT_PAGINATION.MAX_LIMIT);

      const where = {};

      if (query.status) {
        where.status = query.status.trim().toUpperCase();
      }

      if (query.doctorId) {
        where.doctorId = query.doctorId.trim();
      }

      if (query.patientId) {
        where.patientId = query.patientId.trim();
      }

      if (query.date) {
        where.appointmentDate = new Date(`${query.date.trim()}T00:00:00.000Z`);
      } else if (query.startDate || query.endDate) {
        where.appointmentDate = {};
        if (query.startDate) {
          where.appointmentDate.gte = new Date(`${query.startDate.trim()}T00:00:00.000Z`);
        }
        if (query.endDate) {
          where.appointmentDate.lte = new Date(`${query.endDate.trim()}T00:00:00.000Z`);
        }
      }

      if (query.specialtyId) {
        where.specialtyId = query.specialtyId.trim();
      }

      if (query.search) {
        const searchTrim = query.search.trim();
        where.OR = [
          { code: { contains: searchTrim } },
          { relativeName: { contains: searchTrim } },
          {
            patient: {
              OR: [
                { name: { contains: searchTrim } },
                { email: { contains: searchTrim } },
                { phone: { contains: searchTrim } },
              ],
            },
          },
        ];
      }

      const [appointments, total] = await this.prisma.$transaction([
        this.prisma.appointment.findMany({
          where,
          include: {
            doctor: true,
            specialty: true,
            patient: true,
            patientProfile: true,
          },
          orderBy: [
            { appointmentDate: 'desc' },
            { startTime: 'desc' },
          ],
          skip: (page - 1) * limit,
          take: limit,
        }),
        this.prisma.appointment.count({ where }),
      ]);

      return {
        data: toAppointmentListDto(appointments),
        meta: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      throw this._wrapUnexpectedError(
        error,
        APPOINTMENT_ERROR_CODES.LIST_APPOINTMENTS_FAILED,
        'Không thể lấy danh sách lịch hẹn toàn hệ thống'
      );
    }
  }

  async getMyAppointmentDetail(currentUser, appointmentId) {
    try {
      const appointment = await this.appointmentRepository.findAppointmentByIdWithRelations(appointmentId);

      if (!appointment) {
        throw new AppointmentServiceError({
          code: APPOINTMENT_ERROR_CODES.APPOINTMENT_NOT_FOUND,
          message: 'Không tìm thấy thông tin lịch hẹn',
          statusCode: 404,
        });
      }

      if (appointment.patientId !== currentUser.userId) {
        throw new AppointmentServiceError({
          code: APPOINTMENT_ERROR_CODES.APPOINTMENT_FORBIDDEN,
          message: 'Bạn không có quyền truy cập thông tin lịch hẹn này',
          statusCode: 403,
        });
      }

      return toAppointmentDto(appointment);
    } catch (error) {
      if (error instanceof AppointmentServiceError) {
        throw error;
      }
      throw this._wrapUnexpectedError(
        error,
        APPOINTMENT_ERROR_CODES.LIST_APPOINTMENTS_FAILED,
        'Không thể lấy thông tin chi tiết lịch hẹn'
      );
    }
  }

  async getAppointmentDetail(currentUser, appointmentId) {
    try {
      const appointment = await this.appointmentRepository.findAppointmentByIdWithRelations(appointmentId);

      if (!appointment) {
        throw new AppointmentServiceError({
          code: APPOINTMENT_ERROR_CODES.APPOINTMENT_NOT_FOUND,
          message: 'Không tìm thấy thông tin lịch hẹn',
          statusCode: 404,
        });
      }

      return toAppointmentDto(appointment);
    } catch (error) {
      if (error instanceof AppointmentServiceError) {
        throw error;
      }
      throw this._wrapUnexpectedError(
        error,
        APPOINTMENT_ERROR_CODES.LIST_APPOINTMENTS_FAILED,
        'Không thể lấy thông tin chi tiết lịch hẹn'
      );
    }
  }

  async cancelMyAppointment(currentUser, appointmentId, body) {
    try {
      const appointment = await this.prisma.appointment.findUnique({
        where: { id: appointmentId },
        include: {
          doctor: true,
          patient: true,
        },
      });

      if (!appointment) {
        throw new AppointmentServiceError({
          code: APPOINTMENT_ERROR_CODES.APPOINTMENT_NOT_FOUND,
          message: 'Không tìm thấy lịch hẹn cần hủy',
          statusCode: 404,
        });
      }

      if (appointment.patientId !== currentUser.userId) {
        throw new AppointmentServiceError({
          code: APPOINTMENT_ERROR_CODES.APPOINTMENT_FORBIDDEN,
          message: 'Bạn không có quyền hủy lịch hẹn này',
          statusCode: 403,
        });
      }

      if (appointment.status !== 'CONFIRMED') {
        throw new AppointmentServiceError({
          code: APPOINTMENT_ERROR_CODES.INVALID_STATUS_TRANSITION,
          message: 'Chỉ có thể hủy lịch hẹn ở trạng thái CONFIRMED',
          statusCode: 400,
        });
      }

      // Check cancellation limit (At least 24 hours prior to appointment time)
      const dateString = appointment.appointmentDate.toISOString().slice(0, 10);
      const appointmentTime = new Date(`${dateString}T${appointment.startTime}:00+07:00`);
      const now = new Date();
      const diffMs = appointmentTime.getTime() - now.getTime();
      const diffHours = diffMs / (1000 * 60 * 60);

      if (diffHours < 24) {
        throw new AppointmentServiceError({
          code: APPOINTMENT_ERROR_CODES.CANCELLATION_LIMIT_EXCEEDED,
          message: 'Chỉ được phép hủy lịch hẹn trước giờ khám ít nhất 24 giờ.',
          statusCode: 400,
        });
      }

      const { appointment: updatedAppointment } = await this.appointmentRepository.updateStatusWithTransaction(
        appointment,
        'CANCELLED',
        { reason: body.reason || 'Hủy bởi bệnh nhân' }
      );

      // Socket realtime event emit
      try {
        const socketService = require('../../infrastructure/realtime/socket.service');
        const appointmentDto = toAppointmentDto(updatedAppointment);
        socketService.emitToUser(updatedAppointment.patientId, 'appointment:status-changed', appointmentDto);
        socketService.emitToUser(updatedAppointment.doctorId, 'appointment:status-changed', appointmentDto);
        socketService.emitToRole('receptionist', 'appointment:status-changed', appointmentDto);
        socketService.emitToRole('admin', 'appointment:status-changed', appointmentDto);
      } catch (socketErr) {
        console.error('Failed to emit appointment:status-changed socket event:', socketErr.message);
      }

      // Send email notification asynchronously
      const dateStr = appointment.appointmentDate.toISOString().slice(0, 10).split('-').reverse().join('/');
      this.mailService.sendBookingCancellationEmail({
        to: appointment.patientEmail,
        name: appointment.patient.name,
        code: appointment.code,
        doctorName: appointment.doctor.name,
        date: dateStr,
        time: `${appointment.startTime} - ${appointment.endTime}`,
        reason: body.reason || 'Hủy theo yêu cầu của bệnh nhân',
      }).catch((err) => console.error('Failed to send booking cancellation email:', err.message));

      return toAppointmentDto(updatedAppointment);
    } catch (error) {
      if (error instanceof AppointmentServiceError) {
        throw error;
      }
      throw this._wrapUnexpectedError(
        error,
        APPOINTMENT_ERROR_CODES.CANCEL_APPOINTMENT_FAILED,
        'Không thể hủy lịch hẹn'
      );
    }
  }

  async updateAppointmentStatus(currentUser, appointmentId, body) {
    try {
      const appointment = await this.prisma.appointment.findUnique({
        where: { id: appointmentId },
        include: {
          doctor: true,
          patient: true,
        },
      });

      if (!appointment) {
        throw new AppointmentServiceError({
          code: APPOINTMENT_ERROR_CODES.APPOINTMENT_NOT_FOUND,
          message: 'Không tìm thấy lịch hẹn',
          statusCode: 404,
        });
      }

      const currentStatus = appointment.status;
      const newStatus = body.status.trim().toUpperCase();

      // Check valid transitions
      // CONFIRMED -> CHECKED_IN, CANCELLED, NO_SHOW
      // CHECKED_IN -> COMPLETED, CANCELLED
      let isValidTransition = false;
      if (currentStatus === 'CONFIRMED') {
        if (['CHECKED_IN', 'CANCELLED', 'NO_SHOW'].includes(newStatus)) {
          isValidTransition = true;
        }
      } else if (currentStatus === 'CHECKED_IN') {
        if (['COMPLETED', 'CANCELLED'].includes(newStatus)) {
          isValidTransition = true;
        }
      }

      if (!isValidTransition) {
        throw new AppointmentServiceError({
          code: APPOINTMENT_ERROR_CODES.INVALID_STATUS_TRANSITION,
          message: `Không thể chuyển trạng thái từ ${currentStatus} sang ${newStatus}`,
          statusCode: 400,
        });
      }

      // Fetch lock configuration from system settings
      const settings = await this.clinicSettingsRepository.getSystemSetting();
      const maxNoShow = settings?.maxNoShowBeforeLock ?? 3;

      const { appointment: updatedAppointment, userLocked } = await this.appointmentRepository.updateStatusWithTransaction(
        appointment,
        newStatus,
        {
          reason: body.reason,
          note: body.note,
          maxNoShow,
        }
      );

      const dateStr = appointment.appointmentDate.toISOString().slice(0, 10).split('-').reverse().join('/');
      const timeStr = `${appointment.startTime} - ${appointment.endTime}`;

      // Email triggers
      if (newStatus === 'CANCELLED') {
        this.mailService.sendBookingCancellationEmail({
          to: appointment.patientEmail,
          name: appointment.patient.name,
          code: appointment.code,
          doctorName: appointment.doctor.name,
          date: dateStr,
          time: timeStr,
          reason: body.reason || 'Được hủy bởi quầy lễ tân',
        }).catch((err) => console.error('Failed to send booking cancellation email:', err.message));
      } else if (newStatus === 'NO_SHOW') {
        if (userLocked) {
          this.mailService.sendNoShowLockEmail({
            to: appointment.patientEmail,
            name: appointment.patient.name,
            maxNoShow,
          }).catch((err) => console.error('Failed to send account lock warning email:', err.message));
        } else {
          // Send cancellation as fallback notification
          this.mailService.sendBookingCancellationEmail({
            to: appointment.patientEmail,
            name: appointment.patient.name,
            code: appointment.code,
            doctorName: appointment.doctor.name,
            date: dateStr,
            time: timeStr,
            reason: 'Bạn đã không có mặt khám đúng giờ hẹn (No-show). Lịch hẹn bị hủy.',
          }).catch((err) => console.error('Failed to send no-show cancellation email:', err.message));
        }
      }

      // Socket realtime event emit
      try {
        const socketService = require('../../infrastructure/realtime/socket.service');
        const appointmentDto = toAppointmentDto(updatedAppointment);
        socketService.emitToUser(updatedAppointment.patientId, 'appointment:status-changed', appointmentDto);
        socketService.emitToUser(updatedAppointment.doctorId, 'appointment:status-changed', appointmentDto);
        socketService.emitToRole('receptionist', 'appointment:status-changed', appointmentDto);
        socketService.emitToRole('admin', 'appointment:status-changed', appointmentDto);
      } catch (socketErr) {
        console.error('Failed to emit appointment:status-changed socket event:', socketErr.message);
      }

      return toAppointmentDto(updatedAppointment);
    } catch (error) {
      if (error instanceof AppointmentServiceError) {
        throw error;
      }
      throw this._wrapUnexpectedError(
        error,
        APPOINTMENT_ERROR_CODES.UPDATE_STATUS_FAILED,
        'Không thể cập nhật trạng thái lịch hẹn'
      );
    }
  }

  async receptionistSearchPatients(currentUser, query) {
    try {
      const search = typeof query.search === 'string' ? query.search.trim() : '';

      const where = {
        role: 'PATIENT',
      };

      if (search) {
        where.OR = [
          { name: { contains: search } },
          { email: { contains: search } },
          { phone: { contains: search } },
          {
            patientProfiles: {
              some: {
                OR: [
                  { fullName: { contains: search } },
                  { phone: { contains: search } },
                  { email: { contains: search } }
                ],
                isActive: true
              }
            }
          }
        ];
      }

      const patients = await this.prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          gender: true,
          dateOfBirth: true,
          status: true,
          noShowCount: true,
          patientProfiles: {
            where: { isActive: true },
            select: {
              id: true,
              fullName: true,
              phone: true,
              relationship: true,
            },
          },
        },
        orderBy: {
          name: 'asc',
        },
        take: 50, // Limit to top 50 matches
      });

      return patients.map((p) => ({
        id: p.id,
        name: p.name,
        email: p.email,
        phone: p.phone,
        gender: p.gender,
        dateOfBirth: p.dateOfBirth ? p.dateOfBirth.toISOString().slice(0, 10) : null,
        status: p.status,
        noShowCount: p.noShowCount,
        profiles: p.patientProfiles,
      }));
    } catch (error) {
      throw this._wrapUnexpectedError(
        error,
        APPOINTMENT_ERROR_CODES.SEARCH_PATIENTS_FAILED,
        'Không thể tra cứu thông tin bệnh nhân'
      );
    }
  }

  async _resolveBookableTimeSlot(bookingData) {
    let timeSlot = await this._findTimeSlotById(bookingData.timeSlotId);

    if (!timeSlot) {
      timeSlot = await this._createTimeSlotFromVirtualSelection(bookingData);
    }

    if (!timeSlot) {
      throw new AppointmentServiceError({
        code: APPOINTMENT_ERROR_CODES.SLOT_NOT_FOUND,
        message: 'Không tìm thấy khung giờ khám',
        statusCode: 404,
      });
    }

    const lockKey = `lock:slot:${timeSlot.id}`;
    const lockedBy = await redis.get(lockKey);
    if (lockedBy && lockedBy !== bookingData.lockClientId) {
      throw new AppointmentServiceError({
        code: APPOINTMENT_ERROR_CODES.SLOT_NOT_AVAILABLE,
        message: 'Khung giờ khám này đang được giữ bởi người khác',
        statusCode: 400,
      });
    }

    if (timeSlot.status !== 'AVAILABLE') {
      throw new AppointmentServiceError({
        code: APPOINTMENT_ERROR_CODES.SLOT_NOT_AVAILABLE,
        message: 'Khung giờ khám này đã được đặt hoặc bị khóa',
        statusCode: 400,
      });
    }

    if (timeSlot.schedule.status !== 'WORKING') {
      throw new AppointmentServiceError({
        code: APPOINTMENT_ERROR_CODES.SLOT_NOT_AVAILABLE,
        message: 'Lịch làm việc của bác sĩ trong ngày này không khả dụng',
        statusCode: 400,
      });
    }

    return timeSlot;
  }

  async _findTimeSlotById(timeSlotId) {
    return this.appointmentRepository.findTimeSlotByIdWithSchedule(timeSlotId);
  }

  async _createTimeSlotFromVirtualSelection(bookingData) {
    if (!bookingData.doctorId || !bookingData.date || !bookingData.startTime || !bookingData.endTime || !bookingData.workingShift) {
      return null;
    }

    const workingDate = new Date(`${bookingData.date}T00:00:00.000Z`);
    const schedule = await this.appointmentRepository.findWorkingScheduleForSlotSelection({
      doctorId: bookingData.doctorId,
      workingDate,
      workingShift: bookingData.workingShift,
      allDayShift: WORKING_SHIFTS.ALL_DAY,
    });

    if (!schedule) {
      return null;
    }

    const existingSlot = await this.appointmentRepository.findTimeSlotByDoctorDateAndTime({
      doctorId: bookingData.doctorId,
      workingDate,
      startTime: bookingData.startTime,
      endTime: bookingData.endTime,
    });

    if (existingSlot) {
      return existingSlot;
    }

    return this.appointmentRepository.createAvailableTimeSlot({
      scheduleId: schedule.id,
      workingShift: bookingData.workingShift,
      startTime: bookingData.startTime,
      endTime: bookingData.endTime,
    });
  }

  _wrapUnexpectedError(error, code, message) {
    if (error instanceof AppointmentServiceError || (error && error.code && error.statusCode)) {
      return error;
    }

    return new AppointmentServiceError({
      code,
      message,
      statusCode: 500,
      details: error?.message ? [{ message: error.message }] : [],
    });
  }
}

module.exports = new AppointmentService(
  AppointmentRepository,
  UserRepository,
  PatientProfileRepository,
  ClinicSettingsRepository
);
