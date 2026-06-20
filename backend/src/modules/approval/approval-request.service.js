const DoctorRepository = require('../doctor/doctor.repository');
const ScheduleRepository = require('../schedule/schedule.repository');
const TimeSlotService = require('../timeslot/timeslot.service');
const ApprovalRequestRepository = require('./approval-request.repository');
const { toApprovalRequestDto } = require('./approval-request.dto');
const { USER_ROLES } = require('../../shared/constants/roles');
const {
  APPROVAL_REQUEST_ERROR_CODES,
  APPROVAL_REQUEST_PAGINATION,
  APPROVAL_REQUEST_TYPES,
  APPROVAL_STATUSES,
} = require('./approval-request.types');
const { SCHEDULE_STATUSES } = require('../schedule/schedule.types');

class ApprovalRequestServiceError extends Error {
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

class ApprovalRequestService {
  constructor(doctorRepository, scheduleRepository, timeSlotService, approvalRequestRepository) {
    this.doctorRepository = doctorRepository;
    this.scheduleRepository = scheduleRepository;
    this.timeSlotService = timeSlotService;
    this.approvalRequestRepository = approvalRequestRepository;
  }

  async createScheduleException(currentUser, dto) {
    try {
      const doctor = await this._getDoctorByUserIdOrThrow(currentUser.userId);
      const requestDate = parseDateOnly(dto.date);
      const today = parseDateOnly(new Date().toISOString().slice(0, 10));

      if (requestDate < today) {
        throw new ApprovalRequestServiceError({
          code: APPROVAL_REQUEST_ERROR_CODES.VALIDATION_ERROR,
          message: 'Không thể tạo yêu cầu nghỉ cho ngày trong quá khứ',
          statusCode: 400,
        });
      }

      // Strategy to avoid unsafe unlock without schema changes:
      // only one active leave request per doctor/date is allowed.
      const activeRequest = await this.approvalRequestRepository.findActiveRequestByDoctorAndDate(
        doctor.id,
        requestDate,
      );

      if (activeRequest) {
        throw new ApprovalRequestServiceError({
          code: APPROVAL_REQUEST_ERROR_CODES.ACTIVE_REQUEST_ALREADY_EXISTS,
          message: 'Bác sĩ đã có yêu cầu nghỉ đang hiệu lực trong ngày này',
          statusCode: 409,
        });
      }

      const createdRequest = await this.approvalRequestRepository.prisma.$transaction(async (dbClient) => {
        const request = await this.approvalRequestRepository.createScheduleExceptionRequest({
          type: APPROVAL_REQUEST_TYPES.SCHEDULE_EXCEPTION,
          doctorId: doctor.id,
          doctorName: doctor.name,
          date: requestDate,
          exceptionType: dto.exceptionType,
          shift: dto.shift || null,
          startTime: dto.startTime || null,
          endTime: dto.endTime || null,
          reason: dto.reason.trim(),
        }, dbClient);

        await this.timeSlotService.lockSlotsForScheduleException({
          doctorId: doctor.id,
          date: requestDate,
          exceptionType: dto.exceptionType,
          shift: dto.shift || null,
          startTime: dto.startTime || null,
          endTime: dto.endTime || null,
        }, dbClient);

        await this.scheduleRepository.updateScheduleStatusByDoctorAndDate(
          doctor.id,
          requestDate,
          SCHEDULE_STATUSES.PENDING,
          dbClient,
        );

        return request;
      });

      return {
        message: 'Tạo yêu cầu nghỉ thành công',
        request: toApprovalRequestDto(createdRequest),
      };
    } catch (error) {
      throw this._wrapUnexpectedError(
        error,
        APPROVAL_REQUEST_ERROR_CODES.CREATE_REQUEST_FAILED,
        'Không thể tạo yêu cầu nghỉ',
      );
    }
  }

  async listRequests(currentUser, query) {
    try {
      const normalizedQuery = await this._normalizeListQuery(currentUser, query);
      const [requests, total] = await Promise.all([
        this.approvalRequestRepository.findRequests({
          ...normalizedQuery,
          skip: (normalizedQuery.page - 1) * normalizedQuery.limit,
          take: normalizedQuery.limit,
        }),
        this.approvalRequestRepository.countRequests(normalizedQuery),
      ]);

      return {
        data: requests.map(toApprovalRequestDto),
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
        APPROVAL_REQUEST_ERROR_CODES.LIST_REQUESTS_FAILED,
        'Không thể lấy danh sách yêu cầu',
      );
    }
  }

