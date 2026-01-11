const puppeteer = require('puppeteer');
const path = require('path');

async function generatePDF() {
  console.log('🚀 Starting A11y Audit PDF generation...\n');
  
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  
  const htmlPath = path.join(__dirname, 'a11y-audit-report.html');
  console.log('📄 Loading HTML report...');
  await page.goto(`file://${htmlPath}`, { waitUntil: 'networkidle0' });
  
  console.log('📝 Generating PDF...');
  const pdfPath = path.join(__dirname, 'a11y-audit-report.pdf');
  await page.pdf({
    path: pdfPath,
    format: 'A4',
    printBackground: true,
    margin: {
      top: '0',
      right: '0',
      bottom: '0',
      left: '0'
    }
  });
  
  await browser.close();
  
  console.log(`\n✅ PDF generated successfully: ${pdfPath}\n`);
}

generatePDF().catch(console.error);


