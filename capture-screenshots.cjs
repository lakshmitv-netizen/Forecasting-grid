const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

async function captureScreenshots() {
  const screenshotsDir = path.join(__dirname, 'screenshots');
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir);
  }

  const browser = await puppeteer.launch({ 
    headless: 'new',
    defaultViewport: { width: 1400, height: 900 }
  });
  const page = await browser.newPage();
  
  // Navigate to our app
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle0' });
  await delay(1000);
  
  // Screenshot 1: Full grid view
  console.log('Capturing: Full grid view...');
  await page.screenshot({ 
    path: path.join(screenshotsDir, '01-full-grid-view.png'),
    fullPage: false
  });
  
  // Screenshot 2: Button group toolbar
  console.log('Capturing: Button group toolbar...');
  const toolbar = await page.$('.grid-toolbar');
  if (toolbar) {
    await toolbar.screenshot({ 
      path: path.join(screenshotsDir, '02-button-group-toolbar.png')
    });
  }
  
  // Screenshot 3: Click settings to show panel
  console.log('Capturing: Settings panel...');
  await page.click('[title="Settings"]');
  await delay(500);
  await page.screenshot({ 
    path: path.join(screenshotsDir, '03-settings-panel.png'),
    fullPage: false
  });
  
  // Close settings, open filters
  console.log('Capturing: Filters panel...');
  await page.click('[title="Filter"]');
  await delay(500);
  await page.screenshot({ 
    path: path.join(screenshotsDir, '04-filters-panel.png'),
    fullPage: false
  });
  
  // Close filters, open cell details
  console.log('Capturing: Cell details panel...');
  await page.click('[title="Cell Details and History"]');
  await delay(500);
  await page.screenshot({ 
    path: path.join(screenshotsDir, '05-cell-details-panel.png'),
    fullPage: false
  });
  
  // Click on a cell first
  console.log('Capturing: Cell with edit...');
  const cells = await page.$$('td.editable-cell');
  if (cells.length > 5) {
    await cells[5].click();
    await delay(300);
  }
  await page.screenshot({ 
    path: path.join(screenshotsDir, '06-cell-selected.png'),
    fullPage: false
  });
  
  // Type in search
  console.log('Capturing: Search with highlighting...');
  await page.click('[title="Cell Details and History"]'); // close panel
  await delay(300);
  const searchInput = await page.$('.grid-search-input');
  if (searchInput) {
    await searchInput.type('may');
    await delay(800);
    await page.screenshot({ 
      path: path.join(screenshotsDir, '07-search-highlighting.png'),
      fullPage: false
    });
  }
  
  // Clear search
  const clearBtn = await page.$('.grid-search-clear');
  if (clearBtn) {
    await clearBtn.click();
    await delay(300);
  }
  
  // Screenshot of hierarchical expansion
  console.log('Capturing: Hierarchical expansion...');
  const expandButtons = await page.$$('.expand-icon');
  if (expandButtons.length > 0) {
    await expandButtons[0].click();
    await delay(300);
  }
  await page.screenshot({ 
    path: path.join(screenshotsDir, '08-hierarchical-expansion.png'),
    fullPage: false
  });
  
  // Header close-up
  console.log('Capturing: Header design...');
  const header = await page.$('.header-wrapper');
  if (header) {
    await header.screenshot({ 
      path: path.join(screenshotsDir, '09-header-design.png')
    });
  }

  await browser.close();
  console.log('\nScreenshots captured successfully in /screenshots folder');
}

captureScreenshots().catch(console.error);
