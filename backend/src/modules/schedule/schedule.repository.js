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
    return dbClient.schedule.findFirst({
      where: {
        doctorId,
        workingDate,
      },
      include: SCHEDULE_INCLUDE,
      orderBy: [
        { workingShift: 'asc' },
        { createdAt: 'asc' },
      ],
    });
  }

  async findByDoctorDateAndShift(doctorId, workingDate, workingShift, dbClient = this.prisma) {
    return dbClient.schedule.findUnique({
      where: {
        doctorId_workingDate_workingShift: {
          doctorId,
          workingDate,
          workingShift,
        },
      },
      include: SCHEDULE_INCLUDE,
    });
  }

  async findSchedulesByDoctorAndDate(doctorId, workingDate, dbClient = this.prisma) {
    return dbClient.schedule.findMany({
      where: {
        doctorId,
        workingDate,
      },
      include: SCHEDULE_INCLUDE,
      orderBy: [
        { workingShift: 'asc' },
        { createdAt: 'asc' },
      ],
    });
  }

  async createSchedule(payload, dbClient = this.prisma) {
    const {
      doctorId,
      workingDate,
      workingShift,
      morningShiftStart,
      morningShiftEnd,
      afternoonShiftStart,
      afternoonShiftEnd,
      status,
    } = payload;

    return dbClient.schedule.create({
      data: {
        doctorId,
        workingDate,
        workingShift,
        morningShiftStart,
        morningShiftEnd,
        afternoonShiftStart,
        afternoonShiftEnd,
        status,
      },
      include: SCHEDULE_INCLUDE,
    });
  }

  async findSchedulesByRange(filters) {
    const {
      doctorId,
      specialtyId,
      status,
      workingShift,
      startDate,
      endDate,
      skip = 0,
      take = 10,
    } = filters;

    return this.prisma.schedule.findMany({
      where: this._buildWhereClause({ doctorId, specialtyId, status, workingShift, startDate, endDate }),
      include: SCHEDULE_INCLUDE,
      orderBy: [
        { workingDate: 'asc' },
        { workingShift: 'asc' },
        { createdAt: 'asc' },
      ],
      skip,
      take,
    });
  }

  async countSchedulesByRange(filters) {
    const { doctorId, specialtyId, status, workingShift, startDate, endDate } = filters;
    return this.prisma.schedule.count({
      where: this._buildWhereClause({ doctorId, specialtyId, status, workingShift, startDate, endDate }),
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
    return dbClient.schedule.updateMany({
      where: {
        doctorId,
        workingDate,
      },
      data: { status },
    });
  }

  _buildWhereClause(filters) {
    const where = {};

    if (filters.doctorId) {
      where.doctorId = filters.doctorId;
    }

    if (filters.specialtyId) {
      where.doctor = {
        specialtyId: filters.specialtyId,
      };
    }

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.workingShift) {
      where.workingShift = filters.workingShift;
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
