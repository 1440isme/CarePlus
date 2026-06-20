const prisma = require('../../infrastructure/database/prisma.client');

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
  morningShiftStart: true,
  morningShiftEnd: true,
  afternoonShiftStart: true,
  afternoonShiftEnd: true,
};

class ClinicSettingsRepository {
  async getClinicInfo() {
    return prisma.clinicInfo.findFirst({
      orderBy: {
        createdAt: 'asc',
      },
      select: publicClinicInfoSelect,
    });
  }

  async upsertClinicInfo(data) {
    const existingRecord = await prisma.clinicInfo.findFirst({
      orderBy: {
        createdAt: 'asc',
      },
      select: {
        id: true,
      },
    });

    if (existingRecord) {
      return prisma.clinicInfo.update({
        where: {
          id: existingRecord.id,
        },
        data,
        select: adminClinicInfoSelect,
      });
    }

    return prisma.clinicInfo.create({
      data,
      select: adminClinicInfoSelect,
    });
  }

  async getSystemSetting() {
    return prisma.systemSetting.findFirst({
      orderBy: {
        createdAt: 'asc',
      },
      select: systemSettingSelect,
    });
  }

  async upsertSystemSetting(data) {
    const existingRecord = await prisma.systemSetting.findFirst({
      orderBy: {
        createdAt: 'asc',
      },
      select: {
        id: true,
      },
    });

    if (existingRecord) {
      return prisma.systemSetting.update({
        where: {
          id: existingRecord.id,
        },
        data,
        select: systemSettingSelect,
      });
    }

    return prisma.systemSetting.create({
      data,
      select: systemSettingSelect,
    });
  }
}

module.exports = new ClinicSettingsRepository();
