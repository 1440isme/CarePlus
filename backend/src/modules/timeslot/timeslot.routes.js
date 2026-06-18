const express = require('express');
const TimeSlotController = require('./timeslot.controller');
const { validateListTimeSlots } = require('./timeslot.validator');
const { TIMESLOT_ROUTE_PATHS } = require('./timeslot.types');

const router = express.Router();

router.get(TIMESLOT_ROUTE_PATHS.ROOT, validateListTimeSlots, TimeSlotController.listTimeSlots);

module.exports = router;
