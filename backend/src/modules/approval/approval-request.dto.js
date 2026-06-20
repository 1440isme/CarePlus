function toApprovalRequestDto(request) {
  if (!request) {
    return null;
  }

  return {
    id: request.id,
    type: request.type,
    doctorId: request.doctorId,
    doctorName: request.doctorName,
    date: request.date ? request.date.toISOString().slice(0, 10) : null,
    exceptionType: request.exceptionType,
    shift: request.shift,
    startTime: request.startTime,
    endTime: request.endTime,
    reason: request.reason,
    appointmentCode: request.appointmentCode,
    status: request.status,
    createdAt: request.createdAt,
    updatedAt: request.updatedAt,
  };
}

module.exports = {
  toApprovalRequestDto,
};
