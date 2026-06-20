const ScheduleService = require('./schedule.service');

class ScheduleController {
  async createSchedules(req, res, next) {
    try {
      const data = await ScheduleService.createSchedules(req.body);
      return res.status(201).json({
        success: true,
        data,
      });
    } catch (error) {
      return next(error);
    }
  }

  async listSchedules(req, res, next) {
    try {
      const result = await ScheduleService.listSchedules(req.user, req.query);
      return res.status(200).json({
        success: true,
        data: result.data,
        meta: result.meta,
      });
    } catch (error) {
      return next(error);
    }
  }

  async getDoctorSchedules(req, res, next) {
    try {
      const data = await ScheduleService.getDoctorSchedules(req.params.doctorId, req.query);
      return res.status(200).json({
        success: true,
        data,
      });
    } catch (error) {
      return next(error);
    }
  }
}

module.exports = new ScheduleController();
