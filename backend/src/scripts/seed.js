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

    // 5. Update Specialty Doctor Counts based on actual seeded doctors
    for (const spec of specialtiesData) {
      const count = await prisma.doctor.count({ where: { specialtyId: spec.id } });
      await prisma.specialty.update({
        where: { id: spec.id },
        data: { doctorCount: count }
      });
    }
    console.log('Updated specialty doctor counts.');

    // 6. Create System Settings & Clinic Info
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
