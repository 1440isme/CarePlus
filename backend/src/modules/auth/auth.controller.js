const AuthService = require('./auth.service');

class AuthController {
  async register(req, res, next) {
    try {
      const data = await AuthService.register(req.body);
      return res.status(201).json({
        success: true,
        data,
      });
    } catch (error) {
      return next(error);
    }
  }

  async login(req, res, next) {
    try {
      const data = await AuthService.login(req.body);
      res.cookie(data.refreshCookie.name, data.refreshToken, data.refreshCookie.options);

      return res.status(200).json({
        success: true,
        data: {
          user: data.user,
          accessToken: data.accessToken,
        },
      });
    } catch (error) {
      return next(error);
    }
  }

  async refresh(req, res, next) {
    try {
      const refreshToken = req.cookies?.refreshToken || null;
      const data = await AuthService.refresh(refreshToken);
      return res.status(200).json({
        success: true,
        data,
      });
    } catch (error) {
      return next(error);
    }
  }

  async logout(req, res, next) {
    try {
      const refreshToken = req.cookies?.refreshToken || null;
      const data = await AuthService.logout(refreshToken);
      res.clearCookie(data.refreshCookie.name, data.refreshCookie.options);

      return res.status(200).json({
        success: true,
        data: {
          message: data.message,
        },
      });
    } catch (error) {
      return next(error);
    }
  }

  async verifyEmail(req, res, next) {
    try {
      const data = await AuthService.verifyEmail(req.body);
      return res.status(200).json({
        success: true,
        data,
      });
    } catch (error) {
      return next(error);
    }
  }

  async resendVerificationOtp(req, res, next) {
    try {
      const data = await AuthService.resendVerificationOtp(req.body);
      return res.status(200).json({
        success: true,
        data,
      });
    } catch (error) {
      return next(error);
    }
  }

  async forgotPassword(req, res, next) {
    try {
      const data = await AuthService.forgotPassword(req.body);
      return res.status(200).json({
        success: true,
        data,
      });
    } catch (error) {
      return next(error);
    }
  }

  async resetPassword(req, res, next) {
    try {
      const data = await AuthService.resetPassword(req.body);
      return res.status(200).json({
        success: true,
        data,
      });
    } catch (error) {
      return next(error);
    }
  }
}

module.exports = new AuthController();
