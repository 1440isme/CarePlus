function toScheduleDto(schedule) {
  if (!schedule) {
    return null;
  }

  return {
    id: schedule.id,
    doctorId: schedule.doctorId,
    workingDate: schedule.workingDate.toISOString().slice(0, 10),
    status: schedule.status,
    createdAt: schedule.createdAt,
    updatedAt: schedule.updatedAt,
    doctor: schedule.doctor
      ? {
          id: schedule.doctor.id,
          name: schedule.doctor.name,
          specialtyId: schedule.doctor.specialtyId,
          specialtyName: schedule.doctor.specialtyName,
          active: schedule.doctor.active,
        }
      : undefined,
    timeSlots: Array.isArray(schedule.timeSlots)
      ? schedule.timeSlots.map((slot) => ({
          id: slot.id,
          scheduleId: slot.scheduleId,
          startTime: slot.startTime,
          endTime: slot.endTime,
          status: slot.status,
        }))
      : undefined,
  };
}

function toScheduleCalendarDto(schedules) {
  return schedules.map((schedule) => ({
    id: schedule.id,
    doctorId: schedule.doctorId,
    workingDate: schedule.workingDate.toISOString().slice(0, 10),
    status: schedule.status,
    totalSlots: schedule.timeSlots.length,
    availableSlots: schedule.timeSlots.filter((slot) => slot.status === 'AVAILABLE').length,
    bookedSlots: schedule.timeSlots.filter((slot) => slot.status === 'BOOKED').length,
    lockedSlots: schedule.timeSlots.filter((slot) => slot.status === 'LOCKED').length,
    expiredSlots: schedule.timeSlots.filter((slot) => slot.status === 'EXPIRED').length,
    doctor: schedule.doctor
      ? {
          id: schedule.doctor.id,
          name: schedule.doctor.name,
          specialtyName: schedule.doctor.specialtyName,
        }
      : undefined,
  }));
}

module.exports = {
  toScheduleDto,
  toScheduleCalendarDto,
};
