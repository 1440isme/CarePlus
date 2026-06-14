const BaseRepository = require('./base.repository');

class PatientProfileRepository extends BaseRepository {
  constructor() {
    super('PatientProfile');
  }

  // Define custom query methods here if needed
}

module.exports = new PatientProfileRepository();
