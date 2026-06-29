const { expect } = require('chai');
const { By } = require('selenium-webdriver');
const {
  createDriver,
  waitForUrl,
  clearAndType,
  waitForVisible,
  clickWhenClickable,
  createTestPatient,
  getVerificationOtp,
  getPasswordResetToken,
  createVerifiedPatientViaApi,
  requestPasswordResetViaApi,
  cleanupUserByEmail,
  closeBackendTestClients,
} = require('../helper');
const config = require('../config');

async function registerViaUi(driver, user) {
  await driver.get(`${config.baseUrl}/dang-ky`);
  await clearAndType(driver, By.id('register-name'), user.name);
  await clearAndType(driver, By.id('register-email'), user.email);
  await clearAndType(driver, By.id('register-phone'), user.phone);
  await clearAndType(driver, By.id('register-password'), user.password);
  await clearAndType(driver, By.id('register-confirm-password'), user.confirmPassword);

  await clickWhenClickable(driver, By.xpath("//button[contains(., 'Tạo tài khoản')]"));
}

async function loginViaUi(driver, email, password) {
  await driver.get(`${config.baseUrl}/dang-nhap`);
  await clearAndType(driver, By.id('login-email'), email);
  await clearAndType(driver, By.id('login-password'), password);
  await clickWhenClickable(driver, By.css('button[type="submit"]'));
}

describe('CarePlus Auth E2E Tests', function () {
  this.timeout(90000);

  let driver;
  const createdEmails = new Set();

  beforeEach(async function () {
    driver = createDriver();
  });

  afterEach(async function () {
    if (driver) {
      await driver.quit();
    }
  });

  after(async function () {
    for (const email of createdEmails) {
      await cleanupUserByEmail(email);
    }

    await closeBackendTestClients();
  });

  it('Auth_001: Patient can register a new account and is redirected to verify-email', async function () {
    const user = createTestPatient();
    createdEmails.add(user.email);

    await registerViaUi(driver, user);
    await waitForUrl(driver, '/xac-minh-email');

    const verifyEmailInput = await waitForVisible(driver, By.id('verify-email'));
    expect(await verifyEmailInput.getAttribute('value')).to.equal(user.email);

    const otp = await getVerificationOtp(user.email);
    expect(otp).to.match(/^\d{6}$/);
  });

  it('Auth_002: Patient can verify account with OTP', async function () {
    const user = createTestPatient();
    createdEmails.add(user.email);

    await registerViaUi(driver, user);
    await waitForUrl(driver, '/xac-minh-email');

    const otp = await getVerificationOtp(user.email);
    await clearAndType(driver, By.id('verify-otp'), otp);
    await clickWhenClickable(driver, By.xpath("//button[contains(., 'Xác minh email')]"));

    await waitForUrl(driver, '/dang-nhap');
    const loginHeading = await waitForVisible(driver, By.xpath("//h1[contains(., 'Đăng nhập')]"));
    expect(await loginHeading.isDisplayed()).to.be.true;
  });

  it('Auth_003: Verified patient can log in successfully', async function () {
    const user = createTestPatient();
    createdEmails.add(user.email);
    await createVerifiedPatientViaApi(user);

    await loginViaUi(driver, user.email, user.password);

    await driver.wait(async () => {
      const currentUrl = await driver.getCurrentUrl();
      return currentUrl === `${config.baseUrl}/` || currentUrl === config.baseUrl;
    }, 30000);

    const currentUrl = await driver.getCurrentUrl();
    expect(currentUrl === `${config.baseUrl}/` || currentUrl === config.baseUrl).to.be.true;
  });

  it('Auth_004: Verified patient can request forgot-password reset link', async function () {
    const user = createTestPatient();
    createdEmails.add(user.email);
    await createVerifiedPatientViaApi(user);

    await driver.get(`${config.baseUrl}/quen-mat-khau`);
    await clearAndType(driver, By.id('forgot-password-email'), user.email);
    await clickWhenClickable(driver, By.xpath("//button[contains(., 'Gửi link đặt lại mật khẩu')]"));

    const successMessage = await waitForVisible(
      driver,
      By.xpath("//*[contains(., 'Nếu email tồn tại trong hệ thống, hướng dẫn đặt lại mật khẩu đã được gửi.')]"),
    );
    expect(await successMessage.isDisplayed()).to.be.true;

    const resetToken = await getPasswordResetToken(user.email);
    expect(resetToken).to.match(/^[a-f0-9]{64}$/);
  });

  it('Auth_005: Verified patient can reset password and log in with the new password', async function () {
    const user = createTestPatient();
    const newPassword = 'ResetPass@456';
    createdEmails.add(user.email);
    await createVerifiedPatientViaApi(user);
    await requestPasswordResetViaApi(user.email);

    const resetToken = await getPasswordResetToken(user.email);
    await driver.get(`${config.baseUrl}/dat-lai-mat-khau?email=${encodeURIComponent(user.email)}&token=${encodeURIComponent(resetToken)}`);

    await clearAndType(driver, By.id('reset-password-new-password'), newPassword);
    await clearAndType(driver, By.id('reset-password-confirm-password'), newPassword);
    await clickWhenClickable(driver, By.xpath("//button[contains(., 'Đặt lại mật khẩu')]"));

    await waitForUrl(driver, '/dang-nhap?reset=success');
    const resetSuccessMessage = await waitForVisible(
      driver,
      By.xpath("//*[contains(., 'Đặt lại mật khẩu thành công. Vui lòng đăng nhập lại.')]"),
    );
    expect(await resetSuccessMessage.isDisplayed()).to.be.true;

    await clearAndType(driver, By.id('login-email'), user.email);
    await clearAndType(driver, By.id('login-password'), newPassword);
    await clickWhenClickable(driver, By.css('button[type="submit"]'));

    await driver.wait(async () => {
      const currentUrl = await driver.getCurrentUrl();
      return currentUrl === `${config.baseUrl}/` || currentUrl === config.baseUrl;
    }, 30000);
  });
});
