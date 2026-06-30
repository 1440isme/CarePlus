import axiosInstance from '../../../../shared/services/axios.instance.js';
import { CLINIC_SETTINGS_API_PATHS } from '../types/clinic-settings.types.js';
import { SYSTEM_SETTINGS_API_PATHS } from '../types/system-settings.types.js';

function normalizeClinicInfoPayload(payload = {}) {
  return {
    name: payload.name.trim(),
    address: payload.address.trim(),
    hotline: payload.hotline.trim(),
    email: payload.email.trim(),
    workingHours: payload.workingHours.trim(),
    description: payload.description.trim(),
  };
}

function normalizeClinicInfoResponse(clinicInfo = {}) {
  const normalizedClinicInfo = clinicInfo?.clinicInfo ?? clinicInfo;

  return {
    id: normalizedClinicInfo.id,
    name: normalizedClinicInfo.name ?? '',
    address: normalizedClinicInfo.address ?? '',
    hotline: normalizedClinicInfo.hotline ?? '',
    email: normalizedClinicInfo.email ?? '',
    workingHours: normalizedClinicInfo.workingHours ?? '',
    description: normalizedClinicInfo.description ?? '',
    createdAt: normalizedClinicInfo.createdAt,
    updatedAt: normalizedClinicInfo.updatedAt,
  };
}

function normalizeSystemSettingsPayload(payload = {}) {
  return {
    maxBookingDaysAhead: payload.maxBookingDaysAhead,
    slotDurationMinutes: payload.slotDurationMinutes,
    cancelBeforeHours: payload.cancelBeforeHours,
    maxNoShowBeforeLock: payload.maxNoShowBeforeLock,
    maxActiveAppointmentsPerUser: payload.maxActiveAppointmentsPerUser,
    morningShiftStart: payload.morningShiftStart,
    morningShiftEnd: payload.morningShiftEnd,
    afternoonShiftStart: payload.afternoonShiftStart,
    afternoonShiftEnd: payload.afternoonShiftEnd,
  };
}

function normalizeSystemSettingsResponse(systemSettings = {}) {
  const normalizedSystemSettings = systemSettings?.systemSetting ?? systemSettings;

  return {
    maxBookingDaysAhead: normalizedSystemSettings.maxBookingDaysAhead == null
      ? undefined
      : Number(normalizedSystemSettings.maxBookingDaysAhead),
    slotDurationMinutes: normalizedSystemSettings.slotDurationMinutes == null
      ? undefined
      : Number(normalizedSystemSettings.slotDurationMinutes),
    cancelBeforeHours: normalizedSystemSettings.cancelBeforeHours == null
      ? undefined
      : Number(normalizedSystemSettings.cancelBeforeHours),
    maxNoShowBeforeLock: normalizedSystemSettings.maxNoShowBeforeLock == null
      ? undefined
      : Number(normalizedSystemSettings.maxNoShowBeforeLock),
    maxActiveAppointmentsPerUser: normalizedSystemSettings.maxActiveAppointmentsPerUser == null
      ? undefined
      : Number(normalizedSystemSettings.maxActiveAppointmentsPerUser),
    morningShiftStart: normalizedSystemSettings.morningShiftStart ?? '',
    morningShiftEnd: normalizedSystemSettings.morningShiftEnd ?? '',
    afternoonShiftStart: normalizedSystemSettings.afternoonShiftStart ?? '',
    afternoonShiftEnd: normalizedSystemSettings.afternoonShiftEnd ?? '',
  };
}

export async function getClinicInfo() {
  const response = await axiosInstance.get(CLINIC_SETTINGS_API_PATHS.clinicInfo);

  return {
    ...response.data,
    data: normalizeClinicInfoResponse(response.data?.data),
  };
}

export async function updateClinicInfo(payload) {
  const response = await axiosInstance.patch(
    CLINIC_SETTINGS_API_PATHS.clinicInfo,
    normalizeClinicInfoPayload(payload),
  );

  return {
    ...response.data,
    message: response.data?.data?.message ?? response.data?.message,
    data: normalizeClinicInfoResponse(response.data?.data),
  };
}

export async function getSystemSettings() {
  const response = await axiosInstance.get(SYSTEM_SETTINGS_API_PATHS.root);

  return {
    ...response.data,
    data: normalizeSystemSettingsResponse(response.data?.data),
  };
}

function normalizeBookingRulesResponse(bookingRules = {}) {
  const normalizedBookingRules = bookingRules?.bookingRules ?? bookingRules;

  return {
    maxBookingDaysAhead: normalizedBookingRules.maxBookingDaysAhead == null
      ? undefined
      : Number(normalizedBookingRules.maxBookingDaysAhead),
    slotDurationMinutes: normalizedBookingRules.slotDurationMinutes == null
      ? undefined
      : Number(normalizedBookingRules.slotDurationMinutes),
    cancelBeforeHours: normalizedBookingRules.cancelBeforeHours == null
      ? undefined
      : Number(normalizedBookingRules.cancelBeforeHours),
    maxActiveAppointmentsPerUser: normalizedBookingRules.maxActiveAppointmentsPerUser == null
      ? undefined
      : Number(normalizedBookingRules.maxActiveAppointmentsPerUser),
    workingShifts: {
      morning: {
        start: normalizedBookingRules.workingShifts?.morning?.start ?? '',
        end: normalizedBookingRules.workingShifts?.morning?.end ?? '',
      },
      afternoon: {
        start: normalizedBookingRules.workingShifts?.afternoon?.start ?? '',
        end: normalizedBookingRules.workingShifts?.afternoon?.end ?? '',
      },
    },
  };
}

export async function getBookingRules() {
  const response = await axiosInstance.get(SYSTEM_SETTINGS_API_PATHS.bookingRules);

  return {
    ...response.data,
    data: normalizeBookingRulesResponse(response.data?.data),
  };
}

export async function updateSystemSettings(payload) {
  const response = await axiosInstance.patch(
    SYSTEM_SETTINGS_API_PATHS.root,
    normalizeSystemSettingsPayload(payload),
  );

  return {
    ...response.data,
    message: response.data?.data?.message ?? response.data?.message,
    data: normalizeSystemSettingsResponse(response.data?.data),
  };
}
