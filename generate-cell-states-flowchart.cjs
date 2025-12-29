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
      margin: 15mm;
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
      font-size: 24px;
      font-weight: 700;
      margin-bottom: 5px;
      border-bottom: 3px solid #0176d3;
      padding-bottom: 8px;
    }
    h2 {
      color: #001E5B;
      font-size: 18px;
      font-weight: 600;
      margin-top: 25px;
      margin-bottom: 12px;
      background: #f3f2f2;
      padding: 8px 12px;
      border-left: 4px solid #0176d3;
    }
    .subtitle {
      color: #706e6b;
      font-size: 12px;
      margin-bottom: 20px;
    }
    .flowchart {
      margin: 20px 0;
      padding: 15px;
      background: #fafaf9;
      border-radius: 4px;
      border: 1px solid #dddbda;
    }
    .decision-box {
      background: #fff4e5;
      border: 2px solid #ffb75d;
      border-radius: 8px;
      padding: 10px;
      margin: 8px 0;
      font-weight: 600;
      color: #001E5B;
      text-align: center;
      position: relative;
    }
    .decision-box::before {
      content: '◊';
      position: absolute;
      left: 8px;
      color: #ffb75d;
      font-size: 18px;
    }
    .process-box {
      background: #e3f2fd;
      border: 2px solid #0176d3;
      border-radius: 8px;
      padding: 10px;
      margin: 8px 0;
      color: #001E5B;
      text-align: center;
    }
    .result-box {
      background: #e8f5e9;
      border: 2px solid #4caf50;
      border-radius: 8px;
      padding: 12px;
      margin: 8px 0;
      color: #181818;
      font-weight: 500;
    }
    .arrow {
      text-align: center;
      font-size: 20px;
      color: #0176d3;
      margin: 5px 0;
    }
    .yes-no {
      display: flex;
      justify-content: space-around;
      margin: 8px 0;
      font-size: 11px;
      color: #706e6b;
    }
    .yes {
      color: #4caf50;
      font-weight: 600;
    }
    .no {
      color: #f44336;
      font-weight: 600;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
      font-size: 11px;
    }
    th {
      background-color: #0176d3;
      color: white;
      padding: 8px;
      text-align: left;
      font-weight: 600;
      font-size: 11px;
      border: 1px solid #005fb2;
    }
    td {
      padding: 8px;
      border: 1px solid #dddbda;
      font-size: 11px;
      vertical-align: top;
    }
    tr:nth-child(even) {
      background-color: #fafaf9;
    }
    .priority-table {
      width: 100%;
      margin: 15px 0;
    }
    .priority-number {
      display: inline-block;
      width: 24px;
      height: 24px;
      background: #0176d3;
      color: white;
      border-radius: 50%;
      text-align: center;
      line-height: 24px;
      font-weight: 600;
      margin-right: 8px;
    }
    .section {
      margin-bottom: 30px;
      page-break-inside: avoid;
    }
    .note-box {
      background-color: #fef5e7;
      border-left: 4px solid #ffb75d;
      padding: 10px;
      margin: 15px 0;
      font-size: 11px;
      color: #181818;
    }
    .code {
      font-family: 'Courier New', monospace;
      font-size: 10px;
      background: #f3f2f2;
      padding: 2px 4px;
      border-radius: 2px;
    }
    .color-preview {
      display: inline-block;
      width: 16px;
      height: 16px;
      border: 1px solid #c9c9c9;
      vertical-align: middle;
      margin-right: 4px;
      border-radius: 2px;
    }
  </style>
