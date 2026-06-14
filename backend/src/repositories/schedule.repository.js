const BaseRepository = require('./base.repository');

class ScheduleRepository extends BaseRepository {
  constructor() {
    super('Schedule');
  }

  // Define custom query methods here if needed
}

module.exports = new ScheduleRepository();
