const { Builder, By, until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const config = require('./config');
const path = require('path');

let backendEnvLoaded = false;
let redisClient;
let prismaClient;

function loadBackendEnv() {
  if (backendEnvLoaded) {
    return;
  }

  require('dotenv').config({ path: path.resolve(__dirname, '../backend/.env') });
  backendEnvLoaded = true;
}

function getRedisClient() {
  if (!redisClient) {
    loadBackendEnv();
    redisClient = require('../backend/src/infrastructure/cache/redis.client');
  }

  return redisClient;
}

function getPrismaClient() {
  if (!prismaClient) {
    loadBackendEnv();
    prismaClient = require('../backend/src/infrastructure/database/prisma.client');
  }

  return prismaClient;
}

/**
 * Initialize a new Chrome Selenium WebDriver instance.
 */
function createDriver() {
  const options = new chrome.Options();
  if (config.headless) {
    options.addArguments('--headless=new');
    options.addArguments('--disable-gpu');
    options.addArguments('--no-sandbox');
    options.addArguments('--disable-dev-shm-usage');
  }
  options.addArguments('--window-size=1280,1024');

  return new Builder()
    .forBrowser('chrome')
    .setChromeOptions(options)
    .build();
}

/**
 * Helper to log in to CarePlus.
 */
async function login(driver, email, password) {
  await driver.get(`${config.baseUrl}/dang-nhap`);
  
  // Wait for login form to load
  const emailInput = await driver.wait(until.elementLocated(By.id('login-email')), 20000);
  const passwordInput = await driver.wait(until.elementLocated(By.id('login-password')), 20000);
  const rememberCheckbox = await driver.findElement(By.id('login-remember-me'));
  const submitButton = await driver.findElement(By.css('button[type="submit"]'));

  // Enter credentials
  await emailInput.clear();
  await emailInput.sendKeys(email);
  await passwordInput.clear();
  await passwordInput.sendKeys(password);

  // Click remember me
  if (!(await rememberCheckbox.isSelected())) {
    await rememberCheckbox.click();
  }

  // Submit
  await submitButton.click();

  // Wait for redirect/loading (e.g. check for dashboard url or home public)
  await driver.wait(async () => {
    const url = await driver.getCurrentUrl();
    return url.includes('/portal/') || url.includes('/benh-nhan') || url === `${config.baseUrl}/` || url === `${config.baseUrl}`;
  }, 30000);
}

/**
 * Helper to click an element only after it becomes clickable.
 */
async function clickWhenClickable(driver, locator, timeout = 20000) {
  const element = await driver.wait(until.elementLocated(locator), timeout);
  await driver.wait(until.elementIsVisible(element), timeout);
  await driver.wait(until.elementIsEnabled(element), timeout);
  await element.click();
  return element;
}

/**
 * Helper to find and return text of an element after it becomes visible.
 */
async function getText(driver, locator, timeout = 20000) {
  const element = await driver.wait(until.elementLocated(locator), timeout);
  await driver.wait(until.elementIsVisible(element), timeout);
  return element.getText();
}

/**
 * Wait for a specific URL match.
 */
async function waitForUrl(driver, urlPart, timeout = 20000) {
  await driver.wait(async () => {
    const url = await driver.getCurrentUrl();
    return url.includes(urlPart);
  }, timeout);
}

async function clearAndType(driver, locator, value, timeout = 20000) {
  const element = await driver.wait(until.elementLocated(locator), timeout);
  await driver.wait(until.elementIsVisible(element), timeout);
  await element.clear();
  await element.sendKeys(value);
  return element;
}

async function waitForVisible(driver, locator, timeout = 20000) {
  const element = await driver.wait(until.elementLocated(locator), timeout);
  await driver.wait(until.elementIsVisible(element), timeout);
  return element;
}

function createTestPatient(overrides = {}) {
  const uniqueSuffix = `${Date.now()}${Math.floor(Math.random() * 1000)}`;

  return {
    name: overrides.name || `Test Patient ${uniqueSuffix}`,
    email: overrides.email || `test.patient.${uniqueSuffix}@careplus-e2e.local`,
    phone: overrides.phone || `09${String(uniqueSuffix).slice(-8)}`,
    password: overrides.password || 'AuthTest@123',
    confirmPassword: overrides.confirmPassword || overrides.password || 'AuthTest@123',
  };
}

async function apiPost(pathname, payload) {
  if (typeof fetch !== 'function') {
    throw new Error('Global fetch is not available in this Node.js runtime');
  }

  const response = await fetch(`${config.apiBaseUrl}${pathname}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const body = await response.json();

  if (!response.ok || body?.success === false) {
    const error = new Error(body?.error?.message || `API request failed for ${pathname}`);
    error.response = body;
    throw error;
  }

  return body;
}

async function waitForRedisValue(key, timeout = 15000, interval = 250) {
  const redis = getRedisClient();
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeout) {
    const value = await redis.get(key);
    if (value) {
      return value;
    }

    await new Promise((resolve) => setTimeout(resolve, interval));
  }

  throw new Error(`Timed out waiting for Redis key: ${key}`);
}

async function getVerificationOtp(email, timeout = 15000) {
  return waitForRedisValue(`otp:email-verify:${email.trim().toLowerCase()}`, timeout);
}

async function getPasswordResetToken(email, timeout = 15000) {
  return waitForRedisValue(`reset:password:${email.trim().toLowerCase()}`, timeout);
}

async function registerPatientViaApi(user) {
  return apiPost('/auth/register', {
    name: user.name,
    email: user.email,
    phone: user.phone,
    password: user.password,
  });
}

async function verifyPatientEmailViaApi(email, otp) {
  return apiPost('/auth/verify-email', { email, otp });
}

async function createVerifiedPatientViaApi(user) {
  await registerPatientViaApi(user);
  const otp = await getVerificationOtp(user.email);
  await verifyPatientEmailViaApi(user.email, otp);
  return user;
}

async function requestPasswordResetViaApi(email) {
  return apiPost('/auth/forgot-password', { email });
}

async function cleanupAuthArtifacts(email) {
  const normalizedEmail = email.trim().toLowerCase();
  const redis = getRedisClient();

  await redis.del(
    `otp:email-verify:${normalizedEmail}`,
    `ratelimit:resend-otp:${normalizedEmail}`,
    `reset:password:${normalizedEmail}`,
  );
}

async function cleanupUserByEmail(email) {
  const normalizedEmail = email.trim().toLowerCase();
  const prisma = getPrismaClient();

  await cleanupAuthArtifacts(normalizedEmail);
  await prisma.user.deleteMany({
    where: { email: normalizedEmail },
  });
}

async function closeBackendTestClients() {
  // Do nothing to prevent closing shared singletons from require cache.
  // Mocha --exit will clean up all connections.
}

module.exports = {
  createDriver,
  login,
  clickWhenClickable,
  getText,
  waitForUrl,
  clearAndType,
  waitForVisible,
  createTestPatient,
  getVerificationOtp,
  getPasswordResetToken,
  registerPatientViaApi,
  verifyPatientEmailViaApi,
  createVerifiedPatientViaApi,
  requestPasswordResetViaApi,
  cleanupUserByEmail,
  closeBackendTestClients,
};
