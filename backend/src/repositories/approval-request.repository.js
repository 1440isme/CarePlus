const BaseRepository = require('./base.repository');

class ApprovalRequestRepository extends BaseRepository {
  constructor() {
    super('ApprovalRequest');
  }

  // Define custom query methods here if needed
}

module.exports = new ApprovalRequestRepository();
