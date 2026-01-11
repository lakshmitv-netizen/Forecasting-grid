const puppeteer = require('puppeteer');
const path = require('path');

async function convertHtmlToJpg() {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  // Set viewport width
  await page.setViewport({ width: 1400, height: 800 });
  
  // Load the HTML file
  const htmlPath = path.join(__dirname, 'kam-objectives-coverage-report.html');
  await page.goto(`file://${htmlPath}`, { waitUntil: 'networkidle0' });
  
  // Wait for content to render
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Get full page height
  const bodyHandle = await page.$('body');
  const boundingBox = await bodyHandle.boundingBox();
  
  // Set viewport to full page height
  await page.setViewport({
    width: 1400,
    height: Math.ceil(boundingBox.height)
  });
  
  // Take full page screenshot as JPEG
  await page.screenshot({
    path: path.join(__dirname, 'kam-objectives-coverage-report.jpg'),
    type: 'jpeg',
    quality: 95,
    fullPage: true
  });
  
  console.log('Successfully created: kam-objectives-coverage-report.jpg');
  
  await browser.close();
}

convertHtmlToJpg().catch(console.error);


