const { expect } = require('chai');
const { By, until } = require('selenium-webdriver');
const { createDriver, login, waitForUrl } = require('../helper');
const config = require('../config');

const ADMIN_ACCOUNT = {
  email: process.env.TEST_FLOW_ADMIN_EMAIL || 'admin@careplus.vn',
  password: process.env.TEST_FLOW_ADMIN_PASSWORD || '123456',
};

const DOCTOR_ACCOUNT = {
  email: process.env.TEST_FLOW_DOCTOR_EMAIL || 'bsminhanh@careplus.vn',
  password: process.env.TEST_FLOW_DOCTOR_PASSWORD || '123456',
  name: 'Nguyễn Minh Anh',
  title: 'ThS.BS',
};

function formatIsoDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getDateAfterDays(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return formatIsoDate(date);
}

async function authenticatedApiRequest(driver, method, path, body) {
  const response = await driver.executeAsyncScript((requestMethod, requestPath, requestBody, done) => {
    const token = window.localStorage.getItem('accessToken') || window.sessionStorage.getItem('accessToken');
    fetch(`http://localhost:5000/api/v1${requestPath}`, {
      method: requestMethod,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: requestBody ? JSON.stringify(requestBody) : undefined,
    })
      .then(async (res) => {
        const payload = await res.json().catch(() => null);
        done({ ok: res.ok, status: res.status, payload });
      })
      .catch((error) => done({ ok: false, status: 0, payload: { error: { message: error.message } } }));
  }, method, path, body || null);

  return response;
}

async function findDoctorByName(driver, doctorName) {
  const response = await authenticatedApiRequest(
    driver,
    'GET',
    '/doctors?active=true&limit=100'
  );

  if (!response.ok) {
    throw new Error(`Could not search doctor: ${response.payload?.error?.message || response.status}`);
  }

  const doctors = response.payload?.data || [];
  const doctor = doctors.find((item) => item.name?.includes(doctorName));
  if (!doctor) {
    throw new Error(`Could not find doctor "${doctorName}" from GET /doctors`);
  }

  return doctor;
}

async function waitForText(driver, text, timeout = 20000) {
  const element = await driver.wait(
    until.elementLocated(By.xpath(`//*[contains(normalize-space(.), '${text}')]`)),
    timeout
  );
  await driver.wait(until.elementIsVisible(element), timeout);
  return element;
}

async function createWeeklyScheduleForDoctor(driver) {
  const fromDate = getDateAfterDays(0);
  const toDate = getDateAfterDays(6);

  const doctor = await findDoctorByName(driver, DOCTOR_ACCOUNT.name);
  for (const workingShift of ['MORNING', 'AFTERNOON']) {
    const response = await authenticatedApiRequest(driver, 'POST', '/schedules', {
      doctorId: doctor.id,
      fromDate,
      toDate,
      weekdays: [0, 1, 2, 3, 4, 5, 6],
      workingShift,
    });

    if (!response.ok) {
      const message = response.payload?.error?.message || '';
      if (!message.includes('trùng') && !message.includes('đã tồn tại')) {
        throw new Error(`Could not create ${workingShift} weekly schedule: ${message || response.status}`);
      }
    }
  }

  return { fromDate, toDate };
}

async function rejectPendingDoctorLeaveRequestsInRange(driver, doctorName, fromDate, toDate) {
  const response = await authenticatedApiRequest(
    driver,
    'GET',
    '/approval-requests?status=PENDING&type=SCHEDULE_EXCEPTION&page=1&limit=100'
  );

  if (!response.ok) {
    throw new Error(`Could not load pending approval requests for cleanup: ${response.payload?.error?.message || response.status}`);
  }

  const requests = response.payload?.data || [];
  const pendingRequests = requests.filter((request) => {
    const requestDate = String(request.date || '').slice(0, 10);
    return request.doctorName?.includes(doctorName)
      && requestDate >= fromDate
      && requestDate <= toDate;
  });

  for (const request of pendingRequests) {
    await authenticatedApiRequest(driver, 'PATCH', `/approval-requests/${request.id}/reject`, {
      rejectionReason: 'E2E cleanup pending request before schedule leave flow',
    });
  }
}

async function getMyDoctorProfile(driver) {
  const response = await authenticatedApiRequest(driver, 'GET', '/doctors/me/profile');
  if (!response.ok) {
    throw new Error(`Could not load doctor profile: ${response.payload?.error?.message || response.status}`);
  }
  return response.payload?.data;
}

