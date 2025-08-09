// server/src/pdf.ts (FIXED VERSION)

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
  codeFont: string;
  gradientStart?: string;
  gradientEnd?: string;
}

const themes: Record<string, PDFTheme> = {
  professional: {
    primaryColor: '#2563eb',
    secondaryColor: '#64748b',
    textColor: '#1e293b',
    backgroundColor: '#ffffff',
    accentColor: '#0ea5e9',
    headerFont: 'Helvetica-Bold',
    bodyFont: 'Helvetica',
    codeFont: 'Courier'
  },
  modern: {
    primaryColor: '#7c3aed',
    secondaryColor: '#a855f7',
    textColor: '#374151',
    backgroundColor: '#f9fafb',
    accentColor: '#06b6d4',
    headerFont: 'Helvetica-Bold',
    bodyFont: 'Helvetica',
    codeFont: 'Courier',
    gradientStart: '#ede9fe',
    gradientEnd: '#ddd6fe'
  },
  elegant: {
    primaryColor: '#059669',
    secondaryColor: '#10b981',
    textColor: '#1f2937',
    backgroundColor: '#ffffff',
    accentColor: '#f59e0b',
    headerFont: 'Helvetica-Bold',
    bodyFont: 'Helvetica',
    codeFont: 'Courier'
  },
  dark: {
    primaryColor: '#fbbf24',
    secondaryColor: '#f59e0b',
    textColor: '#f9fafb',
    backgroundColor: '#111827',
    accentColor: '#ef4444',
    headerFont: 'Helvetica-Bold',
    bodyFont: 'Helvetica',
    codeFont: 'Courier'
  },
  coding: {
    primaryColor: '#10b981',
    secondaryColor: '#6366f1',
    textColor: '#1f2937',
    backgroundColor: '#ffffff',
    accentColor: '#f59e0b',
    headerFont: 'Helvetica-Bold',
    bodyFont: 'Helvetica',
    codeFont: 'Courier',
    gradientStart: '#ecfdf5',
    gradientEnd: '#d1fae5'
  }
};

