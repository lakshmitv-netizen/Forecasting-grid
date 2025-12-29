const puppeteer = require('puppeteer');
const path = require('path');

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
      size: A4 landscape;
      margin: 10mm;
    }
    body {
      font-family: 'SF Pro', -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
      margin: 0;
      padding: 15px;
      color: #181818;
      background: white;
      font-size: 11px;
    }
    h1 {
      color: #001E5B;
      font-size: 20px;
      font-weight: 700;
      margin-bottom: 10px;
      border-bottom: 2px solid #0176d3;
      padding-bottom: 8px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 10px;
      font-size: 10px;
    }
    th {
      background-color: #0176d3;
      color: white;
      padding: 8px 6px;
      text-align: center;
      font-weight: 600;
      border: 1px solid #005fb2;
      font-size: 10px;
    }
    th:first-child {
      text-align: left;
      background-color: #001E5B;
      min-width: 120px;
    }
    td {
      padding: 6px;
      border: 1px solid #dddbda;
      text-align: center;
      vertical-align: middle;
      font-size: 9px;
    }
    td:first-child {
      text-align: left;
      font-weight: 600;
      background-color: #f3f2f2;
      color: #001E5B;
    }
    tr:nth-child(even) td:not(:first-child) {
      background-color: #fafaf9;
    }
    .color-box {
      display: inline-block;
      width: 14px;
      height: 14px;
      border: 1px solid #c9c9c9;
      vertical-align: middle;
      margin-right: 4px;
      border-radius: 2px;
    }
    .code {
      font-family: 'Courier New', monospace;
      font-size: 8px;
      background: #f3f2f2;
      padding: 1px 3px;
      border-radius: 2px;
    }
    .check {
      color: #4caf50;
      font-weight: 700;
      font-size: 12px;
    }
    .cross {
      color: #f44336;
      font-weight: 700;
      font-size: 12px;
    }
  </style>
