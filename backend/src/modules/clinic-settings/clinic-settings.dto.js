function toClinicInfoDto(clinicInfo) {
  if (!clinicInfo) {
    return null;
  }

  return {
    name: clinicInfo.name,
    address: clinicInfo.address,
    hotline: clinicInfo.hotline,
    email: clinicInfo.email,
    workingHours: clinicInfo.workingHours,
    description: clinicInfo.description,
  };
}

function toAdminClinicInfoDto(clinicInfo) {
  if (!clinicInfo) {
    return null;
  }

  return {
    id: clinicInfo.id,
    name: clinicInfo.name,
    address: clinicInfo.address,
    hotline: clinicInfo.hotline,
    email: clinicInfo.email,
    workingHours: clinicInfo.workingHours,
    description: clinicInfo.description,
    createdAt: clinicInfo.createdAt,
    updatedAt: clinicInfo.updatedAt,
  };
}

function toSystemSettingDto(systemSetting) {
  if (!systemSetting) {
    return null;
  }

  return {
    maxBookingDaysAhead: systemSetting.maxBookingDaysAhead,
    slotDurationMinutes: systemSetting.slotDurationMinutes,
    cancelBeforeHours: systemSetting.cancelBeforeHours,
    maxNoShowBeforeLock: systemSetting.maxNoShowBeforeLock,
    maxActiveAppointmentsPerUser: systemSetting.maxActiveAppointmentsPerUser,
    morningShiftStart: systemSetting.morningShiftStart,
    morningShiftEnd: systemSetting.morningShiftEnd,
    afternoonShiftStart: systemSetting.afternoonShiftStart,
    afternoonShiftEnd: systemSetting.afternoonShiftEnd,
  };
}

module.exports = {
  toClinicInfoDto,
  toAdminClinicInfoDto,
  toSystemSettingDto,
};
