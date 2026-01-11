const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

async function generatePDF() {
  const markdownPath = path.join(__dirname, 'ux-architecture-deck.md');
  const outputPath = path.join(__dirname, 'ux-architecture-deck.pdf');

  // Read markdown content
  const markdown = fs.readFileSync(markdownPath, 'utf-8');

  // Convert markdown to HTML with styling
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    @page {
      size: A4;
      margin: 40px 50px;
    }
    
    * {
      box-sizing: border-box;
    }
    
    body {
      font-family: 'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 11px;
      line-height: 1.5;
      color: #1a1a1a;
      max-width: 100%;
      margin: 0;
      padding: 0;
    }
    
    h1 {
      font-size: 28px;
      font-weight: 700;
      color: #0176d3;
      margin: 30px 0 15px 0;
      padding-bottom: 10px;
      border-bottom: 3px solid #0176d3;
      page-break-after: avoid;
    }
    
    h1:first-child {
      margin-top: 0;
    }
    
    h2 {
      font-size: 20px;
      font-weight: 600;
      color: #333;
      margin: 25px 0 12px 0;
      page-break-after: avoid;
    }
    
    h3 {
      font-size: 14px;
      font-weight: 600;
      color: #444;
      margin: 18px 0 10px 0;
      page-break-after: avoid;
    }
    
    p {
      margin: 8px 0;
    }
    
    pre {
      background-color: #f8f9fa;
      border: 1px solid #e1e4e8;
      border-radius: 6px;
      padding: 15px;
      overflow-x: auto;
      font-family: 'SF Mono', 'Menlo', 'Monaco', 'Courier New', monospace;
      font-size: 9px;
      line-height: 1.4;
      margin: 12px 0;
      page-break-inside: avoid;
    }
    
    code {
      font-family: 'SF Mono', 'Menlo', 'Monaco', 'Courier New', monospace;
      font-size: 10px;
      background-color: #f0f0f0;
      padding: 2px 5px;
      border-radius: 3px;
    }
    
    pre code {
      background: none;
      padding: 0;
    }
    
    ul, ol {
      margin: 8px 0;
      padding-left: 25px;
    }
    
    li {
      margin: 4px 0;
    }
    
    hr {
      border: none;
      border-top: 2px solid #e1e4e8;
      margin: 30px 0;
      page-break-after: avoid;
    }
    
    strong {
      font-weight: 600;
      color: #0176d3;
    }
    
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 15px 0;
      font-size: 10px;
    }
    
    th, td {
      border: 1px solid #ddd;
      padding: 8px 12px;
      text-align: left;
    }
    
    th {
      background-color: #f5f5f5;
      font-weight: 600;
    }
    
    .page-break {
      page-break-before: always;
    }
    
    /* Title page styling */
    .title-page {
      text-align: center;
      padding-top: 200px;
    }
    
    .title-page h1 {
      font-size: 36px;
      border: none;
      margin-bottom: 10px;
    }
    
    .title-page h2 {
      font-size: 24px;
      color: #666;
      font-weight: 400;
    }
  </style>
</head>
<body>
  ${markdownToHtml(markdown)}
</body>
</html>
  `;

  // Launch puppeteer and generate PDF
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: 'networkidle0' });
  
  await page.pdf({
    path: outputPath,
    format: 'A4',
    printBackground: true,
    margin: {
      top: '40px',
      right: '50px',
      bottom: '40px',
      left: '50px'
    }
  });

  await browser.close();
  
  console.log(`PDF generated successfully: ${outputPath}`);
}

function markdownToHtml(markdown) {
  let html = markdown;
  
  // Convert headers
  html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
  html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
  html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');
  
  // Convert horizontal rules (must be before other conversions)
  html = html.replace(/^---$/gim, '<hr>');
  
  // Convert bold
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  
  // Convert italic
  html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
  
  // Convert code blocks (must be before inline code)
  html = html.replace(/```[\w]*\n([\s\S]*?)```/g, '<pre><code>$1</code></pre>');
  
  // Convert inline code
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
  
  // Convert unordered lists
  html = html.replace(/^\- (.*$)/gim, '<li>$1</li>');
  
  // Wrap consecutive list items
  html = html.replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>');
  
  // Convert paragraphs (lines that don't start with < or are empty)
  const lines = html.split('\n');
  const processedLines = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line && !line.startsWith('<') && !line.startsWith('|')) {
      processedLines.push(`<p>${line}</p>`);
    } else {
      processedLines.push(lines[i]);
    }
  }
  
  html = processedLines.join('\n');
  
  // Clean up empty paragraphs
  html = html.replace(/<p>\s*<\/p>/g, '');
  
  return html;
}

generatePDF().catch(console.error);


