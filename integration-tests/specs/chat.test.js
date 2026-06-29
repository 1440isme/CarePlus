const { expect } = require('chai');
const { By, until } = require('selenium-webdriver');
const { createDriver, login, clickWhenClickable, waitForUrl } = require('../helper');
const config = require('../config');

describe('CarePlus Chat E2E Tests', function () {
  this.timeout(60000); // 1 minute timeout
  let driver;

  beforeEach(async function () {
    driver = createDriver();
  });

  afterEach(async function () {
    if (driver) {
      await driver.quit();
    }
  });

  it('Chat_001: Receptionist can access Chat Page without "Please Login" popup', async function () {
    // 1. Login as Receptionist
    await login(driver, config.users.receptionist.email, config.users.receptionist.password);

    // 2. Click Chat menu item
    await clickWhenClickable(driver, By.css('a[href="/portal/le-tan/tin-nhan"]'));

    // 3. Verify redirected to Chat page
    await waitForUrl(driver, '/portal/le-tan/tin-nhan');

    // 4. Assert that no "Please Login" alert popup is visible
    const alertPopups = await driver.findElements(By.xpath("//*[contains(., 'Vui lòng đăng nhập')]"));
    expect(alertPopups.length).to.equal(0);

    // 5. Verify chat conversation list is loaded
    const hasConvsList = await driver.wait(until.elementLocated(By.css('.overflow-y-auto')), 10000);
    expect(hasConvsList).to.not.be.null;
  });

  it('Chat_002: Patient can open Chat Widget and send message', async function () {
    // 1. Login as Patient
    await login(driver, config.users.patient.email, config.users.patient.password);

    // 2. Go to homepage
    await driver.get(config.baseUrl);

    // 3. Robustly open Chat widget
    const triggerLocator = By.css('button[aria-label="Mở khung chat"], .fixed.bottom-4.right-4 button');
    const chatTrigger = await driver.wait(until.elementLocated(triggerLocator), 15000);
    await driver.sleep(1500); // Wait for React hydration
    await driver.executeScript("arguments[0].click();", chatTrigger);

    // Verify it opened
    await driver.wait(until.elementLocated(By.xpath("//*[contains(., 'CarePlus AI')]")), 10000);

    // 4. Click on "Lễ tân CarePlus" (SUPPORT chat) or "Lễ tân"
    const receptionistBtn = await driver.wait(
      until.elementLocated(By.xpath("//button[contains(., 'Lễ tân CarePlus') or contains(., 'Lễ tân') or contains(., 'Chăm sóc khách hàng')]")),
      10000
    );
    await driver.executeScript("arguments[0].click();", receptionistBtn);

    // 5. Wait for the chat textarea to switch to the support conversation placeholder
    const inputArea = await driver.wait(
      until.elementLocated(By.css('textarea[placeholder*="tin nhắn"], textarea[placeholder*="Nhập tin nhắn"]')),
      10000
    );
    const testMessage = `E2E Test Message ${Date.now()}`;
    await driver.executeScript((el, val) => {
      const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set;
      nativeSetter.call(el, val);
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
    }, inputArea, testMessage);
    await driver.sleep(1000); // Allow React to update state and enable button

    // 6. Click send
    const sendBtn = await driver.findElement(By.xpath("//button[.//descendant::*[contains(@class, 'lucide-send')]]"));
    await driver.executeScript("arguments[0].click();", sendBtn);

    // 7. Verify message is displayed in conversation window
    const lastSentMsg = await driver.wait(
      until.elementLocated(By.xpath(`//*[contains(., '${testMessage}')]`)),
      10000
    );
    expect(await lastSentMsg.isDisplayed()).to.be.true;
  });
});
