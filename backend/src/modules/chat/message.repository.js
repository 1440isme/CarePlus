const BaseRepository = require('../../shared/repositories/base.repository');

class MessageRepository extends BaseRepository {
  constructor() {
    super('Message');
  }
}

module.exports = new MessageRepository();
