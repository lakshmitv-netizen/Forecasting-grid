const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

async function captureScreenshots() {
  const screenshotsDir = path.join(__dirname, 'screenshots');
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
  }

  const browser = await puppeteer.launch({ 
    headless: 'new',
    defaultViewport: { width: 1440, height: 900 }
  });
  const page = await browser.newPage();
  
  try {
    // Navigate to home page first (might redirect)
    console.log('Navigating to app...');
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle0', timeout: 30000 });
    await delay(2000);
    
    // Check if we're on home page, if so navigate to grid
    const currentUrl = page.url();
    if (currentUrl.includes('/home')) {
      console.log('On home page, navigating to manufacturing grid...');
      await page.goto('http://localhost:5173/home/manufacturing', { waitUntil: 'networkidle0', timeout: 30000 });
      await delay(2000);
    }
    
    // Screenshot 1: Full grid view
    console.log('1. Capturing: Full grid view...');
    await page.screenshot({ 
      path: path.join(screenshotsDir, '01-full-grid-view.png'),
      fullPage: false
    });
    
    // Screenshot 2: Button group toolbar
    console.log('2. Capturing: Button group toolbar...');
    const toolbar = await page.$('.grid-toolbar');
    if (toolbar) {
      await toolbar.screenshot({ 
        path: path.join(screenshotsDir, '02-button-group-toolbar.png')
      });
    } else {
      console.log('   Warning: Toolbar not found');
    }
    
    // Screenshot 3: Click settings to show panel
    console.log('3. Capturing: Settings panel...');
    const settingsButton = await page.$('button[title="Settings"]');
    if (settingsButton) {
      await settingsButton.click();
      await delay(1000);
      await page.screenshot({ 
        path: path.join(screenshotsDir, '03-settings-panel.png'),
        fullPage: false
      });
    } else {
      console.log('   Warning: Settings button not found');
      await page.screenshot({ 
        path: path.join(screenshotsDir, '03-settings-panel.png'),
        fullPage: false
      });
    }
    
    // Close settings, open filters
    console.log('4. Capturing: Filters panel...');
    await page.keyboard.press('Escape'); // Close settings
    await delay(500);
    const filterButton = await page.$('button[title="Filter"]');
    if (filterButton) {
      await filterButton.click();
      await delay(1000);
      await page.screenshot({ 
        path: path.join(screenshotsDir, '04-filters-panel.png'),
        fullPage: false
      });
    } else {
      console.log('   Warning: Filter button not found');
      await page.screenshot({ 
        path: path.join(screenshotsDir, '04-filters-panel.png'),
        fullPage: false
      });
    }
    
    // Close filters, open cell details
    console.log('5. Capturing: Cell details panel...');
    await page.keyboard.press('Escape'); // Close filters
    await delay(500);
    
    // Click on a cell first
    const cells = await page.$$('td.editable-cell, td[data-cell-key]');
    if (cells.length > 5) {
      await cells[5].click();
      await delay(500);
    }
    
    // Open cell details panel
    const cellDetailsButton = await page.$('button[title="Edit Information"], button[title="Cell Details and History"]');
    if (cellDetailsButton) {
      await cellDetailsButton.click();
      await delay(1000);
      await page.screenshot({ 
        path: path.join(screenshotsDir, '05-cell-details-panel.png'),
        fullPage: false
      });
    } else {
      console.log('   Warning: Cell details button not found');
      await page.screenshot({ 
        path: path.join(screenshotsDir, '05-cell-details-panel.png'),
        fullPage: false
      });
    }
    
    // Screenshot 6: Cell selected
    console.log('6. Capturing: Cell selected state...');
    await page.keyboard.press('Escape'); // Close panel
    await delay(300);
    if (cells.length > 5) {
      await cells[5].click();
      await delay(300);
    }
    await page.screenshot({ 
      path: path.join(screenshotsDir, '06-cell-selected.png'),
      fullPage: false
    });
    
    // Screenshot 7: Search with highlighting
    console.log('7. Capturing: Search with highlighting...');
    const searchInput = await page.$('.grid-search-input, input[type="text"][placeholder*="Search"]');
    if (searchInput) {
      await searchInput.click();
      await searchInput.type('may', { delay: 100 });
      await delay(1000);
      await page.screenshot({ 
        path: path.join(screenshotsDir, '07-search-highlighting.png'),
        fullPage: false
      });
      
      // Clear search
      await searchInput.click({ clickCount: 3 });
      await page.keyboard.press('Backspace');
      await delay(500);
    } else {
      console.log('   Warning: Search input not found');
      await page.screenshot({ 
        path: path.join(screenshotsDir, '07-search-highlighting.png'),
        fullPage: false
      });
    }
    
    // Screenshot 8: Hierarchical expansion
    console.log('8. Capturing: Hierarchical expansion...');
    const expandButtons = await page.$$('.expand-icon, button[aria-label*="expand"], button[aria-label*="Expand"]');
    if (expandButtons.length > 0) {
      await expandButtons[0].click();
      await delay(500);
    }
    await page.screenshot({ 
      path: path.join(screenshotsDir, '08-hierarchical-expansion.png'),
      fullPage: false
    });
    
    // Screenshot 9: Header design
    console.log('9. Capturing: Header design...');
    const header = await page.$('.header-wrapper, header');
    if (header) {
      await header.screenshot({ 
        path: path.join(screenshotsDir, '09-header-design.png')
      });
    } else {
      // Fallback: capture top portion
      await page.screenshot({ 
        path: path.join(screenshotsDir, '09-header-design.png'),
        clip: { x: 0, y: 0, width: 1440, height: 150 }
      });
    }
    
    // Screenshot 10: Context menu (right-click)
    console.log('10. Capturing: Context menu...');
    if (cells.length > 5) {
      await cells[5].click({ button: 'right' });
      await delay(500);
      await page.screenshot({ 
        path: path.join(screenshotsDir, '10-context-menu.png'),
        fullPage: false
      });
      await page.keyboard.press('Escape');
      await delay(300);
    }
    
    // Screenshot 11: List view
    console.log('11. Capturing: List view...');
    await page.goto('http://localhost:5173/planning-forecasting-list', { waitUntil: 'networkidle0', timeout: 30000 });
    await delay(2000);
    await page.screenshot({ 
      path: path.join(screenshotsDir, '11-list-view.png'),
      fullPage: false
    });
    
    // Screenshot 12: Record details
    console.log('12. Capturing: Record details...');
    await page.goto('http://localhost:5173/planning-forecasting', { waitUntil: 'networkidle0', timeout: 30000 });
    await delay(2000);
    await page.screenshot({ 
      path: path.join(screenshotsDir, '12-record-details.png'),
      fullPage: false
    });
    
    // Screenshot 13: Grid configuration tab
    console.log('13. Capturing: Grid configuration tab...');
    // Try finding by text content
    const buttons = await page.$$('button');
    let found = false;
    for (const btn of buttons) {
      const text = await page.evaluate(el => el.textContent, btn);
      if (text && text.includes('Grid Configuration')) {
        await btn.click();
        await delay(1000);
        found = true;
        break;
      }
    }
    if (!found) {
      console.log('   Warning: Grid Configuration tab not found');
    }
    await page.screenshot({ 
      path: path.join(screenshotsDir, '13-record-gridconfig.png'),
      fullPage: false
    });
    
    console.log('\n✅ All screenshots captured successfully!');
    
  } catch (error) {
    console.error('Error capturing screenshots:', error);
  } finally {
    await browser.close();
  }
}

captureScreenshots().catch(console.error);
