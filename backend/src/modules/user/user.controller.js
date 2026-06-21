const UserService = require('./user.service');

class UserController {
  async getMe(req, res, next) {
    try {
      const data = await UserService.getMe(req.user);
      return res.status(200).json({
        success: true,
        data,
      });
    } catch (error) {
      return next(error);
    }
  }

  async updateMe(req, res, next) {
    try {
      const data = await UserService.updateMe(req.user, req.body);
      return res.status(200).json({
        success: true,
        data,
      });
    } catch (error) {
      return next(error);
    }
  }

  async changeMyPassword(req, res, next) {
    try {
      const data = await UserService.changeMyPassword(req.user, req.body);
      return res.status(200).json({
        success: true,
        data,
      });
    } catch (error) {
      return next(error);
    }
  }

  async listUsers(req, res, next) {
    try {
      const result = await UserService.listUsers(req.query);
      return res.status(200).json({
        success: true,
        data: result.data,
        meta: result.meta,
      });
    } catch (error) {
      return next(error);
    }
  }

  async getUserDetail(req, res, next) {
    try {
      const data = await UserService.getUserDetail(req.user, req.params.id);
      return res.status(200).json({
        success: true,
        data,
      });
    } catch (error) {
      return next(error);
    }
  }

  async adminUpdateUser(req, res, next) {
    try {
      const data = await UserService.adminUpdateUser(req.user, req.params.id, req.body);
      return res.status(200).json({
        success: true,
        data,
      });
    } catch (error) {
      return next(error);
    }
  }

  async createStaffUser(req, res, next) {
    try {
      const data = await UserService.createStaffUser(req.user, req.body);
      return res.status(201).json({
        success: true,
        data,
      });
    } catch (error) {
      return next(error);
    }
  }

  async updateUserStatus(req, res, next) {
    try {
      const data = await UserService.updateUserStatus(req.user, req.params.id, req.body);
      return res.status(200).json({
        success: true,
        data,
      });
    } catch (error) {
      return next(error);
    }
  }

  async resetNoShowCount(req, res, next) {
    try {
      const data = await UserService.resetNoShowCount(req.user, req.params.id);
      return res.status(200).json({
        success: true,
        data,
      });
    } catch (error) {
      return next(error);
    }
  }
}

module.exports = new UserController();
