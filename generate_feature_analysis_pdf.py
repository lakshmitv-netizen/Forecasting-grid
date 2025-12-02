#!/usr/bin/env python3
"""
Script to convert FEATURE_AGGRID_ANALYSIS.md to PDF
"""

from reportlab.lib.pagesizes import letter, A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, PageBreak, Table, TableStyle
from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_JUSTIFY
import re

def parse_markdown_to_pdf(input_file, output_file):
    """Convert markdown file to PDF"""
    
    # Create PDF document
    doc = SimpleDocTemplate(
        output_file,
        pagesize=letter,
        rightMargin=72,
        leftMargin=72,
        topMargin=72,
        bottomMargin=18
    )
    
    # Container for the 'Flowable' objects
    elements = []
    
    # Define styles
    styles = getSampleStyleSheet()
    
    # Custom styles
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=24,
        textColor=colors.HexColor('#0176D3'),
        spaceAfter=30,
        alignment=TA_CENTER,
        fontName='Helvetica-Bold'
    )
    
    heading1_style = ParagraphStyle(
        'CustomHeading1',
        parent=styles['Heading1'],
        fontSize=18,
        textColor=colors.HexColor('#0176D3'),
        spaceAfter=12,
        spaceBefore=20,
        fontName='Helvetica-Bold'
    )
    
    heading2_style = ParagraphStyle(
        'CustomHeading2',
        parent=styles['Heading2'],
        fontSize=14,
        textColor=colors.HexColor('#080707'),
        spaceAfter=8,
        spaceBefore=12,
        fontName='Helvetica-Bold'
    )
    
    heading3_style = ParagraphStyle(
        'CustomHeading3',
        parent=styles['Heading3'],
        fontSize=12,
        textColor=colors.HexColor('#2e2e2e'),
        spaceAfter=6,
        spaceBefore=8,
        fontName='Helvetica-Bold'
    )
    
    normal_style = ParagraphStyle(
        'CustomNormal',
        parent=styles['Normal'],
        fontSize=10,
        textColor=colors.HexColor('#181818'),
        spaceAfter=6,
        leading=14,
        alignment=TA_JUSTIFY
    )
    
    bullet_style = ParagraphStyle(
        'CustomBullet',
        parent=styles['Normal'],
        fontSize=10,
        textColor=colors.HexColor('#181818'),
        spaceAfter=4,
        leftIndent=20,
        leading=14
    )
    
    # Read markdown file
    with open(input_file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Split into lines
    lines = content.split('\n')
    
    i = 0
    while i < len(lines):
        line = lines[i].strip()
        
        # Skip empty lines at the start
        if not line and i == 0:
            i += 1
            continue
        
        # Title
        if line.startswith('# ') and i == 0:
            title = line[2:].strip()
            elements.append(Paragraph(title, title_style))
            elements.append(Spacer(1, 0.3*inch))
            i += 1
            continue
        
        # Heading 1
        if line.startswith('## '):
            heading = line[3:].strip()
            elements.append(Spacer(1, 0.2*inch))
            elements.append(Paragraph(heading, heading1_style))
            i += 1
            continue
        
        # Heading 2
        if line.startswith('### '):
            heading = line[4:].strip()
            elements.append(Spacer(1, 0.1*inch))
            elements.append(Paragraph(heading, heading2_style))
            i += 1
            continue
        
        # Heading 3
        if line.startswith('#### '):
            heading = line[5:].strip()
            elements.append(Paragraph(heading, heading3_style))
            i += 1
            continue
        
        # Bullet points
        if line.startswith('- ') or line.startswith('* '):
            bullet_text = line[2:].strip()
            # Remove markdown formatting
            bullet_text = re.sub(r'\*\*(.*?)\*\*', r'<b>\1</b>', bullet_text)
            bullet_text = re.sub(r'`(.*?)`', r'<font name="Courier">\1</font>', bullet_text)
            elements.append(Paragraph(f"• {bullet_text}", bullet_style))
            i += 1
            continue
        
        # Numbered list
        if re.match(r'^\d+\.\s', line):
            bullet_text = re.sub(r'^\d+\.\s', '', line).strip()
            bullet_text = re.sub(r'\*\*(.*?)\*\*', r'<b>\1</b>', bullet_text)
            bullet_text = re.sub(r'`(.*?)`', r'<font name="Courier">\1</font>', bullet_text)
            elements.append(Paragraph(f"• {bullet_text}", bullet_style))
            i += 1
            continue
        
        # Regular paragraph
        if line:
            # Clean up markdown formatting
            para_text = line
            para_text = re.sub(r'\*\*(.*?)\*\*', r'<b>\1</b>', para_text)
            para_text = re.sub(r'`(.*?)`', r'<font name="Courier">\1</font>', para_text)
            para_text = re.sub(r'✅', '✓', para_text)
            para_text = re.sub(r'⚠️', '⚠', para_text)
            para_text = re.sub(r'❌', '✗', para_text)
            
            # Handle special formatting
            if '**Prototype Feature:**' in para_text:
                para_text = para_text.replace('**Prototype Feature:**', '<b>Prototype Feature:</b>')
            if '**AG Grid Support:**' in para_text:
                para_text = para_text.replace('**AG Grid Support:**', '<b>AG Grid Support:</b>')
            if '**Extent:**' in para_text:
                para_text = para_text.replace('**Extent:**', '<b>Extent:</b>')
            if '**Notes:**' in para_text:
                para_text = para_text.replace('**Notes:**', '<b>Notes:</b>')
            
            elements.append(Paragraph(para_text, normal_style))
        
        i += 1
    
    # Build PDF
    doc.build(elements)
    print(f"PDF generated successfully: {output_file}")

if __name__ == "__main__":
    input_file = "FEATURE_AGGRID_ANALYSIS.md"
    output_file = "FEATURE_AGGRID_ANALYSIS.pdf"
    
    try:
        parse_markdown_to_pdf(input_file, output_file)
    except Exception as e:
        print(f"Error generating PDF: {e}")
        import traceback
        traceback.print_exc()


