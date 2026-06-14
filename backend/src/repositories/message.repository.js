const BaseRepository = require('./base.repository');

class MessageRepository extends BaseRepository {
  constructor() {
    super('Message');
  }

  // Define custom query methods here if needed
}

module.exports = new MessageRepository();
