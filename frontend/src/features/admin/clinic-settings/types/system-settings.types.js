/**
 * @typedef {Object} SystemSettings
 * @property {number} maxBookingDaysAhead
 * @property {number} slotDurationMinutes
 * @property {number} cancelBeforeHours
 * @property {number} maxNoShowBeforeLock
 * @property {number} maxActiveAppointmentsPerUser
 * @property {string} morningShiftStart
 * @property {string} morningShiftEnd
 * @property {string} afternoonShiftStart
 * @property {string} afternoonShiftEnd
 */

export const SYSTEM_SETTINGS_API_PATHS = {
  root: '/clinic-settings/system',
};

export const SYSTEM_SETTINGS_QUERY_KEYS = {
  all: 'system-settings',
};
