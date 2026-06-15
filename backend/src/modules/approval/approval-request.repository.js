const BaseRepository = require('../../shared/repositories/base.repository');

class ApprovalRequestRepository extends BaseRepository {
  constructor() {
    super('ApprovalRequest');
  }
}

module.exports = new ApprovalRequestRepository();
