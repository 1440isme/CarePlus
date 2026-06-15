const BaseRepository = require('../../shared/repositories/base.repository');

class ScheduleRepository extends BaseRepository {
  constructor() {
    super('Schedule');
  }
}

module.exports = new ScheduleRepository();
