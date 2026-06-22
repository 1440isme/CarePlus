function toTimeSlotDto(slot, schedule) {
  const workingShift = slot.workingShift || schedule.workingShift;

  return {
    id: slot.id,
    timeSlotId: slot.id,
    scheduleId: slot.scheduleId,
    doctorId: schedule.doctorId,
    workingDate: schedule.workingDate.toISOString().slice(0, 10),
    workingShift,
    shift: workingShift,
    startTime: slot.startTime,
    endTime: slot.endTime,
    status: slot.status,
  };
}

module.exports = {
  toTimeSlotDto,
};
