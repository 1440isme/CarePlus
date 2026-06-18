const PatientProfileRepository = require('./patient-profile.repository');
const { toPatientProfileDto, toPatientProfileListDto } = require('./patient-profile.dto');
const {
  PATIENT_PROFILE_ERROR_CODES,
  PATIENT_PROFILE_PAGINATION,
} = require('./patient-profile.types');

class PatientProfileServiceError extends Error {
  constructor({ code, message, statusCode, details = [] }) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
  }
}

class PatientProfileService {
  constructor(patientProfileRepository) {
    this.patientProfileRepository = patientProfileRepository;
  }

  async listMyProfiles(currentUser, query) {
    try {
      const normalizedQuery = this._normalizeListQuery(query);
      const filters = {
        skip: (normalizedQuery.page - 1) * normalizedQuery.limit,
        take: normalizedQuery.limit,
        search: normalizedQuery.search,
      };

      const [profiles, total] = await Promise.all([
        this.patientProfileRepository.findProfilesByUserId(currentUser.userId, filters),
        this.patientProfileRepository.countProfilesByUserId(currentUser.userId, filters),
      ]);

      return {
        data: toPatientProfileListDto(profiles),
        meta: {
          page: normalizedQuery.page,
          limit: normalizedQuery.limit,
          total,
          totalPages: Math.ceil(total / normalizedQuery.limit),
        },
      };
    } catch (error) {
      if (error instanceof PatientProfileServiceError) {
        throw error;
      }

      throw new PatientProfileServiceError({
        code: PATIENT_PROFILE_ERROR_CODES.LIST_PATIENT_PROFILES_FAILED,
        message: 'Không thể lấy danh sách hồ sơ bệnh nhân',
        statusCode: 500,
      });
    }
  }

  async createMyProfile(currentUser, dto) {
    try {
      const createdProfile = await this.patientProfileRepository.createProfile({
        userId: currentUser.userId,
        fullName: dto.fullName.trim(),
        phone: dto.phone.trim(),
        email: typeof dto.email === 'string' ? dto.email.trim().toLowerCase() : null,
        gender: dto.gender,
        dateOfBirth: new Date(dto.dateOfBirth),
        address: typeof dto.address === 'string' ? dto.address.trim() : null,
        relationship: dto.relationship,
        isDefault: Boolean(dto.isDefault),
        isActive: true,
      });

      return {
        message: 'Tạo hồ sơ thành công',
        profile: toPatientProfileDto(createdProfile),
      };
    } catch (error) {
      if (error instanceof PatientProfileServiceError) {
        throw error;
      }

      throw new PatientProfileServiceError({
        code: PATIENT_PROFILE_ERROR_CODES.CREATE_PATIENT_PROFILE_FAILED,
        message: 'Không thể tạo hồ sơ bệnh nhân',
        statusCode: 500,
      });
    }
  }

  async getMyProfileById(currentUser, profileId) {
    try {
      const profile = await this._getOwnedProfileOrThrow(currentUser.userId, profileId);
      return toPatientProfileDto(profile);
    } catch (error) {
      if (error instanceof PatientProfileServiceError) {
        throw error;
      }

      throw new PatientProfileServiceError({
        code: PATIENT_PROFILE_ERROR_CODES.GET_PATIENT_PROFILE_FAILED,
        message: 'Không thể lấy chi tiết hồ sơ bệnh nhân',
        statusCode: 500,
      });
    }
  }

  async updateMyProfile(currentUser, profileId, dto) {
    try {
      const profile = await this._getOwnedProfileOrThrow(currentUser.userId, profileId);

      if (!profile.isActive) {
        throw new PatientProfileServiceError({
          code: PATIENT_PROFILE_ERROR_CODES.PATIENT_PROFILE_INACTIVE,
          message: 'Không thể cập nhật hồ sơ đã bị xóa',
          statusCode: 400,
        });
      }

      const updateData = this._buildUpdateData(dto);
      const updatedProfile = await this.patientProfileRepository.updateProfile(profileId, updateData);

      return {
        message: 'Cập nhật hồ sơ thành công',
        profile: toPatientProfileDto(updatedProfile),
      };
    } catch (error) {
      if (error instanceof PatientProfileServiceError) {
        throw error;
      }

      throw new PatientProfileServiceError({
        code: PATIENT_PROFILE_ERROR_CODES.UPDATE_PATIENT_PROFILE_FAILED,
        message: 'Không thể cập nhật hồ sơ bệnh nhân',
        statusCode: 500,
      });
    }
  }

