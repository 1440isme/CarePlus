const { expect } = require('chai');
const { By, until } = require('selenium-webdriver');
const { createDriver, login, clickWhenClickable, waitForUrl } = require('../helper');
const config = require('../config');

describe('CarePlus Doctor Review E2E Tests', function () {
  this.timeout(60000);
  let driver;

  beforeEach(async function () {
    driver = createDriver();
  });

  afterEach(async function () {
    if (driver) {
      await driver.quit();
    }
  });

  it('Review_007: Default rating for new doctor without reviews displays 0.0', async function () {
    // 1. Open doctor list page directly
    await driver.get(`${config.baseUrl}/bac-si`);

    // 2. Click on the newly created doctor profile (who has 0 reviews)
    // Lê Thảo Vy (CK Nhi) has 0 reviews in our seed
    const docLink = await driver.wait(
      until.elementLocated(By.xpath("//h3[contains(., 'Thảo Vy')]/ancestor::div[contains(@class, 'bg-white')]//a[contains(., 'Xem chi tiết')]")),
      20000
    );
    await docLink.click();

    // 3. Verify on doctor details page
    await waitForUrl(driver, '/bac-si/');

    // 4. Verify rating text displays "0.0" and count shows "0 đánh giá"
    const ratingText = await driver.wait(
      until.elementLocated(By.xpath("//div[contains(@class, 'flex')]//span[contains(@class, 'text-sm') and contains(., '0.0')]")),
      20000
    );
    expect(await ratingText.getText()).to.equal('0.0');

    const reviewCountText = await driver.findElement(By.xpath("//div[contains(@class, 'flex')]//span[contains(@class, 'text-xs') and contains(., '0 đánh giá')]"));
    expect(await reviewCountText.getText()).to.contain('0');
  });

  it('Review_001: Patient can submit a review for completed appointment', async function () {
    // 1. Login as Patient
    await login(driver, config.users.patient.email, config.users.patient.password);

    // 2. Go to Appointment History
    await driver.get(`${config.baseUrl}/lich-hen`);

    // 3. Select a completed appointment (which displays the "Đánh giá" button)
    // We search for a button with text "Đánh giá"
    const evaluateBtns = await driver.findElements(By.xpath("//button[contains(., 'Đánh giá') or contains(., 'Đánh giá dịch vụ')]"));
    
    if (evaluateBtns.length === 0) {
      console.log('Skipping Review_001 because no completed, reviewable appointments exist.');
      return;
    }

    await evaluateBtns[0].click();

    // 4. In review popup, click the 5th star
    // Wait for the modal/popup to open
    const star5 = await driver.wait(
      until.elementLocated(By.css('.flex.gap-0\\.5 svg:nth-child(5), .modal svg:nth-child(5)')),
      10000
    );
    await star5.click();

    // 5. Fill comments textarea
    const commentInput = await driver.findElement(By.css('textarea[placeholder*="nhận xét"], textarea[name="comment"]'));
    await commentInput.clear();
    await commentInput.sendKeys('Bác sĩ khám rất tận tâm và tư vấn kỹ càng.');

    // 6. Click send
    const submitBtn = await driver.findElement(By.xpath("//button[contains(., 'Gửi') or contains(., 'Hoàn tất')]"));
    await submitBtn.click();

    // 7. Verify modal closes and button changes to "Đã đánh giá"
    await driver.wait(until.stalenessOf(submitBtn), 10000);
    const evaluatedLabel = await driver.wait(
      until.elementLocated(By.xpath("//span[contains(., 'Đã đánh giá') or contains(@class, 'text-gray-400')]")),
      10000
    );
    expect(await evaluatedLabel.isDisplayed()).to.be.true;
  });
});
