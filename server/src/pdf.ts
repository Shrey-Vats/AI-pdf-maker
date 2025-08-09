// server/src/pdf.ts (ENHANCED VERSION)

import PDFDocument from 'pdfkit';
import type { Response } from 'express';
import { marked } from 'marked';

// --- Helper function for sanitizing filenames ---
function sanitizeFilename(filename: string): string {
  return filename.replace(/[\/\\]/g, '').replace(/[^a-zA-Z0-9_.-]/g, '_').slice(0, 100);
}

// --- PDF Theme Configuration ---
interface PDFTheme {
  primaryColor: string;
  secondaryColor: string;
  textColor: string;
  backgroundColor: string;
  accentColor: string;
  headerFont: string;
  bodyFont: string;
}

const themes: Record<string, PDFTheme> = {
  professional: {
    primaryColor: '#2563eb',
    secondaryColor: '#64748b',
    textColor: '#1e293b',
    backgroundColor: '#ffffff',
    accentColor: '#0ea5e9',
    headerFont: 'Helvetica-Bold',
    bodyFont: 'Helvetica'
  },
  modern: {
    primaryColor: '#7c3aed',
    secondaryColor: '#a855f7',
    textColor: '#374151',
    backgroundColor: '#f9fafb',
    accentColor: '#06b6d4',
    headerFont: 'Helvetica-Bold',
    bodyFont: 'Helvetica'
  },
  elegant: {
    primaryColor: '#059669',
    secondaryColor: '#10b981',
    textColor: '#1f2937',
    backgroundColor: '#ffffff',
    accentColor: '#f59e0b',
    headerFont: 'Helvetica-Bold',
    bodyFont: 'Helvetica'
  },
  dark: {
    primaryColor: '#fbbf24',
    secondaryColor: '#f59e0b',
    textColor: '#f9fafb',
    backgroundColor: '#111827',
    accentColor: '#ef4444',
    headerFont: 'Helvetica-Bold',
    bodyFont: 'Helvetica'
  }
};

