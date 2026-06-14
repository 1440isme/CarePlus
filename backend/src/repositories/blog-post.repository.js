const BaseRepository = require('./base.repository');

class BlogPostRepository extends BaseRepository {
  constructor() {
    super('BlogPost');
  }

  // Define custom query methods here if needed
}

module.exports = new BlogPostRepository();
