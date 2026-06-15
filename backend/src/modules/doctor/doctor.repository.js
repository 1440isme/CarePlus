const BaseRepository = require('../../shared/repositories/base.repository');

class DoctorRepository extends BaseRepository {
  constructor() {
    super('Doctor');
  }
}

module.exports = new DoctorRepository();
