const BaseRepository = require('../../shared/repositories/base.repository');

class AppointmentRepository extends BaseRepository {
  constructor() {
    super('Appointment');
  }
}

module.exports = new AppointmentRepository();
