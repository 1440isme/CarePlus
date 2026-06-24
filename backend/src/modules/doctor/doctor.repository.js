const BaseRepository = require('../../shared/repositories/base.repository');

const DOCTOR_INCLUDE = {
  user: {
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      status: true,
      emailVerified: true,
    },
  },
  specialty: {
    select: {
      id: true,
      name: true,
      slug: true,
      active: true,
    },
  },
};

class DoctorRepository extends BaseRepository {
  constructor() {
    super('Doctor');
  }

  async findDoctorByIdWithRelations(doctorId, { activeOnly = false } = {}) {
    const where = { id: doctorId };

    if (activeOnly) {
      where.active = true;
    }

    return this.prisma.doctor.findFirst({
      where,
      include: DOCTOR_INCLUDE,
    });
  }

  async findDoctorByUserId(userId, { activeOnly = false } = {}) {
    const where = { userId };

    if (activeOnly) {
      where.active = true;
    }

    return this.prisma.doctor.findFirst({
      where,
      include: DOCTOR_INCLUDE,
    });
  }

  async findDoctors(filters) {
    const {
      page,
      limit,
      specialtyId,
      active,
      search,
      sortBy,
      sortOrder,
    } = filters;

    const orderBy = [];
    if (sortBy && ['rating', 'experience', 'createdAt'].includes(sortBy)) {
      orderBy.push({
        [sortBy]: sortOrder === 'asc' ? 'asc' : 'desc'
      });
    }

    orderBy.push(
      { active: 'desc' },
      { rating: 'desc' },
      { experience: 'desc' },
      { createdAt: 'desc' }
    );

    return this.prisma.doctor.findMany({
      where: this._buildWhereClause({ specialtyId, active, search }),
      include: DOCTOR_INCLUDE,
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
    });
  }

  async countDoctors(filters) {
    const { specialtyId, active, search } = filters;
    return this.prisma.doctor.count({
      where: this._buildWhereClause({ specialtyId, active, search }),
    });
  }

  async findDoctorsByIds(ids) {
    return this.prisma.doctor.findMany({
      where: { id: { in: ids } },
      include: DOCTOR_INCLUDE,
    });
  }

  async updateDoctorProfile(doctorId, payload) {
    const { doctorData = {}, userData = {} } = payload;

    return this.prisma.doctor.update({
      where: { id: doctorId },
      data: {
        ...doctorData,
        ...(Object.keys(userData).length > 0
          ? {
              user: {
                update: userData,
              },
            }
          : {}),
      },
      include: DOCTOR_INCLUDE,
    });
  }

  async updateDoctorPrice(doctorId, price) {
    return this.prisma.doctor.update({
      where: { id: doctorId },
      data: { price },
      include: DOCTOR_INCLUDE,
    });
  }

  async updateDoctorByAdmin(doctorId, data) {
    return this.prisma.doctor.update({
      where: { id: doctorId },
      data,
      include: DOCTOR_INCLUDE,
    });
  }

  _buildWhereClause(filters) {
    const where = {};

    if (filters.specialtyId) {
      where.specialtyId = filters.specialtyId;
    }

    if (typeof filters.active === 'boolean') {
      where.active = filters.active;
    }

    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search } },
        { specialtyName: { contains: filters.search } },
        { title: { contains: filters.search } },
        { position: { contains: filters.search } },
      ];
    }

    return where;
  }
}

module.exports = new DoctorRepository();
