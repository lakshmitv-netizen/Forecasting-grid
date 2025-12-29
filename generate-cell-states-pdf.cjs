const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

async function generatePDF() {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  
  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    @page {
      size: A4;
      margin: 20mm;
    }
    body {
      font-family: 'SF Pro', -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
      margin: 0;
      padding: 20px;
      color: #181818;
      background: white;
    }
    h1 {
      color: #001E5B;
      font-size: 28px;
      font-weight: 700;
      margin-bottom: 10px;
      border-bottom: 3px solid #0176d3;
      padding-bottom: 10px;
    }
    h2 {
      color: #001E5B;
      font-size: 20px;
      font-weight: 600;
      margin-top: 30px;
      margin-bottom: 15px;
    }
    .subtitle {
      color: #706e6b;
      font-size: 14px;
      margin-bottom: 30px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 30px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }
    th {
      background-color: #0176d3;
      color: white;
      padding: 12px;
      text-align: left;
      font-weight: 600;
      font-size: 13px;
      border: 1px solid #005fb2;
    }
    td {
      padding: 12px;
      border: 1px solid #dddbda;
      font-size: 12px;
      vertical-align: top;
    }
    tr:nth-child(even) {
      background-color: #fafaf9;
    }
    tr:hover {
      background-color: #f3f2f2;
    }
    .state-name {
      font-weight: 600;
      color: #001E5B;
    }
    .visual-indicator {
      font-weight: 500;
      color: #181818;
    }
    .color-box {
      display: inline-block;
      width: 20px;
      height: 20px;
      border: 1px solid #c9c9c9;
      vertical-align: middle;
      margin-right: 8px;
      border-radius: 2px;
    }
    .color-code {
      font-family: 'Courier New', monospace;
      font-size: 11px;
      color: #706e6b;
    }
    .icon-description {
      font-style: italic;
      color: #706e6b;
    }
    .section {
      margin-bottom: 40px;
    }
    .note {
      background-color: #fef5e7;
      border-left: 4px solid #ffb75d;
      padding: 12px;
      margin: 20px 0;
      font-size: 12px;
      color: #181818;
    }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #dddbda;
      font-size: 11px;
      color: #706e6b;
      text-align: center;
    }
  </style>
