const prisma = require('../../infrastructure/database/prisma.client');

const PATIENT_PROFILE_SELECT = {
  id: true,
  userId: true,
  fullName: true,
  phone: true,
  email: true,
  gender: true,
  dateOfBirth: true,
  address: true,
  relationship: true,
  isDefault: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
};

class PatientProfileRepository {
  async findProfilesByUserId(userId, filters) {
    const { skip, take, search } = filters;

    return prisma.patientProfile.findMany({
      where: this._buildWhereClause({ userId, search }),
      select: PATIENT_PROFILE_SELECT,
      orderBy: {
        createdAt: 'desc',
      },
      skip,
      take,
    });
  }

  async countProfilesByUserId(userId, filters) {
    const { search } = filters;

    return prisma.patientProfile.count({
      where: this._buildWhereClause({ userId, search }),
    });
  }

  async findProfileById(profileId) {
    return prisma.patientProfile.findUnique({
      where: { id: profileId },
      select: PATIENT_PROFILE_SELECT,
    });
  }

  async findProfileByIdAndUserId(profileId, userId) {
    return prisma.patientProfile.findFirst({
      where: {
        id: profileId,
        userId,
      },
      select: PATIENT_PROFILE_SELECT,
    });
  }

  async createProfile(data) {
    return prisma.patientProfile.create({
      data,
      select: PATIENT_PROFILE_SELECT,
    });
  }

  async updateProfile(profileId, data) {
    return prisma.patientProfile.update({
      where: { id: profileId },
      data,
      select: PATIENT_PROFILE_SELECT,
    });
  }

  async softDeleteProfile(profileId) {
    return prisma.patientProfile.update({
      where: { id: profileId },
      data: {
        isActive: false,
      },
      select: PATIENT_PROFILE_SELECT,
    });
  }

  async setDefaultProfile(userId, profileId) {
    return prisma.$transaction(async (tx) => {
      await tx.patientProfile.updateMany({
        where: {
          userId,
          isActive: true,
        },
        data: {
          isDefault: false,
        },
      });

      return tx.patientProfile.update({
        where: {
          id: profileId,
        },
        data: {
          isDefault: true,
        },
        select: PATIENT_PROFILE_SELECT,
      });
    });
  }

  async hasActiveAppointment(profileId) {
    const totalBlockingAppointments = await prisma.appointment.count({
      where: {
        patientProfileId: profileId,
        status: {
          in: ['CONFIRMED', 'CHECKED_IN'],
        },
      },
    });

    return totalBlockingAppointments > 0;
  }

  _buildWhereClause({ userId, search }) {
    const where = {
      userId,
      isActive: true,
    };

    if (search) {
      where.OR = [
        {
          fullName: {
            contains: search,
          },
        },
        {
          phone: {
            contains: search,
          },
        },
        {
          email: {
            contains: search,
          },
        },
      ];
    }

    return where;
  }
}

module.exports = new PatientProfileRepository();
