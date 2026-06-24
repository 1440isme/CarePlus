const prisma = require('../../infrastructure/database/prisma.client');

const CLINIC_INFO_SINGLETON_KEY = 'CLINIC_INFO';
const SYSTEM_SETTING_SINGLETON_KEY = 'SYSTEM_SETTING';

const publicClinicInfoSelect = {
  id: true,
  name: true,
  address: true,
  hotline: true,
  email: true,
  workingHours: true,
  description: true,
};

const adminClinicInfoSelect = {
  ...publicClinicInfoSelect,
  createdAt: true,
  updatedAt: true,
};

const systemSettingSelect = {
  maxBookingDaysAhead: true,
  slotDurationMinutes: true,
  cancelBeforeHours: true,
  maxNoShowBeforeLock: true,
  maxActiveAppointmentsPerUser: true,
  morningShiftStart: true,
  morningShiftEnd: true,
  afternoonShiftStart: true,
  afternoonShiftEnd: true,
};

class ClinicSettingsRepository {
  async getClinicInfo() {
    return prisma.clinicInfo.findUnique({
      where: {
        singletonKey: CLINIC_INFO_SINGLETON_KEY,
      },
      select: publicClinicInfoSelect,
    });
  }

  async upsertClinicInfo(data) {
    return prisma.clinicInfo.upsert({
      where: {
        singletonKey: CLINIC_INFO_SINGLETON_KEY,
      },
      update: data,
      create: {
        singletonKey: CLINIC_INFO_SINGLETON_KEY,
        ...data,
      },
      select: adminClinicInfoSelect,
    });
  }

  async getSystemSetting() {
    return prisma.systemSetting.findUnique({
      where: {
        singletonKey: SYSTEM_SETTING_SINGLETON_KEY,
      },
      select: systemSettingSelect,
    });
  }

  async upsertSystemSetting(data) {
    return prisma.systemSetting.upsert({
      where: {
        singletonKey: SYSTEM_SETTING_SINGLETON_KEY,
      },
      update: data,
      create: {
        singletonKey: SYSTEM_SETTING_SINGLETON_KEY,
        ...data,
      },
      select: systemSettingSelect,
    });
  }
}

module.exports = new ClinicSettingsRepository();
