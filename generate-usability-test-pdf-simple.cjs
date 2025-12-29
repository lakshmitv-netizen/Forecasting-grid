const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

// Simple markdown to HTML converter
function markdownToHTML(markdown) {
  let html = markdown;
  
  // Headers
  html = html.replace(/^### \*\*(.+?)\*\*/gm, '<h3>$1</h3>');
  html = html.replace(/^## (.+?)$/gm, '<h2>$1</h2>');
  html = html.replace(/^# (.+?)$/gm, '<h1>$1</h1>');
  
  // Bold
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  
  // Lists
  html = html.replace(/^- \[ \] (.+)$/gm, '<li>$1</li>');
  html = html.replace(/^(\d+)\. (.+)$/gm, '<li>$2</li>');
  
  // Wrap lists
  html = html.replace(/(<li>.*<\/li>\n?)+/g, (match) => {
    return '<ul>' + match + '</ul>';
  });
  
  // Code blocks
  html = html.replace(/`(.+?)`/g, '<code>$1</code>');
  
  // Horizontal rules
  html = html.replace(/^---$/gm, '<hr>');
  
  // Line breaks
  html = html.replace(/\n\n/g, '</p><p>');
  html = '<p>' + html + '</p>';
  
  return html;
}

async function generatePDF() {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  
  const markdownContent = fs.readFileSync(path.join(__dirname, 'usability-testing-plan.md'), 'utf-8');
  
  // Convert markdown sections to HTML
  const sections = markdownContent.split(/\n(?=###|\n##)/);
  
  let htmlContent = `
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
    p {
      margin: 6px 0;
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
    .page-break {
      page-break-before: always;
    }
    strong {
      color: #001E5B;
      font-weight: 600;
    }
    hr {
      border: none;
      border-top: 1px solid #dddbda;
      margin: 15px 0;
    }
  </style>
</head>
<body>
`;

  // Process markdown content
  let inTaskBox = false;
  let inObservationBox = false;
  let inSuccessBox = false;
  
  const lines = markdownContent.split('\n');
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Headers
    if (line.startsWith('# ')) {
      htmlContent += `<h1>${line.substring(2)}</h1>\n`;
    } else if (line.startsWith('## ')) {
      htmlContent += `<h2>${line.substring(3)}</h2>\n`;
    } else if (line.startsWith('### **')) {
      const content = line.replace(/### \*\*(.+?)\*\*/, '$1');
      htmlContent += `<h3>${content}</h3>\n`;
    } else if (line.startsWith('#### ')) {
      htmlContent += `<h4>${line.substring(5)}</h4>\n`;
    }
    // Task boxes
    else if (line.includes('**Task:**')) {
      const taskText = line.replace(/.*\*\*Task:\*\* "(.+?)"/, '$1');
      htmlContent += `<div class="task-box">\n<h4>${lines[i-1]?.replace(/^### \*\*(.+?)\*\*/, '$1') || 'Task'}</h4>\n<p><strong>Task:</strong> "${taskText}"</p>\n`;
      inTaskBox = true;
    }
    // Observation boxes
    else if (line.includes('**What to Observe:**')) {
      htmlContent += `<div class="observation-box">\n<strong>What to Observe:</strong>\n<ul>\n`;
      inObservationBox = true;
    }
    // Success criteria
    else if (line.includes('**Success Criteria:**')) {
      if (inObservationBox) {
        htmlContent += `</ul>\n</div>\n`;
        inObservationBox = false;
      }
      const criteria = line.replace(/.*\*\*Success Criteria:\*\* (.+)/, '$1');
      htmlContent += `<div class="success-box">\n<strong>Success Criteria:</strong> ${criteria}\n</div>\n`;
      inSuccessBox = true;
    }
    // Close task box
    else if (line.startsWith('---') && inTaskBox) {
      htmlContent += `</div>\n`;
      inTaskBox = false;
    }
    // List items in observation box
    else if (inObservationBox && line.trim().startsWith('- [')) {
      const item = line.replace(/^- \[ \] (.+)/, '$1');
      htmlContent += `<li>${item}</li>\n`;
    }
    // Regular paragraphs
    else if (line.trim() && !line.startsWith('#') && !line.startsWith('-') && !line.startsWith('|') && !line.startsWith('**Version:**') && !line.startsWith('**Date:**') && !line.startsWith('**Testing Duration:**') && !line.startsWith('**Target Users:**') && !line.startsWith('**Script:**') && !line.startsWith('**Provide to participant:**')) {
      let processedLine = line;
      processedLine = processedLine.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
      processedLine = processedLine.replace(/`(.+?)`/g, '<code>$1</code>');
      if (processedLine.trim()) {
        htmlContent += `<p>${processedLine}</p>\n`;
      }
    }
  }
  
  // Close any open boxes
  if (inObservationBox) {
    htmlContent += `</ul>\n</div>\n`;
  }
  if (inTaskBox) {
    htmlContent += `</div>\n`;
  }
  
  htmlContent += `
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

