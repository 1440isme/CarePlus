const path = require('path');
const { expect } = require('chai');
const { By, until } = require('selenium-webdriver');
const {
  createDriver,
  login,
  clickWhenClickable,
  clearAndType,
  waitForVisible,
  waitForUrl,
  createTestPatient,
  cleanupUserByEmail,
  closeBackendTestClients,
} = require('../helper');
const config = require('../config');

// Load backend environment variables and initialize Prisma client
require('dotenv').config({ path: path.resolve(__dirname, '../../backend/.env') });
const prisma = require('../../backend/src/infrastructure/database/prisma.client');

/**
 * Bulletproof helper to set values of React-controlled inputs, selects, and textareas.
 */
async function setReactInputValue(driver, locator, value) {
  const element = await driver.wait(until.elementLocated(locator), 15000);
  await driver.wait(until.elementIsVisible(element), 15000);
  await driver.executeScript((el, val) => {
    let prototype;
    if (el.tagName === 'SELECT') {
      prototype = window.HTMLSelectElement.prototype;
    } else if (el.tagName === 'TEXTAREA') {
      prototype = window.HTMLTextAreaElement.prototype;
    } else {
      prototype = window.HTMLInputElement.prototype;
    }
    const nativeSetter = Object.getOwnPropertyDescriptor(prototype, 'value').set;
    nativeSetter.call(el, val);
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
  }, element, value);
  await driver.sleep(200); // Small pause to let React render state updates
}

