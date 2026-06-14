const BaseRepository = require('./base.repository');

class UserRepository extends BaseRepository {
  constructor() {
    super('User');
  }

  // Define custom query methods here if needed
}

module.exports = new UserRepository();
