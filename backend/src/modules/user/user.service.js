const UserRepository = require('./user.repository');
const { toUserDto, toUserListDto } = require('./user.dto');
const { USER_ERROR_CODES, USER_PAGINATION, VALID_USER_STATUSES } = require('./user.types');

class UserServiceError extends Error {
  constructor({ code, message, statusCode, details = [] }) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
  }
}

/**
 * User module service.
 * Handles self profile access and admin user management flows for Dev 1.
 */
class UserService {
  constructor(userRepository) {
    this.userRepository = userRepository;
  }

  async getMe(currentUser) {
    try {
      const user = await this._getUserOrThrow(currentUser.userId);
      return toUserDto(user);
    } catch (error) {
      if (error instanceof UserServiceError) {
        throw error;
      }

      throw new UserServiceError({
        code: USER_ERROR_CODES.GET_ME_FAILED,
        message: 'Không thể lấy thông tin người dùng hiện tại',
        statusCode: 500,
      });
    }
  }

  async updateMe(currentUser, dto) {
    try {
      await this._getUserOrThrow(currentUser.userId);

      const updateData = this._buildProfileUpdateData(dto);
      const updatedUser = await this.userRepository.updateUserProfile(currentUser.userId, updateData);

      return {
        message: 'Cập nhật thông tin cá nhân thành công',
        user: toUserDto(updatedUser),
      };
    } catch (error) {
      if (error instanceof UserServiceError) {
        throw error;
      }

      throw new UserServiceError({
        code: USER_ERROR_CODES.UPDATE_ME_FAILED,
        message: 'Không thể cập nhật thông tin cá nhân',
        statusCode: 500,
      });
    }
  }

  async listUsers(query) {
    try {
      const normalizedQuery = this._normalizeListUsersQuery(query);
      const filters = {
        skip: (normalizedQuery.page - 1) * normalizedQuery.limit,
        take: normalizedQuery.limit,
        search: normalizedQuery.search,
        role: normalizedQuery.role,
        status: normalizedQuery.status,
      };

      const [users, total] = await Promise.all([
        this.userRepository.findUsers(filters),
        this.userRepository.countUsers(filters),
      ]);

      return {
        data: toUserListDto(users),
        meta: {
          page: normalizedQuery.page,
          limit: normalizedQuery.limit,
          total,
          totalPages: Math.ceil(total / normalizedQuery.limit),
        },
      };
    } catch (error) {
      if (error instanceof UserServiceError) {
        throw error;
      }

      throw new UserServiceError({
        code: USER_ERROR_CODES.LIST_USERS_FAILED,
        message: 'Không thể lấy danh sách người dùng',
        statusCode: 500,
      });
    }
  }

  async updateUserStatus(adminUser, userId, dto) {
    try {
      const normalizedStatus = typeof dto.status === 'string' ? dto.status.trim().toUpperCase() : '';

      if (!VALID_USER_STATUSES.includes(normalizedStatus)) {
        throw new UserServiceError({
          code: USER_ERROR_CODES.INVALID_USER_STATUS,
          message: 'Trạng thái người dùng không hợp lệ',
          statusCode: 400,
        });
      }

      const targetUser = await this._getUserOrThrow(userId);

      if (adminUser.userId === userId) {
        throw new UserServiceError({
          code: USER_ERROR_CODES.CANNOT_UPDATE_OWN_STATUS,
          message: 'Không thể tự thay đổi trạng thái tài khoản của chính mình',
          statusCode: 400,
        });
      }

      if (targetUser.status === normalizedStatus) {
        return {
          message: 'Cập nhật trạng thái tài khoản thành công',
          user: toUserDto(targetUser),
        };
      }

      const updatedUser = await this.userRepository.updateUserStatus(userId, normalizedStatus);
      return {
        message: 'Cập nhật trạng thái tài khoản thành công',
        user: toUserDto(updatedUser),
      };
    } catch (error) {
      if (error instanceof UserServiceError) {
        throw error;
      }

      throw new UserServiceError({
        code: USER_ERROR_CODES.UPDATE_USER_STATUS_FAILED,
        message: 'Không thể cập nhật trạng thái người dùng',
        statusCode: 500,
      });
    }
  }

  async resetNoShowCount(adminUser, userId) {
    try {
      const targetUser = await this._getUserOrThrow(userId);

      if (adminUser.userId === userId) {
        throw new UserServiceError({
          code: USER_ERROR_CODES.CANNOT_RESET_OWN_NO_SHOW,
          message: 'Không thể tự reset số lần vắng mặt của chính mình',
          statusCode: 400,
        });
      }

      const updateData = {
        noShowCount: 0,
      };

      if (targetUser.status === 'LOCKED') {
        updateData.status = 'ACTIVE';
      }

      const updatedUser = await this.userRepository.resetNoShowCount(userId, updateData);
      const message = targetUser.status === 'LOCKED'
        ? 'Đã reset số lần vắng mặt và mở khóa tài khoản thành công'
        : 'Đã reset số lần vắng mặt thành công';

      return {
        message,
        user: toUserDto(updatedUser),
      };
    } catch (error) {
      if (error instanceof UserServiceError) {
        throw error;
      }

      throw new UserServiceError({
        code: USER_ERROR_CODES.RESET_NO_SHOW_FAILED,
        message: 'Không thể reset no-show count',
        statusCode: 500,
      });
    }
  }

  async _getUserOrThrow(userId) {
    const user = await this.userRepository.findUserById(userId);

    if (!user) {
      throw new UserServiceError({
        code: USER_ERROR_CODES.USER_NOT_FOUND,
        message: 'Không tìm thấy người dùng',
        statusCode: 404,
      });
    }

    return user;
  }

  _buildProfileUpdateData(dto) {
    const data = {};

    if (typeof dto.name === 'string') {
      data.name = dto.name.trim();
    }

    if (typeof dto.phone === 'string') {
      data.phone = dto.phone.trim();
    }

    return data;
  }

  _normalizeListUsersQuery(query) {
    const page = Number.parseInt(query.page, 10) || USER_PAGINATION.DEFAULT_PAGE;
    const rawLimit = Number.parseInt(query.limit, 10) || USER_PAGINATION.DEFAULT_LIMIT;
    const limit = Math.min(rawLimit, USER_PAGINATION.MAX_LIMIT);

    return {
      page,
      limit,
      search: typeof query.search === 'string' ? query.search.trim() : '',
      role: typeof query.role === 'string' ? query.role.trim().toUpperCase() : '',
      status: typeof query.status === 'string' ? query.status.trim().toUpperCase() : '',
    };
  }
}

module.exports = new UserService(UserRepository);
