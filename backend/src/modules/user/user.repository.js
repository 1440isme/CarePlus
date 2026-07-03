const prisma = require('../../infrastructure/database/prisma.client');

const USER_SELECT = {
  id: true,
  name: true,
  avatarUrl: true,
  email: true,
  phone: true,
  gender: true,
  dateOfBirth: true,
  address: true,
  role: true,
  status: true,
  noShowCount: true,
  emailVerified: true,
  createdAt: true,
  updatedAt: true,
};

const USER_SELECT_WITH_PASSWORD_HASH = {
  ...USER_SELECT,
  passwordHash: true,
};

class UserRepository {
  async findUserById(userId) {
    return prisma.user.findUnique({
      where: { id: userId },
      select: USER_SELECT,
    });
  }

  async findUserByIdWithPasswordHash(userId) {
    return prisma.user.findUnique({
      where: { id: userId },
      select: USER_SELECT_WITH_PASSWORD_HASH,
    });
  }

  async findUserByEmail(email) {
    return prisma.user.findUnique({
      where: { email },
      select: USER_SELECT,
    });
  }

  async findUserByPhone(phone) {
    return prisma.user.findFirst({
      where: { phone },
      select: USER_SELECT,
    });
  }

  async findUserByPhoneExceptId(phone, userId) {
    return prisma.user.findFirst({
      where: {
        phone,
        NOT: {
          id: userId,
        },
      },
      select: USER_SELECT,
    });
  }

  async createStaffUser(data, doctorData) {
    if (!doctorData) {
      return prisma.user.create({
        data,
        select: USER_SELECT,
      });
    }

    return prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data,
        select: USER_SELECT,
      });

      await tx.doctor.create({
        data: {
          ...doctorData,
          userId: user.id,
        },
      });

      await tx.specialty.update({
        where: { id: doctorData.specialtyId },
        data: {
          doctorCount: {
            increment: 1,
          },
        },
      });

      return user;
    });
  }

  async findUsers(filters) {
    const {
      skip,
      take,
      search,
      role,
      status,
      createdFrom,
      createdTo,
    } = filters;

    return prisma.user.findMany({
      where: this._buildWhereClause({ search, role, status, createdFrom, createdTo }),
      select: USER_SELECT,
      orderBy: {
        createdAt: 'desc',
      },
      skip,
      take,
    });
  }

  async findUsersByIds(userIds) {
    if (!Array.isArray(userIds) || userIds.length === 0) {
      return [];
    }

    return prisma.user.findMany({
      where: {
        id: {
          in: userIds,
        },
      },
      select: USER_SELECT,
    });
  }

  async countUsers(filters) {
    const {
      search,
      role,
      status,
      createdFrom,
      createdTo,
    } = filters;

    return prisma.user.count({
      where: this._buildWhereClause({ search, role, status, createdFrom, createdTo }),
    });
  }

  async updateUserProfile(userId, data) {
    return prisma.user.update({
      where: { id: userId },
      data,
      select: USER_SELECT,
    });
  }

  async updateUserAvatar(userId, avatarUrl) {
    return prisma.user.update({
      where: { id: userId },
      data: { avatarUrl },
      select: USER_SELECT,
    });
  }

  async updateUserPasswordHash(userId, passwordHash) {
    return prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
      select: USER_SELECT,
    });
  }

  async updateUserStatus(userId, status) {
    return prisma.user.update({
      where: { id: userId },
      data: { status },
      select: USER_SELECT,
    });
  }

  async resetNoShowCount(userId, updateData = { noShowCount: 0 }) {
    return prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: USER_SELECT,
    });
  }

  _buildWhereClause(filters) {
    const where = {};

    if (filters.search) {
      const normalizedSearch = filters.search.trim();

      where.OR = [
        {
          name: {
            contains: normalizedSearch,
          },
        },
        {
          email: {
            contains: normalizedSearch,
          },
        },
        {
          phone: {
            contains: normalizedSearch,
          },
        },
      ];
    }

    if (filters.role) {
      where.role = filters.role;
    }

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.createdFrom || filters.createdTo) {
      where.createdAt = {};

      if (filters.createdFrom) {
        where.createdAt.gte = filters.createdFrom;
      }

      if (filters.createdTo) {
        where.createdAt.lte = filters.createdTo;
      }
    }

    return where;
  }
}

module.exports = new UserRepository();
