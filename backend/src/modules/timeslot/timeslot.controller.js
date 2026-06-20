const TimeSlotService = require('./timeslot.service');

class TimeSlotController {
  async listTimeSlots(req, res, next) {
    try {
      const data = await TimeSlotService.getSlotsByDoctorAndDate(req.query);
      return res.status(200).json({
        success: true,
        data,
      });
    } catch (error) {
      return next(error);
    }
  }
}

module.exports = new TimeSlotController();
