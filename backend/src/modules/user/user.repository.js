const BaseRepository = require('../../shared/repositories/base.repository');

class UserRepository extends BaseRepository {
  constructor() {
    super('User');
  }
}

module.exports = new UserRepository();
