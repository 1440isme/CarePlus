function toAdminSpecialtyDto(specialty) {
  if (!specialty) {
    return null;
  }

  return {
    id: specialty.id,
    name: specialty.name,
    slug: specialty.slug,
    description: specialty.description,
    icon: specialty.icon,
    doctorCount: specialty.doctorCount,
    active: specialty.active,
    createdAt: specialty.createdAt,
    updatedAt: specialty.updatedAt,
  };
}

function toSpecialtyDto(specialty) {
  return toAdminSpecialtyDto(specialty);
}

function toPublicSpecialtyDto(specialty) {
  if (!specialty) {
    return null;
  }

  return {
    id: specialty.id,
    name: specialty.name,
    slug: specialty.slug,
    description: specialty.description,
    icon: specialty.icon,
    doctorCount: specialty.doctorCount,
  };
}

function toSpecialtyListDto(specialties, { includeTimestamps = false } = {}) {
  return specialties.map((specialty) => (
    includeTimestamps ? toSpecialtyDto(specialty) : toPublicSpecialtyDto(specialty)
  ));
}

module.exports = {
  toAdminSpecialtyDto,
  toSpecialtyDto,
  toPublicSpecialtyDto,
  toSpecialtyListDto,
};
