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
}

module.exports = new AppointmentRepository();
