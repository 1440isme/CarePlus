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
  console.log('Seeding database with the refined, professional dataset...');

  try {
    await prisma.$connect();

    // 1. Clear database tables in correct order to avoid constraint failures
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

    // 2. Create Specialties
    console.log('Creating specialties...');
    const specialtiesData = [
      { id: "s1", name: "Cơ Xương Khớp", slug: "co-xuong-khop", description: "Chẩn đoán và điều trị các bệnh về xương khớp, cột sống, cơ gân.", icon: "Bone", doctorCount: 0, active: true },
      { id: "s2", name: "Tim mạch", slug: "tim-mach", description: "Khám và điều trị các bệnh tim mạch, huyết áp, cholesterol.", icon: "Heart", doctorCount: 0, active: true },
      { id: "s3", name: "Tai Mũi Họng", slug: "tai-mui-hong", description: "Điều trị các bệnh về tai, mũi, họng, viêm amidan, polyp mũi.", icon: "Ear", doctorCount: 0, active: true },
      { id: "s4", name: "Nhi khoa", slug: "nhi-khoa", description: "Chăm sóc sức khỏe toàn diện cho trẻ em từ sơ sinh đến 15 tuổi.", icon: "Baby", doctorCount: 0, active: true },
      { id: "s5", name: "Da liễu", slug: "da-lieu", description: "Điều trị các bệnh da liễu, mụn trứng cá, dị ứng, viêm da.", icon: "Sparkles", doctorCount: 0, active: true },
      { id: "s6", name: "Tiêu hóa", slug: "tieu-hoa", description: "Khám và điều trị các bệnh về dạ dày, ruột, gan, mật.", icon: "Activity", doctorCount: 0, active: true },
      { id: "s7", name: "Sản Phụ khoa", slug: "san-phu-khoa", description: "Chăm sóc sức khỏe phụ nữ, thai sản, phụ khoa toàn diện.", icon: "HeartPulse", doctorCount: 0, active: true },
      { id: "s8", name: "Nội tổng quát", slug: "noi-tong-quat", description: "Khám tổng quát, tầm soát bệnh, điều trị các bệnh nội khoa.", icon: "Stethoscope", doctorCount: 0, active: true }
    ];

    for (const spec of specialtiesData) {
      await prisma.specialty.create({
        data: spec
      });
    }
    console.log(`Created ${specialtiesData.length} specialties.`);

    // 3. Create Users with professional/realistic names
    console.log('Creating users...');
    const usersData = [
      { id: "u1", name: "Nguyễn Anh Tuấn", email: "nguyenanhtuan@email.com", phone: "0901234567", role: "PATIENT", status: "ACTIVE", gender: "MALE", dateOfBirth: new Date("1990-05-15"), noShowCount: 0, emailVerified: true },
      { id: "u2", name: "Trần Thị Thu Trang", email: "tranthithutrang@email.com", phone: "0912345678", role: "PATIENT", status: "ACTIVE", gender: "FEMALE", dateOfBirth: new Date("1985-08-20"), noShowCount: 1, emailVerified: true },
      { id: "u3", name: "Nguyễn Minh Anh", email: "bsminhanh@careplus.vn", phone: "0987654321", role: "DOCTOR", status: "ACTIVE", gender: "MALE", dateOfBirth: new Date("1980-12-01"), noShowCount: 0, emailVerified: true },
      { id: "u4", name: "Trần Quốc Huy", email: "bsquochuy@careplus.vn", phone: "0976543210", role: "DOCTOR", status: "ACTIVE", gender: "MALE", dateOfBirth: new Date("1978-04-14"), noShowCount: 0, emailVerified: true },
      { id: "u5", name: "Lê Thị Lệ Ngân", email: "letan@careplus.vn", phone: "0965432109", role: "RECEPTIONIST", status: "ACTIVE", gender: "FEMALE", dateOfBirth: new Date("1995-09-01"), noShowCount: 0, emailVerified: true },
      { id: "u6", name: "Admin CarePlus", email: "admin@careplus.vn", phone: "0954321098", role: "ADMIN", status: "ACTIVE", gender: "MALE", dateOfBirth: new Date("1985-01-01"), noShowCount: 0, emailVerified: true },
      { id: "u7", name: "Hoàng Minh Đức", email: "hoangminhduc@email.com", phone: "0945678901", role: "PATIENT", status: "LOCKED", gender: "MALE", dateOfBirth: new Date("1988-12-05"), noShowCount: 3, emailVerified: true },

      // Extra doctor users
      { id: 'u_d3', name: 'Lê Thảo Vy', email: 'bsthaovy@careplus.vn', phone: '0933333333', role: 'DOCTOR', status: 'ACTIVE', gender: 'FEMALE', dateOfBirth: new Date('1989-06-25'), noShowCount: 0, emailVerified: true },
      { id: 'u_d4', name: 'Phạm Hoàng Nam', email: 'bshoangnam@careplus.vn', phone: '0944444444', role: 'DOCTOR', status: 'ACTIVE', gender: 'MALE', dateOfBirth: new Date('1975-10-18'), noShowCount: 0, emailVerified: true },
      { id: 'u_d5', name: 'Nguyễn Thu Hương', email: 'bsthuhuong@careplus.vn', phone: '0955555555', role: 'DOCTOR', status: 'ACTIVE', gender: 'FEMALE', dateOfBirth: new Date('1984-03-30'), noShowCount: 0, emailVerified: true },
      { id: 'u_d6', name: 'Vũ Đức Thành', email: 'bsducthanh@careplus.vn', phone: '0966666666', role: 'DOCTOR', status: 'ACTIVE', gender: 'MALE', dateOfBirth: new Date('1982-08-15'), noShowCount: 0, emailVerified: true },

      // Extra patients
      { id: 'u_levanc', name: 'Lê Hoài Nam', email: 'lehoainam@email.com', phone: '0923456789', role: 'PATIENT', status: 'ACTIVE', gender: 'MALE', dateOfBirth: new Date('1982-03-12'), noShowCount: 0, emailVerified: true },
      { id: 'u_phamthie', name: 'Phạm Minh Hằng', email: 'phamminhhang@email.com', phone: '0934567890', role: 'PATIENT', status: 'ACTIVE', gender: 'FEMALE', dateOfBirth: new Date('1994-07-24'), noShowCount: 0, emailVerified: true },
      { id: 'u_nguyenthig', name: 'Nguyễn Khánh Linh', email: 'nguyenkhanhlinh@email.com', phone: '0956789012', role: 'PATIENT', status: 'ACTIVE', gender: 'FEMALE', dateOfBirth: new Date('1991-11-02'), noShowCount: 0, emailVerified: true }
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
        experience: 18, price: 300000, rating: 0.0, reviewCount: 0, position: "Bác sĩ điều trị", active: true,
        avatar: "https://images.unsplash.com/photo-1612531386530-97286d97c2d2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400&q=80",
        description: "ThS.BS Nguyễn Minh Anh có hơn 18 năm kinh nghiệm trong lĩnh vực tim mạch. Tốt nghiệp Đại học Y Hà Nội, hoàn thành chương trình thạc sĩ tại Pháp. Chuyên sâu về điều trị tăng huyết áp, rối loạn nhịp tim và suy tim."
      },
      {
        id: "d2", userId: "u4", title: "BS.CKII", name: "Trần Quốc Huy", specialtyId: "s1", specialtyName: "Cơ Xương Khớp",
        experience: 12, price: 350000, rating: 0.0, reviewCount: 0, position: "Trưởng khoa", active: true,
        avatar: "https://images.unsplash.com/photo-1612531385446-f7e6d131e1d0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400&q=80",
        description: "BS.CKII Trần Quốc Huy là chuyên gia hàng đầu về cơ xương khớp với 12 năm kinh nghiệm. Đã điều trị thành công cho hàng nghìn bệnh nhân mắc bệnh thoái hóa khớp, viêm khớp dạng thấp."
      },
      {
        id: "d3", userId: "u_d3", title: "BS", name: "Lê Thảo Vy", specialtyId: "s4", specialtyName: "Nhi khoa",
        experience: 8, price: 250000, rating: 0.0, reviewCount: 0, position: "Bác sĩ điều trị", active: true,
        avatar: "https://images.unsplash.com/photo-1659353888906-adb3e0041693?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400&q=80",
        description: "BS Lê Thảo Vy là bác sĩ nhi khoa tận tâm với 8 năm kinh nghiệm. Chuyên về chăm sóc sức khỏe trẻ em, tư vấn dinh dưỡng và phát triển cho trẻ từ sơ sinh đến tuổi vị thành niên."
      },
      {
        id: "d4", userId: "u_d4", title: "TS.BS", name: "Phạm Hoàng Nam", specialtyId: "s6", specialtyName: "Tiêu hóa",
        experience: 25, price: 400000, rating: 0.0, reviewCount: 0, position: "Trưởng khoa", active: true,
        avatar: "https://images.unsplash.com/photo-1645066928295-2506defde470?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400&q=80",
        description: "TS.BS Phạm Hoàng Nam là tiến sĩ y học với 25 năm kinh nghiệm trong lĩnh vực tiêu hóa. Chuyên sâu về nội soi tiêu hóa, điều trị viêm loét dạ dày, bệnh gan và các rối loạn tiêu hóa phức tạp."
      },
      {
        id: "d5", userId: "u_d5", title: "BS.CKI", name: "Nguyễn Thu Hương", specialtyId: "s5", specialtyName: "Da liễu",
        experience: 12, price: 280000, rating: 0.0, reviewCount: 0, position: "Bác sĩ điều trị", active: true,
        avatar: "https://images.unsplash.com/photo-1740153204572-5ab53aa9e901?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400&q=80",
        description: "BS.CKI Nguyễn Thu Hương là chuyên gia da liễu với 12 năm kinh nghiệm. Chuyên điều trị các bệnh da liễu như mụn, chàm, vảy nến và tư vấn chăm sóc da chuyên sâu."
      },
      {
        id: "d6", userId: "u_d6", title: "ThS.BS", name: "Vũ Đức Thành", specialtyId: "s8", specialtyName: "Nội tổng quát",
        experience: 10, price: 200000, rating: 0.0, reviewCount: 0, position: "Bác sĩ điều trị", active: true,
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

    // 5. Create System Settings & Clinic Info
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

    // 6. Create Patient Profiles (relatives) for Nguyễn Anh Tuấn (u1)
    console.log('Creating patient profiles (relatives)...');
    const patientProfilesData = [
      {
        id: "pp1",
        userId: "u1",
        fullName: "Nguyễn Anh Dũng",
        phone: "0908888888",
        email: "nguyenanhdung@email.com",
        gender: "MALE",
        dateOfBirth: new Date("1960-01-01"),
        address: "Quận 1, TP HCM",
        relationship: "CHA",
        isDefault: false,
        isActive: true
      },
      {
        id: "pp2",
        userId: "u1",
        fullName: "Trần Thị Thanh Vân",
        phone: "0907777777",
        email: "tranthithanhvan@email.com",
        gender: "FEMALE",
        dateOfBirth: new Date("1965-02-02"),
        address: "Quận 1, TP HCM",
        relationship: "ME",
        isDefault: false,
        isActive: true
      },
      {
        id: "pp3",
        userId: "u1",
        fullName: "Nguyễn Minh Khôi",
        phone: "0901234567",
        email: "minhkhoi@email.com",
        gender: "MALE",
        dateOfBirth: new Date("2018-05-05"),
        address: "Quận 1, TP HCM",
        relationship: "CON",
        isDefault: false,
        isActive: true
      }
    ];

    for (const profile of patientProfilesData) {
      await prisma.patientProfile.create({
        data: profile
      });
    }
    console.log(`Created ${patientProfilesData.length} patient profiles.`);

    // 7. Create Doctor Schedules for Past 7 Days and Next 7 Days (excluding Sundays)
    console.log('Creating schedules for past 7 days and next 7 days (excluding Sundays)...');
    const dates = [];
    const baseDate = new Date("2026-07-02"); // Shifted baseDate to July 2nd
    // Generate dates from baseDate - 7 to baseDate + 7
    for (let i = -7; i <= 7; i++) {
      const d = new Date(baseDate);
      d.setDate(baseDate.getDate() + i);
      dates.push(d);
    }

    const doctors = ["d1", "d2", "d3", "d4", "d5", "d6"];
    const doctorDateScheduleMap = {};

    for (const doctorId of doctors) {
      doctorDateScheduleMap[doctorId] = {};
      for (const workingDate of dates) {
        // Skip Sundays (getUTCDay() === 0)
        if (workingDate.getUTCDay() === 0) {
          continue;
        }

        const dateStr = workingDate.toISOString().slice(0, 10);

        const schedule = await prisma.schedule.create({
          data: {
            doctorId,
            workingDate,
            workingShift: "ALL_DAY",
            morningShiftStart: "08:00",
            morningShiftEnd: "11:30",
            afternoonShiftStart: "13:30",
            afternoonShiftEnd: "17:00",
            status: "WORKING"
          }
        });

        doctorDateScheduleMap[doctorId][dateStr] = schedule.id;
      }
    }
    console.log('Schedules generated for 6 doctors (Sundays excluded).');

    // 8. Create Appointments (Past, Today, and Tomorrow) and their respective TimeSlots
    const dateStrToday = "2026-07-02";
    const dateStrTomorrow = "2026-07-03";
    const seedAppointmentsData = [
      // === Past Appointments ===
      {
        id: "a1",
        code: "CP9876543201",
        patientId: "u1",
        patientName: "Nguyễn Anh Tuấn",
        patientPhone: "0901234567",
        patientGender: "MALE",
        patientDob: new Date("1990-05-15"),
        patientAddress: "Quận 1, TP HCM",
        doctorId: "d1",
        specialtyId: "s2",
        dateStr: "2026-06-25",
        startTime: "09:00",
        endTime: "09:30",
        status: "COMPLETED",
        bookingChannel: "ONLINE",
        bookingSource: "PATIENT_WEB",
        createdBy: "u1",
        forSelf: true,
        consultationFee: 300000,
        patientEmail: "nguyenanhtuan@email.com",
        reason: "Khám sàng lọc cao huyết áp, theo dõi định kỳ"
      },
      {
        id: "a2",
        code: "CP9876543202",
        patientId: "u2",
        patientName: "Trần Thị Thu Trang",
        patientPhone: "0912345678",
        patientGender: "FEMALE",
        patientDob: new Date("1985-08-20"),
        patientAddress: "Quận 2, TP HCM",
        doctorId: "d3",
        specialtyId: "s4",
        dateStr: "2026-06-26",
        startTime: "10:00",
        endTime: "10:30",
        status: "COMPLETED",
        bookingChannel: "ONLINE",
        bookingSource: "PATIENT_WEB",
        createdBy: "u2",
        forSelf: true,
        consultationFee: 250000,
        patientEmail: "tranthithutrang@email.com",
        reason: "Tư vấn tiêm chủng phòng bệnh cho bé"
      },
      {
        id: "a3",
        code: "CP9876543203",
        patientId: "u1",
        patientName: "Nguyễn Anh Tuấn",
        patientPhone: "0901234567",
        patientGender: "MALE",
        patientDob: new Date("1990-05-15"),
        patientAddress: "Quận 1, TP HCM",
        doctorId: "d2",
        specialtyId: "s1",
        dateStr: "2026-06-27",
        startTime: "14:30",
        endTime: "15:00",
        status: "CANCELLED",
        bookingChannel: "ONLINE",
        bookingSource: "PATIENT_WEB",
        createdBy: "u1",
        forSelf: true,
        consultationFee: 350000,
        patientEmail: "nguyenanhtuan@email.com",
        reason: "Khám đau mỏi vai gáy",
        note: "Bệnh nhân báo bận đột xuất, chủ động hủy lịch."
      },
      {
        id: "a4",
        code: "CP9876543204",
        patientId: "u_levanc",
        patientName: "Lê Hoài Nam",
        patientPhone: "0923456789",
        patientGender: "MALE",
        patientDob: new Date("1982-03-12"),
        patientAddress: "Bình Thạnh, TP HCM",
        doctorId: "d1",
        specialtyId: "s2",
        dateStr: "2026-06-30",
        startTime: "09:30",
        endTime: "10:00",
        status: "COMPLETED",
        bookingChannel: "RECEPTION",
        bookingSource: "RECEPTIONIST",
        createdBy: "u5",
        forSelf: true,
        consultationFee: 300000,
        patientEmail: "lehoainam@email.com",
        reason: "Theo dõi nhịp tim nhanh và hồi hộp tức ngực"
      },
      {
        id: "a5",
        code: "CP9876543205",
        patientId: "u7",
        patientName: "Hoàng Minh Đức",
        patientPhone: "0945678901",
        patientGender: "MALE",
        patientDob: new Date("1988-12-05"),
        patientAddress: "Quận 3, TP HCM",
        doctorId: "d4",
        specialtyId: "s6",
        dateStr: "2026-06-29",
        startTime: "15:30",
        endTime: "16:00",
        status: "NO_SHOW",
        bookingChannel: "ONLINE",
        bookingSource: "PATIENT_WEB",
        createdBy: "u7",
        forSelf: true,
        consultationFee: 400000,
        patientEmail: "hoangminhduc@email.com",
        reason: "Khám định kỳ đau dạ dày tá tràng"
      },

      // === Today's Appointments (02/07/2026) - Before 9:00 AM for Live Demo ===
      {
        id: "a30",
        code: "CP9876543230",
        patientId: "u_nguyenthig",
        patientName: "Nguyễn Khánh Linh",
        patientPhone: "0956789012",
        patientGender: "FEMALE",
        patientDob: new Date("1991-11-02"),
        patientAddress: "Quận 7, TP HCM",
        doctorId: "d1",
        specialtyId: "s2",
        dateStr: dateStrToday,
        startTime: "08:00",
        endTime: "08:30",
        status: "COMPLETED",
        bookingChannel: "ONLINE",
        bookingSource: "PATIENT_WEB",
        createdBy: "u_nguyenthig",
        forSelf: true,
        consultationFee: 300000,
        patientEmail: "nguyenkhanhlinh@email.com",
        reason: "Đo điện tâm đồ định kỳ do tức ngực nhẹ",
        note: "Nhịp tim đều, huyết áp ổn định 120/80 mmHg. Tiếp tục uống thuốc huyết áp theo đơn cũ."
      },
      {
        id: "a31",
        code: "CP9876543231",
        patientId: "u_levanc",
        patientName: "Lê Hoài Nam",
        patientPhone: "0923456789",
        patientGender: "MALE",
        patientDob: new Date("1982-03-12"),
        patientAddress: "Bình Thạnh, TP HCM",
        doctorId: "d5",
        specialtyId: "s5",
        dateStr: dateStrToday,
        startTime: "08:00",
        endTime: "08:30",
        status: "NO_SHOW",
        bookingChannel: "RECEPTION",
        bookingSource: "RECEPTIONIST",
        createdBy: "u5",
        forSelf: true,
        consultationFee: 280000,
        patientEmail: "lehoainam@email.com",
        reason: "Khám viêm da cơ địa dị ứng thời tiết",
        note: "Đã quá 30 phút từ ca khám, gọi điện 2 lần không liên lạc được để làm thủ tục."
      },
      {
        id: "a32",
        code: "CP9876543232",
        patientId: "u_phamthie",
        patientName: "Phạm Minh Hằng",
        patientPhone: "0934567890",
        patientGender: "FEMALE",
        patientDob: new Date("1994-07-24"),
        patientAddress: "Tân Bình, TP HCM",
        doctorId: "d3",
        specialtyId: "s4",
        dateStr: dateStrToday,
        startTime: "08:30",
        endTime: "09:00",
        status: "CHECKED_IN",
        bookingChannel: "ONLINE",
        bookingSource: "PATIENT_WEB",
        createdBy: "u_phamthie",
        forSelf: true,
        consultationFee: 250000,
        patientEmail: "phamminhhang@email.com",
        reason: "Bé ho nhiều kèm sổ mũi nhẹ từ tối qua"
      },
      {
        id: "a33",
        code: "CP9876543233",
        patientId: "u1",
        patientName: "Nguyễn Anh Tuấn",
        patientPhone: "0901234567",
        patientGender: "MALE",
        patientDob: new Date("1990-05-15"),
        patientAddress: "Quận 1, TP HCM",
        doctorId: "d2",
        specialtyId: "s1",
        dateStr: dateStrToday,
        startTime: "08:30",
        endTime: "09:00",
        status: "CANCELLED",
        bookingChannel: "ONLINE",
        bookingSource: "PATIENT_WEB",
        createdBy: "u1",
        forSelf: true,
        consultationFee: 350000,
        patientEmail: "nguyenanhtuan@email.com",
        reason: "Khám sưng đau khớp cổ tay sau chấn thương nhẹ",
        note: "Bệnh nhân chủ động hủy lúc 07:45 sáng do có việc bận đột xuất."
      },

      // === Today's Appointments (02/07/2026) - After 9:00 AM ===
      {
        id: "a10",
        code: "CP9876543210",
        patientId: "u1",
        patientName: "Nguyễn Anh Tuấn",
        patientPhone: "0901234567",
        patientGender: "MALE",
        patientDob: new Date("1990-05-15"),
        patientAddress: "Quận 1, TP HCM",
        doctorId: "d1",
        specialtyId: "s2",
        dateStr: dateStrToday,
        startTime: "09:30",
        endTime: "10:00",
        status: "CONFIRMED",
        bookingChannel: "ONLINE",
        bookingSource: "PATIENT_WEB",
        createdBy: "u1",
        forSelf: true,
        consultationFee: 300000,
        patientEmail: "nguyenanhtuan@email.com",
        reason: "Khám định kỳ tim mạch, thỉnh thoảng tức ngực nhẹ"
      },
      {
        id: "a11",
        code: "CP9876543211",
        patientId: "u2",
        patientName: "Trần Thị Thu Trang",
        patientPhone: "0912345678",
        patientGender: "FEMALE",
        patientDob: new Date("1985-08-20"),
        patientAddress: "Quận 2, TP HCM",
        doctorId: "d2",
        specialtyId: "s1",
        dateStr: dateStrToday,
        startTime: "14:30",
        endTime: "15:00",
        status: "CONFIRMED",
        bookingChannel: "ONLINE",
        bookingSource: "PATIENT_WEB",
        createdBy: "u2",
        forSelf: true,
        consultationFee: 350000,
        patientEmail: "tranthithutrang@email.com",
        reason: "Đau mỏi vai gáy và khớp gối khi vận động"
      },
      {
        id: "a15",
        code: "CP9876543215",
        patientId: "u_levanc",
        patientName: "Lê Hoài Nam",
        patientPhone: "0923456789",
        patientGender: "MALE",
        patientDob: new Date("1982-03-12"),
        patientAddress: "Bình Thạnh, TP HCM",
        doctorId: "d6",
        specialtyId: "s8",
        dateStr: dateStrToday,
        startTime: "15:00",
        endTime: "15:30",
        status: "CONFIRMED",
        bookingChannel: "RECEPTION",
        bookingSource: "RECEPTIONIST",
        createdBy: "u5",
        forSelf: true,
        consultationFee: 200000,
        patientEmail: "lehoainam@email.com",
        reason: "Khám sức khỏe tổng quát định kỳ"
      },
      {
        id: "a16",
        code: "CP9876543216",
        patientId: "u1",
        patientName: "Nguyễn Anh Tuấn",
        patientPhone: "0901234567",
        patientGender: "MALE",
        patientDob: new Date("1990-05-15"),
        patientAddress: "Quận 1, TP HCM",
        doctorId: "d1",
        specialtyId: "s2",
        dateStr: dateStrToday,
        startTime: "16:30",
        endTime: "17:00",
        status: "CONFIRMED",
        bookingChannel: "ONLINE",
        bookingSource: "PATIENT_WEB",
        createdBy: "u1",
        forSelf: true,
        consultationFee: 300000,
        patientEmail: "nguyenanhtuan@email.com",
        reason: "Tái khám tim mạch & lấy thêm đơn thuốc điều trị huyết áp"
      },

      // === Tomorrow's Appointments (03/07/2026) ===
      {
        id: "a20",
        code: "CP9876543220",
        patientId: "u1",
        patientName: "Nguyễn Anh Tuấn",
        patientPhone: "0901234567",
        patientGender: "MALE",
        patientDob: new Date("1990-05-15"),
        patientAddress: "Quận 1, TP HCM",
        doctorId: "d1",
        specialtyId: "s2",
        dateStr: dateStrTomorrow,
        startTime: "09:30",
        endTime: "10:00",
        status: "CONFIRMED",
        bookingChannel: "ONLINE",
        bookingSource: "PATIENT_WEB",
        createdBy: "u1",
        forSelf: true,
        consultationFee: 300000,
        patientEmail: "nguyenanhtuan@email.com",
        reason: "Khám định kỳ huyết áp & tim mạch"
      },
      {
        id: "a21",
        code: "CP9876543221",
        patientId: "u2",
        patientName: "Trần Thị Thu Trang",
        patientPhone: "0912345678",
        patientGender: "FEMALE",
        patientDob: new Date("1985-08-20"),
        patientAddress: "Quận 2, TP HCM",
        doctorId: "d2",
        specialtyId: "s1",
        dateStr: dateStrTomorrow,
        startTime: "14:30",
        endTime: "15:00",
        status: "CONFIRMED",
        bookingChannel: "ONLINE",
        bookingSource: "PATIENT_WEB",
        createdBy: "u2",
        forSelf: true,
        consultationFee: 350000,
        patientEmail: "tranthithutrang@email.com",
        reason: "Theo dõi tình trạng đau khớp gối"
      },
      {
        id: "a22",
        code: "CP9876543222",
        patientId: "u_levanc",
        patientName: "Lê Hoài Nam",
        patientPhone: "0923456789",
        patientGender: "MALE",
        patientDob: new Date("1982-03-12"),
        patientAddress: "Bình Thạnh, TP HCM",
        doctorId: "d3",
        specialtyId: "s4",
        dateStr: dateStrTomorrow,
        startTime: "10:00",
        endTime: "10:30",
        status: "CONFIRMED",
        bookingChannel: "RECEPTION",
        bookingSource: "RECEPTIONIST",
        createdBy: "u5",
        forSelf: true,
        consultationFee: 250000,
        patientEmail: "lehoainam@email.com",
        reason: "Đưa con đi khám dinh dưỡng định kỳ"
      },
      {
        id: "a23",
        code: "CP9876543223",
        patientId: "u_phamthie",
        patientName: "Phạm Minh Hằng",
        patientPhone: "0934567890",
        patientGender: "FEMALE",
        patientDob: new Date("1994-07-24"),
        patientAddress: "Tân Bình, TP HCM",
        doctorId: "d4",
        specialtyId: "s6",
        dateStr: dateStrTomorrow,
        startTime: "15:30",
        endTime: "16:00",
        status: "CONFIRMED",
        bookingChannel: "ONLINE",
        bookingSource: "PATIENT_WEB",
        createdBy: "u_phamthie",
        forSelf: true,
        consultationFee: 400000,
        patientEmail: "phamminhhang@email.com",
        reason: "Tư vấn chế độ ăn cho người trào ngược dạ dày"
      }
    ];

    console.log('Seeding appointments and their physical timeslots...');
    for (const apt of seedAppointmentsData) {
      const scheduleId = doctorDateScheduleMap[apt.doctorId]?.[apt.dateStr];
      if (!scheduleId) {
        console.error(`Error: Could not find schedule for Doctor: ${apt.doctorId}, Date: ${apt.dateStr}`);
        continue;
      }

      // Determine shift: morning is start < 12:00, otherwise afternoon
      const hh = parseInt(apt.startTime.split(':')[0]);
      const workingShift = hh < 12 ? "MORNING" : "AFTERNOON";

      // Determine TimeSlot status based on appointment status
      let slotStatus = "BOOKED";
      if (apt.status === "CANCELLED" || apt.status === "NO_SHOW") {
        slotStatus = "AVAILABLE";
      }

      // 1. Create physical TimeSlot first
      const slot = await prisma.timeSlot.create({
        data: {
          scheduleId,
          workingShift,
          startTime: apt.startTime,
          endTime: apt.endTime,
          status: slotStatus
        }
      });

      // 2. Create Appointment pointing to the created TimeSlot
      await prisma.appointment.create({
        data: {
          id: apt.id,
          code: apt.code,
          patientId: apt.patientId,
          patientName: apt.patientName,
          patientPhone: apt.patientPhone,
          patientGender: apt.patientGender,
          patientDob: apt.patientDob,
          patientAddress: apt.patientAddress,
          patientProfileId: apt.patientProfileId,
          doctorId: apt.doctorId,
          specialtyId: apt.specialtyId,
          scheduleId,
          timeSlotId: slot.id,
          appointmentDate: new Date(apt.dateStr),
          startTime: apt.startTime,
          endTime: apt.endTime,
          status: apt.status,
          bookingChannel: apt.bookingChannel,
          bookingSource: apt.bookingSource,
          createdBy: apt.createdBy,
          forSelf: apt.forSelf,
          relativeName: apt.relativeName,
          consultationFee: apt.consultationFee,
          patientEmail: apt.patientEmail,
          reason: apt.reason,
          note: apt.note
        }
      });
    }
    console.log(`Created ${seedAppointmentsData.length} appointments and linked timeslots.`);

    // 9. Create Doctor Reviews (for completed appointments)
    console.log('Seeding reviews...');
    const reviewsData = [
      {
        id: "r1",
        appointmentId: "a1",
        doctorId: "d1",
        patientId: "u1",
        patientName: "Nguyễn Anh Tuấn",
        rating: 5,
        comment: "Bác sĩ Minh Anh tư vấn vô cùng kỹ lưỡng về chế độ ăn uống cho người huyết áp cao. Phòng khám rất sạch sẽ, quy trình nhanh chóng."
      },
      {
        id: "r2",
        appointmentId: "a2",
        doctorId: "d3",
        patientId: "u2",
        patientName: "Trần Thị Thu Trang",
        rating: 4,
        comment: "Bác sĩ khám nhiệt tình, dặn dò chu đáo. Tuy nhiên phải chờ hơi lâu một chút ở khâu làm thủ tục lễ tân."
      },
      {
        id: "r3",
        appointmentId: "a4",
        doctorId: "d1",
        patientId: "u_levanc",
        patientName: "Lê Hoài Nam",
        rating: 5,
        comment: "Rất hài lòng với thái độ làm việc chuyên nghiệp của bác sĩ. Lắng nghe và giải đáp mọi thắc mắc của bệnh nhân."
      },
      {
        id: "r5",
        appointmentId: "a30",
        doctorId: "d1",
        patientId: "u_nguyenthig",
        patientName: "Nguyễn Khánh Linh",
        rating: 5,
        comment: "Bác sĩ Minh Anh rất chu đáo. Quy trình đo điện tâm đồ nhanh chóng, bác sĩ giải thích kết quả dễ hiểu."
      }
    ];

    for (const rev of reviewsData) {
      await prisma.review.create({
        data: rev
      });
    }
    console.log(`Created ${reviewsData.length} doctor reviews.`);

    // 10. Dynamically calculate Doctor ratings and review counts
    console.log('Updating doctor ratings and review counts...');
    const seededDoctors = await prisma.doctor.findMany();
    for (const doc of seededDoctors) {
      const reviews = await prisma.review.findMany({ where: { doctorId: doc.id } });
      const count = reviews.length;
      const avgRating = count > 0 ? (reviews.reduce((sum, r) => sum + r.rating, 0) / count) : 0.0;
      await prisma.doctor.update({
        where: { id: doc.id },
        data: {
          rating: parseFloat(avgRating.toFixed(1)),
          reviewCount: count
        }
      });
    }
    console.log('Doctor ratings and review counts updated.');

    // 11. Update Specialty Doctor Counts based on actual seeded doctors
    for (const spec of specialtiesData) {
      const count = await prisma.doctor.count({ where: { specialtyId: spec.id } });
      await prisma.specialty.update({
        where: { id: spec.id },
        data: { doctorCount: count }
      });
    }
    console.log('Updated specialty doctor counts.');

    // 12. Create pending late cancellation request
    console.log('Creating pending cancellation request...');
    await prisma.approvalRequest.create({
      data: {
        type: "CANCELLATION",
        doctorId: "d1",
        doctorName: "Nguyễn Minh Anh",
        date: new Date(dateStrToday),
        reason: "Có cuộc họp khẩn cấp ở công ty lúc 16h00 không kịp di chuyển sang phòng khám, xin lỗi bác sĩ",
        appointmentCode: "CP9876543216",
        status: "PENDING"
      }
    });
    console.log('Pending cancellation request created.');

    // 13. Create Blog Posts
    console.log('Creating blog posts...');
    const blogPostsData = [
      {
        id: "b1",
        title: "Chế độ dinh dưỡng phòng ngừa loãng xương ở người cao tuổi",
        slug: "dinh-duong-phong-ngua-loang-xuong",
        summary: "Bài viết chia sẻ các kiến thức dinh dưỡng giúp phòng ngừa bệnh loãng xương hiệu quả ở người cao tuổi.",
        content: "<p>Loãng xương là một căn bệnh phổ biến ở người cao tuổi, đặc biệt là phụ nữ sau mãn kinh. Chế độ dinh dưỡng đóng vai trò vô cùng quan trọng trong việc bảo vệ sức khỏe xương khớp...</p><h3>Các thực phẩm giàu Canxi</h3><p>Hãy bổ sung sữa, sữa chua, phô mai và các loại rau xanh đậm vào thực đơn hàng ngày của bạn...</p>",
        thumbnail: "https://images.unsplash.com/photo-1490645935967-10de6ba17061?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800&q=80",
        status: "PUBLISHED",
        tags: "Dinh dưỡng, Xương khớp",
        authorId: "u6"
      },
      {
        id: "b2",
        title: "Làm sao để bảo vệ tim mạch trong mùa nắng nóng?",
        slug: "bao-ve-tim-mach-mua-nang-nong",
        summary: "Hướng dẫn bảo vệ sức khỏe tim mạch dưới thời tiết nắng nóng oi bức của mùa hè.",
        content: "<p>Thời tiết nắng nóng gay gắt khiến tim phải làm việc nhiều hơn để bơm máu đi nuôi cơ thể, dẫn đến tăng huyết áp và nguy cơ đột quỵ cao hơn...</p><h3>Lời khuyên từ chuyên gia</h3><p>Hạn chế ra ngoài vào giờ cao điểm, uống đủ nước và duy trì môi trường sống mát mẻ...</p>",
        thumbnail: "https://images.unsplash.com/photo-1505576399279-565b52d4ac71?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800&q=80",
        status: "PUBLISHED",
        tags: "Tim mạch, Mùa hè",
        authorId: "u3"
      },
      {
        id: "b3",
        title: "Chăm sóc da mụn đúng cách theo lời khuyên của chuyên gia da liễu",
        slug: "cham-soc-da-mun-dung-cach",
        summary: "Các bước chăm sóc da mụn khoa học từ bác sĩ chuyên khoa da liễu CarePlus.",
        content: "<p>Chăm sóc da mụn sai cách có thể làm tình trạng mụn trở nên trầm trọng hơn và để lại sẹo thâm khó chữa...</p><h3>Quy trình 3 bước cơ bản</h3><p>1. Làm sạch da dịu nhẹ.<br>2. Dưỡng ẩm không chứa dầu.<br>3. Sử dụng sản phẩm đặc trị mụn phù hợp.</p>",
        thumbnail: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800&q=80",
        status: "PUBLISHED",
        tags: "Da liễu, Chăm sóc da",
        authorId: "u6"
      }
    ];

    for (const post of blogPostsData) {
      await prisma.blogPost.create({
        data: post
      });
    }
    console.log(`Created ${blogPostsData.length} blog posts.`);

    // 14. Create Support Conversations & Messages
    console.log('Creating support conversations...');
    const conversationId = "c1";
    await prisma.conversation.create({
      data: {
        id: conversationId,
        type: "SUPPORT",
        patientId: "u1",
        receptionistId: "u5",
        status: "ACTIVE",
        lastMessage: "Cảm ơn bạn, tôi đã hiểu.",
        lastMessageAt: new Date(),
      }
    });

    const messagesData = [
      {
        conversationId,
        senderId: "u1",
        senderRole: "PATIENT",
        message: "Chào phòng khám, tôi muốn hỏi về thủ tục bảo hiểm y tế khi khám tại CarePlus.",
        createdAt: new Date(new Date().getTime() - 1000 * 60 * 10), // 10 mins ago
      },
      {
        conversationId,
        senderId: "u5",
        senderRole: "RECEPTIONIST",
        message: "Dạ chào anh Tuấn, phòng khám CarePlus hỗ trợ thanh toán bảo hiểm bảo lãnh của nhiều hãng bảo hiểm tư nhân như Bảo Việt, PVI, Dai-ichi,... Anh vui lòng mang thẻ bảo hiểm và CCCD khi đến khám để được hỗ trợ làm thủ tục nhé.",
        createdAt: new Date(new Date().getTime() - 1000 * 60 * 5), // 5 mins ago
      },
      {
        conversationId,
        senderId: "u1",
        senderRole: "PATIENT",
        message: "Cảm ơn bạn, tôi đã hiểu.",
        createdAt: new Date(),
      }
    ];

    for (const msg of messagesData) {
      await prisma.message.create({
        data: msg
      });
    }
    console.log('Created conversations and messages.');

    // 15. Create Notifications
    console.log('Creating notifications...');
    const notificationsData = [
      {
        userId: "u3", // Doctor Minh Anh
        title: "Lịch hẹn mới",
        content: "Bạn có lịch hẹn mới mã CP9876543220 vào ngày 03/07/2026 lúc 09:30 từ bệnh nhân Nguyễn Anh Tuấn.",
        type: "APPOINTMENT",
        link: "/bac-si/lich-hen",
        isRead: false
      },
      {
        userId: "u5", // Receptionist Ngân
        title: "Yêu cầu hủy lịch mới",
        content: "Bệnh nhân Nguyễn Anh Tuấn đã gửi yêu cầu hủy lịch hẹn CP9876543216 lúc 16:30 hôm nay.",
        type: "APPROVAL",
        link: "/le-tan/duyet-huy",
        isRead: false
      },
      {
        userId: "u1", // Patient Tuấn
        title: "Đăng ký thành công",
        content: "Chào mừng bạn đến với hệ thống đặt lịch khám trực tuyến CarePlus!",
        type: "SYSTEM",
        isRead: true
      }
    ];

    for (const notif of notificationsData) {
      await prisma.notification.create({
        data: notif
      });
    }
    console.log('Created notifications.');

    console.log('\n=============================================');
    console.log('Database seeding finished successfully!');
    console.log('Logins (Password: 123456):');
    console.log('- Admin: admin@careplus.vn');
    console.log('- Receptionist: letan@careplus.vn');
    console.log('- Patient: nguyenanhtuan@email.com');
    console.log('- Doctor: bsminhanh@careplus.vn');
    console.log('=============================================');
  } catch (err) {
    console.error('Seeding database failed:', err);
  } finally {
    await prisma.$disconnect();
  }
}

seed();
