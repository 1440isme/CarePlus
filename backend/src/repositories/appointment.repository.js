const BaseRepository = require('./base.repository');

class AppointmentRepository extends BaseRepository {
  constructor() {
    super('Appointment');
  }

  // Define custom query methods here if needed
}

module.exports = new AppointmentRepository();