// --- Enhanced PDF Generation ---
export function streamTextAsPDF(
  res: Response, 
  title: string, 
  markdownContent: string, 
  options: {
    theme?: keyof typeof themes;
    fontSize?: number;
    margins?: { top: number; bottom: number; left: number; right: number };
    includeHeader?: boolean;
    includeFooter?: boolean;
    includePageNumbers?: boolean;
    includeTableOfContents?: boolean;
  } = {}
) {
  const {
    theme = 'professional',
    fontSize = 12,
    margins = { top: 72, bottom: 72, left: 72, right: 72 },
    includeHeader = true,
    includeFooter = true,
    includePageNumbers = true,
    includeTableOfContents = false
  } = options;

  const currentTheme = themes[theme];
  const safeFilename = sanitizeFilename(title);

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${safeFilename || 'document'}.pdf"`);

  const doc = new PDFDocument({
    margin: margins.top,
    margins: margins,
    size: 'A4',
    info: {
      Title: title,
      Author: 'AI Document Generator',
      Subject: 'Generated Document',
      Creator: 'AI Text to PDF'
    }
  });

  doc.pipe(res);

  // --- Variables for layout tracking ---
  let pageNumber = 1;
  let yPosition = margins.top + 60; // Start below header

  // --- Helper Functions ---
  function addHeader() {
    if (!includeHeader) return;
    
    // Header background
    doc.rect(0, 0, doc.page.width, 50)
       .fill(currentTheme.primaryColor);

    // Header text
    doc.fill(currentTheme.backgroundColor)
       .font(currentTheme.headerFont)
       .fontSize(16)
       .text(title, margins.left, 20, { 
         width: doc.page.width - margins.left - margins.right,
         align: 'center'
       });

    // Header underline
    doc.rect(margins.left, 55, doc.page.width - margins.left - margins.right, 2)
       .fill(currentTheme.accentColor);
  }

  function addFooter() {
    if (!includeFooter) return;
    
    const footerY = doc.page.height - 40;
    
    // Footer line
    doc.rect(margins.left, footerY - 10, doc.page.width - margins.left - margins.right, 1)
       .fill(currentTheme.secondaryColor);

    // Footer text
    doc.fill(currentTheme.secondaryColor)
       .font(currentTheme.bodyFont)
       .fontSize(10)
       .text(`Generated on ${new Date().toLocaleDateString()}`, margins.left, footerY, {
         width: doc.page.width - margins.left - margins.right,
         align: 'left'
       });

    // Page numbers
    if (includePageNumbers) {
      doc.text(`Page ${pageNumber}`, margins.left, footerY, {
        width: doc.page.width - margins.left - margins.right,
        align: 'right'
      });
    }
  }

  function checkPageBreak(requiredSpace: number = 100) {
    if (yPosition + requiredSpace > doc.page.height - margins.bottom - 50) {
      doc.addPage();
      pageNumber++;
      addHeader();
      yPosition = margins.top + 80;
    }
  }

  function moveDown(space: number = 20) {
    yPosition += space;
    checkPageBreak();
  }

  // --- Parse Markdown and extract headings for TOC ---
  const tokens = marked.lexer(markdownContent);
  const tableOfContents: Array<{ level: number; text: string; page: number }> = [];

  // --- Add initial header ---
  addHeader();

  // --- Table of Contents (if enabled) ---
  if (includeTableOfContents) {
    // First pass: collect headings
    let tempPageNum = 1;
    tokens.forEach(token => {
      if (token.type === 'heading') {
        tableOfContents.push({
          level: token.depth,
          text: token.text,
          page: tempPageNum
        });
      }
    });

    // Generate TOC
    doc.fill(currentTheme.primaryColor)
       .font(currentTheme.headerFont)
       .fontSize(18)
       .text('Table of Contents', margins.left, yPosition);
    
    moveDown(30);

    tableOfContents.forEach(item => {
      const indent = (item.level - 1) * 20;
      doc.fill(currentTheme.textColor)
         .font(currentTheme.bodyFont)
         .fontSize(11)
         .text(`${item.text}`, margins.left + indent, yPosition, {
           continued: true
         })
         .text(`............................${item.page}`, {
           align: 'right',
           width: doc.page.width - margins.left - margins.right - indent
         });
      moveDown(15);
    });

    doc.addPage();
    pageNumber++;
    addHeader();
    yPosition = margins.top + 80;
  }

  // --- Process Markdown Content ---
  for (const token of tokens) {
    switch (token.type) {
      case 'heading':
        checkPageBreak(60);
        moveDown(token.depth === 1 ? 30 : 20);

        // Heading with background for H1
        if (token.depth === 1) {
          doc.rect(margins.left - 10, yPosition - 5, doc.page.width - margins.left - margins.right + 20, 35)
             .fill(currentTheme.primaryColor)
             .fill(currentTheme.backgroundColor)
             .font(currentTheme.headerFont)
             .fontSize(20)
             .text(token.text, margins.left, yPosition, {
               width: doc.page.width - margins.left - margins.right,
               align: 'left'
             });
          moveDown(45);
        } else {
          // Regular headings
          const headingSize = token.depth === 2 ? 16 : 14;
          const headingColor = token.depth === 2 ? currentTheme.primaryColor : currentTheme.accentColor;
          
          doc.fill(headingColor)
             .font(currentTheme.headerFont)
             .fontSize(headingSize)
             .text(token.text, margins.left, yPosition, {
               width: doc.page.width - margins.left - margins.right,
               align: 'left'
             });
          
          // Underline for H2
          if (token.depth === 2) {
            doc.rect(margins.left, yPosition + headingSize + 5, 100, 2)
               .fill(currentTheme.accentColor);
          }
          
          moveDown(headingSize + 15);
        }
        break;

      case 'paragraph':
        checkPageBreak(50);
        
        doc.fill(currentTheme.textColor)
           .font(currentTheme.bodyFont)
           .fontSize(fontSize);

        if ('tokens' in token && token.tokens) {
          let currentX = margins.left;
          const lineHeight = fontSize * 1.4;
          
          for (const part of token.tokens) {
            if (!('text' in part)) continue;
            
            if (part.type === 'strong') {
              doc.font(currentTheme.headerFont)
                 .fillColor(currentTheme.primaryColor)
                 .text(part.text, currentX, yPosition, { continued: true });
              doc.font(currentTheme.bodyFont)
                 .fillColor(currentTheme.textColor);
            } else if (part.type === 'em') {
              // Simulate italic with color change
              doc.fillColor(currentTheme.secondaryColor)
                 .text(part.text, currentX, yPosition, { continued: true })
                 .fillColor(currentTheme.textColor);
            } else {
              doc.text(part.text, currentX, yPosition, { continued: true });
            }
          }
          doc.text(''); // End the line
        } else {
          doc.text(token.raw || '', margins.left, yPosition, {
            width: doc.page.width - margins.left - margins.right,
            align: 'justify',
            lineGap: 4
          });
        }
        moveDown(25);
        break;

      case 'list':
        checkPageBreak(80);
        moveDown(15);
        
        token.items.forEach((item: any, index: number) => {
          checkPageBreak(30);
          
          // Custom bullet styling
          doc.circle(margins.left + 5, yPosition + 6, 3)
             .fill(currentTheme.accentColor);
          
          const itemText = item.tokens.map((t: any) => 'text' in t ? t.text : '').join('');
          
          doc.fill(currentTheme.textColor)
             .font(currentTheme.bodyFont)
             .fontSize(fontSize)
             .text(itemText, margins.left + 20, yPosition, {
               width: doc.page.width - margins.left - margins.right - 30,
               align: 'left',
               lineGap: 2
             });
          
          moveDown(20);
        });
        moveDown(10);
        break;

      case 'blockquote':
        checkPageBreak(60);
        moveDown(15);
        
        // Quote styling with left border
        doc.rect(margins.left, yPosition, 4, 40)
           .fill(currentTheme.accentColor);
        
        doc.fill(currentTheme.secondaryColor)
           .font(currentTheme.bodyFont)
           .fontSize(fontSize - 1)
           .text(token.text, margins.left + 20, yPosition, {
             width: doc.page.width - margins.left - margins.right - 30,
             align: 'left',
             lineGap: 3
           });
        
        moveDown(50);
        break;

      case 'code':
        checkPageBreak(40);
        moveDown(15);
        
        // Code block with background
        const codeHeight = 30;
        doc.rect(margins.left, yPosition, doc.page.width - margins.left - margins.right, codeHeight)
           .fill('#f1f5f9')
           .stroke(currentTheme.secondaryColor);
        
        doc.fill('#1e293b')
           .font('Courier')
           .fontSize(10)
           .text(token.text, margins.left + 10, yPosition + 10, {
             width: doc.page.width - margins.left - margins.right - 20
           });
        
        moveDown(codeHeight + 15);
        break;

      case 'hr':
        checkPageBreak(30);
        moveDown(20);
        
        // Decorative horizontal rule
        doc.rect(margins.left, yPosition, doc.page.width - margins.left - margins.right, 2)
           .fill(currentTheme.accentColor);
        
        moveDown(25);
        break;

      case 'space':
        moveDown(10);
        break;

      default:
        // Handle any other token types
        if ('text' in token) {
          doc.fill(currentTheme.textColor)
             .font(currentTheme.bodyFont)
             .fontSize(fontSize)
             .text(token.text, margins.left, yPosition, {
               width: doc.page.width - margins.left - margins.right,
               align: 'left'
             });
          moveDown(20);
        }
        break;
    }
  }

  // --- Add final footer ---
  addFooter();

  doc.end();
}

// --- Export function with theme options ---
export function createStyledPDF(
  res: Response, 
  title: string, 
  content: string, 
  theme: keyof typeof themes = 'professional',
  customOptions: any = {}
) {
  return streamTextAsPDF(res, title, content, {
    theme,
    fontSize: 12,
    includeHeader: true,
    includeFooter: true,
    includePageNumbers: true,
    includeTableOfContents: customOptions.includeTOC || false,
    ...customOptions
  });
}