  async deleteMyProfile(currentUser, profileId) {
    try {
      const profile = await this._getOwnedProfileOrThrow(currentUser.userId, profileId);

      if (!profile.isActive) {
        throw new PatientProfileServiceError({
          code: PATIENT_PROFILE_ERROR_CODES.PATIENT_PROFILE_NOT_FOUND,
          message: 'Không tìm thấy hồ sơ bệnh nhân',
          statusCode: 404,
        });
      }

      const hasActiveAppointment = await this.patientProfileRepository.hasActiveAppointment(profileId);

      if (hasActiveAppointment) {
        throw new PatientProfileServiceError({
          code: PATIENT_PROFILE_ERROR_CODES.PROFILE_HAS_ACTIVE_APPOINTMENT,
          message: 'Không thể xóa hồ sơ đang có lịch hẹn chưa hoàn tất',
          statusCode: 400,
        });
      }

      const deletedProfile = await this.patientProfileRepository.softDeleteProfile(profileId);

      return {
        message: 'Xóa hồ sơ thành công',
        profile: toPatientProfileDto(deletedProfile),
      };
    } catch (error) {
      if (error instanceof PatientProfileServiceError) {
        throw error;
      }

      throw new PatientProfileServiceError({
        code: PATIENT_PROFILE_ERROR_CODES.DELETE_PATIENT_PROFILE_FAILED,
        message: 'Không thể xóa hồ sơ bệnh nhân',
        statusCode: 500,
      });
    }
  }

  async setDefaultProfile(currentUser, profileId) {
    try {
      const profile = await this._getOwnedProfileOrThrow(currentUser.userId, profileId);

      if (!profile.isActive) {
        throw new PatientProfileServiceError({
          code: PATIENT_PROFILE_ERROR_CODES.PATIENT_PROFILE_INACTIVE,
          message: 'Không thể đặt mặc định hồ sơ đã bị xóa',
          statusCode: 400,
        });
      }

      const updatedProfile = await this.patientProfileRepository.setDefaultProfile(
        currentUser.userId,
        profileId,
      );

      return {
        message: 'Đã đặt hồ sơ mặc định thành công',
        profile: toPatientProfileDto(updatedProfile),
      };
    } catch (error) {
      if (error instanceof PatientProfileServiceError) {
        throw error;
      }

      throw new PatientProfileServiceError({
        code: PATIENT_PROFILE_ERROR_CODES.SET_DEFAULT_PROFILE_FAILED,
        message: 'Không thể đặt hồ sơ mặc định',
        statusCode: 500,
      });
    }
  }

  async _getOwnedProfileOrThrow(userId, profileId) {
    const profile = await this.patientProfileRepository.findProfileByIdAndUserId(profileId, userId);

    if (!profile) {
      throw new PatientProfileServiceError({
        code: PATIENT_PROFILE_ERROR_CODES.PATIENT_PROFILE_NOT_FOUND,
        message: 'Không tìm thấy hồ sơ bệnh nhân',
        statusCode: 404,
      });
    }

    return profile;
  }

  _normalizeListQuery(query) {
    const page = Number.parseInt(query.page, 10) || PATIENT_PROFILE_PAGINATION.DEFAULT_PAGE;
    const rawLimit = Number.parseInt(query.limit, 10) || PATIENT_PROFILE_PAGINATION.DEFAULT_LIMIT;
    const limit = Math.min(rawLimit, PATIENT_PROFILE_PAGINATION.MAX_LIMIT);

    return {
      page,
      limit,
      search: typeof query.search === 'string' ? query.search.trim() : '',
    };
  }

  _buildUpdateData(dto) {
    const data = {};

    if (typeof dto.fullName === 'string') {
      data.fullName = dto.fullName.trim();
    }

    if (typeof dto.phone === 'string') {
      data.phone = dto.phone.trim();
    }

    if (typeof dto.email === 'string') {
      data.email = dto.email.trim().toLowerCase();
    }

    if (dto.email === null) {
      data.email = null;
    }

    if (typeof dto.gender === 'string') {
      data.gender = dto.gender;
    }

    if (typeof dto.dateOfBirth === 'string') {
      data.dateOfBirth = new Date(dto.dateOfBirth);
    }

    if (typeof dto.address === 'string') {
      data.address = dto.address.trim();
    }

    if (dto.address === null) {
      data.address = null;
    }

    if (typeof dto.relationship === 'string') {
      data.relationship = dto.relationship;
    }

    if (typeof dto.isDefault === 'boolean') {
      data.isDefault = dto.isDefault;
    }

    return data;
  }
}

module.exports = new PatientProfileService(PatientProfileRepository);
