const BaseRepository = require('../../shared/repositories/base.repository');

class TimeSlotRepository extends BaseRepository {
  constructor() {
    super('TimeSlot');
  }
}

module.exports = new TimeSlotRepository();
