const prisma = require('../infrastructure/database/prisma.client');
const bcrypt = require('bcrypt');

async function seed() {
  console.log('Seeding database with mock data...');
  
  try {
    await prisma.$connect();
    
    // Hash password
    const passwordHash = await bcrypt.hash('123456', 10);
    
    // 1. Create Specialties
    console.log('Creating specialties...');
    const specialtiesData = [
      { name: 'Tim mạch', slug: 'tim-mach', description: 'Chuyên khoa Tim mạch', icon: 'heart' },
      { name: 'Tiêu hóa', slug: 'tieu-hoa', description: 'Chuyên khoa Tiêu hóa', icon: 'stomach' },
      { name: 'Nhi khoa', slug: 'nhi-khoa', description: 'Chuyên khoa Nhi khoa', icon: 'child' },
      { name: 'Da liễu', slug: 'da-lieu', description: 'Chuyên khoa Da liễu', icon: 'skin' },
      { name: 'Cơ Xương Khớp', slug: 'co-xuong-khop', description: 'Chuyên khoa Cơ Xương Khớp', icon: 'bone' },
      { name: 'Tai Mũi Họng', slug: 'tai-mui-hong', description: 'Chuyên khoa Tai Mũi Họng', icon: 'ear' },
      { name: 'Sản phụ khoa', slug: 'san-phu-khoa', description: 'Chuyên khoa Sản phụ khoa', icon: 'baby' }
    ];
    
    const specialties = [];
    for (const spec of specialtiesData) {
      const existing = await prisma.specialty.findFirst({ where: { name: spec.name } });
      if (existing) {
        specialties.push(existing);
      } else {
        const newSpec = await prisma.specialty.create({
          data: {
            name: spec.name,
            slug: spec.slug,
            description: spec.description,
            icon: spec.icon,
            active: true
          }
        });
        specialties.push(newSpec);
      }
    }
    console.log(`Created/Verified ${specialties.length} specialties.`);

    const nhiKhoa = specialties.find(s => s.name === 'Nhi khoa') || specialties[0];

    // 2. Create Users
    console.log('Creating users...');
    const usersData = [
      {
        email: 'admin@careplus.vn',
        name: 'Admin CarePlus',
        phone: '0900000000',
        role: 'ADMIN',
        status: 'ACTIVE',
        emailVerified: true
      },
      {
        email: 'benh-nhan@careplus.vn',
        name: 'Bệnh Nhân Demo',
        phone: '0987654321',
        role: 'PATIENT',
        status: 'ACTIVE',
        emailVerified: true
      },
      {
        email: 'bac-si@careplus.vn',
        name: 'Bác Sĩ Nguyễn Văn A',
        phone: '0912345678',
        role: 'DOCTOR',
        status: 'ACTIVE',
        emailVerified: true
      },
      {
        email: 'le-tan@careplus.vn',
        name: 'Lễ Tân Demo',
        phone: '0901234567',
        role: 'RECEPTIONIST',
        status: 'ACTIVE',
        emailVerified: true
      }
    ];

    const users = {};
    for (const u of usersData) {
      let user = await prisma.user.findUnique({ where: { email: u.email } });
      if (!user) {
        user = await prisma.user.create({
          data: {
            email: u.email,
            name: u.name,
            phone: u.phone,
            role: u.role,
            status: u.status,
            emailVerified: u.emailVerified,
            passwordHash: passwordHash
          }
        });
        console.log(`Created user: ${u.email}`);
      } else {
        console.log(`User already exists: ${u.email}`);
      }
      users[u.role] = user;
    }

    // 3. Create Doctor Profile
    console.log('Checking doctor profile...');
    const doctorUser = users['DOCTOR'];
    let doctorProfile = await prisma.doctor.findUnique({ where: { userId: doctorUser.id } });
    if (!doctorProfile) {
      doctorProfile = await prisma.doctor.create({
        data: {
          userId: doctorUser.id,
          title: 'BS.CKI',
          name: doctorUser.name,
          specialtyId: nhiKhoa.id,
          specialtyName: nhiKhoa.name,
          experience: 10,
          price: 300000,
          rating: 5.0,
          reviewCount: 1,
          description: 'Chuyên gia Nhi khoa giỏi, giàu lòng nhân ái, hơn 10 năm kinh nghiệm tại các bệnh viện lớn.',
          position: 'Trưởng khoa Nhi',
          active: true
        }
      });
      console.log('Created doctor profile.');
    } else {
      console.log('Doctor profile already exists.');
    }

    console.log('Database seeding finished successfully!');
  } catch (err) {
    console.error('Seeding database failed:', err);
  } finally {
    await prisma.$disconnect();
  }
}

seed();
