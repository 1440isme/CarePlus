const BaseRepository = require('./base.repository');

class DoctorRepository extends BaseRepository {
  constructor() {
    super('Doctor');
  }

  // Define custom query methods here if needed
}

module.exports = new DoctorRepository();
