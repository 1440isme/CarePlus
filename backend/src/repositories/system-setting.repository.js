const BaseRepository = require('./base.repository');

class SystemSettingRepository extends BaseRepository {
  constructor() {
    super('SystemSetting');
  }

  // Define custom query methods here if needed
}

module.exports = new SystemSettingRepository();
