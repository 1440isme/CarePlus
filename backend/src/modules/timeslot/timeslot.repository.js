const BaseRepository = require('../../shared/repositories/base.repository');

class TimeSlotRepository extends BaseRepository {
  constructor() {
    super('TimeSlot');
  }

  async findSlotsByScheduleId(scheduleId, dbClient = this.prisma) {
    return dbClient.timeSlot.findMany({
      where: { scheduleId },
      orderBy: {
        startTime: 'asc',
      },
    });
  }

  async findSlotsByDoctorAndDate(filters, dbClient = this.prisma) {
    const { doctorId, workingDate } = filters;

    return dbClient.timeSlot.findMany({
      where: {
        schedule: {
          doctorId,
          workingDate,
        },
      },
      include: {
        schedule: true,
      },
      orderBy: {
        startTime: 'asc',
      },
    });
  }

  async bulkCreateSlots(scheduleId, slots, dbClient = this.prisma) {
    return dbClient.timeSlot.createMany({
      data: slots.map((slot) => ({
        scheduleId,
        startTime: slot.startTime,
        endTime: slot.endTime,
        status: slot.status,
      })),
    });
  }

  async bulkDeleteSlots(slotIds, dbClient = this.prisma) {
    return dbClient.timeSlot.deleteMany({
      where: {
        id: { in: slotIds },
      },
    });
  }

  async bulkLockSlots(slotIds, dbClient = this.prisma) {
    return dbClient.timeSlot.updateMany({
      where: {
        id: { in: slotIds },
        status: 'AVAILABLE',
      },
      data: {
        status: 'LOCKED',
      },
    });
  }

  async bulkUnlockSlots(slotIds, dbClient = this.prisma) {
    return dbClient.timeSlot.updateMany({
      where: {
        id: { in: slotIds },
        status: 'LOCKED',
      },
      data: {
        status: 'AVAILABLE',
      },
    });
  }
}

module.exports = new TimeSlotRepository();
