const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

async function captureBulkUpdateScreenshots() {
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
    // Navigate to grid
    console.log('Navigating to grid...');
    await page.goto('http://localhost:5173/home/manufacturing', { waitUntil: 'networkidle0', timeout: 30000 });
    await delay(2000);
    
    // Screenshot 1: Select multiple cells
    console.log('1. Capturing: Multiple cell selection...');
    const cells = await page.$$('td.editable-cell, td[data-cell-key]');
    if (cells.length > 5) {
      // Click first cell
      await cells[5].click();
      await delay(200);
      // Shift+Click to select multiple
      await page.keyboard.down('Shift');
      await cells[10].click();
      await cells[15].click();
      await page.keyboard.up('Shift');
      await delay(500);
    }
    await page.screenshot({ 
      path: path.join(screenshotsDir, '14-bulk-multiple-selection.png'),
      fullPage: false
    });
    
    // Screenshot 2: Context menu with Bulk Edit option
    console.log('2. Capturing: Context menu with Bulk Edit...');
    if (cells.length > 5) {
      await cells[5].click({ button: 'right' });
      await delay(500);
      await page.screenshot({ 
        path: path.join(screenshotsDir, '15-bulk-context-menu.png'),
        fullPage: false
      });
      await page.keyboard.press('Escape');
      await delay(300);
    }
    
    // Screenshot 3: Cell Details Panel - Bulk Edit tab
    console.log('3. Capturing: Cell Details Panel - Bulk Edit tab...');
    // Select multiple cells again
    if (cells.length > 5) {
      await cells[5].click();
      await delay(200);
      await page.keyboard.down('Shift');
      await cells[10].click();
      await cells[15].click();
      await page.keyboard.up('Shift');
      await delay(500);
    }
    
    // Open Cell Details panel
    const cellDetailsButton = await page.$('button[title="Edit Information"], button[title="Cell Details and History"]');
    if (cellDetailsButton) {
      await cellDetailsButton.click();
      await delay(1000);
      await page.screenshot({ 
        path: path.join(screenshotsDir, '16-bulk-edit-panel.png'),
        fullPage: false
      });
    }
    
    // Screenshot 4: Bulk Edit form with rules dropdown
    console.log('4. Capturing: Bulk Edit form with rules...');
    // Try to find and interact with the form
    const ruleSelect = await page.$('select, [role="combobox"]');
    if (ruleSelect) {
      await ruleSelect.click();
      await delay(300);
      await page.screenshot({ 
        path: path.join(screenshotsDir, '17-bulk-edit-rules.png'),
        fullPage: false
      });
      await page.keyboard.press('Escape');
      await delay(200);
    }
    
    // Screenshot 5: Fill handle for bulk selection
    console.log('5. Capturing: Fill handle for drag selection...');
    await page.keyboard.press('Escape'); // Close panel
    await delay(500);
    // Click a cell and look for fill handle
    if (cells.length > 5) {
      await cells[5].click();
      await delay(500);
      // Look for fill handle dot
      await page.screenshot({ 
        path: path.join(screenshotsDir, '18-bulk-fill-handle.png'),
        fullPage: false
      });
    }
    
    // Screenshot 6: After bulk update (if we can trigger it)
    console.log('6. Capturing: Bulk update result...');
    // Re-open panel and fill form
    if (cellDetailsButton) {
      await cellDetailsButton.click();
      await delay(1000);
      
      // Try to fill the form
      const valueInput = await page.$('input[type="text"], input[type="number"]');
      if (valueInput) {
        await valueInput.click();
        await valueInput.type('10%', { delay: 100 });
        await delay(500);
        await page.screenshot({ 
          path: path.join(screenshotsDir, '19-bulk-update-form-filled.png'),
          fullPage: false
        });
      }
    }
    
    console.log('\n✅ Bulk update screenshots captured successfully!');
    
  } catch (error) {
    console.error('Error capturing screenshots:', error);
  } finally {
    await browser.close();
  }
}

captureBulkUpdateScreenshots().catch(console.error);
