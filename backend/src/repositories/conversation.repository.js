const BaseRepository = require('./base.repository');

class ConversationRepository extends BaseRepository {
  constructor() {
    super('Conversation');
  }

  // Define custom query methods here if needed
}

module.exports = new ConversationRepository();
