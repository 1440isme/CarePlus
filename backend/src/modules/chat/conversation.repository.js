const BaseRepository = require('../../shared/repositories/base.repository');

class ConversationRepository extends BaseRepository {
  constructor() {
    super('Conversation');
  }
}

module.exports = new ConversationRepository();
