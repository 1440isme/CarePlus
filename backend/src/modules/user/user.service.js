const bcrypt = require('bcrypt');
const UserRepository = require('./user.repository');
const SpecialtyRepository = require('../specialty/specialty.repository');
const { toUserDto, toUserListDto } = require('./user.dto');
const {
  USER_ERROR_CODES,
  USER_PAGINATION,
  VALID_USER_STATUSES,
  STAFF_CREATABLE_ROLES,
} = require('./user.types');
const { USER_ROLES } = require('../../shared/constants/roles');

class UserServiceError extends Error {
  constructor({ code, message, statusCode, details = [] }) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
  }
}

function normalizeDateOfBirth(value) {
  if (typeof value !== 'string') {
    return undefined;
  }

  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return undefined;
  }

  const ddmmyyyyMatch = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(trimmedValue);

  if (ddmmyyyyMatch) {
    const day = Number.parseInt(ddmmyyyyMatch[1], 10);
    const month = Number.parseInt(ddmmyyyyMatch[2], 10);
    const year = Number.parseInt(ddmmyyyyMatch[3], 10);

    return new Date(Date.UTC(year, month - 1, day));
  }

  return undefined;
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

  async adminUpdateUser(adminUser, userId, dto) {
    try {
      await this._getUserOrThrow(userId);

      const updateData = this._buildProfileUpdateData(dto);
      const updatedUser = await this.userRepository.updateUserProfile(userId, updateData);

      return {
        message: 'Cập nhật thông tin người dùng thành công',
        user: toUserDto(updatedUser),
      };
    } catch (error) {
      if (error instanceof UserServiceError) {
        throw error;
      }

      throw new UserServiceError({
        code: USER_ERROR_CODES.ADMIN_UPDATE_USER_FAILED,
        message: 'Không thể cập nhật thông tin người dùng',
        statusCode: 500,
      });
    }
  }

  async createStaffUser(adminUser, dto) {
    try {
      const normalizedDto = this._normalizeCreateStaffUserDto(dto);

      if (!STAFF_CREATABLE_ROLES.includes(normalizedDto.role) || normalizedDto.role === USER_ROLES.PATIENT) {
        throw new UserServiceError({
          code: USER_ERROR_CODES.INVALID_STAFF_ROLE,
          message: 'Vai trò tài khoản nhân sự không hợp lệ',
          statusCode: 400,
        });
      }

      const existingUser = await this.userRepository.findUserByEmail(normalizedDto.email);

      if (existingUser) {
        throw new UserServiceError({
          code: USER_ERROR_CODES.EMAIL_ALREADY_EXISTS,
          message: 'Email đã được sử dụng',
          statusCode: 409,
        });
      }

      const passwordHash = await bcrypt.hash(normalizedDto.password, 10);
      const doctorData = await this._buildDoctorProfileData(normalizedDto);
      const createdUser = await this.userRepository.createStaffUser({
        name: normalizedDto.name,
        email: normalizedDto.email,
        phone: normalizedDto.phone,
        passwordHash,
        role: normalizedDto.role,
        status: normalizedDto.status,
        noShowCount: 0,
        emailVerified: true,
      }, doctorData);

      return {
        message: 'Tạo tài khoản nhân sự thành công',
        user: toUserDto(createdUser),
      };
    } catch (error) {
      if (error instanceof UserServiceError) {
        throw error;
      }

      throw new UserServiceError({
        code: USER_ERROR_CODES.CREATE_STAFF_USER_FAILED,
        message: 'Không thể tạo tài khoản nhân sự',
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

  async getUserDetail(adminUser, userId) {
    try {
      const user = await this._getUserOrThrow(userId);
      return toUserDto(user);
    } catch (error) {
      if (error instanceof UserServiceError) {
        throw error;
      }

      throw new UserServiceError({
        code: USER_ERROR_CODES.GET_USER_DETAIL_FAILED,
        message: 'Không thể lấy chi tiết người dùng',
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

    if (typeof dto.gender === 'string') {
      data.gender = dto.gender.trim().toUpperCase();
    }

    if (typeof dto.dateOfBirth === 'string') {
      data.dateOfBirth = normalizeDateOfBirth(dto.dateOfBirth);
    }

    if (typeof dto.address === 'string') {
      data.address = dto.address.trim();
    }

    return data;
  }

  _normalizeCreateStaffUserDto(dto) {
    const role = dto.role.trim().toUpperCase();
    const doctorName = typeof dto.doctorName === 'string' ? dto.doctorName.trim() : '';
    const fallbackName = dto.name.trim();

    return {
      name: role === USER_ROLES.DOCTOR && doctorName ? doctorName : fallbackName,
      email: dto.email.trim().toLowerCase(),
      phone: dto.phone.trim(),
      password: dto.password,
      role,
      status: dto.status || 'ACTIVE',
      doctorName,
      specialtyId: typeof dto.specialtyId === 'string' ? dto.specialtyId.trim() : '',
      academicTitle: typeof dto.academicTitle === 'string' ? dto.academicTitle.trim() : '',
      yearsOfExperience: Number.isFinite(dto.yearsOfExperience) ? dto.yearsOfExperience : 0,
      consultationFee: Number.isFinite(dto.consultationFee) ? dto.consultationFee : 0,
      avatarUrl: typeof dto.avatarUrl === 'string' ? dto.avatarUrl.trim() : '',
    };
  }

  async _buildDoctorProfileData(normalizedDto) {
    if (normalizedDto.role !== USER_ROLES.DOCTOR) {
      return undefined;
    }

    const specialty = await SpecialtyRepository.findSpecialtyById(normalizedDto.specialtyId);

    if (!specialty || specialty.active === false) {
      throw new UserServiceError({
        code: USER_ERROR_CODES.VALIDATION_ERROR,
        message: 'Chuyên khoa của bác sĩ không hợp lệ',
        statusCode: 400,
        details: [{ field: 'specialtyId', message: 'specialtyId must reference an active specialty' }],
      });
    }

    return {
      title: normalizedDto.academicTitle,
      name: normalizedDto.doctorName || normalizedDto.name,
      specialtyId: specialty.id,
      specialtyName: specialty.name,
      experience: normalizedDto.yearsOfExperience,
      price: normalizedDto.consultationFee,
      avatar: normalizedDto.avatarUrl || null,
      description: 'Thông tin bác sĩ đang được cập nhật.',
      position: normalizedDto.academicTitle,
      active: normalizedDto.status === 'ACTIVE',
    };
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
