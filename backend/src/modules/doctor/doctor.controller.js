const DoctorService = require('./doctor.service');

class DoctorController {
  async listDoctors(req, res, next) {
    try {
      const result = await DoctorService.listDoctors(req.query);
      return res.status(200).json({
        success: true,
        data: result.data,
        meta: result.meta,
      });
    } catch (error) {
      return next(error);
    }
  }

  async getDoctorById(req, res, next) {
    try {
      const data = await DoctorService.getDoctorById(req.params.id);
      return res.status(200).json({
        success: true,
        data,
      });
    } catch (error) {
      return next(error);
    }
  }

  async getMyDoctorProfile(req, res, next) {
    try {
      const data = await DoctorService.getMyDoctorProfile(req.user);
      return res.status(200).json({
        success: true,
        data,
      });
    } catch (error) {
      return next(error);
    }
  }

  async updateMyDoctorProfile(req, res, next) {
    try {
      const data = await DoctorService.updateMyDoctorProfile(req.user, req.body);
      return res.status(200).json({
        success: true,
        data,
      });
    } catch (error) {
      return next(error);
    }
  }

  async updateDoctorPrice(req, res, next) {
    try {
      const data = await DoctorService.updateDoctorPrice(req.params.id, req.body);
      return res.status(200).json({
        success: true,
        data,
      });
    } catch (error) {
      return next(error);
    }
  }

  async updateDoctorByAdmin(req, res, next) {
    try {
      const data = await DoctorService.updateDoctorByAdmin(req.params.id, req.body);
      return res.status(200).json({
        success: true,
        data,
      });
    } catch (error) {
      return next(error);
    }
  }

  async getDoctorDashboard(req, res, next) {
    try {
      const data = await DoctorService.getDoctorDashboard(req.user);
      return res.status(200).json({
        success: true,
        data,
      });
    } catch (error) {
      return next(error);
    }
  }
}

module.exports = new DoctorController();
