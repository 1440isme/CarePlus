const prisma = require('../../infrastructure/database/prisma.client');

const specialtySelect = {
  id: true,
  name: true,
  slug: true,
  description: true,
  icon: true,
  doctorCount: true,
  active: true,
  createdAt: true,
  updatedAt: true,
};

function buildSpecialtyWhere(filters = {}) {
  const where = {};

  if (typeof filters.active === 'boolean') {
    where.active = filters.active;
  }

  if (filters.search) {
    where.OR = [
      {
        name: {
          contains: filters.search,
        },
      },
      {
        description: {
          contains: filters.search,
        },
      },
      {
        slug: {
          contains: filters.search,
        },
      },
    ];
  }

  return where;
}

class SpecialtyRepository {
  async findActiveSpecialties(filters = {}) {
    const specialties = await prisma.specialty.findMany({
      where: buildSpecialtyWhere({
        ...filters,
        active: true,
      }),
      orderBy: {
        name: 'asc',
      },
      skip: filters.skip,
      take: filters.take,
      select: specialtySelect,
    });

    if (specialties.length === 0) {
      return [];
    }

    const doctorCounts = await prisma.doctor.groupBy({
      by: ['specialtyId'],
      where: {
        specialtyId: {
          in: specialties.map((specialty) => specialty.id),
        },
        active: true,
      },
      _count: {
        _all: true,
      },
    });

    const doctorCountMap = new Map(
      doctorCounts.map((item) => [item.specialtyId, item._count._all]),
    );

    return specialties.map((specialty) => ({
      ...specialty,
      doctorCount: doctorCountMap.get(specialty.id) ?? 0,
    }));
  }

  async countActiveSpecialties(filters = {}) {
    return prisma.specialty.count({
      where: buildSpecialtyWhere({
        ...filters,
        active: true,
      }),
    });
  }

  async findSpecialties(filters = {}) {
    const specialties = await prisma.specialty.findMany({
      where: buildSpecialtyWhere(filters),
      orderBy: {
        name: 'asc',
      },
      skip: filters.skip,
      take: filters.take,
      select: specialtySelect,
    });

    if (specialties.length === 0) {
      return [];
    }

    const doctorCounts = await prisma.doctor.groupBy({
      by: ['specialtyId'],
      where: {
        specialtyId: {
          in: specialties.map((specialty) => specialty.id),
        },
        active: true,
      },
      _count: {
        _all: true,
      },
    });

    const doctorCountMap = new Map(
      doctorCounts.map((item) => [item.specialtyId, item._count._all]),
    );

    return specialties.map((specialty) => ({
      ...specialty,
      doctorCount: doctorCountMap.get(specialty.id) ?? 0,
    }));
  }

  async countSpecialties(filters = {}) {
    return prisma.specialty.count({
      where: buildSpecialtyWhere(filters),
    });
  }

  async findSpecialtyById(id) {
    return prisma.specialty.findUnique({
      where: { id },
      select: specialtySelect,
    });
  }

  async findSpecialtyByName(name) {
    return prisma.specialty.findFirst({
      where: {
        name,
      },
      select: specialtySelect,
    });
  }

  async findSpecialtyByNameExceptId(name, id) {
    return prisma.specialty.findFirst({
      where: {
        name,
        NOT: {
          id,
        },
      },
      select: specialtySelect,
    });
  }

  async findSpecialtyBySlug(slug) {
    return prisma.specialty.findUnique({
      where: { slug },
      select: specialtySelect,
    });
  }

  async findSpecialtyBySlugExceptId(slug, id) {
    return prisma.specialty.findFirst({
      where: {
        slug,
        NOT: {
          id,
        },
      },
      select: specialtySelect,
    });
  }

  async createSpecialty(data) {
    return prisma.specialty.create({
      data,
      select: specialtySelect,
    });
  }

  async updateSpecialty(id, data) {
    return prisma.specialty.update({
      where: { id },
      data,
      select: specialtySelect,
    });
  }

  async softDeleteSpecialty(id) {
    return prisma.specialty.update({
      where: { id },
      data: {
        active: false,
      },
      select: specialtySelect,
    });
  }

  async isSpecialtyInUse(id) {
    const doctorCount = await prisma.doctor.count({
      where: {
        specialtyId: id,
      },
    });

    return doctorCount > 0;
  }
}

module.exports = new SpecialtyRepository();
