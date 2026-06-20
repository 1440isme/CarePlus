const ClinicSettingsRepository = require('./clinic-settings.repository');
const {
  toClinicInfoDto,
  toAdminClinicInfoDto,
  toSystemSettingDto,
} = require('./clinic-settings.dto');
const {
  CLINIC_SETTINGS_ERROR_CODES,
} = require('./clinic-settings.types');

class ClinicSettingsServiceError extends Error {
  constructor({ code, message, statusCode, details = [] }) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
  }
}

/**
 * Clinic settings module service.
 * Handles singleton clinic information and system configuration flows for Dev 1 admin/public APIs.
 */
class ClinicSettingsService {
  constructor(clinicSettingsRepository) {
    this.clinicSettingsRepository = clinicSettingsRepository;
  }

  async getPublicClinicInfo() {
    try {
      const clinicInfo = await this.clinicSettingsRepository.getClinicInfo();

      if (!clinicInfo) {
        throw new ClinicSettingsServiceError({
          code: CLINIC_SETTINGS_ERROR_CODES.CLINIC_INFO_NOT_FOUND,
          message: 'Không tìm thấy thông tin phòng khám',
          statusCode: 404,
        });
      }

      return toClinicInfoDto(clinicInfo);
    } catch (error) {
      if (error instanceof ClinicSettingsServiceError) {
        throw error;
      }

      throw new ClinicSettingsServiceError({
        code: CLINIC_SETTINGS_ERROR_CODES.GET_CLINIC_INFO_FAILED,
        message: 'Không thể lấy thông tin phòng khám',
        statusCode: 500,
      });
    }
  }

  async updateClinicInfo(adminUser, dto) {
    try {
      void adminUser;

      const updateData = this._buildClinicInfoUpdateData(dto);
      const clinicInfo = await this.clinicSettingsRepository.upsertClinicInfo(updateData);

      return {
        message: 'Cập nhật thông tin phòng khám thành công',
        clinicInfo: toAdminClinicInfoDto(clinicInfo),
      };
    } catch (error) {
      if (error instanceof ClinicSettingsServiceError) {
        throw error;
      }

      throw new ClinicSettingsServiceError({
        code: CLINIC_SETTINGS_ERROR_CODES.UPDATE_CLINIC_INFO_FAILED,
        message: 'Không thể cập nhật thông tin phòng khám',
        statusCode: 500,
      });
    }
  }

  async getSystemSetting(adminUser) {
    try {
      void adminUser;

      const systemSetting = await this.clinicSettingsRepository.getSystemSetting();

      if (!systemSetting) {
        throw new ClinicSettingsServiceError({
          code: CLINIC_SETTINGS_ERROR_CODES.SYSTEM_SETTING_NOT_FOUND,
          message: 'Không tìm thấy cấu hình hệ thống',
          statusCode: 404,
        });
      }

      return toSystemSettingDto(systemSetting);
    } catch (error) {
      if (error instanceof ClinicSettingsServiceError) {
        throw error;
      }

      throw new ClinicSettingsServiceError({
        code: CLINIC_SETTINGS_ERROR_CODES.GET_SYSTEM_SETTING_FAILED,
        message: 'Không thể lấy cấu hình hệ thống',
        statusCode: 500,
      });
    }
  }

  async updateSystemSetting(adminUser, dto) {
    try {
      void adminUser;

      const updateData = this._buildSystemSettingUpdateData(dto);
      const systemSetting = await this.clinicSettingsRepository.upsertSystemSetting(updateData);

      return {
        message: 'Cập nhật cấu hình hệ thống thành công',
        systemSetting: toSystemSettingDto(systemSetting),
      };
    } catch (error) {
      if (error instanceof ClinicSettingsServiceError) {
        throw error;
      }

      throw new ClinicSettingsServiceError({
        code: CLINIC_SETTINGS_ERROR_CODES.UPDATE_SYSTEM_SETTING_FAILED,
        message: 'Không thể cập nhật cấu hình hệ thống',
        statusCode: 500,
      });
    }
  }

  _buildClinicInfoUpdateData(dto) {
    const data = {};

    if (typeof dto.name === 'string') {
      data.name = dto.name.trim();
    }

    if (typeof dto.address === 'string') {
      data.address = dto.address.trim();
    }

    if (typeof dto.hotline === 'string') {
      data.hotline = dto.hotline.trim();
    }

    if (typeof dto.email === 'string') {
      data.email = dto.email.trim().toLowerCase();
    }

    if (typeof dto.workingHours === 'string') {
      data.workingHours = dto.workingHours.trim();
    }

    if (typeof dto.description === 'string') {
      data.description = dto.description.trim();
    }

    return data;
  }

  _buildSystemSettingUpdateData(dto) {
    const data = {};

    if (Number.isInteger(dto.maxBookingDaysAhead)) {
      data.maxBookingDaysAhead = dto.maxBookingDaysAhead;
    }

    if (Number.isInteger(dto.slotDurationMinutes)) {
      data.slotDurationMinutes = dto.slotDurationMinutes;
    }

    if (Number.isInteger(dto.cancelBeforeHours)) {
      data.cancelBeforeHours = dto.cancelBeforeHours;
    }

    if (Number.isInteger(dto.maxNoShowBeforeLock)) {
      data.maxNoShowBeforeLock = dto.maxNoShowBeforeLock;
    }

    if (typeof dto.morningShiftStart === 'string') {
      data.morningShiftStart = dto.morningShiftStart;
    }

    if (typeof dto.morningShiftEnd === 'string') {
      data.morningShiftEnd = dto.morningShiftEnd;
    }

    if (typeof dto.afternoonShiftStart === 'string') {
      data.afternoonShiftStart = dto.afternoonShiftStart;
    }

    if (typeof dto.afternoonShiftEnd === 'string') {
      data.afternoonShiftEnd = dto.afternoonShiftEnd;
    }

    return data;
  }
}

module.exports = new ClinicSettingsService(ClinicSettingsRepository);