</head>
<body>
  <h1>Cell States Reference Guide</h1>
  <div class="subtitle">Forecasting & Planning Grid - Complete Cell State Documentation</div>

  <div class="section">
    <h2>1. Basic Cell States</h2>
    <table>
      <thead>
        <tr>
          <th style="width: 20%;">State Name</th>
          <th style="width: 25%;">Visual Indicators</th>
          <th style="width: 20%;">Background Color</th>
          <th style="width: 35%;">Behavior & Notes</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td class="state-name">Default/Unedited</td>
          <td class="visual-indicator">None</td>
          <td><span class="color-box" style="background-color: #ffffff;"></span> White (#FFFFFF)</td>
          <td>Standard cell with no modifications. Editable if not in measure row.</td>
        </tr>
        <tr>
          <td class="state-name">Edited (Dirty/Unsaved)</td>
          <td class="visual-indicator">Delta badge, Orange/Blue text</td>
          <td><span class="color-box" style="background-color: #f9e3b6;"></span> Light Orange (#F9E3B6)</td>
          <td>Cell has been edited but not saved. Shows percentage change badge. No arrow icon.</td>
        </tr>
        <tr>
          <td class="state-name">Saved Edited</td>
          <td class="visual-indicator">Arrow icon (↑ orange / ↓ blue), Colored text, Bold</td>
          <td><span class="color-box" style="background-color: #ffffff;"></span> White (#FFFFFF)</td>
          <td>Cell was edited and saved. Shows arrow indicating increase (orange) or decrease (blue). Text color matches arrow.</td>
        </tr>
        <tr>
          <td class="state-name">Impacted</td>
          <td class="visual-indicator">Delta badge, Orange/Blue text</td>
          <td><span class="color-box" style="background-color: #fef5e7;"></span> Light Yellow (#FEF5E7)</td>
          <td>Cell value changed due to propagation from another edited cell. Shows percentage change badge.</td>
        </tr>
        <tr>
          <td class="state-name">Locked</td>
          <td class="visual-indicator">Lock icon (grey)</td>
          <td><span class="color-box" style="background-color: #ffffff;"></span> Inherits from state</td>
          <td>Cell is locked and cannot be edited or impacted by propagation. Lock icon replaces arrow.</td>
        </tr>
        <tr>
          <td class="state-name">Readonly (Last Year)</td>
          <td class="visual-indicator">Diagonal texture pattern</td>
          <td><span class="color-box" style="background-color: #ffffff;"></span> White with texture</td>
          <td>Non-editable cells for "Last Year Order Quantity" and "Last Year Order Revenue" measures.</td>
        </tr>
        <tr>
          <td class="state-name">Focused</td>
          <td class="visual-indicator">Black outline (2px)</td>
          <td><span class="color-box" style="background-color: rgba(0,0,0,0.05);"></span> Slight dark overlay</td>
          <td>Cell currently has keyboard focus. Shows outline and slight background change.</td>
        </tr>
      </tbody>
    </table>
  </div>

  <div class="section">
    <h2>2. Row Type States</h2>
    <table>
      <thead>
        <tr>
          <th style="width: 25%;">Row Type</th>
          <th style="width: 25%;">Background Color</th>
          <th style="width: 50%;">Description</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td class="state-name">Measure Row</td>
          <td><span class="color-box" style="background-color: #F3F3F3;"></span> Light Grey (#F3F3F3)</td>
          <td>Top-level rows showing measure names. Cells in these rows are typically non-editable.</td>
        </tr>
        <tr>
          <td class="state-name">Dimension Row</td>
          <td><span class="color-box" style="background-color: #ffffff;"></span> White (#FFFFFF)</td>
          <td>Rows showing dimension hierarchy (Account → Category → Product). Editable cells.</td>
        </tr>
        <tr>
          <td class="state-name">Time Row</td>
          <td><span class="color-box" style="background-color: #F3F3F3;"></span> Light Grey (#F3F3F3)</td>
          <td>Rows showing time periods (Year → Quarter → Month) in certain layouts. Editable cells.</td>
        </tr>
        <tr>
          <td class="state-name">Impacted in Measure Row</td>
          <td><span class="color-box" style="background-color: #F3F3F3;"></span> Light Grey (#F3F3F3)</td>
          <td>Impacted cells retain measure row background color instead of yellow.</td>
        </tr>
      </tbody>
    </table>
  </div>

  <div class="section">
    <h2>3. Visual Indicators</h2>
    <table>
      <thead>
        <tr>
          <th style="width: 20%;">Indicator</th>
          <th style="width: 30%;">Visual Description</th>
          <th style="width: 25%;">Color/Code</th>
          <th style="width: 25%;">When Shown</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td class="state-name">Arrow Icon (Up)</td>
          <td class="visual-indicator">↑ Orange arrow</td>
          <td class="color-code">#ff5d2d</td>
          <td>Saved edited cell with value increase</td>
        </tr>
        <tr>
          <td class="state-name">Arrow Icon (Down)</td>
          <td class="visual-indicator">↓ Blue arrow</td>
          <td class="color-code">#2E76E1</td>
          <td>Saved edited cell with value decrease</td>
        </tr>
        <tr>
          <td class="state-name">Lock Icon</td>
          <td class="visual-indicator">🔒 Grey lock</td>
          <td class="color-code">#6b7280</td>
          <td>Locked cell (replaces arrow)</td>
        </tr>
        <tr>
          <td class="state-name">Note Triangle</td>
          <td class="visual-indicator">Dog-ear triangle (top-right)</td>
          <td class="color-code">#DA9401</td>
          <td>Cell has an adjustment note</td>
        </tr>
        <tr>
          <td class="state-name">Delta Badge</td>
          <td class="visual-indicator">Percentage change (+X.XX% / -X.XX%)</td>
          <td class="color-code">Orange: #ff5d2d<br>Blue: #2E76E1</td>
          <td>Edited or impacted cells (before save)</td>
        </tr>
        <tr>
          <td class="state-name">Search Highlight</td>
          <td class="visual-indicator">Yellow background on matching text</td>
          <td class="color-code">#FFE066</td>
          <td>Text matching search query</td>
        </tr>
      </tbody>
    </table>
  </div>

  <div class="section">
    <h2>4. Combined States</h2>
    <table>
      <thead>
        <tr>
          <th style="width: 30%;">Combination</th>
          <th style="width: 70%;">Visual Result</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td class="state-name">Edited + Note</td>
          <td>Light orange background + delta badge + note triangle (top-right)</td>
        </tr>
        <tr>
          <td class="state-name">Saved Edited + Note</td>
          <td>Arrow icon + colored text + note triangle (top-right)</td>
        </tr>
        <tr>
          <td class="state-name">Impacted + Note</td>
          <td>Light yellow background + delta badge + note triangle (top-right)</td>
        </tr>
        <tr>
          <td class="state-name">Locked + Edited</td>
          <td>Light orange background + lock icon (instead of arrow)</td>
        </tr>
        <tr>
          <td class="state-name">Locked + Impacted</td>
          <td>Light yellow background + lock icon</td>
        </tr>
        <tr>
          <td class="state-name">Locked + Saved Edited</td>
          <td>Lock icon replaces arrow, colored text retained</td>
        </tr>
        <tr>
          <td class="state-name">Focused + Edited</td>
          <td>Black outline + light orange background + delta badge</td>
        </tr>
        <tr>
          <td class="state-name">Search + Edited</td>
          <td>Yellow highlight on matching text + edited cell styling</td>
        </tr>
      </tbody>
    </table>
  </div>

  <div class="section">
    <h2>5. Cell Behavior Rules</h2>
    <table>
      <thead>
        <tr>
          <th style="width: 25%;">State</th>
          <th style="width: 25%;">Editable?</th>
          <th style="width: 25%;">Can be Impacted?</th>
          <th style="width: 25%;">Propagates Changes?</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td class="state-name">Default</td>
          <td>✓ Yes</td>
          <td>✓ Yes</td>
          <td>✓ Yes</td>
        </tr>
        <tr>
          <td class="state-name">Edited (Unsaved)</td>
          <td>✓ Yes</td>
          <td>✓ Yes</td>
          <td>✓ Yes</td>
        </tr>
        <tr>
          <td class="state-name">Saved Edited</td>
          <td>✓ Yes</td>
          <td>✓ Yes</td>
          <td>✓ Yes</td>
        </tr>
        <tr>
          <td class="state-name">Impacted</td>
          <td>✓ Yes</td>
          <td>✓ Yes</td>
          <td>✓ Yes</td>
        </tr>
        <tr>
          <td class="state-name">Locked</td>
          <td>✗ No</td>
          <td>✗ No</td>
          <td>✓ Yes (contributes to sums)</td>
        </tr>
        <tr>
          <td class="state-name">Readonly</td>
          <td>✗ No</td>
          <td>✗ No</td>
          <td>✗ No</td>
        </tr>
        <tr>
          <td class="state-name">Measure Row</td>
          <td>✗ No</td>
          <td>✓ Yes</td>
          <td>✗ No</td>
        </tr>
      </tbody>
    </table>
  </div>

  <div class="section">
    <h2>6. Color Reference</h2>
    <table>
      <thead>
        <tr>
          <th style="width: 30%;">Usage</th>
          <th style="width: 20%;">Color Code</th>
          <th style="width: 20%;">Preview</th>
          <th style="width: 30%;">Context</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>Increase Arrow</td>
          <td class="color-code">#ff5d2d</td>
          <td><span class="color-box" style="background-color: #ff5d2d;"></span> Orange</td>
          <td>Saved edited cells with value increase</td>
        </tr>
        <tr>
          <td>Decrease Arrow</td>
          <td class="color-code">#2E76E1</td>
          <td><span class="color-box" style="background-color: #2E76E1;"></span> Blue</td>
          <td>Saved edited cells with value decrease</td>
        </tr>
        <tr>
          <td>Edited Background</td>
          <td class="color-code">#f9e3b6</td>
          <td><span class="color-box" style="background-color: #f9e3b6;"></span> Light Orange</td>
          <td>Unsaved edited cells</td>
        </tr>
        <tr>
          <td>Impacted Background</td>
          <td class="color-code">#fef5e7</td>
          <td><span class="color-box" style="background-color: #fef5e7;"></span> Light Yellow</td>
          <td>Impacted cells</td>
        </tr>
        <tr>
          <td>Note Triangle</td>
          <td class="color-code">#DA9401</td>
          <td><span class="color-box" style="background-color: #DA9401;"></span> Dark Orange</td>
          <td>Cells with adjustment notes</td>
        </tr>
        <tr>
          <td>Lock Icon</td>
          <td class="color-code">#6b7280</td>
          <td><span class="color-box" style="background-color: #6b7280;"></span> Grey</td>
          <td>Locked cells</td>
        </tr>
        <tr>
          <td>Search Highlight</td>
          <td class="color-code">#FFE066</td>
          <td><span class="color-box" style="background-color: #FFE066;"></span> Yellow</td>
          <td>Search matching text</td>
        </tr>
        <tr>
          <td>Measure/Time Row</td>
          <td class="color-code">#F3F3F3</td>
          <td><span class="color-box" style="background-color: #F3F3F3;"></span> Light Grey</td>
          <td>Measure and time row backgrounds</td>
        </tr>
        <tr>
          <td>Row Hover</td>
          <td class="color-code">#D8E6FE</td>
          <td><span class="color-box" style="background-color: #D8E6FE;"></span> Light Blue</td>
          <td>Row hover state</td>
        </tr>
      </tbody>
    </table>
  </div>

  <div class="note">
    <strong>Note:</strong> Cell states can be combined. For example, a cell can be both "Edited" and have a "Note", 
    showing both the orange background and the note triangle. Locked cells always show the lock icon regardless of 
    other states, replacing any arrow icons.
  </div>

  <div class="footer">
    <p>Forecasting & Planning Tool - Cell States Reference Guide</p>
    <p>Generated: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
  </div>
</body>
</html>
  `;
  
  await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
  
  const pdfPath = path.join(__dirname, 'cell-states-reference.pdf');
  await page.pdf({
    path: pdfPath,
    format: 'A4',
    margin: {
      top: '20mm',
      right: '20mm',
      bottom: '20mm',
      left: '20mm'
    },
    printBackground: true
  });
  
  await browser.close();
  
  console.log(`PDF generated successfully: ${pdfPath}`);
}

generatePDF().catch(console.error);

