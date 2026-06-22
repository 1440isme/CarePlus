const ApprovalRequestService = require('./approval-request.service');

class ApprovalRequestController {
  async createScheduleException(req, res, next) {
    try {
      const data = await ApprovalRequestService.createScheduleException(req.user, req.body);
      return res.status(201).json({
        success: true,
        data,
      });
    } catch (error) {
      return next(error);
    }
  }

  async listRequests(req, res, next) {
    try {
      const result = await ApprovalRequestService.listRequests(req.user, req.query);
      return res.status(200).json({
        success: true,
        data: result.data,
        meta: result.meta,
      });
    } catch (error) {
      return next(error);
    }
  }

  async getRequestDetail(req, res, next) {
    try {
      const data = await ApprovalRequestService.getRequestDetail(req.user, req.params.id);
      return res.status(200).json({
        success: true,
        data,
      });
    } catch (error) {
      return next(error);
    }
  }

  async approveRequest(req, res, next) {
    try {
      const data = await ApprovalRequestService.approveRequest(req.user, req.params.id);
      return res.status(200).json({
        success: true,
        data,
      });
    } catch (error) {
      return next(error);
    }
  }

  async rejectRequest(req, res, next) {
    try {
      const data = await ApprovalRequestService.rejectRequest(req.user, req.params.id, req.body);
      return res.status(200).json({
        success: true,
        data,
      });
    } catch (error) {
      return next(error);
    }
  }
}

module.exports = new ApprovalRequestController();
