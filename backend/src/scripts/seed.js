const prisma = require('../infrastructure/database/prisma.client');
const bcrypt = require('bcrypt');

function getEndTime(startTime) {
  const [hh, mm] = startTime.split(':').map(Number);
  let endH = hh;
  let endM = mm + 30;
  if (endM >= 60) {
    endH += 1;
    endM -= 60;
  }
  const pad = (n) => String(n).padStart(2, '0');
  return `${pad(endH)}:${pad(endM)}`;
}

async function seed() {
  console.log('Seeding database with the user provided dataset...');

  try {
    await prisma.$connect();

    // 1. Clear database tables in correct order
    console.log('Clearing existing data...');
    await prisma.notification.deleteMany({});
    await prisma.review.deleteMany({});
    await prisma.message.deleteMany({});
    await prisma.conversation.deleteMany({});
    await prisma.appointment.deleteMany({});
    await prisma.timeSlot.deleteMany({});
    await prisma.schedule.deleteMany({});
    await prisma.approvalRequest.deleteMany({});
    await prisma.blogPost.deleteMany({});
    await prisma.patientProfile.deleteMany({});
    await prisma.clinicInfo.deleteMany({});
    await prisma.systemSetting.deleteMany({});
    await prisma.doctor.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.specialty.deleteMany({});
    console.log('Database cleared.');

    // Hash password
    const passwordHash = await bcrypt.hash('123456', 10);

    // 2. Create Specialties from user dataset
    console.log('Creating specialties...');
    const specialtiesData = [
      { id: "s1", name: "Cơ Xương Khớp", slug: "co-xuong-khop", description: "Chẩn đoán và điều trị các bệnh về xương khớp, cột sống, cơ gân.", icon: "Bone", doctorCount: 3, active: true },
      { id: "s2", name: "Tim mạch", slug: "tim-mach", description: "Khám và điều trị các bệnh tim mạch, huyết áp, cholesterol.", icon: "Heart", doctorCount: 2, active: true },
      { id: "s3", name: "Tai Mũi Họng", slug: "tai-mui-hong", description: "Điều trị các bệnh về tai, mũi, họng, viêm amidan, polyp mũi.", icon: "Ear", doctorCount: 2, active: true },
      { id: "s4", name: "Nhi khoa", slug: "nhi-khoa", description: "Chăm sóc sức khỏe toàn diện cho trẻ em từ sơ sinh đến 15 tuổi.", icon: "Baby", doctorCount: 3, active: true },
      { id: "s5", name: "Da liễu", slug: "da-lieu", description: "Điều trị các bệnh da liễu, mụn trứng cá, dị ứng, viêm da.", icon: "Sparkles", doctorCount: 2, active: true },
      { id: "s6", name: "Tiêu hóa", slug: "tieu-hoa", description: "Khám và điều trị các bệnh về dạ dày, ruột, gan, mật.", icon: "Activity", doctorCount: 2, active: true },
      { id: "s7", name: "Sản Phụ khoa", slug: "san-phu-khoa", description: "Chăm sóc sức khỏe phụ nữ, thai sản, phụ khoa toàn diện.", icon: "HeartPulse", doctorCount: 2, active: true },
      { id: "s8", name: "Nội tổng quát", slug: "noi-tong-quat", description: "Khám tổng quát, tầm soát bệnh, điều trị các bệnh nội khoa.", icon: "Stethoscope", doctorCount: 4, active: true }
    ];

    for (const spec of specialtiesData) {
      await prisma.specialty.create({
        data: spec
      });
    }
    console.log(`Created ${specialtiesData.length} specialties.`);

    // 3. Create Users
    console.log('Creating users...');
    const usersData = [
      { id: "u1", name: "Nguyễn Văn A", email: "nguyenvana@email.com", phone: "0901234567", role: "PATIENT", status: "ACTIVE", gender: "MALE", dateOfBirth: new Date("1990-05-15"), noShowCount: 0, emailVerified: true },
      { id: "u2", name: "Trần Thị B", email: "tranthib@email.com", phone: "0912345678", role: "PATIENT", status: "ACTIVE", gender: "FEMALE", dateOfBirth: new Date("1985-08-20"), noShowCount: 1, emailVerified: true },
      { id: "u3", name: "Nguyễn Minh Anh", email: "bsminhanh@careplus.vn", phone: "0987654321", role: "DOCTOR", status: "ACTIVE", gender: "MALE", dateOfBirth: new Date("1980-12-01"), noShowCount: 0, emailVerified: true },
      { id: "u4", name: "Trần Quốc Huy", email: "bsquochuy@careplus.vn", phone: "0976543210", role: "DOCTOR", status: "ACTIVE", gender: "MALE", dateOfBirth: new Date("1978-04-14"), noShowCount: 0, emailVerified: true },
      { id: "u5", name: "Lê Thị Lệ Ngân", email: "letan@careplus.vn", phone: "0965432109", role: "RECEPTIONIST", status: "ACTIVE", gender: "FEMALE", dateOfBirth: new Date("1995-09-01"), noShowCount: 0, emailVerified: true },
      { id: "u6", name: "Admin CarePlus", email: "admin@careplus.vn", phone: "0954321098", role: "ADMIN", status: "ACTIVE", gender: "MALE", dateOfBirth: new Date("1985-01-01"), noShowCount: 0, emailVerified: true },
      { id: "u7", name: "Hoàng Văn F", email: "hoangvanf@email.com", phone: "0945678901", role: "PATIENT", status: "LOCKED", gender: "MALE", dateOfBirth: new Date("1988-12-05"), noShowCount: 3, emailVerified: true },

      // Extra doctor users
      { id: 'u_d3', name: 'Lê Thảo Vy', email: 'bsthaovy@careplus.vn', phone: '0933333333', role: 'DOCTOR', status: 'ACTIVE', gender: 'FEMALE', dateOfBirth: new Date('1989-06-25'), noShowCount: 0, emailVerified: true },
      { id: 'u_d4', name: 'Phạm Hoàng Nam', email: 'bshoangnam@careplus.vn', phone: '0944444444', role: 'DOCTOR', status: 'ACTIVE', gender: 'MALE', dateOfBirth: new Date('1975-10-18'), noShowCount: 0, emailVerified: true },
      { id: 'u_d5', name: 'Nguyễn Thu Hương', email: 'bsthuhuong@careplus.vn', phone: '0955555555', role: 'DOCTOR', status: 'ACTIVE', gender: 'FEMALE', dateOfBirth: new Date('1984-03-30'), noShowCount: 0, emailVerified: true },
      { id: 'u_d6', name: 'Vũ Đức Thành', email: 'bsducthanh@careplus.vn', phone: '0966666666', role: 'DOCTOR', status: 'ACTIVE', gender: 'MALE', dateOfBirth: new Date('1982-08-15'), noShowCount: 0, emailVerified: true },

      // Extra patient users from appointments
      { id: 'u_levanc', name: 'Lê Văn C', email: 'levanc@email.com', phone: '0923456789', role: 'PATIENT', status: 'ACTIVE', gender: 'MALE', dateOfBirth: new Date('1982-03-12'), noShowCount: 0, emailVerified: true },
      { id: 'u_phamthie', name: 'Phạm Thị E', email: 'phamthie@email.com', phone: '0934567890', role: 'PATIENT', status: 'ACTIVE', gender: 'FEMALE', dateOfBirth: new Date('1994-07-24'), noShowCount: 0, emailVerified: true },
      { id: 'u_nguyenthig', name: 'Nguyễn Thị G', email: 'nguyenthig@email.com', phone: '0956789012', role: 'PATIENT', status: 'ACTIVE', gender: 'FEMALE', dateOfBirth: new Date('1991-11-02'), noShowCount: 0, emailVerified: true }
    ];

    for (const u of usersData) {
      await prisma.user.create({
        data: {
          ...u,
          passwordHash
        }
      });
    }
    console.log(`Created ${usersData.length} users.`);

    // 4. Create Doctor Profiles
    console.log('Creating doctor profiles...');
    const doctorsData = [
      {
        id: "d1", userId: "u3", title: "ThS.BS", name: "Nguyễn Minh Anh", specialtyId: "s2", specialtyName: "Tim mạch",
        experience: 18, price: 300000, rating: 4.9, reviewCount: 124, position: "Bác sĩ điều trị", active: true,
        avatar: "https://images.unsplash.com/photo-1612531386530-97286d97c2d2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400&q=80",
        description: "ThS.BS Nguyễn Minh Anh có hơn 18 năm kinh nghiệm trong lĩnh vực tim mạch. Tốt nghiệp Đại học Y Hà Nội, hoàn thành chương trình thạc sĩ tại Pháp. Chuyên sâu về điều trị tăng huyết áp, rối loạn nhịp tim và suy tim."
      },
      {
        id: "d2", userId: "u4", title: "BS.CKII", name: "Trần Quốc Huy", specialtyId: "s1", specialtyName: "Cơ Xương Khớp",
        experience: 12, price: 350000, rating: 4.7, reviewCount: 208, position: "Trưởng khoa", active: true,
        avatar: "https://images.unsplash.com/photo-1612531385446-f7e6d131e1d0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400&q=80",
        description: "BS.CKII Trần Quốc Huy là chuyên gia hàng đầu về cơ xương khớp với 12 năm kinh nghiệm. Đã điều trị thành công cho hàng nghìn bệnh nhân mắc bệnh thoái hóa khớp, viêm khớp dạng thấp."
      },
      {
        id: "d3", userId: "u_d3", title: "BS", name: "Lê Thảo Vy", specialtyId: "s4", specialtyName: "Nhi khoa",
        experience: 8, price: 250000, rating: 4.8, reviewCount: 89, position: "Bác sĩ điều trị", active: true,
        avatar: "https://images.unsplash.com/photo-1659353888906-adb3e0041693?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400&q=80",
        description: "BS Lê Thảo Vy là bác sĩ nhi khoa tận tâm với 8 năm kinh nghiệm. Chuyên về chăm sóc sức khỏe trẻ em, tư vấn dinh dưỡng và phát triển cho trẻ từ sơ sinh đến tuổi vị thành niên."
      },
      {
        id: "d4", userId: "u_d4", title: "TS.BS", name: "Phạm Hoàng Nam", specialtyId: "s6", specialtyName: "Tiêu hóa",
        experience: 25, price: 400000, rating: 5.0, reviewCount: 312, position: "Trưởng khoa", active: true,
        avatar: "https://images.unsplash.com/photo-1645066928295-2506defde470?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400&q=80",
        description: "TS.BS Phạm Hoàng Nam là tiến sĩ y học với 25 năm kinh nghiệm trong lĩnh vực tiêu hóa. Chuyên sâu về nội soi tiêu hóa, điều trị viêm loét dạ dày, bệnh gan và các rối loạn tiêu hóa phức tạp."
      },
      {
        id: "d5", userId: "u_d5", title: "BS.CKI", name: "Nguyễn Thu Hương", specialtyId: "s5", specialtyName: "Da liễu",
        experience: 12, price: 280000, rating: 4.7, reviewCount: 156, position: "Bác sĩ điều trị", active: true,
        avatar: "https://images.unsplash.com/photo-1740153204572-5ab53aa9e901?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400&q=80",
        description: "BS.CKI Nguyễn Thu Hương là chuyên gia da liễu với 12 năm kinh nghiệm. Chuyên điều trị các bệnh da liễu như mụn, chàm, vảy nến và tư vấn chăm sóc da chuyên sâu."
      },
      {
        id: "d6", userId: "u_d6", title: "ThS.BS", name: "Vũ Đức Thành", specialtyId: "s8", specialtyName: "Nội tổng quát",
        experience: 10, price: 200000, rating: 4.6, reviewCount: 98, position: "Bác sĩ điều trị", active: true,
        avatar: "https://images.unsplash.com/photo-1612531386530-97286d97c2d2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400&q=80",
        description: "ThS.BS Vũ Đức Thành có 10 năm kinh nghiệm trong lĩnh vực nội khoa tổng quát. Chuyên khám tầm soát sức khỏe định kỳ, phát hiện sớm và điều trị các bệnh mãn tính."
      }
    ];

    for (const doc of doctorsData) {
      await prisma.doctor.create({
        data: doc
      });
    }
    console.log(`Created ${doctorsData.length} doctor profiles.`);

    // 5. Update Specialty Doctor Counts based on actual seeded doctors
    for (const spec of specialtiesData) {
      const count = await prisma.doctor.count({ where: { specialtyId: spec.id } });
      await prisma.specialty.update({
        where: { id: spec.id },
        data: { doctorCount: count }
      });
    }
    console.log('Updated specialty doctor counts.');

    // 6. Create Patient Profiles (Relatives) for u_levanc
    console.log('Creating patient relatives...');
    await prisma.patientProfile.create({
      data: {
        id: 'pp_leminhd',
        userId: 'u_levanc',
        fullName: 'Lê Minh D',
        phone: '0923456789',
        gender: 'MALE',
        dateOfBirth: new Date('2018-05-10'),
        relationship: 'CON',
        isDefault: false,
        isActive: true
      }
    });

    // 7. Create System Settings & Clinic Info
    console.log('Creating settings and clinic info...');
    await prisma.systemSetting.create({
      data: {
        maxBookingDaysAhead: 7,
        slotDurationMinutes: 30,
        cancelBeforeHours: 2,
        maxNoShowBeforeLock: 3,
        maxActiveAppointmentsPerUser: 5,
        morningShiftStart: '08:00',
        morningShiftEnd: '11:30',
        afternoonShiftStart: '13:30',
        afternoonShiftEnd: '17:00'
      }
    });

    await prisma.clinicInfo.create({
      data: {
        name: 'Hệ thống Phòng khám Đa khoa Quốc tế CarePlus',
        address: 'Tòa nhà Savico, 662-664 Sư Vạn Hạnh, Phường 12, Quận 10, TP. Hồ Chí Minh',
        hotline: '1800 6116',
        email: 'info@careplus.vn',
        workingHours: 'Thứ 2 - Thứ 7: 08:00 - 17:00 | Chủ nhật: 08:00 - 12:00',
        description: 'CarePlus là thành viên của Singapore Health Partners, mang lại dịch vụ chăm sóc sức khỏe chất lượng cao tiêu chuẩn Singapore.'
      }
    });

    // 8. Generate working schedules and time slots according to user's schedule rules
    console.log('Generating working schedules and time slots...');
    const start = new Date('2026-06-01');
    const end = new Date();
    end.setDate(end.getDate() + 30);

    const unavailableMap = {
      "d1-2026-06-10": ["09:30", "10:00"],
      "d1-2026-06-11": ["08:00", "13:30"],
      "d2-2026-06-10": ["14:00", "14:30", "15:00"],
      "d3-2026-06-09": ["08:30"]
    };

    const morningHours = ["08:00", "08:30", "09:00", "09:30", "10:00", "10:30", "11:00"];
    const afternoonHours = ["13:30", "14:00", "14:30", "15:00", "15:30", "16:00", "16:30"];

    // Appointments we need to seed
    const appointmentsData = [
      {
        id: "a1", code: "CP20260520001", patientId: "u1",
        doctorId: "d1", specialtyId: "s2", dateStr: "2026-06-10", time: "09:00",
        status: "CHECKED_IN", bookingChannel: "ONLINE", forSelf: true,
        price: 300000, reason: "Đau ngực, khó thở khi gắng sức", patientEmail: "nguyenvana@email.com"
      },
      {
        id: "a2", code: "CP20260520002", patientId: "u2",
        doctorId: "d2", specialtyId: "s1", dateStr: "2026-06-09", time: "14:00",
        status: "CONFIRMED", bookingChannel: "ONLINE", forSelf: true,
        price: 350000, reason: "Đau khớp gối trái", patientEmail: "tranthib@email.com"
      },
      {
        id: "a3", code: "CP20260520003", patientId: "u_levanc", patientProfileId: "pp_leminhd",
        doctorId: "d3", specialtyId: "s4", dateStr: "2026-06-05", time: "08:30",
        status: "COMPLETED", bookingChannel: "RECEPTION", forSelf: false, relativeName: "Lê Minh D (Con)",
        price: 250000, reason: "Trẻ sốt cao, ho nhiều", patientEmail: "levanc@email.com"
      },
      {
        id: "a4", code: "CP20260520004", patientId: "u_phamthie",
        doctorId: "d4", specialtyId: "s6", dateStr: "2026-06-03", time: "15:00",
        status: "CHECKED_IN", bookingChannel: "ONLINE", forSelf: true,
        price: 400000, reason: "Đau bụng, tiêu chảy", patientEmail: "phamthie@email.com"
      },
      {
        id: "a5", code: "CP20260520005", patientId: "u7",
        doctorId: "d1", specialtyId: "s2", dateStr: "2026-06-01", time: "10:30",
        status: "COMPLETED", bookingChannel: "ONLINE", forSelf: true,
        price: 300000, reason: "Kiểm tra tim định kỳ", patientEmail: "hoangvanf@email.com"
      },
      {
        id: "a6", code: "CP20260520006", patientId: "u_nguyenthig",
        doctorId: "d5", specialtyId: "s5", dateStr: "2026-06-11", time: "09:30",
        status: "CONFIRMED", bookingChannel: "ONLINE", forSelf: true,
        price: 280000, reason: "Nổi mụn nhiều, da dầu", patientEmail: "nguyenthig@email.com"
      },
      {
        id: "a7", code: "CP20260520007", patientId: "u_levanc", patientProfileId: "pp_leminhd",
        doctorId: "d3", specialtyId: "s4", dateStr: "2026-06-05", time: "09:00",
        status: "NO_SHOW", bookingChannel: "RECEPTION", forSelf: false, relativeName: "Lê Minh D (Con)",
        price: 250000, reason: "Trẻ sốt cao, ho nhiều", patientEmail: "levanc@email.com"
      },
      {
        id: "a20", code: "CP20260520020", patientId: "u_levanc", patientProfileId: "pp_leminhd",
        doctorId: "d3", specialtyId: "s4", dateStr: "2026-06-05", time: "09:30",
        status: "COMPLETED", bookingChannel: "RECEPTION", forSelf: false, relativeName: "Lê Minh D (Con)",
        price: 250000, reason: "Trẻ sốt cao, ho nhiều", patientEmail: "levanc@email.com"
      }
    ];

    // Build doctor-date appointment sets to force schedule generation
    const appointmentDates = {};
    for (const appt of appointmentsData) {
      if (!appointmentDates[appt.doctorId]) {
        appointmentDates[appt.doctorId] = new Set();
      }
      appointmentDates[appt.doctorId].add(appt.dateStr);
    }

    // Schedule rules
    const scheduleRules = [
      { doctorId: "d1", weekdays: [1, 2, 3, 4, 5], shift: "BOTH" },
      { doctorId: "d2", weekdays: [1, 3, 5], shift: "MORNING" },
      { doctorId: "d3", weekdays: [2, 4, 6], shift: "BOTH" },
      { doctorId: "d4", weekdays: [1, 2, 3, 4, 5], shift: "AFTERNOON" },
      { doctorId: "d5", weekdays: [1, 2, 3, 4, 5], shift: "BOTH" },
      { doctorId: "d6", weekdays: [1, 2, 3, 4, 5], shift: "BOTH" }
    ];

    const schedulesToCreate = [];
    const slotsToCreate = [];

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const workingDate = new Date(d);
      const dateStr = workingDate.toISOString().slice(0, 10);
      const dayOfWeek = workingDate.getDay(); // 0 = Sun, 1 = Mon, ..., 6 = Sat

      for (const rule of scheduleRules) {
        const docId = rule.doctorId;
        const matchesRule = rule.weekdays.includes(dayOfWeek);
        const hasAppointment = appointmentDates[docId]?.has(dateStr);

        if (matchesRule || hasAppointment) {
          const scheduleId = `sched_${docId}_${dateStr}`;
          const dbShift = rule.shift === 'BOTH' ? 'ALL_DAY' : rule.shift;

          schedulesToCreate.push({
            id: scheduleId,
            doctorId: docId,
            workingDate,
            workingShift: dbShift,
            status: 'WORKING'
          });

          // Exceptions:
          // r3 states d3 is off AFTERNOON shift on 2026-06-12 (Approved exception)
          const isD3OffAfternoon = docId === 'd3' && dateStr === '2026-06-12';

          // Generate Morning TimeSlots
          morningHours.forEach((time, idx) => {
            const matchesShift = rule.shift === 'BOTH' || rule.shift === 'MORNING';
            const hasApptAtTime = appointmentsData.some(a => a.doctorId === docId && a.dateStr === dateStr && a.time === time);

            if (matchesShift || hasApptAtTime) {
              const endTime = idx === morningHours.length - 1 ? '11:30' : morningHours[idx + 1];
              const slotId = `slot_${docId}_${dateStr}_${time}`;
              const isUnavailable = unavailableMap[`${docId}-${dateStr}`]?.includes(time);

              slotsToCreate.push({
                id: slotId,
                scheduleId,
                workingShift: 'MORNING',
                startTime: time,
                endTime,
                status: isUnavailable ? 'LOCKED' : 'AVAILABLE'
              });
            }
          });

          // Generate Afternoon TimeSlots
          if (!isD3OffAfternoon) {
            afternoonHours.forEach((time, idx) => {
              const matchesShift = rule.shift === 'BOTH' || rule.shift === 'AFTERNOON';
              const hasApptAtTime = appointmentsData.some(a => a.doctorId === docId && a.dateStr === dateStr && a.time === time);

              if (matchesShift || hasApptAtTime) {
                const endTime = idx === afternoonHours.length - 1 ? '17:00' : afternoonHours[idx + 1];
                const slotId = `slot_${docId}_${dateStr}_${time}`;
                const isUnavailable = unavailableMap[`${docId}-${dateStr}`]?.includes(time);

                slotsToCreate.push({
                  id: slotId,
                  scheduleId,
                  workingShift: 'AFTERNOON',
                  startTime: time,
                  endTime,
                  status: isUnavailable ? 'LOCKED' : 'AVAILABLE'
                });
              }
            });
          }
        }
      }
    }

    console.log(`Inserting ${schedulesToCreate.length} schedules...`);
    await prisma.schedule.createMany({ data: schedulesToCreate });

    console.log(`Inserting ${slotsToCreate.length} time slots...`);
    await prisma.timeSlot.createMany({ data: slotsToCreate });

    // 9. Create Seeded Appointments and update their slots to BOOKED
    console.log('Creating appointments...');
    for (const appt of appointmentsData) {
      const dateObj = new Date(appt.dateStr);
      const slotId = `slot_${appt.doctorId}_${appt.dateStr}_${appt.time}`;
      const scheduleId = `sched_${appt.doctorId}_${appt.dateStr}`;
      const endTime = getEndTime(appt.time);

      const createdBy = appt.bookingChannel === 'ONLINE' ? appt.patientId : 'u5'; // u5 is receptionist
      const bookingSource = appt.bookingChannel === 'ONLINE' ? 'PATIENT_WEB' : 'RECEPTIONIST';

      // Look up user info
      let user = null;
      if (appt.patientId) {
        user = usersData.find(u => u.id === appt.patientId);
      }

      let pName = appt.patientName || (user ? user.name : null);
      let pPhone = appt.patientPhone || (user ? user.phone : null);
      let pGender = appt.patientGender || (user ? user.gender : null);
      let pDob = appt.patientDob || (user ? user.dateOfBirth : null);
      let pAddress = appt.patientAddress || (user ? user.address : null);

      if (appt.patientProfileId === 'pp_leminhd') {
        pName = 'Lê Minh D';
        pPhone = '0923456789';
        pGender = 'MALE';
        pDob = new Date('2018-05-10');
        pAddress = null;
      }

      // Update slot status to BOOKED
      await prisma.timeSlot.update({
        where: { id: slotId },
        data: { status: 'BOOKED' }
      });

      // Create appointment
      await prisma.appointment.create({
        data: {
          id: appt.id,
          code: appt.code,
          patientId: appt.patientId,
          patientName: pName,
          patientPhone: pPhone,
          patientGender: pGender,
          patientDob: pDob,
          patientAddress: pAddress,
          patientProfileId: appt.patientProfileId || null,
          doctorId: appt.doctorId,
          specialtyId: appt.specialtyId,
          scheduleId: scheduleId,
          timeSlotId: slotId,
          appointmentDate: dateObj,
          startTime: appt.time,
          endTime: endTime,
          status: appt.status,
          bookingChannel: appt.bookingChannel,
          bookingSource: bookingSource,
          createdBy: createdBy,
          forSelf: appt.forSelf,
          relativeName: appt.relativeName || null,
          consultationFee: appt.price,
          patientEmail: appt.patientEmail,
          reason: appt.reason || null
        }
      });
    }
    console.log('Appointments created successfully.');

    // 10. Create Reviews
    console.log('Creating reviews...');
    const mockReviews = [
      { id: 'rv1', appointmentId: 'a1', rating: 5, comment: 'Bác sĩ rất tận tâm, giải thích rõ ràng và chi tiết. Tôi rất hài lòng với buổi khám.', dateStr: '2026-06-10' },
      { id: 'rv2', appointmentId: 'a2', rating: 4, comment: 'Khám nhanh, chuyên nghiệp. Bác sĩ có kinh nghiệm và thái độ tốt.', dateStr: '2026-06-08' },
      { id: 'rv3', appointmentId: 'a3', rating: 5, comment: 'Bác sĩ giỏi, chẩn đoán chính xác và tư vấn rất cụ thể. Sẽ quay lại lần sau.', dateStr: '2026-06-05' },
      { id: 'rv4', appointmentId: 'a4', rating: 4, comment: 'Hài lòng với dịch vụ. Chờ đợi hơi lâu nhưng bác sĩ khám kỹ.', dateStr: '2026-06-03' },
      { id: 'rv5', appointmentId: 'a5', rating: 5, comment: 'Xuất sắc! Bác sĩ rất kiên nhẫn lắng nghe và đưa ra phác đồ điều trị phù hợp.', dateStr: '2026-06-01' },
      { id: 'rv6', appointmentId: 'a6', rating: 4, comment: 'Tốt, sẽ giới thiệu cho bạn bè. Bác sĩ có chuyên môn cao.', dateStr: '2026-05-28' },
      { id: 'rv7', appointmentId: 'a7', rating: 3, comment: 'Khám ổn, tuy nhiên cần thêm thời gian giải thích cho bệnh nhân.', dateStr: '2026-05-25' },
      { id: 'rv8', appointmentId: 'a20', rating: 5, comment: 'Bác sĩ rất giỏi, tư vấn chi tiết và nhiệt tình.', dateStr: '2026-06-12' },
    ];

    for (const rv of mockReviews) {
      const appt = await prisma.appointment.findUnique({ where: { id: rv.appointmentId } });
      if (appt) {
        await prisma.review.create({
          data: {
            id: rv.id,
            appointmentId: rv.appointmentId,
            doctorId: appt.doctorId,
            patientId: appt.patientId || 'u1',
            patientName: appt.patientName || 'Bệnh nhân',
            rating: rv.rating,
            comment: rv.comment,
            createdAt: new Date(rv.dateStr),
            updatedAt: new Date(rv.dateStr)
          }
        });
      }
    }
    console.log('Reviews created.');

    // 11. Update Doctor Ratings based on actual reviews
    console.log('Updating doctor ratings and review counts...');
    const dbDoctors = await prisma.doctor.findMany({});
    for (const doc of dbDoctors) {
      const reviews = await prisma.review.findMany({ where: { doctorId: doc.id } });
      if (reviews.length > 0) {
        const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);
        const average = Math.round((totalRating / reviews.length) * 10) / 10;
        await prisma.doctor.update({
          where: { id: doc.id },
          data: {
            rating: average,
            reviewCount: reviews.length
          }
        });
      }
    }
    console.log('Doctor ratings and review counts updated.');

    // 12. Create Blog Posts
    console.log('Creating blog posts...');
    await prisma.blogPost.createMany({
      data: [
        {
          id: "b1",
          title: "Phòng ngừa bệnh tim mạch hiệu quả tại nhà",
          slug: "phong-ngua-benh-tim-mach",
          summary: "Những biện pháp đơn giản giúp bảo vệ trái tim khỏe mạnh mỗi ngày.",
          content: "Bệnh tim mạch là nguyên nhân hàng đầu gây tử vong trên thế giới. Tuy nhiên, nhiều trường hợp có thể phòng ngừa được thông qua lối sống lành mạnh...",
          thumbnail: "https://images.unsplash.com/photo-1761258747617-822222c941aa?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=600&q=80",
          status: "PUBLISHED",
          tags: "Tim mạch",
          authorId: "u6",
          createdAt: new Date("2026-05-20"),
          updatedAt: new Date("2026-05-21")
        },
        {
          id: "b2",
          title: "Chế độ ăn uống tốt cho người bệnh tiêu hóa",
          slug: "che-do-an-uong-tieu-hoa",
          summary: "Hướng dẫn dinh dưỡng cho bệnh nhân viêm loét dạ dày và các bệnh tiêu hóa.",
          content: "Chế độ ăn uống đúng cách là yếu tố then chốt trong điều trị bệnh tiêu hóa. Bệnh nhân cần tránh thức ăn cay nóng, nhiều dầu mỡ...",
          thumbnail: "https://images.unsplash.com/photo-1759987383760-327efaf5522a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=600&q=80",
          status: "PUBLISHED",
          tags: "Tiêu hóa",
          authorId: "u6",
          createdAt: new Date("2026-05-15"),
          updatedAt: new Date("2026-05-16")
        },
        {
          id: "b3",
          title: "Cách chăm sóc da đúng cách trong mùa hè",
          slug: "cham-soc-da-mua-he",
          summary: "Bí quyết bảo vệ làn da khỏi tác hại của ánh nắng mặt trời.",
          content: "Mùa hè là thời điểm da dễ bị tổn thương nhất do tia UV. Việc chăm sóc da đúng cách không chỉ giúp da đẹp mà còn ngăn ngừa ung thư da...",
          thumbnail: "https://images.unsplash.com/photo-1777269749032-d8d458ae594d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=600&q=80",
          status: "PUBLISHED",
          tags: "Da liễu",
          authorId: "u6",
          createdAt: new Date("2026-05-10"),
          updatedAt: new Date("2026-05-11")
        },
        {
          id: "b4",
          title: "Dinh dưỡng cho trẻ em trong giai đoạn phát triển",
          slug: "dinh-duong-tre-em",
          summary: "Những thực phẩm cần thiết giúp trẻ phát triển toàn diện cả thể chất lẫn trí tuệ.",
          content: "Giai đoạn từ 0-5 tuổi là thời kỳ vàng cho sự phát triển của trẻ. Dinh dưỡng đầy đủ và cân bằng là nền tảng cho sức khỏe tương lai...",
          thumbnail: "https://images.unsplash.com/photo-1643877107082-8ee9da17c090?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=600&q=80",
          status: "PUBLISHED",
          tags: "Nhi khoa",
          authorId: "u6",
          createdAt: new Date("2026-05-05"),
          updatedAt: new Date("2026-05-06")
        }
      ]
    });
    console.log('Blog posts created.');

    // 13. Create Approval Requests
    console.log('Creating approval requests...');
    await prisma.approvalRequest.createMany({
      data: [
        {
          id: "r1",
          type: "SCHEDULE_EXCEPTION",
          doctorId: "d1",
          doctorName: "Nguyễn Minh Anh",
          date: new Date("2026-06-15"),
          reason: "Tham dự hội nghị tim mạch quốc tế",
          status: "PENDING",
          exceptionType: "ALL_DAY"
        },
        {
          id: "r2",
          type: "CANCELLATION",
          doctorId: "d2",
          doctorName: "Trần Quốc Huy",
          reason: "Bệnh nhân không liên lạc được, yêu cầu hủy lịch",
          appointmentCode: "CP20260520002",
          status: "PENDING"
        },
        {
          id: "r3",
          type: "SCHEDULE_EXCEPTION",
          doctorId: "d3",
          doctorName: "Lê Thảo Vy",
          date: new Date("2026-06-12"),
          reason: "Khám sức khỏe định kỳ cá nhân, nghỉ ca chiều",
          status: "APPROVED",
          exceptionType: "SHIFT",
          shift: "AFTERNOON"
        }
      ]
    });
    console.log('Approval requests created.');

    console.log('\n=============================================');
    console.log('Database seeding finished successfully!');
    console.log('Logins (Password: 123456):');
    console.log('- Admin: admin@careplus.vn');
    console.log('- Receptionist: letan@careplus.vn');
    console.log('- Patient: nguyenvana@email.com');
    console.log('- Doctor: bsminhanh@careplus.vn');
    console.log('=============================================');
  } catch (err) {
    console.error('Seeding database failed:', err);
  } finally {
    await prisma.$disconnect();
  }
}

seed();