async function getMyApprovalRequests(driver) {
  const response = await authenticatedApiRequest(
    driver,
    'GET',
    '/approval-requests?type=SCHEDULE_EXCEPTION&page=1&limit=100'
  );
  if (!response.ok) {
    throw new Error(`Could not load doctor approval requests: ${response.payload?.error?.message || response.status}`);
  }
  return response.payload?.data || [];
}

async function findDateWithoutActiveLeaveRequests(driver, fromDate) {
  const doctor = await getMyDoctorProfile(driver);
  const scheduleResponse = await authenticatedApiRequest(
    driver,
    'GET',
    `/schedules/doctor/${doctor.id}?startDate=${fromDate}&endDate=${getDateAfterDays(6)}&limit=100`
  );
  if (!scheduleResponse.ok) {
    throw new Error(`Could not load doctor schedules: ${scheduleResponse.payload?.error?.message || scheduleResponse.status}`);
  }

  const workingShiftsByDate = new Map();
  const schedules = scheduleResponse.payload?.data || [];
  schedules.forEach((schedule) => {
    if (schedule.status !== 'WORKING') return;
    const date = String(schedule.workingDate || '').slice(0, 10);
    const shift = schedule.workingShift || schedule.shift;
    const shifts = workingShiftsByDate.get(date) || new Set();
    if (shift === 'ALL_DAY') {
      shifts.add('MORNING');
      shifts.add('AFTERNOON');
    } else {
      shifts.add(shift);
    }
    workingShiftsByDate.set(date, shifts);
  });

  const requests = await getMyApprovalRequests(driver);
  const activeKeys = new Set(
    requests
      .filter((request) => ['PENDING', 'APPROVED'].includes(request.status))
      .map((request) => {
        const date = String(request.date || '').slice(0, 10);
        if (request.exceptionType === 'ALL_DAY') return `${date}:ALL_DAY`;
        return `${date}:${request.shift}`;
      })
  );

  for (let offset = 0; offset < 7; offset += 1) {
    const candidate = new Date(`${fromDate}T00:00:00`);
    candidate.setDate(candidate.getDate() + offset);
    const isoDate = formatIsoDate(candidate);
    const hasAllDayRequest = activeKeys.has(`${isoDate}:ALL_DAY`);
    const hasMorningRequest = activeKeys.has(`${isoDate}:MORNING`);
    const hasAfternoonRequest = activeKeys.has(`${isoDate}:AFTERNOON`);
    const workingShifts = workingShiftsByDate.get(isoDate) || new Set();
    const hasBothWorkingShifts = workingShifts.has('MORNING') && workingShifts.has('AFTERNOON');

    if (hasBothWorkingShifts && !hasAllDayRequest && !hasMorningRequest && !hasAfternoonRequest) {
      return isoDate;
    }
  }

  throw new Error('Could not find a date in the next 7 days without active leave requests for both shifts.');
}

async function createLeaveRequestByApi(driver, date, shift, reason) {
  const response = await authenticatedApiRequest(driver, 'POST', '/approval-requests/schedule-exception', {
    type: 'SCHEDULE_EXCEPTION',
    date,
    exceptionType: 'SHIFT',
    shift,
    reason,
  });

  if (!response.ok) {
    throw new Error(`Could not create ${shift} leave request: ${response.payload?.error?.message || response.status}`);
  }

  return response.payload?.data;
}

async function findApprovalRowByReason(driver, reason) {
  return driver.wait(
    until.elementLocated(By.xpath(`//tr[.//p[contains(normalize-space(.), '${reason}')]]`)),
    20000
  );
}

async function approveRequestByReason(driver, reason) {
  const row = await findApprovalRowByReason(driver, reason);
  const approveButton = await row.findElement(By.xpath(".//button[contains(., 'Duyệt')]"));
  await approveButton.click();
  await waitForText(driver, 'Đã duyệt yêu cầu nghỉ thành công.', 20000);
}

async function rejectRequestByReason(driver, reason, rejectionReason) {
  const row = await findApprovalRowByReason(driver, reason);
  const textarea = await row.findElement(By.css('textarea'));
  await textarea.clear();
  await textarea.sendKeys(rejectionReason);
  const rejectButton = await row.findElement(By.xpath(".//button[contains(., 'Từ chối')]"));
  await rejectButton.click();
  await waitForText(driver, 'Đã từ chối yêu cầu nghỉ.', 20000);
}

