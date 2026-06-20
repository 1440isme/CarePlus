const BaseRepository = require('../../shared/repositories/base.repository');

class ApprovalRequestRepository extends BaseRepository {
  constructor() {
    super('ApprovalRequest');
  }

  async createScheduleExceptionRequest(data, dbClient = this.prisma) {
    return dbClient.approvalRequest.create({
      data,
    });
  }

  async findRequestById(requestId, dbClient = this.prisma) {
    return dbClient.approvalRequest.findUnique({
      where: { id: requestId },
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

    return this.prisma.approvalRequest.findMany({
      where: this._buildWhereClause({ type, status, doctorId, date }),
      orderBy: {
        createdAt: 'desc',
      },
      skip,
      take,
    });
  }

  async countRequests(filters) {
    const { type, status, doctorId, date } = filters;
    return this.prisma.approvalRequest.count({
      where: this._buildWhereClause({ type, status, doctorId, date }),
    });
  }

  async updateRequestStatus(requestId, status, dbClient = this.prisma) {
    return dbClient.approvalRequest.update({
      where: { id: requestId },
      data: { status },
    });
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
}

module.exports = new ApprovalRequestRepository();
