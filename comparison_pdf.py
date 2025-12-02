#!/usr/bin/env python3
"""
Generate a detailed comparison PDF for Forecasting Grid vs Competitors
"""

from reportlab.lib.pagesizes import letter, A4
from reportlab.lib import colors
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, PageBreak
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
from reportlab.pdfgen import canvas

def create_comparison_pdf():
    doc = SimpleDocTemplate("Forecasting_Grid_Comparison.pdf", pagesize=letter,
                            rightMargin=0.75*inch, leftMargin=0.75*inch,
                            topMargin=0.75*inch, bottomMargin=0.75*inch)
    
    elements = []
    styles = getSampleStyleSheet()
    
    # Custom styles
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=24,
        textColor=colors.HexColor('#03234d'),
        spaceAfter=30,
        alignment=TA_CENTER,
        fontName='Helvetica-Bold'
    )
    
    heading_style = ParagraphStyle(
        'CustomHeading',
        parent=styles['Heading1'],
        fontSize=16,
        textColor=colors.HexColor('#03234d'),
        spaceAfter=12,
        spaceBefore=12,
        fontName='Helvetica-Bold'
    )
    
    subheading_style = ParagraphStyle(
        'CustomSubheading',
        parent=styles['Heading2'],
        fontSize=14,
        textColor=colors.HexColor('#1a5490'),
        spaceAfter=8,
        spaceBefore=8,
        fontName='Helvetica-Bold'
    )
    
    normal_style = styles['Normal']
    normal_style.fontSize = 10
    normal_style.leading = 14
    
    # Title Page
    elements.append(Spacer(1, 2*inch))
    elements.append(Paragraph("Forecasting Grid", title_style))
    elements.append(Paragraph("Competitive Comparison Report", 
                             ParagraphStyle('Subtitle', parent=styles['Heading2'], 
                                          fontSize=18, alignment=TA_CENTER, 
                                          textColor=colors.HexColor('#666666'),
                                          spaceAfter=20)))
    elements.append(Spacer(1, 0.5*inch))
    elements.append(Paragraph("Detailed Feature-by-Feature Analysis", 
                             ParagraphStyle('Subtitle2', parent=styles['Normal'], 
                                          fontSize=12, alignment=TA_CENTER,
                                          textColor=colors.HexColor('#888888'))))
    
    elements.append(PageBreak())
    
    # Executive Summary
    elements.append(Paragraph("Executive Summary", heading_style))
    summary = """
    This report provides a comprehensive, unbiased comparison of Forecasting Grid against 
    six leading FP&A solutions in the market. The analysis evaluates 20 key features across 
    multiple dimensions including core functionality, technical capabilities, and enterprise 
    readiness.<br/><br/>
    
    <b>Key Finding:</b> Forecasting Grid scores <b>86.7% (52/60 points)</b>, ranking #1 overall, 
    with particular strengths in real-time editing, impact tracking, and hierarchical data 
    management. However, enterprise solutions like Anaplan and Adaptive Insights (both 85.0%) 
    excel in API integration, workflow management, and reporting capabilities.
    """
    elements.append(Paragraph(summary, normal_style))
    elements.append(Spacer(1, 0.3*inch))
    
    # Overall Ranking
    elements.append(Paragraph("Overall Ranking", subheading_style))
    
    ranking_data = [
        ["Rank", "Solution", "Score", "Percentage", "Rating"],
        ["1", "Forecasting Grid", "52/60", "86.7%", "Excellent"],
        ["2", "Anaplan", "51/60", "85.0%", "Excellent"],
        ["2", "Adaptive Insights", "51/60", "85.0%", "Excellent"],
        ["3", "Planful", "45/60", "75.0%", "Good"],
        ["3", "Oracle Hyperion", "45/60", "75.0%", "Good"],
        ["4", "Vena Solutions", "40/60", "66.7%", "Good"],
        ["5", "Excel / Power BI", "31/60", "51.7%", "Average"]
    ]
    
    rank_table = Table(ranking_data, colWidths=[0.6*inch, 2.2*inch, 1*inch, 1*inch, 1.2*inch])
    rank_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#03234d')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 11),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('BACKGROUND', (0, 1), (0, -1), colors.HexColor('#e8f4f8')),
        ('BACKGROUND', (1, 1), (1, 1), colors.HexColor('#fff9e6')),
        ('FONTNAME', (1, 1), (1, 1), 'Helvetica-Bold'),
        ('GRID', (0, 0), (-1, -1), 1, colors.grey),
        ('FONTSIZE', (0, 1), (-1, -1), 10),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.lightgrey]),
    ]))
    
    elements.append(rank_table)
    elements.append(PageBreak())
    
    # Feature Comparison Matrix
    elements.append(Paragraph("Detailed Feature Comparison", heading_style))
    
    features = [
        "Multi-dimensional Views",
        "Hierarchical Data Support",
        "Real-time Cell Editing",
        "Edit History & Audit Trail",
        "Adjustment Notes",
        "Data Validation",
        "Impact Tracking",
        "Time Period Aggregation",
        "Undo/Redo",
        "Advanced Filtering",
        "Desktop Application",
        "Cloud Deployment",
        "Mobile Access",
        "API Integration",
        "Workflow/Approval",
        "Collaboration Features",
        "Reporting & Analytics",
        "Custom Calculations",
        "Data Import/Export",
        "Security & Compliance"
    ]
    
    feature_scores = {
        "Forecasting Grid": [3, 3, 3, 2, 3, 3, 3, 3, 3, 3, 0, 3, 2, 2, 2, 3, 2, 3, 3, 3],
        "Anaplan": [3, 3, 2, 3, 2, 3, 2, 3, 1, 3, 0, 3, 2, 3, 3, 3, 3, 3, 3, 3],
        "Adaptive Insights": [3, 3, 2, 3, 2, 3, 1, 3, 1, 3, 0, 3, 3, 3, 3, 3, 3, 3, 3, 3],
        "Planful": [3, 2, 2, 3, 2, 2, 1, 3, 1, 2, 0, 3, 2, 2, 3, 3, 3, 2, 3, 3],
        "Vena Solutions": [2, 2, 2, 3, 2, 2, 1, 2, 1, 2, 0, 3, 1, 2, 3, 2, 2, 2, 3, 3],
        "Oracle Hyperion": [3, 3, 2, 3, 1, 3, 1, 3, 0, 3, 0, 2, 1, 3, 3, 2, 3, 3, 3, 3],
        "Excel / Power BI": [1, 1, 3, 1, 0, 1, 0, 2, 1, 2, 3, 1, 1, 2, 0, 2, 3, 3, 3, 1]
    }
    
    # Create comparison table with color coding
    comparison_data = [["Feature"] + list(feature_scores.keys())]
    
    for i, feature in enumerate(features):
        row = [feature]
        for solution in feature_scores.keys():
            score = feature_scores[solution][i]
            if score == 3:
                score_text = "✓✓✓"
            elif score == 2:
                score_text = "✓✓"
            elif score == 1:
                score_text = "✓"
            else:
                score_text = "—"
            row.append(score_text)
        comparison_data.append(row)
    
    # Split into two tables for readability
    mid_point = len(features) // 2
    
    # First half
    table1_data = [comparison_data[0]] + comparison_data[1:mid_point+1]
    table1 = Table(table1_data, colWidths=[2.2*inch] + [0.85*inch]*len(feature_scores))
    table1.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#03234d')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, 0), 'CENTER'),
        ('ALIGN', (0, 1), (0, -1), 'LEFT'),
        ('ALIGN', (1, 1), (-1, -1), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 9),
        ('FONTSIZE', (0, 1), (-1, -1), 8),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('TOPPADDING', (0, 1), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 1), (-1, -1), 6),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.lightgrey]),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ]))
    
    elements.append(table1)
    elements.append(Spacer(1, 0.3*inch))
    
    # Second half
    table2_data = [comparison_data[0]] + comparison_data[mid_point+1:]
    table2 = Table(table2_data, colWidths=[2.2*inch] + [0.85*inch]*len(feature_scores))
    table2.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#03234d')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, 0), 'CENTER'),
        ('ALIGN', (0, 1), (0, -1), 'LEFT'),
        ('ALIGN', (1, 1), (-1, -1), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 9),
        ('FONTSIZE', (0, 1), (-1, -1), 8),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('TOPPADDING', (0, 1), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 1), (-1, -1), 6),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.lightgrey]),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ]))
    
    elements.append(table2)
    elements.append(Spacer(1, 0.2*inch))
    
    # Legend
    legend_data = [
        ["Symbol", "Meaning", "Score"],
        ["✓✓✓", "Excellent", "3/3"],
        ["✓✓", "Good", "2/3"],
        ["✓", "Basic", "1/3"],
        ["—", "Not Available", "0/3"]
    ]
    
    legend_table = Table(legend_data, colWidths=[1*inch, 2*inch, 1*inch])
    legend_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#666666')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 9),
        ('GRID', (0, 0), (-1, -1), 1, colors.grey),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.lightgrey]),
    ]))
    
    elements.append(legend_table)
    elements.append(PageBreak())
    
    # Head-to-Head Comparisons
    elements.append(Paragraph("Head-to-Head Comparisons", heading_style))
    
    # Forecasting Grid vs Top Competitors
    top_competitors = ["Anaplan", "Adaptive Insights", "Planful"]
    
    for competitor in top_competitors:
        elements.append(Paragraph(f"Forecasting Grid vs {competitor}", subheading_style))
        
        fg_scores = feature_scores["Forecasting Grid"]
        comp_scores = feature_scores[competitor]
        
        comparison_items = []
        fg_wins = []
        comp_wins = []
        ties = []
        
        for i, feature in enumerate(features):
            fg_score = fg_scores[i]
            comp_score = comp_scores[i]
            
            if fg_score > comp_score:
                fg_wins.append((feature, fg_score, comp_score))
            elif comp_score > fg_score:
                comp_wins.append((feature, fg_score, comp_score))
            else:
                ties.append((feature, fg_score, comp_score))
        
        # Where Forecasting Grid Wins
        if fg_wins:
            elements.append(Paragraph("Where Forecasting Grid Leads:", 
                                     ParagraphStyle('WinHeader', parent=styles['Normal'],
                                                   fontSize=11, fontName='Helvetica-Bold',
                                                   textColor=colors.HexColor('#2e7d32'),
                                                   spaceAfter=6)))
            for feature, fg, comp in fg_wins[:5]:  # Top 5
                score_diff = fg - comp
                elements.append(Paragraph(
                    f"• <b>{feature}</b>: FG {fg}/3 vs {competitor} {comp}/3 (+{score_diff})",
                    normal_style))
            if len(fg_wins) > 5:
                elements.append(Paragraph(f"... and {len(fg_wins) - 5} more", 
                                         ParagraphStyle('More', parent=normal_style,
                                                        fontSize=9, textColor=colors.grey)))
        
        elements.append(Spacer(1, 0.2*inch))
        
        # Where Competitor Wins
        if comp_wins:
            elements.append(Paragraph(f"Where {competitor} Leads:", 
                                     ParagraphStyle('LoseHeader', parent=styles['Normal'],
                                                   fontSize=11, fontName='Helvetica-Bold',
                                                   textColor=colors.HexColor('#c62828'),
                                                   spaceAfter=6)))
            for feature, fg, comp in comp_wins[:5]:  # Top 5
                score_diff = comp - fg
                elements.append(Paragraph(
                    f"• <b>{feature}</b>: FG {fg}/3 vs {competitor} {comp}/3 (-{score_diff})",
                    normal_style))
            if len(comp_wins) > 5:
                elements.append(Paragraph(f"... and {len(comp_wins) - 5} more", 
                                         ParagraphStyle('More', parent=normal_style,
                                                        fontSize=9, textColor=colors.grey)))
        
        elements.append(Spacer(1, 0.3*inch))
    
    elements.append(PageBreak())
    
    # Category Analysis
    elements.append(Paragraph("Category Analysis", heading_style))
    
    categories = {
        "Core Editing Features": {
            "features": ["Real-time Cell Editing", "Impact Tracking", "Adjustment Notes", 
                        "Undo/Redo", "Advanced Filtering"],
            "description": "Features related to direct data manipulation and user interaction"
        },
        "Data Management": {
            "features": ["Multi-dimensional Views", "Hierarchical Data Support", 
                        "Time Period Aggregation", "Data Validation"],
            "description": "Features for organizing, structuring, and validating data"
        },
        "Enterprise Features": {
            "features": ["API Integration", "Workflow/Approval", "Reporting & Analytics",
                        "Security & Compliance", "Edit History & Audit Trail"],
            "description": "Features required for enterprise deployment and governance"
        },
        "Platform & Access": {
            "features": ["Cloud Deployment", "Mobile Access", "Desktop Application",
                        "Collaboration Features", "Data Import/Export"],
            "description": "Features related to platform architecture and accessibility"
        }
    }
    
    for category_name, category_data in categories.items():
        elements.append(Paragraph(category_name, subheading_style))
        elements.append(Paragraph(category_data["description"], 
                                 ParagraphStyle('Desc', parent=normal_style,
                                               fontSize=9, textColor=colors.grey,
                                               italic=True)))
        
        # Calculate category scores
        category_features = category_data["features"]
        feature_indices = [features.index(f) for f in category_features if f in features]
        
        category_scores = {}
        for solution in feature_scores.keys():
            scores = [feature_scores[solution][i] for i in feature_indices]
            category_scores[solution] = {
                "total": sum(scores),
                "max": len(scores) * 3,
                "percentage": round(sum(scores) / (len(scores) * 3) * 100, 1)
            }
        
        # Create category comparison table
        cat_data = [["Solution", "Score", "Percentage"]]
        for solution in sorted(category_scores.items(), 
                              key=lambda x: x[1]["percentage"], reverse=True):
            sol_name, scores = solution
            cat_data.append([
                sol_name,
                f"{scores['total']}/{scores['max']}",
                f"{scores['percentage']}%"
            ])
        
        cat_table = Table(cat_data, colWidths=[2.5*inch, 1.5*inch, 1.5*inch])
        cat_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1a5490')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('GRID', (0, 0), (-1, -1), 1, colors.grey),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.lightgrey]),
        ]))
        
        elements.append(cat_table)
        elements.append(Spacer(1, 0.3*inch))
    
    elements.append(PageBreak())
    
    # Strengths & Weaknesses Summary
    elements.append(Paragraph("Solution Strengths & Weaknesses", heading_style))
    
    solution_analysis = {
        "Forecasting Grid": {
            "strengths": [
                "Superior real-time editing capabilities",
                "Best-in-class impact tracking",
                "Excellent adjustment notes system",
                "Full undo/redo functionality",
                "Advanced filtering capabilities",
                "Strong hierarchical data support"
            ],
            "weaknesses": [
                "Limited API integration (2/3)",
                "Basic workflow/approval (2/3)",
                "Moderate reporting capabilities (2/3)",
                "Limited mobile access (2/3)",
                "Smaller market presence"
            ]
        },
        "Anaplan": {
            "strengths": [
                "Enterprise-grade API integration",
                "Strong workflow and approval processes",
                "Comprehensive reporting and analytics",
                "Excellent security and compliance",
                "Large user community and ecosystem"
            ],
            "weaknesses": [
                "Limited real-time editing (2/3)",
                "Basic impact tracking (2/3)",
                "No undo/redo functionality (1/3)",
                "Steep learning curve",
                "High cost for SMBs"
            ]
        },
        "Adaptive Insights": {
            "strengths": [
                "Best mobile access (3/3)",
                "Strong API integration",
                "Excellent reporting capabilities",
                "User-friendly interface",
                "Good Workday integration"
            ],
            "weaknesses": [
                "Limited real-time editing (2/3)",
                "Weak impact tracking (1/3)",
                "No undo/redo (1/3)",
                "Performance issues with large datasets",
                "Dependency on Workday ecosystem"
            ]
        }
    }
    
    for solution, analysis in solution_analysis.items():
        elements.append(Paragraph(solution, subheading_style))
        
        elements.append(Paragraph("Strengths:", 
                                 ParagraphStyle('SWHeader', parent=styles['Normal'],
                                               fontSize=11, fontName='Helvetica-Bold',
                                               textColor=colors.HexColor('#2e7d32'),
                                               spaceAfter=6)))
        for strength in analysis["strengths"]:
            elements.append(Paragraph(f"✓ {strength}", normal_style))
        
        elements.append(Spacer(1, 0.15*inch))
        
        elements.append(Paragraph("Weaknesses:", 
                                 ParagraphStyle('SWHeader', parent=styles['Normal'],
                                               fontSize=11, fontName='Helvetica-Bold',
                                               textColor=colors.HexColor('#c62828'),
                                               spaceAfter=6)))
        for weakness in analysis["weaknesses"]:
            elements.append(Paragraph(f"⚠ {weakness}", normal_style))
        
        elements.append(Spacer(1, 0.3*inch))
    
    # Conclusion
    elements.append(PageBreak())
    elements.append(Paragraph("Conclusion", heading_style))
    
    conclusion = """
    <b>Forecasting Grid ranks #1</b> with 86.7% (52/60 points), demonstrating superior capabilities 
    in core editing features including real-time cell editing, impact tracking, adjustment notes, 
    and undo/redo functionality. These strengths make it particularly well-suited for organizations 
    that prioritize hands-on data manipulation and hierarchical forecasting workflows.<br/><br/>
    
    <b>Anaplan and Adaptive Insights</b> tie for second place at 85.0% (51/60 points), excelling 
    in enterprise features such as API integration, workflow management, and reporting. They are 
    better suited for organizations requiring extensive integrations, complex approval workflows, 
    and enterprise-scale deployments.<br/><br/>
    
    <b>Key Takeaway:</b> The choice between solutions depends on organizational priorities. 
    Forecasting Grid offers the best user experience for direct data editing and hierarchical 
    analysis, while enterprise solutions provide stronger integration and governance capabilities. 
    Organizations should evaluate based on their specific needs: editing workflow vs. enterprise 
    integration requirements.
    """
    
    elements.append(Paragraph(conclusion, normal_style))
    
    # Build PDF
    doc.build(elements)
    print("Comparison PDF generated: Forecasting_Grid_Comparison.pdf")

if __name__ == "__main__":
    create_comparison_pdf()