async function expectRequestStatus(driver, reason, statusLabel) {
  await driver.navigate().refresh();
  const row = await findApprovalRowByReason(driver, reason);
  const rowText = await row.getText();
  expect(rowText).to.contain(statusLabel);
}

describe('CarePlus Admin Schedule and Doctor Leave Request E2E Tests', function () {
  this.timeout(120000);
  let driver;

  beforeEach(async function () {
    driver = createDriver();
  });

  afterEach(async function () {
    if (driver) {
      await driver.quit();
    }
  });

  it('ScheduleLeave_001: admin creates weekly doctor schedule and processes doctor leave requests by shift', async function () {
    const timestamp = Date.now();
    const morningReason = `E2E nghỉ ca sáng ${timestamp}`;
    const afternoonReason = `E2E nghỉ ca chiều ${timestamp}`;
    const rejectionReason = `E2E từ chối ca chiều ${timestamp}`;

    // 1. Admin logs in and creates a 7-day all-day working schedule for BS Nguyễn Minh Anh.
    console.log('[ScheduleLeave_001] Login admin and ensure weekly schedule.');
    await login(driver, ADMIN_ACCOUNT.email, ADMIN_ACCOUNT.password);
    const scheduleRange = await createWeeklyScheduleForDoctor(driver);
    await rejectPendingDoctorLeaveRequestsInRange(
      driver,
      DOCTOR_ACCOUNT.name,
      scheduleRange.fromDate,
      scheduleRange.toDate
    );

    // 2. Doctor logs in and creates two leave requests, one per shift.
    console.log('[ScheduleLeave_001] Login doctor and create two leave requests.');
    await driver.quit();
    driver = createDriver();
    await login(driver, DOCTOR_ACCOUNT.email, DOCTOR_ACCOUNT.password);
    await driver.get(`${config.baseUrl}/portal/bac-si/lich-lam-viec`);
    await waitForUrl(driver, '/portal/bac-si/lich-lam-viec');
    await waitForText(driver, 'Lịch làm việc');

    await getMyDoctorProfile(driver);
    const leaveDate = await findDateWithoutActiveLeaveRequests(driver, scheduleRange.fromDate);
    await createLeaveRequestByApi(driver, leaveDate, 'MORNING', morningReason);
    await createLeaveRequestByApi(driver, leaveDate, 'AFTERNOON', afternoonReason);
    await driver.navigate().refresh();

    console.log('[ScheduleLeave_001] Verify doctor can see created requests.');
    await waitForText(driver, morningReason, 20000);
    await waitForText(driver, afternoonReason, 20000);

    // 3. Admin approves one request and rejects the other.
    console.log('[ScheduleLeave_001] Login admin and process requests.');
    await driver.quit();
    driver = createDriver();
    await login(driver, ADMIN_ACCOUNT.email, ADMIN_ACCOUNT.password);
    await driver.get(`${config.baseUrl}/portal/admin/duyet-yeu-cau`);
    await waitForUrl(driver, '/portal/admin/duyet-yeu-cau');

    await approveRequestByReason(driver, morningReason);
    await rejectRequestByReason(driver, afternoonReason, rejectionReason);

    // 4. Admin sees the final statuses.
    console.log('[ScheduleLeave_001] Verify admin statuses.');
    await expectRequestStatus(driver, morningReason, 'Đã duyệt');
    await expectRequestStatus(driver, afternoonReason, 'Từ chối');

    // 5. Doctor sees the final statuses and admin rejection feedback.
    console.log('[ScheduleLeave_001] Login doctor and verify final statuses.');
    await driver.quit();
    driver = createDriver();
    await login(driver, DOCTOR_ACCOUNT.email, DOCTOR_ACCOUNT.password);
    await driver.get(`${config.baseUrl}/portal/bac-si/lich-lam-viec`);
    await waitForUrl(driver, '/portal/bac-si/lich-lam-viec');

    await waitForText(driver, morningReason, 20000);
    await waitForText(driver, afternoonReason, 20000);
    await waitForText(driver, 'Đã duyệt', 20000);
    await waitForText(driver, 'Từ chối', 20000);
    await waitForText(driver, rejectionReason, 20000);
  });
});
