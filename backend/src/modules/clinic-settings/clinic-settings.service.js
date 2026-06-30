const ClinicSettingsRepository = require('./clinic-settings.repository');
const {
  toClinicInfoDto,
  toAdminClinicInfoDto,
  toSystemSettingDto,
  toBookingRulesDto,
} = require('./clinic-settings.dto');
const {
  CLINIC_SETTINGS_ERROR_CODES,
  CLINIC_SETTINGS_DEFAULTS,
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
      return toClinicInfoDto(clinicInfo ?? this._buildEmptyClinicInfo());
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
        return toSystemSettingDto(this._buildEmptySystemSetting());
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

  async getPublicSystemSetting() {
    return this.getBookingRules();
  }

  async getBookingRules() {
    try {
      const systemSetting = await this.clinicSettingsRepository.getSystemSetting();
      return toBookingRulesDto(systemSetting ?? this._buildDefaultSystemSetting());
    } catch (error) {
      if (error instanceof ClinicSettingsServiceError) {
        throw error;
      }

      throw new ClinicSettingsServiceError({
        code: CLINIC_SETTINGS_ERROR_CODES.GET_BOOKING_RULES_FAILED,
        message: 'Không thể lấy rule đặt lịch',
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

  _buildEmptyClinicInfo() {
    return {
      name: '',
      address: '',
      hotline: '',
      email: '',
      workingHours: '',
      description: '',
    };
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

    if (Number.isInteger(dto.maxActiveAppointmentsPerUser)) {
      data.maxActiveAppointmentsPerUser = dto.maxActiveAppointmentsPerUser;
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

  _buildDefaultSystemSetting() {
    return {
      maxBookingDaysAhead: CLINIC_SETTINGS_DEFAULTS.MAX_BOOKING_DAYS_AHEAD,
      slotDurationMinutes: CLINIC_SETTINGS_DEFAULTS.SLOT_DURATION_MINUTES,
      cancelBeforeHours: CLINIC_SETTINGS_DEFAULTS.CANCEL_BEFORE_HOURS,
      maxNoShowBeforeLock: CLINIC_SETTINGS_DEFAULTS.MAX_NO_SHOW_BEFORE_LOCK,
      maxActiveAppointmentsPerUser: CLINIC_SETTINGS_DEFAULTS.MAX_ACTIVE_APPOINTMENTS_PER_USER,
      morningShiftStart: CLINIC_SETTINGS_DEFAULTS.MORNING_SHIFT_START,
      morningShiftEnd: CLINIC_SETTINGS_DEFAULTS.MORNING_SHIFT_END,
      afternoonShiftStart: CLINIC_SETTINGS_DEFAULTS.AFTERNOON_SHIFT_START,
      afternoonShiftEnd: CLINIC_SETTINGS_DEFAULTS.AFTERNOON_SHIFT_END,
    };
  }

  _buildEmptySystemSetting() {
    return {
      maxBookingDaysAhead: undefined,
      slotDurationMinutes: undefined,
      cancelBeforeHours: undefined,
      maxNoShowBeforeLock: undefined,
      maxActiveAppointmentsPerUser: undefined,
      morningShiftStart: '',
      morningShiftEnd: '',
      afternoonShiftStart: '',
      afternoonShiftEnd: '',
    };
  }
}

module.exports = new ClinicSettingsService(ClinicSettingsRepository);
