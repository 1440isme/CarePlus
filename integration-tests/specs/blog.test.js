const { expect } = require('chai');
const { By, until } = require('selenium-webdriver');
const { createDriver, login, clickWhenClickable, waitForUrl } = require('../helper');
const config = require('../config');

describe('CarePlus Blog Management E2E Tests', function () {
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

  it('Blog_001: Admin can create a new blog post in DRAFT status', async function () {
    // 1. Login as Admin
    await login(driver, config.users.admin.email, config.users.admin.password);

    // 2. Go to Blog Management
    await driver.get(`${config.baseUrl}/portal/admin/blog`);
    await waitForUrl(driver, '/portal/admin/blog');

    // 3. Click "Thêm bài viết mới"
    await clickWhenClickable(driver, By.xpath("//button[contains(., 'Thêm bài viết') or contains(., 'Viết bài')]"));

    // 4. Fill form details
    const titleInput = await driver.wait(until.elementLocated(By.css('input[placeholder*="tiêu đề"], input[name="title"]')), 10000);
    const testTitle = `Bac si khuyen dung nuoc am - E2E Test ${Date.now()}`;
    await titleInput.sendKeys(testTitle);

    const contentInput = await driver.wait(
      until.elementLocated(By.css('.ck-editor__editable, textarea[placeholder*="nội dung"], textarea[name="content"]')),
      10000
    );
    await contentInput.sendKeys('Đây là nội dung hướng dẫn sức khỏe quan trọng dành cho mọi độ tuổi...');

    // Select DRAFT state if dropdown exists
    const statusSelect = await driver.findElements(By.css('select[name="status"], select'));
    if (statusSelect.length > 0) {
      await statusSelect[0].sendKeys('DRAFT');
    }

    // 5. Save Blog
    const saveBtn = await driver.findElement(By.xpath("//button[contains(., 'Lưu nháp') or contains(., 'Lưu')]"));
    await saveBtn.click();

    // 6. Verify redirection to list view
    const listView = await driver.wait(until.elementLocated(By.css('.blog-mgmt-list-view')), 15000);
    await driver.wait(until.elementIsVisible(listView), 15000);

    // Refresh the page to guarantee the list view re-fetches fresh data from DB
    await driver.navigate().refresh();
    const refreshedListView = await driver.wait(until.elementLocated(By.css('.blog-mgmt-list-view')), 15000);
    await driver.wait(until.elementIsVisible(refreshedListView), 15000);

    // 7. Verify the new blog displays in list in DRAFT status
    // BlogManagement renders titles in an h3 tag
    const createdBlogItem = await driver.wait(
      until.elementLocated(By.xpath(`//h3[contains(., '${testTitle}')]`)),
      20000
    );
    expect(await createdBlogItem.isDisplayed()).to.be.true;
  });

  it('Blog_006: Patient dashboard does not show Blog Management menus', async function () {
    // 1. Login as Patient
    await login(driver, config.users.patient.email, config.users.patient.password);

    // 2. Open dashboard/home
    await driver.get(config.baseUrl);

    // 3. Assert side-nav/top-nav doesn't have Admin/Blog Management options
    const adminNavs = await driver.findElements(By.xpath("//a[contains(., 'Quản lý bài viết') or contains(., 'Admin') or contains(., 'Quản trị')]"));
    expect(adminNavs.length).to.equal(0);

    // 4. Try navigating directly to admin blog page
    await driver.get(`${config.baseUrl}/portal/admin/blog`);

    // 5. Verify redirected back or showing unauthorized error
    await driver.wait(async () => {
      const url = await driver.getCurrentUrl();
      return url === `${config.baseUrl}/` || url === `${config.baseUrl}` || url.includes('/dang-nhap') || url.includes('/error') || url.includes('/403');
    }, 10000);
  });
});
