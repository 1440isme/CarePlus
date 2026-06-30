function toPatientProfileDto(profile) {
  if (!profile) {
    return null;
  }

  return {
    id: profile.id,
    fullName: profile.fullName,
    phone: profile.phone,
    gender: profile.gender,
    dateOfBirth: profile.dateOfBirth,
    address: profile.address,
    relationship: profile.relationship,
    isActive: profile.isActive,
    isDefault: profile.isDefault,
    createdAt: profile.createdAt,
    updatedAt: profile.updatedAt,
  };
}

function toPatientProfileListDto(profiles) {
  return profiles.map(toPatientProfileDto);
}

module.exports = {
  toPatientProfileDto,
  toPatientProfileListDto,
};
