const prisma = require('../infrastructure/database/prisma.client');
const elasticClient = require('../infrastructure/search/elastic.client');
const SearchService = require('../modules/search/search.service');

const USER_SELECT = {
  id: true,
  name: true,
  email: true,
  phone: true,
  role: true,
  status: true,
  emailVerified: true,
  noShowCount: true,
  createdAt: true,
  updatedAt: true,
};

const SPECIALTY_SELECT = {
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

async function ensureIndex(index) {
  const exists = await elasticClient.indices.exists({ index });

  if (!exists) {
    await elasticClient.indices.create({ index });
  }
}

function buildUserBulkOperations(users) {
  return users.flatMap((user) => ([
    {
      index: {
        _index: SearchService.getResolvedIndexName('users'),
        _id: user.id,
      },
    },
    {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      status: user.status,
      emailVerified: user.emailVerified,
      noShowCount: user.noShowCount ?? 0,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    },
  ]));
}

function buildSpecialtyBulkOperations(specialties) {
  return specialties.flatMap((specialty) => ([
    {
      index: {
        _index: SearchService.getResolvedIndexName('specialties'),
        _id: specialty.id,
      },
    },
    {
      id: specialty.id,
      name: specialty.name,
      slug: specialty.slug,
      description: specialty.description,
      icon: specialty.icon,
      doctorCount: specialty.doctorCount ?? 0,
      active: specialty.active,
      createdAt: specialty.createdAt,
      updatedAt: specialty.updatedAt,
    },
  ]));
}

async function reindexDev1Search() {
  if (!SearchService.isEnabled()) {
    throw new Error('Elasticsearch integration is disabled by ELASTICSEARCH_ENABLED=false.');
  }

  console.log('[reindex-dev1-search] Starting reindex for users and specialties...');

  await elasticClient.ping();

  const userIndex = SearchService.getResolvedIndexName('users');
  const specialtyIndex = SearchService.getResolvedIndexName('specialties');

  await ensureIndex(userIndex);
  await ensureIndex(specialtyIndex);

  const [users, specialties] = await Promise.all([
    prisma.user.findMany({
      select: USER_SELECT,
      orderBy: {
        createdAt: 'desc',
      },
    }),
    prisma.specialty.findMany({
      select: SPECIALTY_SELECT,
      orderBy: {
        name: 'asc',
      },
    }),
  ]);

  const userOperations = buildUserBulkOperations(users);
  if (userOperations.length > 0) {
    await elasticClient.bulk({
      refresh: true,
      operations: userOperations,
    });
  }

  const specialtyOperations = buildSpecialtyBulkOperations(specialties);
  if (specialtyOperations.length > 0) {
    await elasticClient.bulk({
      refresh: true,
      operations: specialtyOperations,
    });
  }

  console.log('[reindex-dev1-search] Completed successfully.', {
    users: users.length,
    specialties: specialties.length,
    indices: [userIndex, specialtyIndex],
  });
}

reindexDev1Search()
  .catch((error) => {
    console.error('[reindex-dev1-search] Failed.', {
      message: error.message,
    });
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
