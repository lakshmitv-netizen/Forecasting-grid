const puppeteer = require('puppeteer');
const path = require('path');

async function generateCardSortImage() {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  // Set initial viewport with higher resolution for clearer image
  await page.setViewport({ width: 3200, height: 2400, deviceScaleFactor: 2 });
  
  // Load the HTML file
  const htmlPath = path.join(__dirname, 'card-sort-final-grouping.html');
  await page.goto(`file://${htmlPath}`, { waitUntil: 'networkidle0' });
  
  // Wait for content to render
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  // Get full page height
  const bodyHandle = await page.$('body');
  const boundingBox = await bodyHandle.boundingBox();
  
  // Set viewport to full page height with high resolution
  await page.setViewport({
    width: 3200,
    height: Math.ceil(boundingBox.height),
    deviceScaleFactor: 2
  });
  
  // Take full page screenshot as PNG (better quality for detailed content)
  const outputPath = path.join(__dirname, 'card-sort-final-grouping.png');
  await page.screenshot({
    path: outputPath,
    type: 'png',
    fullPage: true
  });
  
  console.log(`Successfully created: ${outputPath}`);
  
  // Also create a JPEG version with maximum quality
  const jpegPath = path.join(__dirname, 'card-sort-final-grouping.jpg');
  await page.screenshot({
    path: jpegPath,
    type: 'jpeg',
    quality: 100,
    fullPage: true
  });
  
  console.log(`Successfully created: ${jpegPath}`);
  
  await browser.close();
}

generateCardSortImage().catch(console.error);
