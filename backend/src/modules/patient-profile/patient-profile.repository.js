const BaseRepository = require('../../shared/repositories/base.repository');

class PatientProfileRepository extends BaseRepository {
  constructor() {
    super('PatientProfile');
  }
}

module.exports = new PatientProfileRepository();
