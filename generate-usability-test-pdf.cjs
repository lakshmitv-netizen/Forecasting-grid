const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

async function generatePDF() {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  
  const markdownContent = fs.readFileSync(path.join(__dirname, 'usability-testing-plan.md'), 'utf-8');
  
  // Convert markdown to HTML (simplified conversion)
  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    @page {
      size: A4;
      margin: 15mm;
    }
    body {
      font-family: 'SF Pro', -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
      margin: 0;
      padding: 20px;
      color: #181818;
      background: white;
      font-size: 10px;
      line-height: 1.5;
    }
    h1 {
      color: #001E5B;
      font-size: 22px;
      font-weight: 700;
      margin-bottom: 8px;
      border-bottom: 3px solid #0176d3;
      padding-bottom: 8px;
      page-break-after: avoid;
    }
    h2 {
      color: #001E5B;
      font-size: 16px;
      font-weight: 600;
      margin-top: 20px;
      margin-bottom: 10px;
      background: #f3f2f2;
      padding: 6px 10px;
      border-left: 4px solid #0176d3;
      page-break-after: avoid;
    }
    h3 {
      color: #001E5B;
      font-size: 13px;
      font-weight: 600;
      margin-top: 15px;
      margin-bottom: 8px;
      page-break-after: avoid;
    }
    h4 {
      color: #001E5B;
      font-size: 11px;
      font-weight: 600;
      margin-top: 12px;
      margin-bottom: 6px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 12px 0;
      font-size: 9px;
      page-break-inside: avoid;
    }
    th {
      background-color: #0176d3;
      color: white;
      padding: 8px 6px;
      text-align: left;
      font-weight: 600;
      font-size: 9px;
      border: 1px solid #005fb2;
    }
    td {
      padding: 6px;
      border: 1px solid #dddbda;
      font-size: 9px;
      vertical-align: top;
    }
    tr:nth-child(even) {
      background-color: #fafaf9;
    }
    ul, ol {
      margin: 8px 0;
      padding-left: 20px;
    }
    li {
      margin: 4px 0;
      line-height: 1.4;
    }
    .task-box {
      background-color: #e3f2fd;
      border-left: 4px solid #0176d3;
      padding: 10px;
      margin: 12px 0;
      border-radius: 4px;
      page-break-inside: avoid;
    }
    .task-box h4 {
      margin-top: 0;
      color: #001E5B;
    }
    .observation-box {
      background-color: #fff4e5;
      border-left: 4px solid #ffb75d;
      padding: 8px;
      margin: 10px 0;
      border-radius: 4px;
      font-size: 9px;
    }
    .success-box {
      background-color: #e8f5e9;
      border-left: 4px solid #4caf50;
      padding: 8px;
      margin: 10px 0;
      border-radius: 4px;
      font-size: 9px;
    }
    code {
      font-family: 'Courier New', monospace;
      font-size: 8px;
      background: #f3f2f2;
      padding: 2px 4px;
      border-radius: 2px;
      color: #d32f2f;
    }
    .section {
      margin-bottom: 20px;
      page-break-inside: avoid;
    }
    .checklist {
      list-style: none;
      padding-left: 0;
    }
    .checklist li:before {
      content: "☐ ";
      margin-right: 6px;
    }
    .page-break {
      page-break-before: always;
    }
    strong {
      color: #001E5B;
      font-weight: 600;
    }
  </style>
</head>
<body>
  <h1>Usability Testing Plan</h1>
  <h2>Forecasting & Planning Tool Prototype</h2>
  
  <div style="margin-bottom: 15px; padding: 10px; background: #f3f2f2; border-radius: 4px; font-size: 9px;">
    <p><strong>Version:</strong> 2.0</p>
    <p><strong>Date:</strong> December 2025</p>
    <p><strong>Testing Duration:</strong> 60-90 minutes per session</p>
    <p><strong>Target Users:</strong> Financial analysts, planning managers, data analysts</p>
    <p><strong>Focus:</strong> Comprehension, Discoverability, Usefulness</p>
  </div>

  <h2>Pre-Testing Setup</h2>
  
  <h3>Environment Preparation</h3>
  <ul class="checklist">
    <li>Ensure prototype is running on http://localhost:5173 or deployed URL</li>
    <li>Clear browser cache and localStorage</li>
    <li>Have screen recording software ready (optional but recommended)</li>
    <li>Prepare note-taking template for observer</li>
  </ul>

  <h3>Participant Briefing</h3>
  <div class="task-box">
    <p><strong>Script:</strong> "Thank you for participating in this usability test. You'll be working with a forecasting and planning tool prototype. I'll give you some tasks to accomplish, but I won't tell you how to do them - I want to see how you naturally approach the tool. Please think aloud as you work, sharing what you're looking for, what you're trying to do, and any questions or thoughts you have. There are no right or wrong answers - we're testing the tool, not you. Feel free to explore and experiment. The session will take about 60-90 minutes. Do you have any questions before we begin?"</p>
  </div>

  <h3>Test Data Context</h3>
  <div class="task-box">
    <p><strong>Provide to participant:</strong> "You are a financial analyst reviewing forecast data for 2026. The grid shows Sales Agreement Revenue and Sales Agreement Quantity across different accounts, product categories, and products. You can edit values, add notes, and track changes. Take a moment to familiarize yourself with what you're seeing."</p>
  </div>

  <h2>Test Scenarios Overview</h2>
  
  <table>
    <thead>
      <tr>
        <th style="width: 5%;">#</th>
        <th style="width: 30%;">Scenario</th>
        <th style="width: 25%;">Focus Area</th>
        <th style="width: 15%;">Duration</th>
        <th style="width: 25%;">Priority</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>1</td>
        <td>Grid Comprehension</td>
        <td>Understanding structure and data</td>
        <td>10 min</td>
        <td>Critical</td>
      </tr>
      <tr>
        <td>2</td>
        <td>Feature Discovery</td>
        <td>Finding and using features</td>
        <td>15 min</td>
        <td>Critical</td>
      </tr>
      <tr>
        <td>3</td>
        <td>Cell Editing</td>
        <td>Editing and value changes</td>
        <td>15 min</td>
        <td>Critical</td>
      </tr>
      <tr>
        <td>4</td>
        <td>Search & Filtering</td>
        <td>Finding specific data</td>
        <td>10 min</td>
        <td>High</td>
      </tr>
      <tr>
        <td>5</td>
        <td>Customization</td>
        <td>Adjusting grid view</td>
        <td>10 min</td>
        <td>Medium</td>
      </tr>
      <tr>
        <td>6</td>
        <td>Notes & Documentation</td>
        <td>Adding context to edits</td>
        <td>10 min</td>
        <td>High</td>
      </tr>
      <tr>
        <td>7</td>
        <td>Change Tracking</td>
        <td>Viewing edit history</td>
        <td>10 min</td>
        <td>High</td>
      </tr>
      <tr>
        <td>8</td>
        <td>Collaboration</td>
        <td>Discussions and comments</td>
        <td>8 min</td>
        <td>Medium</td>
      </tr>
      <tr>
        <td>9</td>
        <td>Data Protection</td>
        <td>Locking cells</td>
        <td>8 min</td>
        <td>Medium</td>
      </tr>
      <tr>
        <td>10</td>
        <td>Error Recovery</td>
        <td>Undo/redo functionality</td>
        <td>5 min</td>
        <td>Medium</td>
      </tr>
    </tbody>
  </table>

  <div class="page-break"></div>

  <h2>Test Tasks</h2>

  <div class="task-box">
    <h4>Task 1: Initial Screen Comprehension</h4>
    <p><strong>Task:</strong> "Take a minute to look at this screen. What do you understand from this screen? What are your thoughts about this screen?"</p>
    
    <div class="observation-box">
      <strong>What to Observe:</strong>
      <ul>
        <li>What do they notice first?</li>
        <li>How do they describe the grid structure?</li>
        <li>What terminology do they use?</li>
        <li>Do they understand the data relationships?</li>
        <li>What questions do they have?</li>
        <li>What seems clear or unclear?</li>
      </ul>
    </div>
    
    <div class="success-box">
      <strong>Success Criteria:</strong> User can describe basic structure and purpose of the screen
    </div>
  </div>

  <div class="task-box">
    <h4>Task 1.2: Expand and Collapse Rows</h4>
    <p><strong>Instructions:</strong> "Expand the 'Sales Agreement Revenue' measure to see its child rows. Then collapse it again."</p>
    
    <div class="observation-box">
      <strong>Observations to Note:</strong>
      <ul>
        <li>Can user find the expand/collapse icon?</li>
        <li>Does expansion work smoothly?</li>
        <li>Do they understand what information appears when expanded?</li>
      </ul>
    </div>
    
    <div class="success-box">
      <strong>Success Criteria:</strong> User successfully expands and collapses rows
    </div>
  </div>

  <div class="task-box">
    <h4>Task 1.3: Switch Between Layout Views</h4>
    <p><strong>Instructions:</strong> "Open the Settings panel (gear icon in toolbar). Change the layout to 'Dimensions / Time x Measures'. Then switch to 'Time / Dimensions x Measures'."</p>
    
    <div class="observation-box">
      <strong>Observations to Note:</strong>
      <ul>
        <li>Can user find the Settings panel?</li>
        <li>Do they understand the layout options?</li>
        <li>Does the layout switch work smoothly?</li>
        <li>Do they notice the data reorganization?</li>
      </ul>
    </div>
    
    <div class="success-box">
      <strong>Success Criteria:</strong> User successfully switches between all 3 layouts
    </div>
  </div>

  <div class="task-box">
    <h4>Task 1.4: Navigate Large Grid</h4>
    <p><strong>Instructions:</strong> "Scroll horizontally to see all months (Jan through Dec). Scroll vertically to see different products. Notice how the first column stays visible."</p>
    
    <div class="observation-box">
      <strong>Observations to Note:</strong>
      <ul>
        <li>Does the frozen column work as expected?</li>
        <li>Does the sticky header work during scroll?</li>
        <li>Is scrolling smooth?</li>
      </ul>
    </div>
    
    <div class="success-box">
      <strong>Success Criteria:</strong> User can navigate large grid without losing context
    </div>
  </div>

  <div class="page-break"></div>

  <h3>SCENARIO 2: Cell Editing & Value Propagation</h3>
  <p><strong>Objective:</strong> Test core editing functionality and automatic value propagation</p>

  <div class="task-box">
    <h4>Task 2.1: Edit a Cell Value</h4>
    <p><strong>Instructions:</strong> "Find a product cell under 'Sales Agreement Revenue' for January 2026. Change its value from the current number to 500. Press Enter to save."</p>
    
    <div class="observation-box">
      <strong>Observations to Note:</strong>
      <ul>
        <li>Can user identify editable cells?</li>
        <li>Do they understand how to enter edit mode?</li>
        <li>Do they know to press Enter to save?</li>
        <li>What happens after they save?</li>
      </ul>
    </div>
    
    <div class="success-box">
      <strong>Success Criteria:</strong> User successfully edits and saves a cell value
    </div>
  </div>

  <div class="task-box">
    <h4>Task 2.2: Observe Value Propagation (Upward)</h4>
    <p><strong>Instructions:</strong> "After editing the product cell, check what happened to the parent category and account totals. Do they update automatically?"</p>
    
    <div class="observation-box">
      <strong>Observations to Note:</strong>
      <ul>
        <li>Does user notice the parent totals changed?</li>
        <li>Do they understand the relationship?</li>
        <li>Are the visual indicators (arrows, colors) clear?</li>
      </ul>
    </div>
    
    <div class="success-box">
      <strong>Success Criteria:</strong> User recognizes that parent totals updated automatically
    </div>
  </div>

  <div class="task-box">
    <h4>Task 2.3: Observe Value Propagation (Downward)</h4>
    <p><strong>Instructions:</strong> "Now edit a category total (not a product). Change it to 1000. Check what happens to the child product values."</p>
    
    <div class="observation-box">
      <strong>Observations to Note:</strong>
      <ul>
        <li>Does user understand downward propagation?</li>
        <li>Are child values updated proportionally?</li>
        <li>Do they see impacted cells highlighted?</li>
      </ul>
    </div>
    
    <div class="success-box">
      <strong>Success Criteria:</strong> User recognizes that child values updated automatically
    </div>
  </div>

  <div class="task-box">
    <h4>Task 2.4: Edit Multiple Cells</h4>
    <p><strong>Instructions:</strong> "Edit 3 different cells in different months. Notice how each edit is tracked. Don't save yet - we'll save later."</p>
    
    <div class="observation-box">
      <strong>Observations to Note:</strong>
      <ul>
        <li>Can user edit multiple cells in sequence?</li>
        <li>Do they see visual feedback for edited cells?</li>
        <li>Do they understand the difference between edited and impacted cells?</li>
      </ul>
    </div>
    
    <div class="success-box">
      <strong>Success Criteria:</strong> User can edit multiple cells and distinguish edited vs impacted
    </div>
  </div>

  <div class="task-box">
    <h4>Task 2.5: Time Aggregation</h4>
    <p><strong>Instructions:</strong> "Edit a month value (e.g., January). Check if the quarter total (Q1) and year total update automatically."</p>
    
    <div class="observation-box">
      <strong>Observations to Note:</strong>
      <ul>
        <li>Does user notice time aggregation?</li>
        <li>Do quarter/year totals update correctly?</li>
        <li>Is the relationship clear?</li>
      </ul>
    </div>
    
    <div class="success-box">
      <strong>Success Criteria:</strong> User recognizes time period aggregation
    </div>
  </div>

  <div class="page-break"></div>

  <h3>SCENARIO 3: Search & Filtering</h3>
  <p><strong>Objective:</strong> Test search functionality and filtering capabilities</p>

  <div class="task-box">
    <h4>Task 3.1: Basic Search</h4>
    <p><strong>Instructions:</strong> "Use the search box in the toolbar. Search for 'TRN'. What do you see?"</p>
    
    <div class="observation-box">
      <strong>Observations to Note:</strong>
      <ul>
        <li>Can user find the search box?</li>
        <li>Do search results appear immediately?</li>
        <li>Is text highlighted in matching cells?</li>
        <li>Do columns filter correctly?</li>
      </ul>
    </div>
    
    <div class="success-box">
      <strong>Success Criteria:</strong> User successfully searches and sees highlighted results
    </div>
  </div>

  <div class="task-box">
    <h4>Task 3.2: Search for Time Period</h4>
    <p><strong>Instructions:</strong> "Search for 'May' or 'Q2'. What columns are shown?"</p>
    
    <div class="observation-box">
      <strong>Observations to Note:</strong>
      <ul>
        <li>Does time period search work?</li>
        <li>Are only matching time columns shown?</li>
        <li>Do parent/child time periods appear correctly?</li>
      </ul>
    </div>
    
    <div class="success-box">
      <strong>Success Criteria:</strong> User can search for time periods and see filtered columns
    </div>
  </div>

  <div class="task-box">
    <h4>Task 3.3: Search for Measure</h4>
    <p><strong>Instructions:</strong> "Search for 'Revenue'. What happens to the grid?"</p>
    
    <div class="observation-box">
      <strong>Observations to Note:</strong>
      <ul>
        <li>Does measure search filter rows or columns?</li>
        <li>Are matching measure names highlighted?</li>
        <li>Is the filtering behavior intuitive?</li>
      </ul>
    </div>
    
    <div class="success-box">
      <strong>Success Criteria:</strong> User understands how measure search works
    </div>
  </div>

  <div class="task-box">
    <h4>Task 3.4: Clear Search</h4>
    <p><strong>Instructions:</strong> "Clear the search box. Does the grid return to its original state?"</p>
    
    <div class="observation-box">
      <strong>Observations to Note:</strong>
      <ul>
        <li>Can user clear search easily?</li>
        <li>Does grid restore correctly?</li>
        <li>Are all rows/columns visible again?</li>
      </ul>
    </div>
    
    <div class="success-box">
      <strong>Success Criteria:</strong> User can clear search and restore full view
    </div>
  </div>

  <div class="page-break"></div>

  <h3>SCENARIO 4: Settings & Configuration</h3>
  <p><strong>Objective:</strong> Test settings panel and grid customization</p>

  <div class="task-box">
    <h4>Task 4.1: Open Settings Panel</h4>
    <p><strong>Instructions:</strong> "Open the Settings panel using the gear icon in the toolbar."</p>
    
    <div class="success-box">
      <strong>Success Criteria:</strong> User successfully opens Settings panel
    </div>
  </div>

  <div class="task-box">
    <h4>Task 4.2: Change Measure Subgroup</h4>
    <p><strong>Instructions:</strong> "In Settings, change the 'Measure Subgroup' dropdown to 'Adjustment Measures'. What changes in the grid?"</p>
    
    <div class="success-box">
      <strong>Success Criteria:</strong> User successfully changes measure subgroup
    </div>
  </div>

  <div class="task-box">
    <h4>Task 4.3: Adjust Dimension Levels</h4>
    <p><strong>Instructions:</strong> "In Settings, uncheck 'Product' in Dimension Levels. Check what happens to the grid rows."</p>
    
    <div class="success-box">
      <strong>Success Criteria:</strong> User successfully modifies dimension levels
    </div>
  </div>

  <div class="task-box">
    <h4>Task 4.4: Adjust Time Granularity</h4>
    <p><strong>Instructions:</strong> "In Settings, uncheck 'Months' in Time Granularity. What time periods are shown now?"</p>
    
    <div class="success-box">
      <strong>Success Criteria:</strong> User successfully modifies time granularity
    </div>
  </div>

  <div class="task-box">
    <h4>Task 4.5: Change Column Width</h4>
    <p><strong>Instructions:</strong> "In Settings, use the column width slider to make columns wider or narrower."</p>
    
    <div class="success-box">
      <strong>Success Criteria:</strong> User successfully adjusts column width
    </div>
  </div>

  <div class="task-box">
    <h4>Task 4.6: Expand/Collapse All</h4>
    <p><strong>Instructions:</strong> "In Settings, click 'Expand All Rows'. Then click 'Collapse All Rows'."</p>
    
    <div class="success-box">
      <strong>Success Criteria:</strong> User successfully expands and collapses all rows
    </div>
  </div>

  <div class="page-break"></div>

  <h3>SCENARIO 5: Filters Panel</h3>
  <p><strong>Objective:</strong> Test advanced filtering capabilities</p>

  <div class="task-box">
    <h4>Task 5.1: Open Filters Panel</h4>
    <p><strong>Instructions:</strong> "Open the Filters panel using the filter icon in the toolbar."</p>
    
    <div class="success-box">
      <strong>Success Criteria:</strong> User successfully opens Filters panel
    </div>
  </div>

  <div class="task-box">
    <h4>Task 5.2: Create Product Filter</h4>
    <p><strong>Instructions:</strong> "In Filters panel, click on the 'Products' filter block. Select 3 products from the popover. Save the filter."</p>
    
    <div class="success-box">
      <strong>Success Criteria:</strong> User successfully creates and applies product filter
    </div>
  </div>

  <div class="task-box">
    <h4>Task 5.3: Create Time Filter</h4>
    <p><strong>Instructions:</strong> "In Filters panel, click on the 'Time' filter block. Select specific months or quarters. Save the filter."</p>
    
    <div class="success-box">
      <strong>Success Criteria:</strong> User successfully creates and applies time filter
    </div>
  </div>

  <div class="task-box">
    <h4>Task 5.4: Modify Existing Filter</h4>
    <p><strong>Instructions:</strong> "Click on the Products filter you created earlier. Add 2 more products to the selection. Save."</p>
    
    <div class="success-box">
      <strong>Success Criteria:</strong> User successfully modifies existing filter
    </div>
  </div>

  <div class="page-break"></div>

  <h3>SCENARIO 6: Adjustment Notes</h3>
  <p><strong>Objective:</strong> Test adding notes to cells</p>

  <div class="task-box">
    <h4>Task 6.1: Add Note While Editing</h4>
    <p><strong>Instructions:</strong> "Edit a cell value. After entering the new value, press the Down Arrow key. You should see a note input field. Add a note explaining why you changed the value."</p>
    
    <div class="success-box">
      <strong>Success Criteria:</strong> User successfully adds note via keyboard navigation
    </div>
  </div>

  <div class="task-box">
    <h4>Task 6.2: Add Note by Clicking</h4>
    <p><strong>Instructions:</strong> "Edit another cell. This time, try clicking on the note input area that appears below the cell."</p>
    
    <div class="success-box">
      <strong>Success Criteria:</strong> User successfully adds note via mouse click
    </div>
  </div>

  <div class="task-box">
    <h4>Task 6.3: Add Note Without Value Change</h4>
    <p><strong>Instructions:</strong> "Click on a cell that hasn't been edited. Try to add just a note without changing the value."</p>
    
    <div class="success-box">
      <strong>Success Criteria:</strong> User successfully adds note-only entry
    </div>
  </div>

  <div class="task-box">
    <h4>Task 6.4: View Note Indicator</h4>
    <p><strong>Instructions:</strong> "After adding a note, look at the cell. Do you see any visual indicator that the cell has a note?"</p>
    
    <div class="success-box">
      <strong>Success Criteria:</strong> User recognizes note indicator on cells
    </div>
  </div>

  <div class="page-break"></div>

  <h3>SCENARIO 7: Edit History & Cell Details</h3>
  <p><strong>Objective:</strong> Test edit history tracking and cell details panel</p>

  <div class="task-box">
    <h4>Task 7.1: Open Cell Details Panel</h4>
    <p><strong>Instructions:</strong> "Click on a cell that you've edited. Look for the Cell Details panel on the right side. Open it if it's not already open."</p>
    
    <div class="success-box">
      <strong>Success Criteria:</strong> User successfully opens Cell Details panel
    </div>
  </div>

  <div class="task-box">
    <h4>Task 7.2: View Edit History</h4>
    <p><strong>Instructions:</strong> "In the Cell Details panel, look at the 'Cell Edit History' section. Can you see the edit you just made?"</p>
    
    <div class="success-box">
      <strong>Success Criteria:</strong> User can view edit history entries
    </div>
  </div>

  <div class="task-box">
    <h4>Task 7.3: View Cell Information Header</h4>
    <p><strong>Instructions:</strong> "Look at the top of the Cell Details panel. What information is shown about the selected cell?"</p>
    
    <div class="success-box">
      <strong>Success Criteria:</strong> User understands cell context information
    </div>
  </div>

  <div class="task-box">
    <h4>Task 7.4: View Dimension Hierarchy</h4>
    <p><strong>Instructions:</strong> "Click on the info icon next to the dimension value in the header. What appears?"</p>
    
    <div class="success-box">
      <strong>Success Criteria:</strong> User successfully views dimension hierarchy
    </div>
  </div>

  <div class="task-box">
    <h4>Task 7.5: Expand/Collapse History Entry</h4>
    <p><strong>Instructions:</strong> "Click on one of the edit history cards to expand it. Then collapse it again."</p>
    
    <div class="success-box">
      <strong>Success Criteria:</strong> User successfully expands and collapses history entries
    </div>
  </div>

  <div class="task-box">
    <h4>Task 7.6: View Notes in History</h4>
    <p><strong>Instructions:</strong> "Find an edit history entry that has a note. Can you see the note content?"</p>
    
    <div class="success-box">
      <strong>Success Criteria:</strong> User can view notes in edit history
    </div>
  </div>

  <div class="page-break"></div>

  <h3>SCENARIO 8: Threaded Discussions</h3>
  <p><strong>Objective:</strong> Test collaboration features</p>

  <div class="task-box">
    <h4>Task 8.1: Add Comment to Edit History</h4>
    <p><strong>Instructions:</strong> "Expand an edit history entry. In the discussion section at the bottom, add a comment."</p>
    
    <div class="success-box">
      <strong>Success Criteria:</strong> User successfully adds a comment
    </div>
  </div>

  <div class="task-box">
    <h4>Task 8.2: Reply to Comment</h4>
    <p><strong>Instructions:</strong> "If there's a comment, try to reply to it. Otherwise, add a second comment."</p>
    
    <div class="success-box">
      <strong>Success Criteria:</strong> User successfully replies to comments
    </div>
  </div>

  <div class="task-box">
    <h4>Task 8.3: View Discussion Thread</h4>
    <p><strong>Instructions:</strong> "Look at the discussion thread. Can you see who posted what and when?"</p>
    
    <div class="success-box">
      <strong>Success Criteria:</strong> User can follow discussion threads
    </div>
  </div>

  <div class="task-box">
    <h4>Task 8.4: Add Comment from Bottom Input</h4>
    <p><strong>Instructions:</strong> "Scroll to the bottom of the Cell Details panel. Use the comment input there to add a new comment."</p>
    
    <div class="success-box">
      <strong>Success Criteria:</strong> User successfully uses bottom comment input
    </div>
  </div>

  <div class="page-break"></div>

  <h3>SCENARIO 9: Cell Locking</h3>
  <p><strong>Objective:</strong> Test cell locking functionality</p>

  <div class="task-box">
    <h4>Task 9.1: Lock a Cell via Context Menu</h4>
    <p><strong>Instructions:</strong> "Right-click on a cell. Select 'Lock' from the context menu."</p>
    
    <div class="success-box">
      <strong>Success Criteria:</strong> User successfully locks cell via context menu
    </div>
  </div>

  <div class="task-box">
    <h4>Task 9.2: Observe Lock Icon</h4>
    <p><strong>Instructions:</strong> "After locking, look at the cell. Do you see a lock icon?"</p>
    
    <div class="success-box">
      <strong>Success Criteria:</strong> User recognizes lock icon
    </div>
  </div>

  <div class="task-box">
    <h4>Task 9.3: Try to Edit Locked Cell</h4>
    <p><strong>Instructions:</strong> "Try to edit the locked cell. What happens?"</p>
    
    <div class="success-box">
      <strong>Success Criteria:</strong> User cannot edit locked cell
    </div>
  </div>

  <div class="task-box">
    <h4>Task 9.4: Test Propagation Protection</h4>
    <p><strong>Instructions:</strong> "Lock a cell. Then edit a parent cell that would normally impact the locked cell. Does the locked cell remain unchanged?"</p>
    
    <div class="success-box">
      <strong>Success Criteria:</strong> Locked cell is protected from propagation
    </div>
  </div>

  <div class="task-box">
    <h4>Task 9.5: Unlock a Cell</h4>
    <p><strong>Instructions:</strong> "Right-click on the locked cell again. Select 'Unlock'."</p>
    
    <div class="success-box">
      <strong>Success Criteria:</strong> User successfully unlocks cell
    </div>
  </div>

  <div class="page-break"></div>

  <h3>SCENARIO 10: Undo/Redo</h3>
  <p><strong>Objective:</strong> Test error recovery</p>

  <div class="task-box">
    <h4>Task 10.1: Undo an Edit</h4>
    <p><strong>Instructions:</strong> "After making an edit, look for an Undo option. Try to undo your last edit."</p>
    
    <div class="success-box">
      <strong>Success Criteria:</strong> User successfully undoes an edit
    </div>
  </div>

  <div class="task-box">
    <h4>Task 10.2: Redo an Edit</h4>
    <p><strong>Instructions:</strong> "After undoing, try to redo the edit."</p>
    
    <div class="success-box">
      <strong>Success Criteria:</strong> User successfully redoes an edit
    </div>
  </div>

  <div class="task-box">
    <h4>Task 10.3: Multiple Undo/Redo</h4>
    <p><strong>Instructions:</strong> "Make 3 edits. Then undo all 3. Then redo 2 of them."</p>
    
    <div class="success-box">
      <strong>Success Criteria:</strong> User can undo/redo multiple actions
    </div>
  </div>

  <div class="page-break"></div>

  <h3>SCENARIO 11: Cell Info Popover</h3>
  <p><strong>Objective:</strong> Test cell information display</p>

  <div class="task-box">
    <h4>Task 11.1: View Cell Info Popover</h4>
    <p><strong>Instructions:</strong> "Click on a cell that has been edited and saved. A popover should appear showing cell information."</p>
    
    <div class="success-box">
      <strong>Success Criteria:</strong> User sees cell info popover
    </div>
  </div>

  <div class="task-box">
    <h4>Task 11.2: View Edit Details in Popover</h4>
    <p><strong>Instructions:</strong> "Look at the information in the popover. What details are shown?"</p>
    
    <div class="success-box">
      <strong>Success Criteria:</strong> User can see edit details in popover
    </div>
  </div>

  <div class="task-box">
    <h4>Task 11.3: View Note in Popover</h4>
    <p><strong>Instructions:</strong> "If the cell has a note, is it shown in the popover?"</p>
    
    <div class="success-box">
      <strong>Success Criteria:</strong> User can see note in popover
    </div>
  </div>

  <div class="task-box">
    <h4>Task 11.4: Open Edit History from Popover</h4>
    <p><strong>Instructions:</strong> "In the popover, click 'View Edit History'. What happens?"</p>
    
    <div class="success-box">
      <strong>Success Criteria:</strong> User can open edit history from popover
    </div>
  </div>

  <div class="page-break"></div>

  <h3>SCENARIO 12: Save and Cancel</h3>
  <p><strong>Objective:</strong> Test save/cancel workflow</p>

  <div class="task-box">
    <h4>Task 12.1: Save Multiple Edits</h4>
    <p><strong>Instructions:</strong> "Make several edits to different cells. Don't save yet. Then click the 'Save' button in the footer."</p>
    
    <div class="success-box">
      <strong>Success Criteria:</strong> User successfully saves all edits
    </div>
  </div>

  <div class="task-box">
    <h4>Task 12.2: Cancel Edits</h4>
    <p><strong>Instructions:</strong> "Make some edits. Then click 'Cancel'. What happens?"</p>
    
    <div class="success-box">
      <strong>Success Criteria:</strong> User successfully cancels edits
    </div>
  </div>

  <div class="task-box">
    <h4>Task 12.3: Draft vs Saved State</h4>
    <p><strong>Instructions:</strong> "Make an edit but don't save. Look at the edit history panel. Is it marked as 'Unsaved' or 'Draft'?"</p>
    
    <div class="success-box">
      <strong>Success Criteria:</strong> User understands draft vs saved state
    </div>
  </div>

  <div class="page-break"></div>

  <h2>Post-Testing Questionnaire</h2>

  <h3>Overall Experience (1-5 scale, 5 = Excellent)</h3>
  <ol>
    <li><strong>Ease of Use:</strong> How easy was it to use the tool? (1-5)
      <p>Comments: _______________________________________________</p>
    </li>
    <li><strong>Learning Curve:</strong> How quickly did you understand how to use it? (1-5)
      <p>Comments: _______________________________________________</p>
    </li>
    <li><strong>Visual Design:</strong> How would you rate the visual design? (1-5)
      <p>Comments: _______________________________________________</p>
    </li>
    <li><strong>Feature Completeness:</strong> Do you feel all necessary features are present? (1-5)
      <p>Comments: _______________________________________________</p>
    </li>
    <li><strong>Performance:</strong> How would you rate the speed and responsiveness? (1-5)
      <p>Comments: _______________________________________________</p>
    </li>
  </ol>

  <h3>Specific Features (1-5 scale)</h3>
  <ol start="6">
    <li><strong>Cell Editing:</strong> How intuitive was editing cells? (1-5)
      <p>Comments: _______________________________________________</p>
    </li>
    <li><strong>Value Propagation:</strong> Was it clear how values propagate? (1-5)
      <p>Comments: _______________________________________________</p>
    </li>
    <li><strong>Search Functionality:</strong> How effective was the search? (1-5)
      <p>Comments: _______________________________________________</p>
    </li>
    <li><strong>Adjustment Notes:</strong> How easy was it to add notes? (1-5)
      <p>Comments: _______________________________________________</p>
    </li>
    <li><strong>Edit History:</strong> Was the edit history clear and useful? (1-5)
      <p>Comments: _______________________________________________</p>
    </li>
    <li><strong>Cell Locking:</strong> Was locking/unlocking intuitive? (1-5)
      <p>Comments: _______________________________________________</p>
    </li>
    <li><strong>Layout Switching:</strong> How easy was it to switch between layouts? (1-5)
      <p>Comments: _______________________________________________</p>
    </li>
  </ol>

  <h3>Open-Ended Questions</h3>
  <ol start="13">
    <li><strong>What did you like most about the tool?</strong>
      <p>_______________________________________________</p>
    </li>
    <li><strong>What did you find confusing or difficult?</strong>
      <p>_______________________________________________</p>
    </li>
    <li><strong>What features are missing that you would need?</strong>
      <p>_______________________________________________</p>
    </li>
    <li><strong>What would you change if you could?</strong>
      <p>_______________________________________________</p>
    </li>
    <li><strong>Would you use this tool in your daily work? Why or why not?</strong>
      <p>_______________________________________________</p>
    </li>
    <li><strong>How does this compare to tools you currently use?</strong>
      <p>_______________________________________________</p>
    </li>
    <li><strong>Any other comments or suggestions?</strong>
      <p>_______________________________________________</p>
    </li>
  </ol>

  <div class="page-break"></div>

  <h2>Success Criteria</h2>

  <h3>Critical Success Metrics</h3>
  <ul>
    <li>✅ <strong>Task Completion Rate:</strong> >80% of tasks completed successfully</li>
    <li>✅ <strong>Error Rate:</strong> <20% of tasks result in errors or confusion</li>
    <li>✅ <strong>Time to Complete:</strong> Average task completion time within expected range</li>
    <li>✅ <strong>User Satisfaction:</strong> Average rating >3.5/5.0</li>
  </ul>

  <h3>Feature-Specific Success Criteria</h3>
  <table>
    <thead>
      <tr>
        <th>Feature</th>
        <th>Success Criteria</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>Cell Editing</td>
        <td>User can edit cells without confusion (>90% success rate)</td>
      </tr>
      <tr>
        <td>Value Propagation</td>
        <td>User understands propagation behavior (>80% recognition)</td>
      </tr>
      <tr>
        <td>Search</td>
        <td>User can find desired data (>85% success rate)</td>
      </tr>
      <tr>
        <td>Adjustment Notes</td>
        <td>User can add notes successfully (>80% success rate)</td>
      </tr>
      <tr>
        <td>Edit History</td>
        <td>User can view and understand edit history (>85% success rate)</td>
      </tr>
      <tr>
        <td>Cell Locking</td>
        <td>User can lock/unlock cells successfully (>80% success rate)</td>
      </tr>
      <tr>
        <td>Layout Switching</td>
        <td>User can switch layouts without confusion (>85% success rate)</td>
      </tr>
    </tbody>
  </table>

  <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #dddbda; font-size: 8px; color: #706e6b; text-align: center;">
    <p>Forecasting & Planning Tool - Usability Testing Plan</p>
    <p>Generated: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
  </div>
</body>
</html>
  `;
  
  await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
  
  const pdfPath = path.join(__dirname, 'usability-testing-plan.pdf');
  await page.pdf({
    path: pdfPath,
    format: 'A4',
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

