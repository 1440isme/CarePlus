const ClinicSettingsService = require('./clinic-settings.service');
const prisma = require('../../infrastructure/database/prisma.client');

class ClinicSettingsController {
  async getPublicClinicInfo(req, res, next) {
    try {
      const data = await ClinicSettingsService.getPublicClinicInfo();
      return res.status(200).json({
        success: true,
        data,
      });
    } catch (error) {
      return next(error);
    }
  }

  async updateClinicInfo(req, res, next) {
    try {
      const data = await ClinicSettingsService.updateClinicInfo(req.user, req.body);
      return res.status(200).json({
        success: true,
        data,
      });
    } catch (error) {
      return next(error);
    }
  }

  async getSystemSetting(req, res, next) {
    try {
      const data = await ClinicSettingsService.getSystemSetting(req.user);
      return res.status(200).json({
        success: true,
        data,
      });
    } catch (error) {
      return next(error);
    }
  }

  async getPublicSystemSetting(req, res, next) {
    try {
      const data = await ClinicSettingsService.getPublicSystemSetting();
      return res.status(200).json({
        success: true,
        data,
      });
    } catch (error) {
      return next(error);
    }
  }

  async getBookingRules(req, res, next) {
    try {
      const data = await ClinicSettingsService.getBookingRules();
      return res.status(200).json({
        success: true,
        data,
      });
    } catch (error) {
      return next(error);
    }
  }

  async updateSystemSetting(req, res, next) {
    try {
      const data = await ClinicSettingsService.updateSystemSetting(req.user, req.body);
      return res.status(200).json({
        success: true,
        data,
      });
    } catch (error) {
      return next(error);
    }
  }

  async getPublicStats(req, res, next) {
    try {
      const patientCount = await prisma.user.count({
        where: { role: 'PATIENT' }
      });
      const doctorCount = await prisma.doctor.count({
        where: { active: true }
      });
      const specialtyCount = await prisma.specialty.count({
        where: { active: true }
      });

      return res.status(200).json({
        success: true,
        data: {
          patientCount,
          doctorCount,
          specialtyCount
        }
      });
    } catch (error) {
      return next(error);
    }
  }
}

module.exports = new ClinicSettingsController();
