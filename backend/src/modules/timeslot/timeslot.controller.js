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

  async lockTimeSlot(req, res, next) {
    try {
      const { id } = req.params;
      const { lockClientId } = req.body;
      const result = await TimeSlotService.lockTimeSlot(id, lockClientId);
      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      return next(error);
    }
  }

  async unlockTimeSlot(req, res, next) {
    try {
      const { id } = req.params;
      const { lockClientId } = req.body;
      const result = await TimeSlotService.unlockTimeSlot(id, lockClientId);
      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      return next(error);
    }
  }
}

module.exports = new TimeSlotController();

