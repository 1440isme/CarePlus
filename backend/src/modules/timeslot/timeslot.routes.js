const express = require('express');
const TimeSlotController = require('./timeslot.controller');
const { validateListTimeSlots, validateLockTimeSlot } = require('./timeslot.validator');
const { TIMESLOT_ROUTE_PATHS } = require('./timeslot.types');

const router = express.Router();

router.get(TIMESLOT_ROUTE_PATHS.ROOT, validateListTimeSlots, TimeSlotController.listTimeSlots);
router.post(TIMESLOT_ROUTE_PATHS.LOCK, validateLockTimeSlot, TimeSlotController.lockTimeSlot);
router.post(TIMESLOT_ROUTE_PATHS.UNLOCK, validateLockTimeSlot, TimeSlotController.unlockTimeSlot);

module.exports = router;

