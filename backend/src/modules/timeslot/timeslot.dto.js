function toTimeSlotDto(slot, schedule) {
  return {
    id: slot.id,
    timeSlotId: slot.id,
    scheduleId: slot.scheduleId,
    doctorId: schedule.doctorId,
    workingDate: schedule.workingDate.toISOString().slice(0, 10),
    startTime: slot.startTime,
    endTime: slot.endTime,
    status: slot.status,
  };
}

module.exports = {
  toTimeSlotDto,
};
