const BaseRepository = require('./base.repository');

class TimeSlotRepository extends BaseRepository {
  constructor() {
    super('TimeSlot');
  }

  // Define custom query methods here if needed
}

module.exports = new TimeSlotRepository();
