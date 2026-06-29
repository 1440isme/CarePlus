const { Builder, By, until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const config = require('./config');

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

module.exports = {
  createDriver,
  login,
  clickWhenClickable,
  getText,
  waitForUrl,
};
