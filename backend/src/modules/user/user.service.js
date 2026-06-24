const bcrypt = require('bcrypt');
const UserRepository = require('./user.repository');
const SpecialtyRepository = require('../specialty/specialty.repository');
const { toUserDto, toUserListDto } = require('./user.dto');
const UploadService = require('../upload/upload.service');
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

function logSafeUserError(action, error, fallbackCode) {
  console.error('[UserService] action failed', {
    module: 'user',
    action,
    errorCode: error?.code || fallbackCode,
    statusCode: error?.statusCode || 500,
    message: error?.message || 'Unknown error',
  });
}

function normalizeDateOfBirth(value) {
  if (typeof value !== 'string') {
    return undefined;
  }

  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return undefined;
  }

  const isoMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmedValue);

  if (!isoMatch) {
    return undefined;
  }

  const year = Number.parseInt(isoMatch[1], 10);
  const month = Number.parseInt(isoMatch[2], 10);
  const day = Number.parseInt(isoMatch[3], 10);

  return new Date(Date.UTC(year, month - 1, day));
}

function normalizeCreatedDateRange(value, boundary) {
  if (typeof value !== 'string') {
  return undefined;
}

const ACADEMIC_TITLE_NORMALIZATION_MAP = {
  BS_CKI: 'BS.CKI',
  BS_CKII: 'BS.CKII',
  THS_BS: 'ThS.BS',
  TS_BS: 'TS.BS',
};

function normalizeAcademicTitle(value) {
  if (typeof value !== 'string') {
    return value;
  }

  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return trimmedValue;
  }

  return ACADEMIC_TITLE_NORMALIZATION_MAP[trimmedValue] || trimmedValue;
}

  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return undefined;
  }

  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmedValue);

  if (!match) {
    return undefined;
  }

  const year = Number.parseInt(match[1], 10);
  const month = Number.parseInt(match[2], 10);
  const day = Number.parseInt(match[3], 10);

  if (boundary === 'end') {
    return new Date(Date.UTC(year, month - 1, day, 23, 59, 59, 999));
  }

  return new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
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
      logSafeUserError('getMe', error, USER_ERROR_CODES.GET_ME_FAILED);
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

  async updateMyAvatar(currentUser, file) {
    try {
      const user = await this._getUserOrThrow(currentUser.userId);
      const oldAvatarUrl = user.avatarUrl;

      if (!file) {
        throw new UserServiceError({
          code: USER_ERROR_CODES.AVATAR_FILE_REQUIRED,
          message: 'Vui lòng chọn ảnh đại diện cần tải lên',
          statusCode: 400,
        });
      }

      const uploadResult = await this._uploadAvatarOrThrow(currentUser.userId, file);
      const updatedUser = await this.userRepository.updateUserAvatar(currentUser.userId, uploadResult.url);

      if (currentUser.role === USER_ROLES.DOCTOR) {
        const prisma = require('../../infrastructure/database/prisma.client');
        await prisma.doctor.update({
          where: { userId: currentUser.userId },
          data: { avatar: uploadResult.url }
        });
        
        // Update Doctor ES index
        try {
          const SearchService = require('../search/search.service');
          const doctor = await prisma.doctor.findUnique({
            where: { userId: currentUser.userId }
          });
          if (doctor && doctor.active) {
            await SearchService.indexDocument('doctors', doctor.id, {
              userId: doctor.userId,
              title: doctor.title,
              name: doctor.name,
              specialtyId: doctor.specialtyId,
              specialtyName: doctor.specialtyName,
              experience: doctor.experience,
              price: doctor.price,
              rating: doctor.rating,
              reviewCount: doctor.reviewCount,
              avatar: doctor.avatar,
              description: doctor.description,
              position: doctor.position,
              active: doctor.active,
              createdAt: doctor.createdAt,
              updatedAt: doctor.updatedAt
            });
          }
        } catch (esError) {
          console.error('[UserService] Failed to update doctor ES index:', esError.message);
        }
      }

      // Cleanup old avatar from Cloudinary
      if (oldAvatarUrl) {
        const oldPublicId = getCloudinaryPublicId(oldAvatarUrl);
        if (oldPublicId) {
          try {
            await UploadService.deleteImage(oldPublicId);
          } catch (deleteErr) {
            console.error('[UserService] Failed to delete old avatar from Cloudinary:', deleteErr.message);
          }
        }
      }

      return {
        message: 'Cập nhật ảnh đại diện thành công',
        user: toUserDto(updatedUser),
      };
    } catch (error) {
      if (error instanceof UserServiceError) {
        throw error;
      }

      throw new UserServiceError({
        code: USER_ERROR_CODES.UPDATE_AVATAR_FAILED,
        message: 'Không thể cập nhật ảnh đại diện',
        statusCode: 500,
      });
    }
  }

  async changeMyPassword(currentUser, dto) {
    try {
      const user = await this.userRepository.findUserByIdWithPasswordHash(currentUser.userId);

      if (!user) {
        throw new UserServiceError({
          code: USER_ERROR_CODES.USER_NOT_FOUND,
          message: 'Không tìm thấy người dùng',
          statusCode: 404,
        });
      }

      const isCurrentPasswordValid = await bcrypt.compare(dto.currentPassword, user.passwordHash);

      if (!isCurrentPasswordValid) {
        throw new UserServiceError({
          code: USER_ERROR_CODES.CURRENT_PASSWORD_INCORRECT,
          message: 'Mật khẩu hiện tại không chính xác',
          statusCode: 400,
        });
      }

      const isNewPasswordSameAsOld = await bcrypt.compare(dto.newPassword, user.passwordHash);

      if (isNewPasswordSameAsOld) {
        throw new UserServiceError({
          code: USER_ERROR_CODES.NEW_PASSWORD_SAME_AS_OLD,
          message: 'Mật khẩu mới không được trùng mật khẩu hiện tại',
          statusCode: 400,
        });
      }

      const newPasswordHash = await bcrypt.hash(dto.newPassword, 10);
      await this.userRepository.updateUserPasswordHash(currentUser.userId, newPasswordHash);

      return {
        message: 'Đổi mật khẩu thành công',
      };
    } catch (error) {
      if (error instanceof UserServiceError) {
        throw error;
      }

      throw new UserServiceError({
        code: USER_ERROR_CODES.CHANGE_PASSWORD_FAILED,
        message: 'Không thể đổi mật khẩu',
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
        createdFrom: normalizedQuery.createdFrom,
        createdTo: normalizedQuery.createdTo,
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

  async _uploadAvatarOrThrow(userId, file) {
    try {
      return await UploadService.uploadImage(file.buffer, `careplus/avatars/${userId}`);
    } catch (error) {
      if (error?.code === USER_ERROR_CODES.INVALID_FILE_TYPE || error?.code === USER_ERROR_CODES.FILE_TOO_LARGE) {
        throw new UserServiceError({
          code: error.code,
          message: error.message,
          statusCode: error.statusCode || 400,
          details: error.details || [],
        });
      }

      throw new UserServiceError({
        code: USER_ERROR_CODES.CLOUDINARY_UPLOAD_FAILED,
        message: 'Không thể tải ảnh đại diện lên Cloudinary',
        statusCode: 500,
      });
    }
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

    const academicTitle = normalizeAcademicTitle(normalizedDto.academicTitle);
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
      title: academicTitle,
      name: normalizedDto.doctorName || normalizedDto.name,
      specialtyId: specialty.id,
      specialtyName: specialty.name,
      experience: normalizedDto.yearsOfExperience,
      price: normalizedDto.consultationFee,
      avatar: normalizedDto.avatarUrl || null,
      description: 'Thông tin bác sĩ đang được cập nhật.',
      position: academicTitle,
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
      createdFrom: normalizeCreatedDateRange(query.createdFrom, 'start'),
      createdTo: normalizeCreatedDateRange(query.createdTo, 'end'),
    };
  }
}

function getCloudinaryPublicId(url) {
  if (!url || !url.includes('cloudinary.com')) return null;
  const parts = url.split('/upload/');
  if (parts.length < 2) return null;
  let path = parts[1];
  if (path.startsWith('v')) {
    const slashIdx = path.indexOf('/');
    if (slashIdx !== -1) {
      path = path.substring(slashIdx + 1);
    }
  }
  const dotIdx = path.lastIndexOf('.');
  if (dotIdx !== -1) {
    path = path.substring(0, dotIdx);
  }
  return path;
}

module.exports = new UserService(UserRepository);
