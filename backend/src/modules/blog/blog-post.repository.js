const BaseRepository = require('../../shared/repositories/base.repository');

class BlogPostRepository extends BaseRepository {
  constructor() {
    super('BlogPost');
  }
}

module.exports = new BlogPostRepository();
