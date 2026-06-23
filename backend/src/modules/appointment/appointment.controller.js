const AppointmentService = require('./appointment.service');

class AppointmentController {
  async createAppointment(req, res, next) {
    try {
      const data = await AppointmentService.createAppointment(req.user, req.body);
      return res.status(201).json({
        success: true,
        data,
      });
    } catch (error) {
      return next(error);
    }
  }

  async createReceptionistAppointment(req, res, next) {
    try {
      const data = await AppointmentService.createReceptionistAppointment(req.user, req.body);
      return res.status(201).json({
        success: true,
        data,
      });
    } catch (error) {
      return next(error);
    }
  }

  async listMyAppointments(req, res, next) {
    try {
      const result = await AppointmentService.listMyAppointments(req.user, req.query);
      return res.status(200).json({
        success: true,
        data: result.data,
        meta: result.meta,
      });
    } catch (error) {
      return next(error);
    }
  }

  async listAllAppointments(req, res, next) {
    try {
      const result = await AppointmentService.listAllAppointments(req.user, req.query);
      return res.status(200).json({
        success: true,
        data: result.data,
        meta: result.meta,
      });
    } catch (error) {
      return next(error);
    }
  }

  async listDoctorAppointments(req, res, next) {
    try {
      const result = await AppointmentService.listDoctorAppointments(req.user, req.query);
      return res.status(200).json({
        success: true,
        data: result.data,
        meta: result.meta,
      });
    } catch (error) {
      return next(error);
    }
  }

  async getMyAppointmentDetail(req, res, next) {
    try {
      const data = await AppointmentService.getMyAppointmentDetail(req.user, req.params.id);
      return res.status(200).json({
        success: true,
        data,
      });
    } catch (error) {
      return next(error);
    }
  }

  async getAppointmentDetail(req, res, next) {
    try {
      const data = await AppointmentService.getAppointmentDetail(req.user, req.params.id);
      return res.status(200).json({
        success: true,
        data,
      });
    } catch (error) {
      return next(error);
    }
  }

  async cancelMyAppointment(req, res, next) {
    try {
      const data = await AppointmentService.cancelMyAppointment(req.user, req.params.id, req.body);
      return res.status(200).json({
        success: true,
        data,
      });
    } catch (error) {
      return next(error);
    }
  }

  async updateAppointmentStatus(req, res, next) {
    try {
      const data = await AppointmentService.updateAppointmentStatus(req.user, req.params.id, req.body);
      return res.status(200).json({
        success: true,
        data,
      });
    } catch (error) {
      return next(error);
    }
  }

  async updateDoctorAppointmentStatus(req, res, next) {
    try {
      const data = await AppointmentService.updateDoctorAppointmentStatus(req.user, req.params.id, req.body);
      return res.status(200).json({
        success: true,
        data,
      });
    } catch (error) {
      return next(error);
    }
  }

  async receptionistSearchPatients(req, res, next) {
    try {
      const data = await AppointmentService.receptionistSearchPatients(req.user, req.query);
      return res.status(200).json({
        success: true,
        data,
      });
    } catch (error) {
      return next(error);
    }
  }
}

module.exports = new AppointmentController();
