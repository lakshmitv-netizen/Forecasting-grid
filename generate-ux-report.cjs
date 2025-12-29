const puppeteer = require('puppeteer');
const path = require('path');

async function generatePDF() {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  const htmlPath = path.join(__dirname, 'ux-comparison-report.html');
  await page.goto(`file://${htmlPath}`, { waitUntil: 'networkidle0' });
  
  await page.pdf({
    path: 'ux-comparison-report.pdf',
    format: 'A4',
    margin: {
      top: '20px',
      right: '20px',
      bottom: '20px',
      left: '20px'
    },
    printBackground: true
  });
  
  await browser.close();
  console.log('PDF generated: ux-comparison-report.pdf');
}

generatePDF().catch(console.error);

