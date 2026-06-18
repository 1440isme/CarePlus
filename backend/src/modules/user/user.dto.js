function formatDateOfBirth(dateOfBirth) {
  if (!dateOfBirth) {
    return null;
  }

  const parsedDate = new Date(dateOfBirth);

  if (Number.isNaN(parsedDate.getTime())) {
    return null;
  }

  const day = String(parsedDate.getUTCDate()).padStart(2, '0');
  const month = String(parsedDate.getUTCMonth() + 1).padStart(2, '0');
  const year = parsedDate.getUTCFullYear();

  return `${day}/${month}/${year}`;
}

function toUserDto(user) {
  if (!user) {
    return null;
  }

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    gender: user.gender,
    dateOfBirth: formatDateOfBirth(user.dateOfBirth),
    address: user.address,
    role: user.role,
    status: user.status,
    noShowCount: user.noShowCount,
    emailVerified: user.emailVerified,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

function toUserListDto(users) {
  return users.map(toUserDto);
}

module.exports = {
  toUserDto,
  toUserListDto,
};
