function toUserDto(user) {
  if (!user) {
    return null;
  }

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
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