describe('CarePlus Booking Wizard E2E Tests', function () {
  this.timeout(90000); // 1.5 minutes timeout per test

  let driver;
  const createdEmails = new Set();
  let testDate;
  let dateStr; // YYYY-MM-DD
  const doctorId = 'd1'; // Dr. Nguyễn Minh Anh
  const doctorName = 'Nguyễn Minh Anh';
  const specialtyName = 'Tim mạch';
  let createdScheduleId = null;

  before(async function () {
    // Generate test date (tomorrow) to avoid past timeslots expiry
    const testDateLocal = new Date();
    testDateLocal.setDate(testDateLocal.getDate() + 1);

    const pad = (n) => String(n).padStart(2, '0');
    dateStr = `${testDateLocal.getFullYear()}-${pad(testDateLocal.getMonth() + 1)}-${pad(testDateLocal.getDate())}`;

    // Safely parse date in UTC so Prisma saves the exact date in MySQL without timezone offset shift
    testDate = new Date(`${dateStr}T00:00:00.000Z`);

    console.log(`[E2E Setup] dateStr: ${dateStr}`);
    console.log(`[E2E Setup] testDate ISO: ${testDate.toISOString()}`);

    // Clean up any existing schedule/appointments for this doctor on the testDate to avoid constraints violations
    await prisma.appointment.deleteMany({
      where: {
        doctorId: doctorId,
        appointmentDate: testDate,
      },
    });

    await prisma.schedule.deleteMany({
      where: {
        doctorId: doctorId,
        workingDate: testDate,
      },
    });

    // Create a working schedule with specific timeslots matching the application format (no seconds)
    const schedule = await prisma.schedule.create({
      data: {
        doctorId: doctorId,
        workingDate: testDate,
        workingShift: 'ALL_DAY',
        status: 'WORKING',
        timeSlots: {
          create: [
            { startTime: '09:00', endTime: '09:30', workingShift: 'MORNING', status: 'AVAILABLE' },
            { startTime: '09:30', endTime: '10:00', workingShift: 'MORNING', status: 'AVAILABLE' },
            { startTime: '14:00', endTime: '14:30', workingShift: 'AFTERNOON', status: 'AVAILABLE' },
          ],
        },
      },
    });
    createdScheduleId = schedule.id;
    console.log(`[E2E Setup] Created schedule ID: ${createdScheduleId}`);
  });

  beforeEach(async function () {
    driver = createDriver();
  });

  afterEach(async function () {
    if (this.currentTest.state === 'failed') {
      console.log(`\n[E2E Debug] --- TEST FAILED: ${this.currentTest.title} ---`);
      try {
        const url = await driver.getCurrentUrl();
        console.log(`[E2E Debug] Current URL: ${url}`);
        const bodyText = await driver.findElement(By.tagName('body')).getText();
        console.log(`[E2E Debug] Body text snippet (first 1200 chars):\n${bodyText.slice(0, 1200)}`);
        
        // Retrieve and print browser console logs
        try {
          const logs = await driver.manage().logs().get('browser');
          console.log('[E2E Debug] Browser console logs:');
          logs.forEach(log => console.log(`[${log.level.name}] ${log.message}`));
        } catch (logErr) {
          console.error('[E2E Debug] Failed to capture browser logs:', logErr.message);
        }
      } catch (err) {
        console.error('[E2E Debug] Failed to capture page info:', err.message);
      }
      console.log('[E2E Debug] ------------------------------------\n');
    }

    if (driver) {
      await driver.quit();
    }
  });

  after(async function () {
    // Clean up created appointments and schedules
    if (createdScheduleId) {
      try {
        await prisma.appointment.deleteMany({
          where: { scheduleId: createdScheduleId },
        });
        await prisma.timeSlot.deleteMany({
          where: { scheduleId: createdScheduleId },
        });
        await prisma.schedule.delete({
          where: { id: createdScheduleId },
        });
      } catch (err) {
        console.error('[E2E Cleanup Error] Failed to delete test schedule:', err.message);
      }
    }

    // Clean up test patient users and their patient profiles
    for (const email of createdEmails) {
      try {
        const u = await prisma.user.findUnique({ where: { email } });
        if (u) {
          // Delete appointments for this patient
          await prisma.appointment.deleteMany({
            where: { patientId: u.id },
          });
          // Delete patient profiles for this patient
          await prisma.patientProfile.deleteMany({
            where: { userId: u.id },
          });
        }
        await cleanupUserByEmail(email);
        console.log(`[E2E Cleanup] Deleted patient and profiles: ${email}`);
      } catch (err) {
        console.error(`[E2E Cleanup Error] Failed to delete patient ${email}:`, err.message);
      }
    }

    await closeBackendTestClients();
  });

  it('Booking_001: Patient can book an appointment for themselves successfully', async function () {
    // 1. Create a verified patient account
    const user = createTestPatient();
    createdEmails.add(user.email);
    const apiUser = {
      name: user.name,
      email: user.email,
      phone: user.phone,
      password: user.password,
    };
    
    // Register and verify the user via API to save time
    const { registerPatientViaApi, getVerificationOtp, verifyPatientEmailViaApi } = require('../helper');
    await registerPatientViaApi(apiUser);
    const otp = await getVerificationOtp(user.email);
    await verifyPatientEmailViaApi(user.email, otp);

    // 2. Log in and go to the booking wizard page
    await login(driver, user.email, user.password);
    await driver.get(`${config.baseUrl}/dat-lich`);
    await waitForUrl(driver, '/dat-lich');

    // 3. Step 1: Select Specialty
    const specialtyBtn = await driver.wait(
      until.elementLocated(
        By.xpath(`//button[contains(@class, 'specialty-card-button') and .//span[contains(text(), '${specialtyName}')]]`)
      ),
      15000
    );
    await driver.executeScript('arguments[0].click();', specialtyBtn);
    await clickWhenClickable(driver, By.css('.btn-wizard-next'));

    // 4. Step 2: Select Date and TimeSlot
    // Select the date card corresponding to our target date (tomorrow)
    const dateBtn = await driver.wait(
      until.elementLocated(
        By.xpath(`//button[contains(@class, 'date-card-button') and .//span[@class='date-card-num' and text()='${testDate.getUTCDate()}']]`)
      ),
      15000
    );
    await driver.executeScript('arguments[0].click();', dateBtn);
    await driver.sleep(1000); // Wait for slots query to fetch

    // Select the doctor card to expand timeslots (if not already selected)
    const doctorCard = await driver.wait(
      until.elementLocated(
        By.xpath(`//div[contains(@class, 'doctor-main-info') and .//div[contains(@class, 'doctor-name-text') and contains(text(), '${doctorName}')]]`)
      ),
      15000
    );
    await driver.executeScript('arguments[0].click();', doctorCard);
    await driver.sleep(1000); // Wait for slide animation/render

    // Select timeslot "09:00 - 09:30" using normalize-space to handle newlines
    const slotBtn = await driver.wait(
      until.elementLocated(
        By.xpath("//button[contains(@class, 'timeslot-btn') and normalize-space(.)='09:00 - 09:30']")
      ),
      15000
    );
    await driver.executeScript('arguments[0].click();', slotBtn);
    await clickWhenClickable(driver, By.css('.btn-wizard-next'));

    // 5. Step 3: Fill out Reason
    // Wait for the reason textarea and use React value setter helper
    await setReactInputValue(driver, By.css('textarea[placeholder*="Mô tả triệu chứng"]'), 'Khám sức khỏe tim mạch định kỳ E2E Test');
    await clickWhenClickable(driver, By.css('.btn-wizard-next'));

    // 6. Step 4: Confirm Details
    // Verify confirmation details are displayed
    const docNameConfirm = await driver.wait(
      until.elementLocated(By.xpath(`//span[contains(@class, 'confirm-detail-val') and contains(text(), '${doctorName}')]`)),
      15000
    );
    expect(await docNameConfirm.isDisplayed()).to.be.true;

    const specialtyConfirm = await driver.findElement(
      By.xpath(`//span[contains(@class, 'confirm-detail-val') and contains(text(), '${specialtyName}')]`)
    );
    expect(await specialtyConfirm.isDisplayed()).to.be.true;

    // Confirm booking
    await clickWhenClickable(driver, By.css('.btn-confirm-booking'));

    // 7. Step 5: Verify Success Screen
    const successTitle = await driver.wait(
      until.elementLocated(By.css('.success-title')),
      25000
    );
    expect(await successTitle.getText()).to.contain('Đặt lịch thành công');

    const bookingCodeLabel = await driver.findElement(By.css('.highlight-code'));
    const code = await bookingCodeLabel.getText();
    expect(code).to.match(/^CP\d{10}$/);
    console.log(`[E2E Verification] Successfully created appointment code: ${code}`);
  });

  it('Booking_002: Patient can book an appointment for a relative by adding a profile inline', async function () {
    // 1. Create a verified patient account
    const user = createTestPatient();
    createdEmails.add(user.email);
    const apiUser = {
      name: user.name,
      email: user.email,
      phone: user.phone,
      password: user.password,
    };
    
    const { registerPatientViaApi, getVerificationOtp, verifyPatientEmailViaApi } = require('../helper');
    await registerPatientViaApi(apiUser);
    const otp = await getVerificationOtp(user.email);
    await verifyPatientEmailViaApi(user.email, otp);

    // 2. Log in and go to the booking wizard page
    await login(driver, user.email, user.password);
    await driver.get(`${config.baseUrl}/dat-lich`);
    await waitForUrl(driver, '/dat-lich');

    // 3. Step 1: Select Specialty
    const specialtyBtn = await driver.wait(
      until.elementLocated(
        By.xpath(`//button[contains(@class, 'specialty-card-button') and .//span[contains(text(), '${specialtyName}')]]`)
      ),
      15000
    );
    await driver.executeScript('arguments[0].click();', specialtyBtn);
    await clickWhenClickable(driver, By.css('.btn-wizard-next'));

    // 4. Step 2: Select Date and TimeSlot
    const dateBtn = await driver.wait(
      until.elementLocated(
        By.xpath(`//button[contains(@class, 'date-card-button') and .//span[@class='date-card-num' and text()='${testDate.getUTCDate()}']]`)
      ),
      15000
    );
    await driver.executeScript('arguments[0].click();', dateBtn);
    await driver.sleep(1000);

    const doctorCard = await driver.wait(
      until.elementLocated(
        By.xpath(`//div[contains(@class, 'doctor-main-info') and .//div[contains(@class, 'doctor-name-text') and contains(text(), '${doctorName}')]]`)
      ),
      15000
    );
    await driver.executeScript('arguments[0].click();', doctorCard);
    await driver.sleep(1000);

    // Select timeslot "09:30 - 10:00" using normalize-space to handle newlines
    const slotBtn = await driver.wait(
      until.elementLocated(
        By.xpath("//button[contains(@class, 'timeslot-btn') and normalize-space(.)='09:30 - 10:00']")
      ),
      15000
    );
    await driver.executeScript('arguments[0].click();', slotBtn);
    await clickWhenClickable(driver, By.css('.btn-wizard-next'));

    // 5. Step 3: Add and select a relative
    
    // Wait until the person picker button has finished loading the user's details and contains the edit pen symbol
    await driver.wait(async () => {
      try {
        const btn = await driver.findElement(By.xpath("//div[h3[contains(text(), 'Thông tin người được khám')]]/button"));
        const text = await btn.getText();
        return text.includes('Test Patient') && text.includes('✎');
      } catch (err) {
        return false;
      }
    }, 15000);

    // Locate the stable person picker button
    const personPickerBtn = await driver.findElement(By.xpath("//div[h3[contains(text(), 'Thông tin người được khám')]]/button"));
    // Click button to open the person picker popup using executeScript for robust headless Chrome triggers
    await driver.executeScript('arguments[0].click();', personPickerBtn);
    
    // Wait for the modal/portal to open and animate
    const modalHeader = await driver.wait(
      until.elementLocated(By.xpath("//h3[contains(text(), 'Chọn người được khám')]")),
      15000
    );
    await driver.wait(until.elementIsVisible(modalHeader), 15000);
    await driver.sleep(500);

    // Click "＋ Thêm người thân" via executeScript
    const addRelativeBtn = await driver.wait(
      until.elementLocated(By.xpath("//button[contains(., 'Thêm người thân')]")),
      15000
    );
    await driver.executeScript('arguments[0].click();', addRelativeBtn);
    
    // Wait for the inline form to render
    const nameInputLocator = By.css('input[placeholder="Nhập họ tên"]');
    const nameInputEl = await driver.wait(until.elementLocated(nameInputLocator), 15000);
    await driver.wait(until.elementIsVisible(nameInputEl), 15000);
    await driver.sleep(500);

    // Fill the inline relative form using our bulletproof React value setter helper
    const relativeName = 'Nguyen Van Be';
    const relativePhone = '0988777666'; // Valid Vietnamese phone number format
    await setReactInputValue(driver, By.css('input[placeholder="Nhập họ tên"]'), relativeName);
    await setReactInputValue(driver, By.xpath("//select[option[@value='CON']]"), 'CON');
    await setReactInputValue(driver, By.css('input[placeholder="09..."]'), relativePhone);
    await setReactInputValue(driver, By.css('input[type="date"]'), '2015-05-15');
    await setReactInputValue(driver, By.xpath("//select[option[@value='MALE']]"), 'MALE');

    // Click Add button
    const submitRelativeBtn = await driver.findElement(By.xpath("//button[text()='Thêm']"));
    await driver.executeScript('arguments[0].click();', submitRelativeBtn);

    // Verify relative is selected in Step 3 inputs (waiting for state update)
    // Wait until the React state updates and the inputs receive the new relative's info
    await driver.wait(async () => {
      try {
        const nameInput = await driver.findElement(By.xpath("//div[.//label[contains(text(), 'Họ tên')]]/input"));
        const currentNameVal = await nameInput.getAttribute('value');
        return currentNameVal === relativeName;
      } catch (err) {
        return false;
      }
    }, 15000);

    const nameInput = await driver.findElement(By.xpath("//div[.//label[contains(text(), 'Họ tên')]]/input"));
    const phoneInput = await driver.findElement(By.xpath("//div[.//label[contains(text(), 'Số điện thoại')]]/input"));

    expect(await nameInput.getAttribute('value')).to.equal(relativeName);
    expect(await phoneInput.getAttribute('value')).to.equal(relativePhone);

    // Enter reason
    await setReactInputValue(driver, By.css('textarea[placeholder*="Mô tả triệu chứng"]'), 'Khám tổng quát định kỳ cho con E2E Test');
    await clickWhenClickable(driver, By.css('.btn-wizard-next'));

    // 6. Step 4: Confirm Details
    const relativeNameConfirm = await driver.wait(
      until.elementLocated(By.xpath(`//span[contains(@class, 'confirm-detail-val') and contains(text(), '${relativeName}')]`)),
      15000
    );
    expect(await relativeNameConfirm.isDisplayed()).to.be.true;

    // Confirm booking
    await clickWhenClickable(driver, By.css('.btn-confirm-booking'));

    // 7. Step 5: Verify Success
    const successTitle = await driver.wait(
      until.elementLocated(By.css('.success-title')),
      25000
    );
    expect(await successTitle.getText()).to.contain('Đặt lịch thành công');
  });

  it('Booking_003: Booking Wizard validates required fields (Reason of visit) on Step 3', async function () {
    // 1. Create a verified patient account
    const user = createTestPatient();
    createdEmails.add(user.email);
    const apiUser = {
      name: user.name,
      email: user.email,
      phone: user.phone,
      password: user.password,
    };
    
    const { registerPatientViaApi, getVerificationOtp, verifyPatientEmailViaApi } = require('../helper');
    await registerPatientViaApi(apiUser);
    const otp = await getVerificationOtp(user.email);
    await verifyPatientEmailViaApi(user.email, otp);

    // 2. Log in and go to the booking wizard page
    await login(driver, user.email, user.password);
    await driver.get(`${config.baseUrl}/dat-lich`);
    await waitForUrl(driver, '/dat-lich');

    // 3. Step 1: Select Specialty
    const specialtyBtn = await driver.wait(
      until.elementLocated(
        By.xpath(`//button[contains(@class, 'specialty-card-button') and .//span[contains(text(), '${specialtyName}')]]`)
      ),
      15000
    );
    await driver.executeScript('arguments[0].click();', specialtyBtn);
    await clickWhenClickable(driver, By.css('.btn-wizard-next'));

    // 4. Step 2: Select Date and TimeSlot
    const dateBtn = await driver.wait(
      until.elementLocated(
        By.xpath(`//button[contains(@class, 'date-card-button') and .//span[@class='date-card-num' and text()='${testDate.getUTCDate()}']]`)
      ),
      15000
    );
    await driver.executeScript('arguments[0].click();', dateBtn);
    await driver.sleep(1000);

    const doctorCard = await driver.wait(
      until.elementLocated(
        By.xpath(`//div[contains(@class, 'doctor-main-info') and .//div[contains(@class, 'doctor-name-text') and contains(text(), '${doctorName}')]]`)
      ),
      15000
    );
    await driver.executeScript('arguments[0].click();', doctorCard);
    await driver.sleep(1000);

    // Select timeslot "14:00 - 14:30" using normalize-space to handle newlines
    const slotBtn = await driver.wait(
      until.elementLocated(
        By.xpath("//button[contains(@class, 'timeslot-btn') and normalize-space(.)='14:00 - 14:30']")
      ),
      15000
    );
    await driver.executeScript('arguments[0].click();', slotBtn);
    await clickWhenClickable(driver, By.css('.btn-wizard-next'));

    // 5. Step 3: Click Next without entering a reason (it is empty)
    const reasonTextarea = await driver.wait(
      until.elementLocated(By.css('textarea[placeholder*="Mô tả triệu chứng"]')),
      15000
    );
    await reasonTextarea.clear();
    await clickWhenClickable(driver, By.css('.btn-wizard-next'));

    // 6. Verify error banner is visible and prompts to fill required fields
    const errorBanner = await driver.wait(
      until.elementLocated(
        By.xpath("//div[contains(., 'Vui lòng điền đầy đủ các thông tin bắt buộc')]")
      ),
      15000
    );
    expect(errorBanner).to.not.be.null;
    expect(await errorBanner.isDisplayed()).to.be.true;
    console.log(`[E2E Verification] Correctly blocked transition with empty reason. Error text shown.`);
  });
});
