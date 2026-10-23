import { jsPDF } from 'jspdf';
import type { ResumeData, ResumeSection, ResumeEntry } from '../types/resume';

export interface PDFExportOptions {
  filename?: string;
  candidateName?: string;
}

export function generateFilename(candidateName?: string): string {
  if (!candidateName || !candidateName.trim()) {
    return 'Resume.pdf';
  }

  const cleanName = candidateName
    .trim()
    .replace(/[^a-zA-Z0-9_\-\s]/g, '')
    .replace(/\s+/g, '_');

  return `${cleanName}_Resume.pdf`;
}

function ensurePageSpace(doc: jsPDF, y: number, required: number, margin: number) {
  const pageHeight = doc.internal.pageSize.getHeight();
  if (y + required > pageHeight - margin) {
    doc.addPage();
    return margin;
  }
  return y;
}

function addWrappedText(
  doc: jsPDF,
  text: string,
  x: number,
  y: number,
  width: number,
  fontSize: number,
  margin: number,
  options?: { bold?: boolean; italic?: boolean; color?: [number, number, number]; lineHeight?: number }
): number {
  doc.setFont('helvetica', options?.bold ? 'bold' : options?.italic ? 'italic' : 'normal');
  doc.setFontSize(fontSize);
  if (options?.color) {
    doc.setTextColor(options.color[0], options.color[1], options.color[2]);
  } else {
    doc.setTextColor(17, 24, 39);
  }

  const lines = doc.splitTextToSize(text, width);
  for (const line of lines) {
    const nextY = ensurePageSpace(doc, y, 12, margin);
    if (nextY !== y) {
      y = nextY;
    }
    doc.text(line, x, y);
    y += (options?.lineHeight ?? 1.2) * fontSize;
  }

  return y;
}

function renderSection(doc: jsPDF, section: ResumeSection, x: number, y: number, width: number, margin: number) {
  let currentY = ensurePageSpace(doc, y, 22, margin);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  const titleLines = doc.splitTextToSize(section.title.toUpperCase(), width);
  for (const titleLine of titleLines) {
    const newY = ensurePageSpace(doc, currentY, 12, margin);
    if (newY !== currentY) currentY = newY;
    doc.text(titleLine, x, currentY);
    currentY += 12;
  }

  const dividerY = currentY + 2;
  const safeLineY = ensurePageSpace(doc, dividerY, 8, margin);
  if (safeLineY !== dividerY) currentY = safeLineY;
  doc.setDrawColor(148, 163, 184);
  doc.setLineWidth(0.6);
  doc.line(x, currentY, x + width, currentY);
  currentY += 12;

  if (section.content) {
    currentY = addWrappedText(doc, section.content, x, currentY, width, 9, margin, { lineHeight: 1.4 });
    currentY += 4;
  }

  if (section.type === 'skills' && section.skillCategories) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    for (const skillCat of section.skillCategories) {
      const label = skillCat.category ? `${skillCat.category}: ` : '';
      const cellText = `${label}${skillCat.skills.join(', ')}`;
      currentY = addWrappedText(doc, cellText, x, currentY, width, 9, margin, { lineHeight: 1.4 });
      currentY += 4;
    }
  }

  if (section.entries) {
    for (const entry of section.entries) {
      currentY = ensurePageSpace(doc, currentY, 20, margin);
      if (entry.title) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9.5);
        const titleX = x;
        const titleText = entry.title;
        const dateText = entry.date ? entry.date : '';
        doc.text(titleText, titleX, currentY);
        if (dateText) {
          doc.text(dateText, x + width, currentY, { align: 'right' });
        }
        currentY += 10;
      }

      if (entry.subtitle || entry.location) {
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(8.4);
        const subtitleText = entry.subtitle || '';
        const locationText = entry.location || '';
        if (subtitleText) {
          doc.text(subtitleText, x, currentY);
        }
        if (locationText) {
          doc.text(locationText, x + width, currentY, { align: 'right' });
        }
        currentY += 9;
      }

      if (entry.description) {
        currentY = addWrappedText(doc, entry.description, x, currentY, width, 8.5, margin, { lineHeight: 1.45 });
        currentY += 4;
      }

      if (entry.bullets && entry.bullets.length > 0) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8.5);
        for (const bullet of entry.bullets) {
          const cleanBullet = bullet.replace(/\s+/g, ' ').trim();
          if (!cleanBullet) continue;
          currentY = ensurePageSpace(doc, currentY, 12, margin);
          const lines = doc.splitTextToSize(`• ${cleanBullet}`, width - 12);
          for (const line of lines) {
            const nextY = ensurePageSpace(doc, currentY, 12, margin);
            if (nextY !== currentY) currentY = nextY;
            doc.text(line, x + 8, currentY);
            currentY += 10;
          }
        }
      }

      currentY += 6;
    }
  }

  return currentY;
}

export function createResumePdfDocument(resume: ResumeData): jsPDF {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
  const margin = 40;
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  const contactLine = [
    resume.contact.email,
    resume.contact.phone,
    resume.contact.location,
    resume.contact.linkedin,
    resume.contact.github,
    resume.contact.website,
  ].filter(Boolean).join('   •   ');

  doc.setFillColor(255, 255, 255);
  doc.rect(0, 0, pageWidth, pageHeight, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  const nameText = (resume.contact.name || 'Candidate Name').trim();
  doc.text(nameText || 'Candidate Name', pageWidth / 2, y, { align: 'center' });
  y += 22;

  if (contactLine) {
    y = ensurePageSpace(doc, y, 18, margin);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(75, 85, 99);
    const contactLines = doc.splitTextToSize(contactLine, contentWidth);
    for (const line of contactLines) {
      const nextY = ensurePageSpace(doc, y, 12, margin);
      if (nextY !== y) y = nextY;
      doc.text(line, pageWidth / 2, y, { align: 'center' });
      y += 10;
    }
  }

  y = ensurePageSpace(doc, y + 4, 10, margin);
  doc.setDrawColor(30, 41, 59);
  doc.setLineWidth(1);
  doc.line(margin, y, pageWidth - margin, y);
  y += 16;

  for (const section of resume.sections) {
    const sectionHeightEstimate = section.entries && section.entries.length > 0
      ? section.entries.length * 26 + (section.content ? 18 : 0) + 30
      : 36;
    y = ensurePageSpace(doc, y, sectionHeightEstimate, margin);
    if (section.title) {
      y = renderSection(doc, section, margin, y, contentWidth, margin);
    }
    y += 8;
  }

  doc.setTextColor(17, 24, 39);
  return doc;
}

export async function exportToPDFBlob(
  resume: ResumeData,
  options?: PDFExportOptions
): Promise<Blob> {
  const doc = createResumePdfDocument(resume);
  const fileName = generateFilename(options?.candidateName ?? resume.contact.name);
  const output = doc.output('blob');
  if (output instanceof Blob && output.size > 0) {
    return output;
  }

  return new Blob([
    doc.output('arraybuffer'),
  ], { type: 'application/pdf' });
}

export function printResume(candidateName?: string): void {
  if (typeof window === 'undefined') {
    return;
  }

  const prevTitle = document.title;
  const docTitle = candidateName ? `${candidateName.replace(/\s+/g, '_')}_Resume` : 'Resume';
  document.title = docTitle;
  window.print();
  setTimeout(() => {
    document.title = prevTitle;
  }, 1000);
}
