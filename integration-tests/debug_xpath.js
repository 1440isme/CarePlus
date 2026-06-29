const { Builder, By, until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');

async function main() {
  const options = new chrome.Options();
  options.addArguments('--headless=new');
  options.addArguments('--no-sandbox');
  options.addArguments('--disable-dev-shm-usage');

  const driver = await new Builder().forBrowser('chrome').setChromeOptions(options).build();
  try {
    console.log('Navigating to login page...');
    await driver.get('http://localhost:5173/dang-nhap');
    
    // Login
    const emailInput = await driver.wait(until.elementLocated(By.id('login-email')), 10000);
    const passwordInput = await driver.findElement(By.id('login-password'));
    const rememberCheckbox = await driver.findElement(By.id('login-remember-me'));
    const submitBtn = await driver.findElement(By.css('button[type="submit"]'));
    
    await emailInput.sendKeys('nguyenvana@email.com');
    await passwordInput.sendKeys('123456');
    if (!(await rememberCheckbox.isSelected())) {
      await rememberCheckbox.click();
    }
    await submitBtn.click();
    
    console.log('Waiting for login redirect...');
    await driver.sleep(3000);
    
    console.log('Navigating to homepage...');
    await driver.get('http://localhost:5173/');
    await driver.sleep(3000);
    
    const container = await driver.findElement(By.css('.fixed.bottom-4.right-4'));
    console.log('Opening chat widget...');
    const trigger = await container.findElement(By.css('button'));
    await driver.executeScript("arguments[0].click();", trigger);
    await driver.sleep(2000);
    
    console.log('Clicking receptionist button...');
    const receptionistBtn = await container.findElement(
      By.xpath("//button[contains(., 'Lễ tân CarePlus') or contains(., 'Lễ tân') or contains(., 'Chăm sóc khách hàng')]")
    );
    await driver.executeScript("arguments[0].click();", receptionistBtn);
    
    console.log('Clicked. Waiting 3s for conversation to load...');
    await driver.sleep(3000);
    
    console.log('HTML AFTER CLICKING RECEPTIONIST:');
    console.log(await container.getAttribute('outerHTML'));
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await driver.quit();
  }
}

main();
