const puppeteer = require('puppeteer');
const path = require('path');

async function generatePDF() {
  console.log('🚀 Starting UX Evaluation PDF generation...\n');
  
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  const htmlPath = path.join(__dirname, 'ux-evaluation-report.html');
  const pdfPath = path.join(__dirname, 'ux-evaluation-report.pdf');
  
  console.log('📄 Loading HTML report...');
  await page.goto(`file://${htmlPath}`, { waitUntil: 'networkidle0' });
  
  console.log('📝 Generating PDF...');
  await page.pdf({
    path: pdfPath,
    format: 'A4',
    printBackground: true,
    margin: {
      top: '20px',
      right: '20px',
      bottom: '20px',
      left: '20px'
    }
  });
  
  await browser.close();
  
  console.log(`\n✅ PDF generated successfully: ${pdfPath}`);
}

generatePDF().catch(console.error);