</head>
<body>
  <h1>Cell State Visual Properties Reference Table</h1>
  
  <table>
    <thead>
      <tr>
        <th>Container</th>
        <th>Has Note</th>
        <th>Locked</th>
        <th>Default</th>
        <th>Directly Increased</th>
        <th>Directly Decreased</th>
        <th>Impacted Increased</th>
        <th>Impacted Decreased</th>
        <th>Directly Edited Note</th>
        <th>Saved</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>Text Font</td>
        <td>SF Pro, 12px</td>
        <td>SF Pro, 12px</td>
        <td>SF Pro, 12px</td>
        <td>SF Pro, 12px, Semibold (590)</td>
        <td>SF Pro, 12px, Semibold (590)</td>
        <td>SF Pro, 12px, Semibold (590)</td>
        <td>SF Pro, 12px, Semibold (590)</td>
        <td>SF Pro, 12px, Semibold (590)</td>
        <td>SF Pro, 12px, Bold (600)</td>
      </tr>
      <tr>
        <td>Text Color</td>
        <td>#181818</td>
        <td>#181818</td>
        <td>#181818</td>
        <td><span class="color-box" style="background-color: #ff5d2d;"></span>#ff5d2d (Orange)</td>
        <td><span class="color-box" style="background-color: #2E76E1;"></span>#2E76E1 (Blue)</td>
        <td><span class="color-box" style="background-color: #ff5d2d;"></span>#ff5d2d (Orange)</td>
        <td><span class="color-box" style="background-color: #2E76E1;"></span>#2E76E1 (Blue)</td>
        <td>#181818 (Black)</td>
        <td><span class="color-box" style="background-color: #ff5d2d;"></span>#ff5d2d (Orange) or <span class="color-box" style="background-color: #2E76E1;"></span>#2E76E1 (Blue)</td>
      </tr>
      <tr>
        <td>Cell Texture</td>
        <td><span class="cross">✗</span></td>
        <td><span class="cross">✗</span></td>
        <td><span class="cross">✗</span></td>
        <td><span class="cross">✗</span></td>
        <td><span class="cross">✗</span></td>
        <td><span class="cross">✗</span></td>
        <td><span class="cross">✗</span></td>
        <td><span class="cross">✗</span></td>
        <td><span class="cross">✗</span></td>
      </tr>
      <tr>
        <td>Cell Colour</td>
        <td><span class="color-box" style="background-color: #ffffff;"></span>#FFFFFF (White)</td>
        <td><span class="color-box" style="background-color: #ffffff;"></span>#FFFFFF (White)</td>
        <td><span class="color-box" style="background-color: #ffffff;"></span>#FFFFFF (White)</td>
        <td><span class="color-box" style="background-color: #f9e3b6;"></span>#f9e3b6 (Light Orange)</td>
        <td><span class="color-box" style="background-color: #f9e3b6;"></span>#f9e3b6 (Light Orange)</td>
        <td><span class="color-box" style="background-color: #fef5e7;"></span>#fef5e7 (Light Yellow)</td>
        <td><span class="color-box" style="background-color: #fef5e7;"></span>#fef5e7 (Light Yellow)</td>
        <td><span class="color-box" style="background-color: #f9e3b6;"></span>#f9e3b6 (Light Orange)</td>
        <td><span class="color-box" style="background-color: #ffffff;"></span>#FFFFFF (White)</td>
      </tr>
      <tr>
        <td>Brightness / Intensity</td>
        <td>Normal</td>
        <td>Normal</td>
        <td>Normal</td>
        <td>Normal</td>
        <td>Normal</td>
        <td>Normal</td>
        <td>Normal</td>
        <td>Normal</td>
        <td>Normal</td>
      </tr>
      <tr>
        <td>Left Icon</td>
        <td><span class="cross">✗</span></td>
        <td><span class="color-box" style="background-color: #6b7280;"></span> Lock Icon (#6b7280)</td>
        <td><span class="cross">✗</span></td>
        <td><span class="cross">✗</span> (No arrow in dirty state)</td>
        <td><span class="cross">✗</span> (No arrow in dirty state)</td>
        <td><span class="cross">✗</span></td>
        <td><span class="cross">✗</span></td>
        <td><span class="cross">✗</span></td>
        <td><span class="color-box" style="background-color: #ff5d2d;"></span> ↑ Orange Arrow or <span class="color-box" style="background-color: #2E76E1;"></span> ↓ Blue Arrow</td>
      </tr>
      <tr>
        <td>Super Text</td>
        <td><span class="cross">✗</span></td>
        <td><span class="cross">✗</span></td>
        <td><span class="cross">✗</span></td>
        <td><span class="check">✓</span> Delta Badge (+X.XX%)</td>
        <td><span class="check">✓</span> Delta Badge (-X.XX%)</td>
        <td><span class="check">✓</span> Delta Badge (+X.XX%)</td>
        <td><span class="check">✓</span> Delta Badge (-X.XX%)</td>
        <td><span class="cross">✗</span></td>
        <td><span class="cross">✗</span></td>
      </tr>
      <tr>
        <td>Corner Triangle</td>
        <td><span class="color-box" style="background-color: #DA9401;"></span> <span class="check">✓</span> Top-right (#DA9401)</td>
        <td><span class="cross">✗</span></td>
        <td><span class="cross">✗</span></td>
        <td><span class="cross">✗</span></td>
        <td><span class="cross">✗</span></td>
        <td><span class="cross">✗</span></td>
        <td><span class="cross">✗</span></td>
        <td><span class="color-box" style="background-color: #DA9401;"></span> <span class="check">✓</span> Top-right (#DA9401)</td>
        <td><span class="color-box" style="background-color: #DA9401;"></span> <span class="check">✓</span> Top-right (#DA9401) if has note</td>
      </tr>
      <tr>
        <td>Border</td>
        <td>1px solid #c9c9c9</td>
        <td>1px solid #c9c9c9</td>
        <td>1px solid #c9c9c9</td>
        <td>1px solid #c9c9c9</td>
        <td>1px solid #c9c9c9</td>
        <td>1px solid #c9c9c9</td>
        <td>1px solid #c9c9c9</td>
        <td>1px solid #c9c9c9</td>
        <td>1px solid #c9c9c9</td>
      </tr>
    </tbody>
  </table>
  
  <div style="margin-top: 20px; padding: 10px; background: #fef5e7; border-left: 4px solid #ffb75d; font-size: 9px;">
    <strong>Notes:</strong>
    <ul style="margin: 5px 0; padding-left: 20px;">
      <li><strong>Has Note:</strong> Cell with only a note (no value change). Shows note triangle, white background.</li>
      <li><strong>Locked:</strong> Cell is locked. Shows lock icon instead of arrow. Non-editable, non-impactable.</li>
      <li><strong>Default:</strong> Standard unedited cell with no modifications.</li>
      <li><strong>Directly Increased/Decreased:</strong> Cell edited by user (unsaved/dirty state). Shows orange background, delta badge, colored text. No arrow until saved.</li>
      <li><strong>Impacted Increased/Decreased:</strong> Cell changed due to propagation from another edit. Shows yellow background, delta badge, colored text. No arrow.</li>
      <li><strong>Directly Edited Note:</strong> Cell with note added but no value change. Shows orange background (edited state), note triangle.</li>
      <li><strong>Saved:</strong> Cell was edited and saved. Shows arrow icon (orange up or blue down), colored bold text, white background. Note triangle if note exists.</li>
      <li><strong>Delta Badge:</strong> Shows percentage change (+X.XX% or -X.XX%) in orange (#ff5d2d) for increases, blue (#2E76E1) for decreases.</li>
      <li><strong>Impacted cells in measure rows:</strong> Retain measure row background (#F3F3F3) instead of yellow.</li>
    </ul>
  </div>
  
  <div style="margin-top: 15px; padding-top: 10px; border-top: 1px solid #dddbda; font-size: 8px; color: #706e6b; text-align: center;">
    <p>Forecasting & Planning Tool - Cell State Visual Properties Reference</p>
    <p>Generated: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
  </div>
</body>
</html>
  `;
  
  await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
  
  const pdfPath = path.join(__dirname, 'cell-states-visual-properties.pdf');
  await page.pdf({
    path: pdfPath,
    format: 'A4',
    landscape: true,
    margin: {
      top: '10mm',
      right: '10mm',
      bottom: '10mm',
      left: '10mm'
    },
    printBackground: true
  });
  
  await browser.close();
  
  console.log(`PDF generated successfully: ${pdfPath}`);
}

generatePDF().catch(console.error);

