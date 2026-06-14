const BaseRepository = require('./base.repository');

class SpecialtyRepository extends BaseRepository {
  constructor() {
    super('Specialty');
  }

  // Define custom query methods here if needed
}

module.exports = new SpecialtyRepository();
