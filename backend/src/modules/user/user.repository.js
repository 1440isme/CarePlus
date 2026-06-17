const prisma = require('../../infrastructure/database/prisma.client');

const USER_SELECT = {
  id: true,
  name: true,
  email: true,
  phone: true,
  role: true,
  status: true,
  noShowCount: true,
  emailVerified: true,
  createdAt: true,
  updatedAt: true,
};

class UserRepository {
  async findUserById(userId) {
    return prisma.user.findUnique({
      where: { id: userId },
      select: USER_SELECT,
    });
  }

  async findUsers(filters) {
    const {
      skip,
      take,
      search,
      role,
      status,
    } = filters;

    return prisma.user.findMany({
      where: this._buildWhereClause({ search, role, status }),
      select: USER_SELECT,
      orderBy: {
        createdAt: 'desc',
      },
      skip,
      take,
    });
  }

  async countUsers(filters) {
    const {
      search,
      role,
      status,
    } = filters;

    return prisma.user.count({
      where: this._buildWhereClause({ search, role, status }),
    });
  }

  async updateUserProfile(userId, data) {
    return prisma.user.update({
      where: { id: userId },
      data,
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

    return where;
  }
}

module.exports = new UserRepository();
