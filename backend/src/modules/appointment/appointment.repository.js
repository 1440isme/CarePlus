const BaseRepository = require('../../shared/repositories/base.repository');

class AppointmentRepository extends BaseRepository {
  constructor() {
    super('Appointment');
  }

  async findDoctorAppointmentsByDate(doctorId, appointmentDate) {
    const appointments = await this.prisma.appointment.findMany({
      where: {
        doctorId,
        appointmentDate,
      },
      orderBy: {
        startTime: 'asc',
      },
      select: {
        id: true,
        code: true,
        doctorId: true,
        scheduleId: true,
        timeSlotId: true,
        appointmentDate: true,
        startTime: true,
        endTime: true,
        status: true,
        bookingChannel: true,
        relativeName: true,
        patient: {
          select: {
            name: true,
          },
        },
        patientProfile: {
          select: {
            fullName: true,
          },
        },
      },
    });

    return appointments.map((appointment) => ({
      ...appointment,
      patientName: appointment.patientProfile?.fullName
        || appointment.relativeName
        || appointment.patient?.name
        || 'Bệnh nhân',
    }));
  }

  async findActiveAppointmentOnDate(patientId, patientProfileId, date) {
    return this.prisma.appointment.findFirst({
      where: {
        patientId,
        patientProfileId: patientProfileId || null,
        appointmentDate: date,
        status: {
          in: ['CONFIRMED', 'CHECKED_IN'],
        },
      },
    });
  }

  async findActiveAppointmentWithDoctor(patientId, patientProfileId, doctorId) {
    return this.prisma.appointment.findFirst({
      where: {
        patientId,
        patientProfileId: patientProfileId || null,
        doctorId,
        status: {
          in: ['CONFIRMED', 'CHECKED_IN'],
        },
      },
    });
  }

  async findDoctorByUserId(userId) {
    return this.prisma.doctor.findUnique({
      where: { userId },
      select: {
        id: true,
        userId: true,
      },
    });
  }

  async findDoctorAppointments(filters) {
    const { where, skip, take } = filters;

    return this.prisma.appointment.findMany({
      where,
      include: {
        doctor: true,
        specialty: true,
        patient: true,
        patientProfile: true,
        timeSlot: true,
      },
      orderBy: [
        { appointmentDate: 'desc' },
        { startTime: 'desc' },
      ],
      skip,
      take,
    });
  }

  async countDoctorAppointments(where) {
    return this.prisma.appointment.count({ where });
  }

  async findAppointmentByIdWithRelations(id) {
    return this.prisma.appointment.findUnique({
      where: { id },
      include: {
        patient: true,
        patientProfile: true,
        doctor: true,
        specialty: true,
        timeSlot: true,
      },
    });
  }

  async findTimeSlotByIdWithSchedule(timeSlotId) {
    return this.prisma.timeSlot.findUnique({
      where: { id: timeSlotId },
      include: {
        schedule: {
          include: {
            doctor: true,
          },
        },
      },
    });
  }

  async findWorkingScheduleForSlotSelection(filters) {
    const { doctorId, workingDate, workingShift, allDayShift } = filters;

    return this.prisma.schedule.findFirst({
      where: {
        doctorId,
        workingDate,
        status: 'WORKING',
        OR: [
          { workingShift },
          { workingShift: allDayShift },
        ],
      },
      include: {
        doctor: true,
      },
      orderBy: [
        { workingShift: 'asc' },
        { createdAt: 'asc' },
      ],
    });
  }

  async findTimeSlotByDoctorDateAndTime(filters) {
    const { doctorId, workingDate, startTime, endTime } = filters;

    return this.prisma.timeSlot.findFirst({
      where: {
        schedule: {
          doctorId,
          workingDate,
        },
        startTime,
        endTime,
      },
      include: {
        schedule: {
          include: {
            doctor: true,
          },
        },
      },
    });
  }

  async createAvailableTimeSlot(data) {
    return this.prisma.timeSlot.create({
      data: {
        scheduleId: data.scheduleId,
        workingShift: data.workingShift,
        startTime: data.startTime,
        endTime: data.endTime,
        status: 'AVAILABLE',
      },
      include: {
        schedule: {
          include: {
            doctor: true,
          },
        },
      },
    });
  }

  async createAppointmentWithTransaction(data) {
    return this.prisma.$transaction(async (tx) => {
      // 1. Lock and check TimeSlot
      const timeSlot = await tx.timeSlot.findUnique({
        where: { id: data.timeSlotId },
      });

      if (!timeSlot) {
        const error = new Error('TimeSlot not found');
        error.code = 'SLOT_NOT_FOUND';
        throw error;
      }

      if (timeSlot.status !== 'AVAILABLE') {
        const error = new Error('TimeSlot is not available');
        error.code = 'SLOT_NOT_AVAILABLE';
        throw error;
      }

      // 2. Update TimeSlot to BOOKED
      await tx.timeSlot.update({
        where: { id: data.timeSlotId },
        data: { status: 'BOOKED' },
      });

      // 3. Create Appointment
      const appointment = await tx.appointment.create({
        data: {
          code: data.code,
          patientId: data.patientId,
          patientProfileId: data.patientProfileId || null,
          doctorId: data.doctorId,
          specialtyId: data.specialtyId,
          scheduleId: data.scheduleId,
          timeSlotId: data.timeSlotId,
          appointmentDate: data.appointmentDate,
          startTime: data.startTime,
          endTime: data.endTime,
          status: data.status || 'CONFIRMED',
          bookingChannel: data.bookingChannel,
          bookingSource: data.bookingSource,
          createdBy: data.createdBy,
          forSelf: data.forSelf,
          relativeName: data.relativeName || null,
          consultationFee: data.consultationFee,
          patientEmail: data.patientEmail,
          reason: data.reason || null,
          note: data.note || null,
        },
        include: {
          patient: true,
          patientProfile: true,
          doctor: true,
          specialty: true,
          timeSlot: true,
        },
      });

      return appointment;
    });
  }

  async updateStatusWithTransaction(appointment, newStatus, payload) {
    return this.prisma.$transaction(async (tx) => {
      // Update appointment status
      const updatedAppointment = await tx.appointment.update({
        where: { id: appointment.id },
        data: {
          status: newStatus,
          reason: payload.reason !== undefined ? payload.reason : appointment.reason,
          note: payload.note !== undefined ? payload.note : appointment.note,
        },
        include: {
          patient: true,
          patientProfile: true,
          doctor: true,
          specialty: true,
          timeSlot: true,
        },
      });

      // Release TimeSlot if cancelled or no-show
      if (newStatus === 'CANCELLED' || newStatus === 'NO_SHOW') {
        await tx.timeSlot.update({
          where: { id: appointment.timeSlotId },
          data: { status: 'AVAILABLE' },
        });
      }

      // Handle No-Show count and potential User locking
      let userLocked = false;
      if (newStatus === 'NO_SHOW') {
        const user = await tx.user.findUnique({
          where: { id: appointment.patientId },
        });

        if (user) {
          const newNoShowCount = user.noShowCount + 1;
          const maxNoShow = payload.maxNoShow || 3;
          const status = newNoShowCount >= maxNoShow ? 'LOCKED' : user.status;
          userLocked = newNoShowCount >= maxNoShow;

          await tx.user.update({
            where: { id: appointment.patientId },
            data: {
              noShowCount: newNoShowCount,
              status,
            },
          });
        }
      }

      return { appointment: updatedAppointment, userLocked };
    });
  }
}

module.exports = new AppointmentRepository();
