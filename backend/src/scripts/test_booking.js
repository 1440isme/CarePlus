const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const { PrismaClient } = require('@prisma/client');
const prisma = require('../infrastructure/database/prisma.client');
const AppointmentService = require('../modules/appointment/appointment.service');
const { APPOINTMENT_STATUSES } = require('../modules/appointment/appointment.types');

async function testBookingFlow() {
  console.log('--- STARTING BOOKING FLOW VERIFICATION ---');

  try {
    // 1. Get or create specialty
    let specialty = await prisma.specialty.findFirst({ where: { active: true } });
    if (!specialty) {
      specialty = await prisma.specialty.create({
        data: {
          name: 'Khoa Nội Tổng Quát',
          slug: 'khoa-noi-tong-quat',
          description: 'Khám nội khoa tổng quát',
          icon: 'home',
          active: true,
        },
      });
      console.log('Created test specialty:', specialty.name);
    }

    // 2. Get or create Doctor and User for doctor
    let doctorUser = await prisma.user.findFirst({ where: { role: 'DOCTOR' } });
    if (!doctorUser) {
      doctorUser = await prisma.user.create({
        data: {
          name: 'Bác sĩ Nguyễn Văn A',
          email: 'doctora@careplus.com',
          phone: '0987654321',
          role: 'DOCTOR',
          status: 'ACTIVE',
          passwordHash: 'dummyhash',
          emailVerified: true,
        },
      });
      console.log('Created doctor user:', doctorUser.email);
    }

    let doctor = await prisma.doctor.findUnique({ where: { userId: doctorUser.id } });
    if (!doctor) {
      doctor = await prisma.doctor.create({
        data: {
          userId: doctorUser.id,
          title: 'BS.CKI',
          name: doctorUser.name,
          specialtyId: specialty.id,
          specialtyName: specialty.name,
          experience: 10,
          price: 150000,
          description: 'Bác sĩ nhiều kinh nghiệm',
          position: 'Trưởng khoa',
          active: true,
        },
      });
      console.log('Created doctor profile for:', doctor.name);
    }

    // 3. Create active schedule and timeslots for doctor (2 days in the future to allow cancellation testing)
    const workingDate = new Date();
    workingDate.setDate(workingDate.getDate() + 3); // 3 days in the future (compensate for UTC shift)
    workingDate.setHours(0, 0, 0, 0);

    // Delete existing schedule for doctor on this day to avoid unique constraint violations
    await prisma.schedule.deleteMany({
      where: {
        doctorId: doctor.id,
        workingDate,
      },
    });

    const schedule = await prisma.schedule.create({
      data: {
        doctorId: doctor.id,
        workingDate,
        status: 'WORKING',
        timeSlots: {
          create: [
            { startTime: '09:00', endTime: '09:30', status: 'AVAILABLE' },
            { startTime: '09:30', endTime: '10:00', status: 'AVAILABLE' },
          ],
        },
      },
      include: {
        timeSlots: true,
      },
    });
    console.log('Created doctor schedule for date:', workingDate.toISOString().slice(0, 10));

    // 4. Create a test Patient User
    const uniqueEmail = `testpatient_${Date.now()}@careplus.com`;
    const patientUser = await prisma.user.create({
      data: {
        name: 'Bệnh nhân Test',
        email: uniqueEmail,
        phone: '0901234567',
        role: 'PATIENT',
        status: 'ACTIVE',
        passwordHash: 'dummyhash',
        emailVerified: true,
        noShowCount: 0,
      },
    });
    console.log('Created active patient user:', patientUser.email);

    const currentUserContext = { userId: patientUser.id, role: 'PATIENT' };

    // 5. Test 1: Successful booking
    console.log('\n[TEST 1] Testing successful booking...');
    const slot1 = schedule.timeSlots[0];
    const appointment1 = await AppointmentService.createAppointment(currentUserContext, {
      timeSlotId: slot1.id,
      forSelf: true,
    });
    console.log('Success: Appointment created with code:', appointment1.code);

    // Verify timeslot status is updated to BOOKED
    const updatedSlot1 = await prisma.timeSlot.findUnique({ where: { id: slot1.id } });
    console.log('TimeSlot 1 status:', updatedSlot1.status); // Expected: BOOKED

    // Test 2: Double booking in same day (Spam Protection)
    console.log('\n[TEST 2] Testing double booking in same day (should fail)...');
    const slot2 = schedule.timeSlots[1];
    try {
      await AppointmentService.createAppointment(currentUserContext, {
        timeSlotId: slot2.id,
        forSelf: true,
      });
      console.log('FAIL: Expected error but booking succeeded');
    } catch (err) {
      console.log('PASS: Correctly rejected double booking in same day. Code:', err.code, '-', err.message);
    }

    // Test 3: Booking with locked account
    console.log('\n[TEST 3] Testing booking with locked account (should fail)...');
    await prisma.user.update({
      where: { id: patientUser.id },
      data: { status: 'LOCKED' },
    });
    try {
      await AppointmentService.createAppointment(currentUserContext, {
        timeSlotId: slot2.id,
        forSelf: true,
      });
      console.log('FAIL: Expected error but booking succeeded');
    } catch (err) {
      console.log('PASS: Correctly rejected locked account. Code:', err.code, '-', err.message);
    }
    // Restore status
    await prisma.user.update({
      where: { id: patientUser.id },
      data: { status: 'ACTIVE' },
    });

    // Test 4: Patient Cancelling appointment (Within 24h limit check)
    console.log('\n[TEST 4.1] Testing cancellation limit (appointment is 2 days out, should succeed)...');
    const cancelledAppt = await AppointmentService.cancelMyAppointment(currentUserContext, appointment1.id, {
      reason: 'Bận việc cá nhân',
    });
    console.log('Success: Appointment cancelled. New status:', cancelledAppt.status);

    // Verify timeslot is released back to AVAILABLE
    const releasedSlot = await prisma.timeSlot.findUnique({ where: { id: slot1.id } });
    console.log('TimeSlot 1 status after cancellation:', releasedSlot.status); // Expected: AVAILABLE

    // Test 4.2: Cancellation failure when < 24 hours
    console.log('\n[TEST 4.2] Testing cancellation limit (when appointment is today, should fail)...');
    // Book slot1 again, but first move schedule date to today
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Let's delete any schedule on today to avoid conflicts
    await prisma.schedule.deleteMany({
      where: { doctorId: doctor.id, workingDate: today },
    });

    const todaySchedule = await prisma.schedule.create({
      data: {
        doctorId: doctor.id,
        workingDate: today,
        status: 'WORKING',
        timeSlots: {
          create: [
            { startTime: '11:00', endTime: '11:30', status: 'AVAILABLE' },
          ],
        },
      },
      include: {
        timeSlots: true,
      },
    });

    const todaySlot = todaySchedule.timeSlots[0];
    const appointmentToday = await AppointmentService.createAppointment(currentUserContext, {
      timeSlotId: todaySlot.id,
      forSelf: true,
    });
    console.log('Created appointment for today. Code:', appointmentToday.code);

    try {
      await AppointmentService.cancelMyAppointment(currentUserContext, appointmentToday.id, {
        reason: 'Hủy khẩn cấp',
      });
      console.log('FAIL: Expected cancel to fail but it succeeded');
    } catch (err) {
      console.log('PASS: Correctly blocked cancellation within 24h. Code:', err.code, '-', err.message);
    }

    // Test 5: Receptionist marking NO_SHOW and penalty lock
    console.log('\n[TEST 5] Testing No-Show count and automatic lock...');
    const receptionistContext = { userId: 'receptionist-id-dummy', role: 'RECEPTIONIST' };

    // Set noShowCount to 2 first
    await prisma.user.update({
      where: { id: patientUser.id },
      data: { noShowCount: 2 },
    });
    console.log('Set user no-show count to 2');

    // Update appointment status to NO_SHOW (this is the 3rd time)
    const result = await AppointmentService.updateAppointmentStatus(receptionistContext, appointmentToday.id, {
      status: 'NO_SHOW',
      note: 'Bệnh nhân vắng mặt không lý do',
    });
    console.log('Success: Appointment status updated to:', result.status);

    // Check user status
    const updatedUser = await prisma.user.findUnique({ where: { id: patientUser.id } });
    console.log('User noShowCount after update:', updatedUser.noShowCount); // Expected: 3
    console.log('User status after update:', updatedUser.status); // Expected: LOCKED

    console.log('\n--- VERIFICATION COMPLETED SUCCESSFULLY ---');
  } catch (error) {
    console.error('VERIFICATION FAILED WITH ERROR:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testBookingFlow();
