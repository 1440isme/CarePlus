function toAppointmentDto(appointment) {
  if (!appointment) {
    return null;
  }

  const dto = {
    id: appointment.id,
    code: appointment.code,
    patientId: appointment.patientId,
    patientProfileId: appointment.patientProfileId,
    doctorId: appointment.doctorId,
    specialtyId: appointment.specialtyId,
    scheduleId: appointment.scheduleId,
    timeSlotId: appointment.timeSlotId,
    appointmentDate: appointment.appointmentDate ? appointment.appointmentDate.toISOString().slice(0, 10) : null,
    startTime: appointment.startTime,
    endTime: appointment.endTime,
    status: appointment.status,
    bookingChannel: appointment.bookingChannel,
    bookingSource: appointment.bookingSource,
    createdBy: appointment.createdBy,
    forSelf: appointment.forSelf,
    relativeName: appointment.relativeName,
    consultationFee: appointment.consultationFee,
    patientEmail: appointment.patientEmail,
    reason: appointment.reason,
    note: appointment.note,
    createdAt: appointment.createdAt,
    updatedAt: appointment.updatedAt,
  };

  // Map relations if they exist
  if (appointment.patient) {
    dto.patient = {
      id: appointment.patient.id,
      name: appointment.patient.name,
      email: appointment.patient.email,
      phone: appointment.patient.phone,
    };
  }

  if (appointment.patientProfile) {
    dto.patientProfile = {
      id: appointment.patientProfile.id,
      fullName: appointment.patientProfile.fullName,
      phone: appointment.patientProfile.phone,
      email: appointment.patientProfile.email,
      relationship: appointment.patientProfile.relationship,
    };
  }

  if (appointment.doctor) {
    dto.doctor = {
      id: appointment.doctor.id,
      name: appointment.doctor.name,
      title: appointment.doctor.title,
      price: appointment.doctor.price,
      avatar: appointment.doctor.avatar,
    };
  }

  if (appointment.specialty) {
    dto.specialty = {
      id: appointment.specialty.id,
      name: appointment.specialty.name,
      slug: appointment.specialty.slug,
    };
  }

  // Generate friendly patient/relative name
  dto.patientName = appointment.patientProfile?.fullName 
    || appointment.relativeName 
    || appointment.patient?.name 
    || 'Bệnh nhân';

  return dto;
}

function toAppointmentListDto(appointments) {
  if (!Array.isArray(appointments)) {
    return [];
  }
  return appointments.map(toAppointmentDto);
}

module.exports = {
  toAppointmentDto,
  toAppointmentListDto,
};
