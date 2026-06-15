const BaseRepository = require('../../shared/repositories/base.repository');

class ReviewRepository extends BaseRepository {
  constructor() {
    super('Review');
  }
}

module.exports = new ReviewRepository();
