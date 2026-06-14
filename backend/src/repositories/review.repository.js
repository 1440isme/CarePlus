const BaseRepository = require('./base.repository');

class ReviewRepository extends BaseRepository {
  constructor() {
    super('Review');
  }

  // Define custom query methods here if needed
}

module.exports = new ReviewRepository();
