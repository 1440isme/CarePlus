const SpecialtyService = require('./specialty.service');

class SpecialtyController {
  async listPublicSpecialties(req, res, next) {
    try {
      const result = await SpecialtyService.listPublicSpecialties(req.query);
      return res.status(200).json({
        success: true,
        data: result.data,
        meta: result.meta,
      });
    } catch (error) {
      return next(error);
    }
  }

  async listSpecialties(req, res, next) {
    try {
      const result = await SpecialtyService.listSpecialties(req.query);
      return res.status(200).json({
        success: true,
        data: result.data,
        meta: result.meta,
      });
    } catch (error) {
      return next(error);
    }
  }

  async getSpecialtyById(req, res, next) {
    try {
      const data = await SpecialtyService.getSpecialtyById(req.params.id);
      return res.status(200).json({
        success: true,
        data,
      });
    } catch (error) {
      return next(error);
    }
  }

  async createSpecialty(req, res, next) {
    try {
      const data = await SpecialtyService.createSpecialty(req.user, req.body);
      return res.status(201).json({
        success: true,
        data,
      });
    } catch (error) {
      return next(error);
    }
  }

  async updateSpecialty(req, res, next) {
    try {
      const data = await SpecialtyService.updateSpecialty(req.user, req.params.id, req.body);
      return res.status(200).json({
        success: true,
        data,
      });
    } catch (error) {
      return next(error);
    }
  }

  async deleteSpecialty(req, res, next) {
    try {
      const data = await SpecialtyService.deleteSpecialty(req.user, req.params.id);
      return res.status(200).json({
        success: true,
        data,
      });
    } catch (error) {
      return next(error);
    }
  }
}

module.exports = new SpecialtyController();