  async approveRequest(requestId) {
    try {
      const request = await this._getPendingRequestOrThrow(requestId);
      const approvedRequest = await this.approvalRequestRepository.prisma.$transaction(async (dbClient) => {
        const updatedRequest = await this.approvalRequestRepository.updateRequestStatus(
          request.id,
          APPROVAL_STATUSES.APPROVED,
          dbClient,
        );

        await this.scheduleRepository.updateScheduleStatusByDoctorAndDate(
          request.doctorId,
          request.date,
          SCHEDULE_STATUSES.APPROVED_OFF,
          dbClient,
        );

        return updatedRequest;
      });

      return {
        message: 'Duyệt yêu cầu nghỉ thành công',
        request: toApprovalRequestDto(approvedRequest),
      };
    } catch (error) {
      throw this._wrapUnexpectedError(
        error,
        APPROVAL_REQUEST_ERROR_CODES.APPROVE_REQUEST_FAILED,
        'Không thể duyệt yêu cầu nghỉ',
      );
    }
  }

  async rejectRequest(requestId) {
    try {
      const request = await this._getPendingRequestOrThrow(requestId);
      const rejectedRequest = await this.approvalRequestRepository.prisma.$transaction(async (dbClient) => {
        await this.timeSlotService.unlockSlotsForScheduleException({
          doctorId: request.doctorId,
          date: request.date,
          exceptionType: request.exceptionType,
          shift: request.shift,
          startTime: request.startTime,
          endTime: request.endTime,
        }, dbClient);

        const updatedRequest = await this.approvalRequestRepository.updateRequestStatus(
          request.id,
          APPROVAL_STATUSES.REJECTED,
          dbClient,
        );

        await this.scheduleRepository.updateScheduleStatusByDoctorAndDate(
          request.doctorId,
          request.date,
          SCHEDULE_STATUSES.WORKING,
          dbClient,
        );

        return updatedRequest;
      });

      return {
        message: 'Từ chối yêu cầu nghỉ thành công',
        request: toApprovalRequestDto(rejectedRequest),
      };
    } catch (error) {
      throw this._wrapUnexpectedError(
        error,
        APPROVAL_REQUEST_ERROR_CODES.REJECT_REQUEST_FAILED,
        'Không thể từ chối yêu cầu nghỉ',
      );
    }
  }

  async _getDoctorByUserIdOrThrow(userId) {
    const doctor = await this.doctorRepository.findDoctorByUserId(userId);

    if (!doctor) {
      throw new ApprovalRequestServiceError({
        code: APPROVAL_REQUEST_ERROR_CODES.DOCTOR_NOT_FOUND,
        message: 'Không tìm thấy hồ sơ bác sĩ',
        statusCode: 404,
      });
    }

    return doctor;
  }

  async _normalizeListQuery(currentUser, query) {
    const page = query.page || APPROVAL_REQUEST_PAGINATION.DEFAULT_PAGE;
    const limit = Math.min(query.limit || APPROVAL_REQUEST_PAGINATION.DEFAULT_LIMIT, APPROVAL_REQUEST_PAGINATION.MAX_LIMIT);
    let doctorId = query.doctorId || undefined;

    if (currentUser.role === USER_ROLES.DOCTOR) {
      const doctor = await this._getDoctorByUserIdOrThrow(currentUser.userId);
      doctorId = doctor.id;
    }

    return {
      page,
      limit,
      type: query.type || undefined,
      status: query.status || undefined,
      doctorId,
      date: query.date ? parseDateOnly(query.date) : undefined,
    };
  }

  async _getPendingRequestOrThrow(requestId) {
    const request = await this.approvalRequestRepository.findRequestById(requestId);

    if (!request) {
      throw new ApprovalRequestServiceError({
        code: APPROVAL_REQUEST_ERROR_CODES.REQUEST_NOT_FOUND,
        message: 'Không tìm thấy yêu cầu duyệt',
        statusCode: 404,
      });
    }

    if (request.status !== APPROVAL_STATUSES.PENDING) {
      throw new ApprovalRequestServiceError({
        code: APPROVAL_REQUEST_ERROR_CODES.INVALID_REQUEST_STATUS,
        message: 'Yêu cầu duyệt không còn ở trạng thái PENDING',
        statusCode: 400,
      });
    }

    return request;
  }

  _wrapUnexpectedError(error, code, message) {
    if (error instanceof ApprovalRequestServiceError || (error && error.code && error.statusCode)) {
      return error;
    }

    return new ApprovalRequestServiceError({
      code,
      message,
      statusCode: 500,
      details: error?.message ? [{ message: error.message }] : [],
    });
  }
}

module.exports = new ApprovalRequestService(
  DoctorRepository,
  ScheduleRepository,
  TimeSlotService,
  ApprovalRequestRepository,
);
