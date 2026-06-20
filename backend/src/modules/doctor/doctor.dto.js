function toDoctorDto(doctor) {
  if (!doctor) {
    return null;
  }

  return {
    id: doctor.id,
    userId: doctor.userId,
    name: doctor.name,
    title: doctor.title,
    specialtyId: doctor.specialtyId,
    specialtyName: doctor.specialtyName,
    experience: doctor.experience,
    price: doctor.price,
    rating: doctor.rating,
    reviewCount: doctor.reviewCount,
    avatar: doctor.avatar,
    description: doctor.description,
    position: doctor.position,
    active: doctor.active,
    createdAt: doctor.createdAt,
    updatedAt: doctor.updatedAt,
    specialty: doctor.specialty
      ? {
          id: doctor.specialty.id,
          name: doctor.specialty.name,
          slug: doctor.specialty.slug,
          active: doctor.specialty.active,
        }
      : undefined,
    user: doctor.user
      ? {
          id: doctor.user.id,
          name: doctor.user.name,
          email: doctor.user.email,
          phone: doctor.user.phone,
          role: doctor.user.role,
          status: doctor.user.status,
          emailVerified: doctor.user.emailVerified,
        }
      : undefined,
  };
}

function toDoctorListDto(doctors) {
  return doctors.map((doctor) => ({
    id: doctor.id,
    userId: doctor.userId,
    name: doctor.name,
    title: doctor.title,
    specialtyId: doctor.specialtyId,
    specialtyName: doctor.specialtyName,
    experience: doctor.experience,
    price: doctor.price,
    rating: doctor.rating,
    reviewCount: doctor.reviewCount,
    avatar: doctor.avatar,
    position: doctor.position,
    active: doctor.active,
  }));
}

function toDoctorDashboardDto(payload) {
  return {
    doctorId: payload.doctorId,
    today: payload.today,
    kpis: {
      totalAppointments: payload.totalAppointments,
      checkedInAppointments: payload.checkedInAppointments,
      completedAppointments: payload.completedAppointments,
      noShowAppointments: payload.noShowAppointments,
    },
    todaySchedule: payload.todaySchedule,
    weeklySchedule: payload.weeklySchedule,
    timeline: payload.timeline,
  };
}

module.exports = {
  toDoctorDto,
  toDoctorListDto,
  toDoctorDashboardDto,
};