// --- Enhanced PDF Generation with Fixed Text Positioning ---
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
  const lineHeight = fontSize * 1.4;

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${safeFilename || 'document'}.pdf"`);

  const doc = new PDFDocument({
    margin: margins.top,
    margins: margins,
    size: 'A4',
    bufferPages: true, // Important for consistent layout
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
  let yPosition = margins.top + (includeHeader ? 80 : 20);
  const pageHeight = doc.page.height;
  const pageWidth = doc.page.width;
  const contentWidth = pageWidth - margins.left - margins.right;
  const footerSpace = includeFooter ? 60 : margins.bottom;

  // --- Helper Functions ---
  function addHeader() {
    if (!includeHeader) return;
    
    // Reset position to top
    doc.x = 0;
    doc.y = 0;
    
    // Header background with gradient effect
    if (currentTheme.gradientStart) {
      // Simulate gradient with multiple rectangles
      for (let i = 0; i < 50; i++) {
        const alpha = 1 - (i / 50);
        doc.rect(0, i, pageWidth, 1)
           .fillOpacity(alpha * 0.1)
           .fill(currentTheme.primaryColor);
      }
    } else {
      doc.rect(0, 0, pageWidth, 60)
         .fill(currentTheme.primaryColor);
    }

    // Header text
    doc.fillOpacity(1)
       .fill(currentTheme.backgroundColor)
       .font(currentTheme.headerFont)
       .fontSize(18);
    
    // Get text dimensions to center properly
    const titleWidth = doc.widthOfString(title);
    const centerX = (pageWidth - titleWidth) / 2;
    
    doc.text(title, centerX, 20);

    // Decorative line
    doc.rect(margins.left, 65, contentWidth, 3)
       .fill(currentTheme.accentColor);
  }

  function addFooter() {
    if (!includeFooter) return;
    
    const footerY = pageHeight - 50;
    
    // Footer line
    doc.rect(margins.left, footerY - 5, contentWidth, 1)
       .fill(currentTheme.secondaryColor);

    // Footer content
    doc.fill(currentTheme.secondaryColor)
       .font(currentTheme.bodyFont)
       .fontSize(9);

    // Left side - date
    doc.text(`Generated on ${new Date().toLocaleDateString()}`, margins.left, footerY);

    // Right side - page numbers
    if (includePageNumbers) {
      const pageText = `Page ${pageNumber}`;
      const pageTextWidth = doc.widthOfString(pageText);
      doc.text(pageText, pageWidth - margins.right - pageTextWidth, footerY);
    }
  }

  function checkPageBreak(requiredSpace: number = 50) {
    const availableSpace = pageHeight - footerSpace - yPosition;
    
    if (availableSpace < requiredSpace) {
      // Add footer to current page
      addFooter();
      
      // Create new page
      doc.addPage();
      pageNumber++;
      
      // Add header to new page
      addHeader();
      
      // Reset position
      yPosition = margins.top + (includeHeader ? 90 : 30);
      doc.x = margins.left;
      doc.y = yPosition;
    }
  }

  function moveDown(space: number = lineHeight) {
    yPosition += space;
    doc.y = yPosition;
    checkPageBreak();
  }

  function setPosition(x: number = margins.left, y?: number) {
    doc.x = x;
    if (y !== undefined) {
      yPosition = y;
      doc.y = y;
    }
  }

  // --- Parse Markdown and extract headings for TOC ---
  const tokens = marked.lexer(markdownContent);
  const tableOfContents: Array<{ level: number; text: string; page: number }> = [];

  // --- Add initial header ---
  addHeader();
  setPosition(margins.left, yPosition);

  // --- Table of Contents (if enabled) ---
  if (includeTableOfContents) {
    // First pass: collect headings (simplified for now)
    tokens.forEach(token => {
      if (token.type === 'heading') {
        tableOfContents.push({
          level: token.depth,
          text: token.text,
          page: pageNumber
        });
      }
    });

    if (tableOfContents.length > 0) {
      checkPageBreak(100);
      
      // TOC Title
      doc.fill(currentTheme.primaryColor)
         .font(currentTheme.headerFont)
         .fontSize(20);
      
      setPosition(margins.left, yPosition);
      doc.text('Table of Contents', margins.left, yPosition);
      moveDown(40);

      // TOC Entries
      tableOfContents.forEach(item => {
        checkPageBreak(25);
        
        const indent = (item.level - 1) * 20;
        const dotLength = 50 - item.text.length;
        const dots = '.'.repeat(Math.max(dotLength, 5));
        
        doc.fill(currentTheme.textColor)
           .font(currentTheme.bodyFont)
           .fontSize(11);
        
        setPosition(margins.left + indent, yPosition);
        doc.text(`${item.text} ${dots} ${item.page}`, margins.left + indent, yPosition);
        moveDown(18);
      });

      // New page after TOC
      doc.addPage();
      pageNumber++;
      addHeader();
      setPosition(margins.left, margins.top + (includeHeader ? 90 : 30));
    }
  }

  // --- Process Markdown Content with Fixed Positioning ---
  for (const token of tokens) {
    switch (token.type) {
      case 'heading':
        const headingSpace = token.depth === 1 ? 80 : 60;
        checkPageBreak(headingSpace);
        
        moveDown(token.depth === 1 ? 40 : 25);

        if (token.depth === 1) {
          // H1 with decorative background
          doc.rect(margins.left - 15, yPosition - 8, contentWidth + 30, 40)
             .fillOpacity(0.1)
             .fill(currentTheme.primaryColor)
             .fillOpacity(1);
          
          doc.fill(currentTheme.primaryColor)
             .font(currentTheme.headerFont)
             .fontSize(22);
          
          setPosition(margins.left, yPosition);
          doc.text(token.text, margins.left, yPosition, {
            width: contentWidth,
            align: 'left'
          });
          
          moveDown(50);
          
          // Decorative line under H1
          doc.rect(margins.left, yPosition - 20, contentWidth, 3)
             .fill(currentTheme.accentColor);
             
        } else {
          // H2, H3, etc.
          const headingSize = token.depth === 2 ? 18 : 15;
          const headingColor = token.depth === 2 ? currentTheme.primaryColor : currentTheme.accentColor;
          
          doc.fill(headingColor)
             .font(currentTheme.headerFont)
             .fontSize(headingSize);
          
          setPosition(margins.left, yPosition);
          doc.text(token.text, margins.left, yPosition, {
            width: contentWidth,
            align: 'left'
          });
          
          moveDown(headingSize + 10);
          
          // Underline for H2
          if (token.depth === 2) {
            doc.rect(margins.left, yPosition - 15, 120, 2)
               .fill(currentTheme.accentColor);
          }
        }
        break;

      case 'paragraph':
        checkPageBreak(60);
        
        doc.fill(currentTheme.textColor)
           .font(currentTheme.bodyFont)
           .fontSize(fontSize);

        setPosition(margins.left, yPosition);
        
        // Calculate text height before rendering
        const textHeight = doc.heightOfString(token.raw || '', {
          width: contentWidth,
          lineGap: 4
        });
        
        checkPageBreak(textHeight + 20);
        
        doc.text(token.raw || '', margins.left, yPosition, {
          width: contentWidth,
          align: 'justify',
          lineGap: 4
        });
        
        // Update position based on actual text height
        yPosition += textHeight + 25;
        break;

      case 'list':
        checkPageBreak(100);
        moveDown(20);
        
        for (let i = 0; i < token.items.length; i++) {
          const item = token.items[i];
          checkPageBreak(35);
          
          // Bullet point
          doc.circle(margins.left + 8, yPosition + 8, 2.5)
             .fill(currentTheme.accentColor);
          
          // Extract text from item tokens
          let itemText = '';
          if (item.tokens) {
            itemText = item.tokens.map((t: any) => {
              if ('text' in t) return t.text;
              if ('raw' in t) return t.raw;
              return '';
            }).join('');
          }
          
          doc.fill(currentTheme.textColor)
             .font(currentTheme.bodyFont)
             .fontSize(fontSize);
          
          setPosition(margins.left + 25, yPosition);
          
          // Calculate height for list item
          const itemHeight = doc.heightOfString(itemText, {
            width: contentWidth - 35,
            lineGap: 2
          });
          
          doc.text(itemText, margins.left + 25, yPosition, {
            width: contentWidth - 35,
            align: 'left',
            lineGap: 2
          });
          
          yPosition += itemHeight + 15;
        }
        moveDown(15);
        break;

      case 'blockquote':
        checkPageBreak(80);
        moveDown(20);
        
        // Quote background
        const quoteHeight = doc.heightOfString(token.text, {
          width: contentWidth - 40,
          lineGap: 4
        }) + 20;
        
        doc.rect(margins.left, yPosition - 10, contentWidth, quoteHeight)
           .fillOpacity(0.05)
           .fill(currentTheme.primaryColor)
           .fillOpacity(1);
        
        // Quote left border
        doc.rect(margins.left, yPosition - 10, 4, quoteHeight)
           .fill(currentTheme.accentColor);
        
        doc.fill(currentTheme.secondaryColor)
           .font(currentTheme.bodyFont)
           .fontSize(fontSize - 1);
        
        setPosition(margins.left + 25, yPosition);
        doc.text(token.text, margins.left + 25, yPosition, {
          width: contentWidth - 40,
          align: 'left',
          lineGap: 4
        });
        
        yPosition += quoteHeight + 10;
        break;

      case 'code':
        checkPageBreak(60);
        moveDown(20);
        
        // Code block background
        const codeText = token.text || '';
        const codeHeight = Math.max(40, doc.heightOfString(codeText, {
          width: contentWidth - 20,
          lineGap: 2
        }) + 20);
        
        // Background
        doc.rect(margins.left, yPosition, contentWidth, codeHeight)
           .fill('#f8fafc')
           .stroke(currentTheme.secondaryColor)
           .lineWidth(1);
        
        // Code text
        doc.fill('#1e293b')
           .font(currentTheme.codeFont)
           .fontSize(fontSize - 1);
        
        setPosition(margins.left + 15, yPosition + 10);
        doc.text(codeText, margins.left + 15, yPosition + 10, {
          width: contentWidth - 30,
          lineGap: 2
        });
        
        yPosition += codeHeight + 20;
        break;

      case 'hr':
        checkPageBreak(40);
        moveDown(25);
        
        // Enhanced horizontal rule with gradient effect
        doc.rect(margins.left, yPosition, contentWidth, 3)
           .fill(currentTheme.accentColor);
        
        // Add decorative elements
        doc.circle(margins.left + 10, yPosition + 1.5, 4)
           .fill(currentTheme.primaryColor);
        doc.circle(pageWidth - margins.right - 10, yPosition + 1.5, 4)
           .fill(currentTheme.primaryColor);
        
        moveDown(30);
        break;

      case 'space':
        moveDown(12);
        break;

      default:
        // Handle any other token types
        if ('text' in token || 'raw' in token) {
          checkPageBreak(40);
          
          const text = (typeof (token as any).text === 'string' ? (token as any).text : (typeof (token as any).raw === 'string' ? (token as any).raw : ''));
          const textHeight = doc.heightOfString(text, {
            width: contentWidth,
            lineGap: 3
          });
          
          doc.fill(currentTheme.textColor)
             .font(currentTheme.bodyFont)
             .fontSize(fontSize);
          
          setPosition(margins.left, yPosition);
          doc.text(text, margins.left, yPosition, {
            width: contentWidth,
            align: 'left',
            lineGap: 3
          });
          
          yPosition += textHeight + 20;
        }
        break;
    }
  }

  // --- Add final footer ---
  addFooter();

  // --- Add page numbers to all pages if enabled ---
  if (includePageNumbers && doc.bufferedPageRange) {
    const pages = doc.bufferedPageRange();
    for (let i = pages.start; i < pages.start + pages.count; i++) {
      doc.switchToPage(i);
      
      // Add page-specific footer if not already added
      const currentPageNum = i - pages.start + 1;
      const footerY = pageHeight - 40;
      
      doc.fill(currentTheme.secondaryColor)
         .font(currentTheme.bodyFont)
         .fontSize(9);
      
      const pageText = `Page ${currentPageNum}`;
      const pageTextWidth = doc.widthOfString(pageText);
      doc.text(pageText, pageWidth - margins.right - pageTextWidth, footerY);
    }
  }

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
    fontSize: customOptions.fontSize || 12,
    includeHeader: true,
    includeFooter: true,
    includePageNumbers: true,
    includeTableOfContents: customOptions.includeTOC || false,
    ...customOptions
  });
}