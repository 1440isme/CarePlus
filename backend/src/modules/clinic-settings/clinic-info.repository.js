const BaseRepository = require('../../shared/repositories/base.repository');

class ClinicInfoRepository extends BaseRepository {
  constructor() {
    super('ClinicInfo');
  }
}

module.exports = new ClinicInfoRepository();
