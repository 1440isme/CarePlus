const BaseRepository = require('../../shared/repositories/base.repository');

class SystemSettingRepository extends BaseRepository {
  constructor() {
    super('SystemSetting');
  }
}

module.exports = new SystemSettingRepository();
