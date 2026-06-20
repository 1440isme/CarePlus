const BaseRepository = require('../../shared/repositories/base.repository');

const SCHEDULE_INCLUDE = {
  doctor: {
    select: {
      id: true,
      name: true,
      specialtyId: true,
      specialtyName: true,
      active: true,
    },
  },
  timeSlots: {
    orderBy: {
      startTime: 'asc',
    },
  },
};

class ScheduleRepository extends BaseRepository {
  constructor() {
    super('Schedule');
  }

  async findByDoctorAndDate(doctorId, workingDate, dbClient = this.prisma) {
    return dbClient.schedule.findUnique({
      where: {
        doctorId_workingDate: {
          doctorId,
          workingDate,
        },
      },
      include: SCHEDULE_INCLUDE,
    });
  }

  async createScheduleWithSlots(payload, dbClient = this.prisma) {
    const { doctorId, workingDate, status, slots } = payload;

    return dbClient.schedule.create({
      data: {
        doctorId,
        workingDate,
        status,
        timeSlots: {
          create: slots,
        },
      },
      include: SCHEDULE_INCLUDE,
    });
  }

  async findSchedulesByRange(filters) {
    const {
      doctorId,
      status,
      startDate,
      endDate,
      skip = 0,
      take = 10,
    } = filters;

    return this.prisma.schedule.findMany({
      where: this._buildWhereClause({ doctorId, status, startDate, endDate }),
      include: SCHEDULE_INCLUDE,
      orderBy: [
        { workingDate: 'asc' },
        { createdAt: 'asc' },
      ],
      skip,
      take,
    });
  }

  async countSchedulesByRange(filters) {
    const { doctorId, status, startDate, endDate } = filters;
    return this.prisma.schedule.count({
      where: this._buildWhereClause({ doctorId, status, startDate, endDate }),
    });
  }

  async updateScheduleStatus(scheduleId, status, dbClient = this.prisma) {
    return dbClient.schedule.update({
      where: { id: scheduleId },
      data: { status },
      include: SCHEDULE_INCLUDE,
    });
  }

  async updateScheduleStatusByDoctorAndDate(doctorId, workingDate, status, dbClient = this.prisma) {
    return dbClient.schedule.update({
      where: {
        doctorId_workingDate: {
          doctorId,
          workingDate,
        },
      },
      data: { status },
      include: SCHEDULE_INCLUDE,
    });
  }

  _buildWhereClause(filters) {
    const where = {};

    if (filters.doctorId) {
      where.doctorId = filters.doctorId;
    }

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.startDate || filters.endDate) {
      where.workingDate = {};

      if (filters.startDate) {
        where.workingDate.gte = filters.startDate;
      }

      if (filters.endDate) {
        where.workingDate.lte = filters.endDate;
      }
    }

    return where;
  }
}

module.exports = new ScheduleRepository();
