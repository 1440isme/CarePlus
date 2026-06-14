const BaseRepository = require('./base.repository');

class ClinicInfoRepository extends BaseRepository {
  constructor() {
    super('ClinicInfo');
  }

  // Define custom query methods here if needed
}

module.exports = new ClinicInfoRepository();
