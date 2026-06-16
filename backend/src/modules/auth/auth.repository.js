const prisma = require('../../infrastructure/database/prisma.client');

class AuthRepository {
  async findUserByEmail(email) {
    return prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        status: true,
        noShowCount: true,
        emailVerified: true,
        passwordHash: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async findUserById(id) {
    return prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        status: true,
        noShowCount: true,
        emailVerified: true,
        passwordHash: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async createPatientUser(data) {
    return prisma.user.create({
      data,
      select: {
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
      },
    });
  }

  async updateUserEmailVerified(userId, emailVerified) {
    return prisma.user.update({
      where: { id: userId },
      data: { emailVerified },
      select: {
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
      },
    });
  }

  async updateUserPasswordHash(userId, passwordHash) {
    return prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });
  }

  async deleteUserById(userId) {
    return prisma.user.delete({
      where: { id: userId },
    });
  }
}

module.exports = new AuthRepository();
