const BaseRepository = require('../../shared/repositories/base.repository');

const APPROVAL_REQUEST_SELECT = {
  id: true,
  type: true,
  doctorId: true,
  doctorName: true,
  date: true,
  exceptionType: true,
  shift: true,
  startTime: true,
  endTime: true,
  reason: true,
  appointmentCode: true,
  status: true,
  reviewedBy: true,
  reviewedAt: true,
  rejectionReason: true,
  createdAt: true,
  updatedAt: true,
};

const LEGACY_APPROVAL_REQUEST_SELECT = {
  id: true,
  type: true,
  doctorId: true,
  doctorName: true,
  date: true,
  exceptionType: true,
  shift: true,
  startTime: true,
  endTime: true,
  reason: true,
  appointmentCode: true,
  status: true,
  createdAt: true,
  updatedAt: true,
};

class ApprovalRequestRepository extends BaseRepository {
  constructor() {
    super('ApprovalRequest');
  }

  async createScheduleExceptionRequest(data, dbClient = this.prisma) {
    return dbClient.approvalRequest.create({
      data,
      select: LEGACY_APPROVAL_REQUEST_SELECT,
    });
  }

  async findRequestById(requestId, dbClient = this.prisma) {
    try {
      return await dbClient.approvalRequest.findUnique({
        where: { id: requestId },
        select: APPROVAL_REQUEST_SELECT,
      });
    } catch (error) {
      if (!this._isMissingReviewColumnError(error)) {
        throw error;
      }

      return dbClient.approvalRequest.findUnique({
        where: { id: requestId },
        select: LEGACY_APPROVAL_REQUEST_SELECT,
      });
    }
  }

  async findActiveScheduleExceptionRequestsByDoctorAndDate(doctorId, date, dbClient = this.prisma) {
    return dbClient.approvalRequest.findMany({
      where: {
        doctorId,
        date,
        type: 'SCHEDULE_EXCEPTION',
        status: {
          in: ['PENDING', 'APPROVED'],
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      select: LEGACY_APPROVAL_REQUEST_SELECT,
    });
  }

  async findRequests(filters) {
    const {
      type,
      status,
      doctorId,
      date,
      skip = 0,
      take = 10,
    } = filters;

    try {
      return await this.prisma.approvalRequest.findMany({
        where: this._buildWhereClause({ type, status, doctorId, date }),
        select: APPROVAL_REQUEST_SELECT,
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take,
      });
    } catch (error) {
      if (!this._isMissingReviewColumnError(error)) {
        throw error;
      }

      return this.prisma.approvalRequest.findMany({
        where: this._buildWhereClause({ type, status, doctorId, date }),
        select: LEGACY_APPROVAL_REQUEST_SELECT,
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take,
      });
    }
  }

  async countRequests(filters) {
    const { type, status, doctorId, date } = filters;
    return this.prisma.approvalRequest.count({
      where: this._buildWhereClause({ type, status, doctorId, date }),
    });
  }

  async updateRequestStatus(requestId, status, payload = {}, dbClient = this.prisma) {
    try {
      return await dbClient.approvalRequest.update({
        where: { id: requestId },
        data: {
          status,
          reviewedBy: payload.reviewedBy,
          reviewedAt: payload.reviewedAt,
          rejectionReason: payload.rejectionReason,
        },
        select: APPROVAL_REQUEST_SELECT,
      });
    } catch (error) {
      if (!this._isMissingReviewColumnError(error)) {
        throw error;
      }

      return dbClient.approvalRequest.update({
        where: { id: requestId },
        data: { status },
        select: LEGACY_APPROVAL_REQUEST_SELECT,
      });
    }
  }

  async findPendingRequestByDoctorAndDate(doctorId, date, dbClient = this.prisma) {
    return dbClient.approvalRequest.findFirst({
      where: {
        doctorId,
        date,
        type: 'SCHEDULE_EXCEPTION',
        status: 'PENDING',
      },
      orderBy: {
        createdAt: 'desc',
      },
      select: LEGACY_APPROVAL_REQUEST_SELECT,
    });
  }

  async findActiveRequestByDoctorAndDate(doctorId, date, dbClient = this.prisma) {
    return dbClient.approvalRequest.findFirst({
      where: {
        doctorId,
        date,
        type: 'SCHEDULE_EXCEPTION',
        status: {
          in: ['PENDING', 'APPROVED'],
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      select: LEGACY_APPROVAL_REQUEST_SELECT,
    });
  }

  _buildWhereClause(filters) {
    const where = {};

    if (filters.type) {
      where.type = filters.type;
    }

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.doctorId) {
      where.doctorId = filters.doctorId;
    }

    if (filters.date) {
      where.date = filters.date;
    }

    return where;
  }

  _isMissingReviewColumnError(error) {
    const message = String(error?.message || '');
    return error?.code === 'P2022'
      || message.includes('reviewedBy')
      || message.includes('reviewedAt')
      || message.includes('rejectionReason');
  }
}

module.exports = new ApprovalRequestRepository();
