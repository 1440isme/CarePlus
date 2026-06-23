function formatDateOfBirth(dateOfBirth) {
  if (!dateOfBirth) {
    return null;
  }
  const parsedDate = new Date(dateOfBirth);
  if (Number.isNaN(parsedDate.getTime())) {
    return null;
  }
  const day = String(parsedDate.getUTCDate()).padStart(2, '0');
  const month = String(parsedDate.getUTCMonth() + 1).padStart(2, '0');
  const year = parsedDate.getUTCFullYear();
  return `${day}/${month}/${year}`;
}

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
      gender: appointment.patient.gender,
      dateOfBirth: formatDateOfBirth(appointment.patient.dateOfBirth),
      address: appointment.patient.address,
    };
  } else if (appointment.patientName) {
    dto.patient = {
      id: null,
      name: appointment.patientName,
      email: appointment.patientEmail || null,
      phone: appointment.patientPhone || null,
      gender: appointment.patientGender || null,
      dateOfBirth: formatDateOfBirth(appointment.patientDob),
      address: appointment.patientAddress || null,
    };
  }

  if (appointment.patientProfile) {
    dto.patientProfile = {
      id: appointment.patientProfile.id,
      fullName: appointment.patientProfile.fullName,
      phone: appointment.patientProfile.phone,
      email: appointment.patientProfile.email,
      relationship: appointment.patientProfile.relationship,
      dateOfBirth: formatDateOfBirth(appointment.patientProfile.dateOfBirth),
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
    || appointment.patientName
    || 'Bệnh nhân';

  // Generate friendly patient/relative date of birth
  dto.patientDob = formatDateOfBirth(appointment.patientProfile?.dateOfBirth)
    || formatDateOfBirth(appointment.patient?.dateOfBirth)
    || formatDateOfBirth(appointment.patientDob)
    || null;

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
