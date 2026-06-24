const DEFAULT_SYSTEM_SETTINGS = {
  slotDurationMinutes: 30,
  morningShiftStart: '08:00',
  morningShiftEnd: '11:30',
  afternoonShiftStart: '13:30',
  afternoonShiftEnd: '17:00',
};

function timeToMinutes(value) {
  const [hours, minutes] = String(value || '').split(':').map((item) => Number.parseInt(item, 10));

  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) {
    return null;
  }

  return (hours * 60) + minutes;
}

function minutesToTime(value) {
  const hours = String(Math.floor(value / 60)).padStart(2, '0');
  const minutes = String(value % 60).padStart(2, '0');
  return `${hours}:${minutes}`;
}

function normalizeSettings(systemSettings = {}) {
  const workingShifts = systemSettings.workingShifts || {};

  return {
    slotDurationMinutes: systemSettings.slotDurationMinutes || DEFAULT_SYSTEM_SETTINGS.slotDurationMinutes,
    morningShiftStart: workingShifts.morning?.start
      || systemSettings.morningShiftStart
      || DEFAULT_SYSTEM_SETTINGS.morningShiftStart,
    morningShiftEnd: workingShifts.morning?.end
      || systemSettings.morningShiftEnd
      || DEFAULT_SYSTEM_SETTINGS.morningShiftEnd,
    afternoonShiftStart: workingShifts.afternoon?.start
      || systemSettings.afternoonShiftStart
      || DEFAULT_SYSTEM_SETTINGS.afternoonShiftStart,
    afternoonShiftEnd: workingShifts.afternoon?.end
      || systemSettings.afternoonShiftEnd
      || DEFAULT_SYSTEM_SETTINGS.afternoonShiftEnd,
  };
}

function buildShiftSlots({ shift, start, end, duration }) {
  const startMinutes = timeToMinutes(start);
  const endMinutes = timeToMinutes(end);

  if (startMinutes == null || endMinutes == null || startMinutes >= endMinutes || duration <= 0) {
    return [];
  }

  const slots = [];
  for (let cursor = startMinutes; cursor + duration <= endMinutes; cursor += duration) {
    const startTime = minutesToTime(cursor);
    const endTime = minutesToTime(cursor + duration);

    slots.push({
      id: `${shift}-${startTime}-${endTime}`,
      shift,
      workingShift: shift === 'morning' ? 'MORNING' : 'AFTERNOON',
      startTime,
      endTime,
      status: 'AVAILABLE',
      isVirtual: true,
    });
  }

  return slots;
}

export function buildVirtualSlots(systemSettings = {}) {
  const settings = normalizeSettings(systemSettings);
  const duration = settings.slotDurationMinutes;

  return {
    morning: buildShiftSlots({
      shift: 'morning',
      start: settings.morningShiftStart,
      end: settings.morningShiftEnd,
      duration,
    }),
    afternoon: buildShiftSlots({
      shift: 'afternoon',
      start: settings.afternoonShiftStart,
      end: settings.afternoonShiftEnd,
      duration,
    }),
  };
}

function findScheduleForShift(schedules, workingShift) {
  return schedules.find((schedule) => {
    const scheduleShift = schedule?.workingShift || schedule?.shift;
    return scheduleShift === workingShift || scheduleShift === 'ALL_DAY';
  });
}

export function buildVirtualSlotsForSchedules(systemSettings = {}, schedules = []) {
  const settings = normalizeSettings(systemSettings);
  const duration = settings.slotDurationMinutes;
  const morningSchedule = findScheduleForShift(schedules, 'MORNING');
  const afternoonSchedule = findScheduleForShift(schedules, 'AFTERNOON');

  return {
    morning: buildShiftSlots({
      shift: 'morning',
      start: morningSchedule?.morningShiftStart || settings.morningShiftStart,
      end: morningSchedule?.morningShiftEnd || settings.morningShiftEnd,
      duration,
    }),
    afternoon: buildShiftSlots({
      shift: 'afternoon',
      start: afternoonSchedule?.afternoonShiftStart || settings.afternoonShiftStart,
      end: afternoonSchedule?.afternoonShiftEnd || settings.afternoonShiftEnd,
      duration,
    }),
  };
}

export function filterSlotGroupsBySchedules(slotGroups, schedules = []) {
  const workingSchedules = schedules.filter((schedule) => schedule.status === 'WORKING');
  const hasWorkingSchedule = workingSchedules.length > 0;

  if (!hasWorkingSchedule) {
    return { morning: [], afternoon: [] };
  }

  const hasAllDay = workingSchedules.some((schedule) => schedule.workingShift === 'ALL_DAY' || schedule.shift === 'ALL_DAY');
  const hasMorning = hasAllDay || workingSchedules.some((schedule) => schedule.workingShift === 'MORNING' || schedule.shift === 'MORNING');
  const hasAfternoon = hasAllDay || workingSchedules.some((schedule) => schedule.workingShift === 'AFTERNOON' || schedule.shift === 'AFTERNOON');

  return {
    morning: hasMorning ? (slotGroups.morning || []) : [],
    afternoon: hasAfternoon ? (slotGroups.afternoon || []) : [],
  };
}

export function mergePersistedSlots(virtualGroups, persistedSlots = []) {
  const persistedByTime = new Map(
    persistedSlots.map((slot) => [`${slot.startTime}-${slot.endTime}`, slot]),
  );

  const mergeGroup = (slots) => slots
    .map((slot) => {
      const persistedSlot = persistedByTime.get(`${slot.startTime}-${slot.endTime}`);
      return persistedSlot
        ? {
            ...slot,
            ...persistedSlot,
            id: persistedSlot.timeSlotId || persistedSlot.id || slot.id,
            isVirtual: false,
          }
        : slot;
    })
    .filter((slot) => slot.status !== 'LOCKED');

  return {
    morning: mergeGroup(virtualGroups.morning || []),
    afternoon: mergeGroup(virtualGroups.afternoon || []),
  };
}

export function flattenSlotGroups(slotGroups) {
  return [...(slotGroups.morning || []), ...(slotGroups.afternoon || [])];
}