</head>
<body>
  <h1>Cell State Decision Framework</h1>
  <div class="subtitle">Complete Flowchart & Condition Reference for Forecasting & Planning Grid</div>

  <div class="section">
    <h2>1. Primary State Determination Flow</h2>
    <div class="flowchart">
      <div class="decision-box">START: Render Cell</div>
      <div class="arrow">↓</div>
      
      <div class="decision-box">Is cell currently being edited? (editingCell === monthKey)</div>
      <div class="yes-no">
        <span class="yes">YES → Show Input Field</span>
        <span class="no">NO → Continue</span>
      </div>
      <div class="arrow">↓</div>
      
      <div class="decision-box">Is row type = 'measure'?</div>
      <div class="yes-no">
        <span class="yes">YES → Non-editable, Background: #F3F3F3</span>
        <span class="no">NO → Continue</span>
      </div>
      <div class="arrow">↓</div>
      
      <div class="decision-box">Is Last Year measure? (id includes 'ly-order' or name includes 'Last Year')</div>
      <div class="yes-no">
        <span class="yes">YES → Non-editable, Add texture</span>
        <span class="no">NO → Continue</span>
      </div>
      <div class="arrow">↓</div>
      
      <div class="decision-box">Is cell locked? (lockedCells.has(cellKey))</div>
      <div class="yes-no">
        <span class="yes">YES → Non-editable, Non-impactable</span>
        <span class="no">NO → Continue</span>
      </div>
      <div class="arrow">↓</div>
      
      <div class="process-box">Determine Edit State</div>
    </div>
  </div>

  <div class="section">
    <h2>2. Edit State Determination Flow</h2>
    <div class="flowchart">
      <div class="decision-box">Is cell in savedEditedCells map?</div>
      <div class="yes-no">
        <span class="yes">YES → SAVED EDITED STATE</span>
        <span class="no">NO → Continue</span>
      </div>
      <div class="arrow">↓</div>
      
      <div class="decision-box">Is cell in editedCells map?</div>
      <div class="yes-no">
        <span class="yes">YES → DIRECTLY EDITED STATE (Dirty/Unsaved)</span>
        <span class="no">NO → Continue</span>
      </div>
      <div class="arrow">↓</div>
      
      <div class="decision-box">Is cell in impactedCells map?</div>
      <div class="yes-no">
        <span class="yes">YES → IMPACTED STATE</span>
        <span class="no">NO → DEFAULT STATE</span>
      </div>
    </div>
    
    <div class="note-box">
      <strong>Important:</strong> States are mutually exclusive in this order: Saved Edited > Directly Edited > Impacted > Default
    </div>
  </div>

  <div class="section">
    <h2>3. Visual Indicator Priority Rules</h2>
    <table class="priority-table">
      <thead>
        <tr>
          <th style="width: 10%;">Priority</th>
          <th style="width: 25%;">Indicator</th>
          <th style="width: 20%;">Condition</th>
          <th style="width: 20%;">Replaces</th>
          <th style="width: 25%;">Visual</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><span class="priority-number">1</span></td>
          <td><strong>Lock Icon</strong></td>
          <td><code class="code">isCellLocked === true</code></td>
          <td>Arrow icon</td>
          <td>Grey lock (<span class="color-preview" style="background-color: #6b7280;"></span>#6b7280)</td>
        </tr>
        <tr>
          <td><span class="priority-number">2</span></td>
          <td><strong>Arrow Icon</strong></td>
          <td><code class="code">isSavedEdited === true && !isCellLocked</code></td>
          <td>Delta badge</td>
          <td>↑ Orange (#ff5d2d) or ↓ Blue (#2E76E1)</td>
        </tr>
        <tr>
          <td><span class="priority-number">3</span></td>
          <td><strong>Delta Badge</strong></td>
          <td><code class="code">(isDirectlyEdited || isImpacted) && !isSavedEdited</code></td>
          <td>None</td>
          <td>Percentage change badge</td>
        </tr>
        <tr>
          <td><span class="priority-number">4</span></td>
          <td><strong>Note Triangle</strong></td>
          <td><code class="code">hasNote === true</code></td>
          <td>None (overlay)</td>
          <td>Top-right corner (<span class="color-preview" style="background-color: #DA9401;"></span>#DA9401)</td>
        </tr>
        <tr>
          <td><span class="priority-number">5</span></td>
          <td><strong>Search Highlight</strong></td>
          <td><code class="code">valueMatchesSearch === true</code></td>
          <td>None (text highlight)</td>
          <td>Yellow background on text (<span class="color-preview" style="background-color: #FFE066;"></span>#FFE066)</td>
        </tr>
      </tbody>
    </table>
  </div>

  <div class="section">
    <h2>4. Background Color Decision Matrix</h2>
    <table>
      <thead>
        <tr>
          <th style="width: 30%;">Condition</th>
          <th style="width: 20%;">Background Color</th>
          <th style="width: 20%;">Color Code</th>
          <th style="width: 30%;">Exception</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>Row type = 'measure'</td>
          <td><span class="color-preview" style="background-color: #F3F3F3;"></span> Light Grey</td>
          <td><code class="code">#F3F3F3</code></td>
          <td>Always applies, even if edited/impacted</td>
        </tr>
        <tr>
          <td>Row type = 'time' (in Time/Dimensions layout)</td>
          <td><span class="color-preview" style="background-color: #F3F3F3;"></span> Light Grey</td>
          <td><code class="code">#F3F3F3</code></td>
          <td>Always applies</td>
        </tr>
        <tr>
          <td>isDirectlyEdited === true</td>
          <td><span class="color-preview" style="background-color: #f9e3b6;"></span> Light Orange</td>
          <td><code class="code">#f9e3b6</code></td>
          <td>Unless in measure row</td>
        </tr>
        <tr>
          <td>isImpacted === true</td>
          <td><span class="color-preview" style="background-color: #fef5e7;"></span> Light Yellow</td>
          <td><code class="code">#fef5e7</code></td>
          <td>Unless in measure row (keeps #F3F3F3)</td>
        </tr>
        <tr>
          <td>isSavedEdited === true</td>
          <td><span class="color-preview" style="background-color: #ffffff;"></span> White</td>
          <td><code class="code">#ffffff</code></td>
          <td>Unless in measure row</td>
        </tr>
        <tr>
          <td>Default state</td>
          <td><span class="color-preview" style="background-color: #ffffff;"></span> White</td>
          <td><code class="code">#ffffff</code></td>
          <td>Standard unedited cell</td>
        </tr>
      </tbody>
    </table>
  </div>

  <div class="section">
    <h2>5. Text Color Decision Flow</h2>
    <div class="flowchart">
      <div class="decision-box">Is cell saved edited?</div>
      <div class="yes-no">
        <span class="yes">YES → Check arrow color</span>
        <span class="no">NO → Default black</span>
      </div>
      <div class="arrow">↓</div>
      
      <div class="decision-box">Is arrow color orange? (#ff5d2d)</div>
      <div class="yes-no">
        <span class="yes">YES → Text color: Orange (#ff5d2d), Bold</span>
        <span class="no">NO → Text color: Blue (#2E76E1), Bold</span>
      </div>
      <div class="arrow">↓</div>
      
      <div class="result-box">For edited/impacted (unsaved): Text color matches delta badge color</div>
    </div>
  </div>

  <div class="section">
    <h2>6. Complete State Combination Matrix</h2>
    <table>
      <thead>
        <tr>
          <th style="width: 15%;">Edit State</th>
          <th style="width: 10%;">Locked</th>
          <th style="width: 10%;">Has Note</th>
          <th style="width: 10%;">Row Type</th>
          <th style="width: 15%;">Background</th>
          <th style="width: 15%;">Icon</th>
          <th style="width: 15%;">Text Color</th>
          <th style="width: 10%;">Editable</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>Default</td>
          <td>No</td>
          <td>No</td>
          <td>Dimension</td>
          <td>White</td>
          <td>None</td>
          <td>Black</td>
          <td>✓</td>
        </tr>
        <tr>
          <td>Default</td>
          <td>No</td>
          <td>Yes</td>
          <td>Dimension</td>
          <td>White</td>
          <td>None</td>
          <td>Black</td>
          <td>✓</td>
        </tr>
        <tr>
          <td>Default</td>
          <td>No</td>
          <td>No</td>
          <td>Measure</td>
          <td>#F3F3F3</td>
          <td>None</td>
          <td>Black</td>
          <td>✗</td>
        </tr>
        <tr>
          <td>Directly Edited</td>
          <td>No</td>
          <td>No</td>
          <td>Dimension</td>
          <td>#f9e3b6</td>
          <td>None</td>
          <td>Orange/Blue</td>
          <td>✓</td>
        </tr>
        <tr>
          <td>Directly Edited</td>
          <td>No</td>
          <td>Yes</td>
          <td>Dimension</td>
          <td>#f9e3b6</td>
          <td>None + Triangle</td>
          <td>Orange/Blue</td>
          <td>✓</td>
        </tr>
        <tr>
          <td>Directly Edited</td>
          <td>Yes</td>
          <td>No</td>
          <td>Dimension</td>
          <td>#f9e3b6</td>
          <td>Lock</td>
          <td>Orange/Blue</td>
          <td>✗</td>
        </tr>
        <tr>
          <td>Saved Edited</td>
          <td>No</td>
          <td>No</td>
          <td>Dimension</td>
          <td>White</td>
          <td>Arrow</td>
          <td>Orange/Blue Bold</td>
          <td>✓</td>
        </tr>
        <tr>
          <td>Saved Edited</td>
          <td>No</td>
          <td>Yes</td>
          <td>Dimension</td>
          <td>White</td>
          <td>Arrow + Triangle</td>
          <td>Orange/Blue Bold</td>
          <td>✓</td>
        </tr>
        <tr>
          <td>Saved Edited</td>
          <td>Yes</td>
          <td>No</td>
          <td>Dimension</td>
          <td>White</td>
          <td>Lock</td>
          <td>Orange/Blue Bold</td>
          <td>✗</td>
        </tr>
        <tr>
          <td>Impacted</td>
          <td>No</td>
          <td>No</td>
          <td>Dimension</td>
          <td>#fef5e7</td>
          <td>None</td>
          <td>Orange/Blue</td>
          <td>✓</td>
        </tr>
        <tr>
          <td>Impacted</td>
          <td>No</td>
          <td>Yes</td>
          <td>Dimension</td>
          <td>#fef5e7</td>
          <td>None + Triangle</td>
          <td>Orange/Blue</td>
          <td>✓</td>
        </tr>
        <tr>
          <td>Impacted</td>
          <td>No</td>
          <td>No</td>
          <td>Measure</td>
          <td>#F3F3F3</td>
          <td>None</td>
          <td>Orange/Blue</td>
          <td>✗</td>
        </tr>
        <tr>
          <td>Impacted</td>
          <td>Yes</td>
          <td>No</td>
          <td>Dimension</td>
          <td>#fef5e7</td>
          <td>Lock</td>
          <td>Orange/Blue</td>
          <td>✗</td>
        </tr>
        <tr>
          <td>Default</td>
          <td>No</td>
          <td>No</td>
          <td>Readonly</td>
          <td>White + Texture</td>
          <td>None</td>
          <td>Black</td>
          <td>✗</td>
        </tr>
      </tbody>
    </table>
  </div>

  <div class="section">
    <h2>7. Edge Cases & Special Conditions</h2>
    <table>
      <thead>
        <tr>
          <th style="width: 30%;">Condition</th>
          <th style="width: 70%;">Behavior</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>Cell in editedCells AND impactedCells</strong></td>
          <td>Impossible - impactedCells only populated if NOT in editedCells. Priority: editedCells > impactedCells</td>
        </tr>
        <tr>
          <td><strong>Locked cell in measure row</strong></td>
          <td>Shows lock icon, retains measure row background (#F3F3F3), non-editable, non-impactable</td>
        </tr>
        <tr>
          <td><strong>Saved edited cell gets impacted</strong></td>
          <td>Remains in savedEditedCells, shows arrow, but value updates. Arrow color based on original edit direction.</td>
        </tr>
        <tr>
          <td><strong>Cell with note but no value change</strong></td>
          <td>Shows note triangle, white background, no arrow/badge, editable</td>
        </tr>
        <tr>
          <td><strong>Search matches edited cell</strong></td>
          <td>Shows yellow highlight on matching text, retains edited cell styling (orange background, delta badge)</td>
        </tr>
        <tr>
          <td><strong>Focused edited cell</strong></td>
          <td>Shows black outline (2px), retains edited styling, can show edit info popover</td>
        </tr>
        <tr>
          <td><strong>Dirty cell (edited but not saved)</strong></td>
          <td>No arrow shown, only delta badge. Arrow appears after save.</td>
        </tr>
        <tr>
          <td><strong>Delta = 0%</strong></td>
          <td>Delta badge not shown if |deltaPercent| < 0.001</td>
        </tr>
        <tr>
          <td><strong>Locked cell contributes to sums</strong></td>
          <td>Yes - locked cells contribute current value to parent sums and aggregations, but don't receive propagation changes</td>
        </tr>
        <tr>
          <td><strong>Impacted cell in measure row</strong></td>
          <td>Retains measure row background (#F3F3F3) instead of yellow (#fef5e7)</td>
        </tr>
      </tbody>
    </table>
  </div>

  <div class="section">
    <h2>8. State Transition Rules</h2>
    <table>
      <thead>
        <tr>
          <th style="width: 25%;">From State</th>
          <th style="width: 25%;">Action</th>
          <th style="width: 25%;">To State</th>
          <th style="width: 25%;">Visual Change</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>Default</td>
          <td>User edits value</td>
          <td>Directly Edited</td>
          <td>Background → Orange, Delta badge appears</td>
        </tr>
        <tr>
          <td>Directly Edited</td>
          <td>User saves grid</td>
          <td>Saved Edited</td>
          <td>Background → White, Badge → Arrow, Text → Colored & Bold</td>
        </tr>
        <tr>
          <td>Default</td>
          <td>Another cell edited (propagation)</td>
          <td>Impacted</td>
          <td>Background → Yellow, Delta badge appears</td>
        </tr>
        <tr>
          <td>Any</td>
          <td>User locks cell</td>
          <td>Locked</td>
          <td>Icon → Lock (replaces arrow), Non-editable</td>
        </tr>
        <tr>
          <td>Any</td>
          <td>User adds note</td>
          <td>Same + Note</td>
          <td>Triangle appears (no other change)</td>
        </tr>
        <tr>
          <td>Directly Edited</td>
          <td>User cancels</td>
          <td>Default</td>
          <td>Background → White, Badge removed</td>
        </tr>
        <tr>
          <td>Impacted</td>
          <td>User edits impacted cell</td>
          <td>Directly Edited</td>
          <td>Background → Orange (from Yellow)</td>
        </tr>
      </tbody>
    </table>
  </div>

  <div class="section">
    <h2>9. Missing Conditions Checklist</h2>
    <div class="note-box">
      <strong>Verified Conditions:</strong>
      <ul style="margin: 8px 0; padding-left: 20px;">
        <li>✓ Currently editing state (input field shown)</li>
        <li>✓ Row type determination (measure/dimension/time)</li>
        <li>✓ Readonly measure detection (Last Year)</li>
        <li>✓ Lock state detection</li>
        <li>✓ Edit state priority (saved > edited > impacted > default)</li>
        <li>✓ Note detection (from editHistory)</li>
        <li>✓ Search highlighting</li>
        <li>✓ Focus state</li>
        <li>✓ Hover state (row level, not cell level)</li>
        <li>✓ Delta calculation (percentage)</li>
        <li>✓ Arrow direction (increase/decrease)</li>
        <li>✓ Measure row background override</li>
        <li>✓ Locked cell propagation protection</li>
      </ul>
    </div>
  </div>

  <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #dddbda; font-size: 10px; color: #706e6b; text-align: center;">
    <p>Forecasting & Planning Tool - Cell State Decision Framework</p>
    <p>Generated: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
  </div>
</body>
</html>
  `;
  
  await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
  
  const pdfPath = path.join(__dirname, 'cell-states-flowchart.pdf');
  await page.pdf({
    path: pdfPath,
    format: 'A4',
    landscape: true,
    margin: {
      top: '15mm',
      right: '15mm',
      bottom: '15mm',
      left: '15mm'
    },
    printBackground: true
  });
  
  await browser.close();
  
  console.log(`PDF generated successfully: ${pdfPath}`);
}

generatePDF().catch(console.error);

