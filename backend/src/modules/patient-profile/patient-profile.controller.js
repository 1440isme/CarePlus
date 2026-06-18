const PatientProfileService = require('./patient-profile.service');

class PatientProfileController {
  async listMyProfiles(req, res, next) {
    try {
      const result = await PatientProfileService.listMyProfiles(req.user, req.query);
      return res.status(200).json({
        success: true,
        data: result.data,
        meta: result.meta,
      });
    } catch (error) {
      return next(error);
    }
  }

  async createMyProfile(req, res, next) {
    try {
      const data = await PatientProfileService.createMyProfile(req.user, req.body);
      return res.status(201).json({
        success: true,
        data,
      });
    } catch (error) {
      return next(error);
    }
  }

  async getMyProfileById(req, res, next) {
    try {
      const data = await PatientProfileService.getMyProfileById(req.user, req.params.id);
      return res.status(200).json({
        success: true,
        data,
      });
    } catch (error) {
      return next(error);
    }
  }

  async updateMyProfile(req, res, next) {
    try {
      const data = await PatientProfileService.updateMyProfile(req.user, req.params.id, req.body);
      return res.status(200).json({
        success: true,
        data,
      });
    } catch (error) {
      return next(error);
    }
  }

  async deleteMyProfile(req, res, next) {
    try {
      const data = await PatientProfileService.deleteMyProfile(req.user, req.params.id);
      return res.status(200).json({
        success: true,
        data,
      });
    } catch (error) {
      return next(error);
    }
  }

  async setDefaultProfile(req, res, next) {
    try {
      const data = await PatientProfileService.setDefaultProfile(req.user, req.params.id);
      return res.status(200).json({
        success: true,
        data,
      });
    } catch (error) {
      return next(error);
    }
  }
}

module.exports = new PatientProfileController();
