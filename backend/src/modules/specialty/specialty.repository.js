const BaseRepository = require('../../shared/repositories/base.repository');

class SpecialtyRepository extends BaseRepository {
  constructor() {
    super('Specialty');
  }
}

module.exports = new SpecialtyRepository();
