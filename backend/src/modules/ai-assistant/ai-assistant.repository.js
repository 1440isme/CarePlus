const prisma = require('../../infrastructure/database/prisma.client');

const clinicInfoSelect = {
  name: true,
  address: true,
  hotline: true,
  email: true,
  workingHours: true,
  description: true,
};

const bookingRulesSelect = {
  maxBookingDaysAhead: true,
  slotDurationMinutes: true,
  cancelBeforeHours: true,
  morningShiftStart: true,
  morningShiftEnd: true,
  afternoonShiftStart: true,
  afternoonShiftEnd: true,
};

function buildSearchTerms(query) {
  const trimmed = typeof query === 'string' ? query.trim() : '';

  if (!trimmed) {
    return [];
  }

  const tokens = trimmed
    .split(/\s+/)
    .map((token) => token.trim())
    .filter((token) => token.length >= 2);

  return Array.from(new Set([trimmed, ...tokens])).slice(0, 6);
}

function buildContainsOr(fields, terms) {
  if (!Array.isArray(terms) || terms.length === 0) {
    return undefined;
  }

  return terms.flatMap((term) => fields.map((field) => ({
    [field]: {
      contains: term,
    },
  })));
}

class AIAssistantRepository {
  async getClinicInfo() {
    return prisma.clinicInfo.findFirst({
      select: clinicInfoSelect,
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async getBookingRules() {
    return prisma.systemSetting.findFirst({
      select: bookingRulesSelect,
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findRelevantSpecialties(query, limit) {
    const terms = buildSearchTerms(query);
    const searchOr = buildContainsOr(['name', 'description', 'slug'], terms);

    return prisma.specialty.findMany({
      where: {
        active: true,
        ...(searchOr ? { OR: searchOr } : {}),
      },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        icon: true,
        doctorCount: true,
      },
      orderBy: [
        { doctorCount: 'desc' },
        { name: 'asc' },
      ],
      take: limit,
    });
  }

  async findRelevantDoctors(query, limit) {
    const terms = buildSearchTerms(query);
    const searchOr = buildContainsOr(
      ['name', 'title', 'specialtyName', 'position', 'description'],
      terms,
    );

    return prisma.doctor.findMany({
      where: {
        active: true,
        ...(searchOr ? { OR: searchOr } : {}),
      },
      select: {
        id: true,
        name: true,
        title: true,
        specialtyName: true,
        experience: true,
        price: true,
        avatar: true,
        description: true,
        position: true,
        active: true,
      },
      orderBy: [
        { rating: 'desc' },
        { experience: 'desc' },
        { name: 'asc' },
      ],
      take: limit,
    });
  }

  async findRelevantBlogs(query, limit) {
    const terms = buildSearchTerms(query);
    const searchOr = buildContainsOr(['title', 'summary', 'content', 'tags', 'slug'], terms);

    return prisma.blogPost.findMany({
      where: {
        status: 'PUBLISHED',
        ...(searchOr ? { OR: searchOr } : {}),
      },
      select: {
        id: true,
        title: true,
        slug: true,
        summary: true,
        content: true,
        tags: true,
        createdAt: true,
        author: {
          select: {
            name: true,
          },
        },
      },
      orderBy: [
        { createdAt: 'desc' },
      ],
      take: limit,
    });
  }
}

module.exports = new AIAssistantRepository();
