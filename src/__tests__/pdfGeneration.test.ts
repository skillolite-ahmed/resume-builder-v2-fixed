import { describe, it, expect } from 'vitest';
import { jsPDF } from 'jspdf';
import fs from 'fs';
import path from 'path';
import { parseResume } from '../parser/universalParser';
import { SAMPLE_RESUMES } from '../test-fixtures/sampleResumes';

describe('PDF Generation and Integrity Verification', () => {
  const outDir = path.resolve('sample_outputs');
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  function generateSamplePdf(sample: (typeof SAMPLE_RESUMES)[0]): string {
    const resumeData = parseResume(sample.text);
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'pt',
      format: 'a4',
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 36;
    const contentWidth = pageWidth - margin * 2;
    let y = 40;

    function checkPageBreak(required = 20) {
      if (y + required > pageHeight - margin) {
        doc.addPage();
        y = 40;
      }
    }

    // Name
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text((resumeData.contact.name || 'Candidate Name').toUpperCase(), pageWidth / 2, y, { align: 'center' });
    y += 16;

    // Contact
    const contacts = [
      resumeData.contact.email,
      resumeData.contact.phone,
      resumeData.contact.location,
      resumeData.contact.linkedin,
      resumeData.contact.github,
      resumeData.contact.website,
    ].filter(Boolean);

    if (contacts.length > 0) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.text(contacts.join('   |   '), pageWidth / 2, y, { align: 'center' });
      y += 8;
    }

    // Divider line
    doc.setDrawColor(30, 41, 59);
    doc.setLineWidth(1);
    doc.line(margin, y, pageWidth - margin, y);
    y += 12;

    // Sections
    for (const section of resumeData.sections) {
      checkPageBreak(30);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text(section.title.toUpperCase(), margin, y);
      y += 3;
      doc.setLineWidth(0.75);
      doc.line(margin, y, pageWidth - margin, y);
      y += 10;

      if (section.content) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8.5);
        const splitText = doc.splitTextToSize(section.content, contentWidth);
        for (const line of splitText) {
          checkPageBreak(11);
          doc.text(line, margin, y);
          y += 10;
        }
        y += 4;
      }

      if (section.type === 'skills' && section.skillCategories) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8.5);
        for (const cat of section.skillCategories) {
          checkPageBreak(12);
          const prefix = cat.category ? `${cat.category}: ` : '';
          const str = `${prefix}${cat.skills.join(', ')}`;
          const lines = doc.splitTextToSize(str, contentWidth);
          for (const l of lines) {
            checkPageBreak(11);
            doc.text(l, margin, y);
            y += 10;
          }
        }
        y += 4;
      }

      if (section.entries) {
        for (const entry of section.entries) {
          checkPageBreak(25);

          doc.setFont('helvetica', 'bold');
          doc.setFontSize(9);
          if (entry.title) doc.text(entry.title, margin, y);
          if (entry.date) doc.text(entry.date, pageWidth - margin, y, { align: 'right' });
          y += 10;

          if (entry.subtitle || entry.location) {
            doc.setFont('helvetica', 'italic');
            doc.setFontSize(8);
            if (entry.subtitle) doc.text(entry.subtitle, margin, y);
            if (entry.location) doc.text(entry.location, pageWidth - margin, y, { align: 'right' });
            y += 10;
          }

          if (entry.description) {
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(8);
            const lines = doc.splitTextToSize(entry.description, contentWidth);
            for (const l of lines) {
              checkPageBreak(10);
              doc.text(l, margin, y);
              y += 9.5;
            }
          }

          if (entry.bullets) {
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(8);
            for (const b of entry.bullets) {
              const cleanB = b.replace(/₹/g, 'INR ');
              const lines = doc.splitTextToSize(cleanB, contentWidth - 10);
              for (let idx = 0; idx < lines.length; idx++) {
                checkPageBreak(10);
                if (idx === 0) doc.text('-', margin + 2, y);
                doc.text(lines[idx], margin + 10, y);
                y += 9.5;
              }
            }
          }

          y += 4;
        }
      }
    }

    const outPath = path.join(outDir, `${sample.id}.pdf`);
    const buffer = Buffer.from(doc.output('arraybuffer'));
    fs.writeFileSync(outPath, buffer);
    return outPath;
  }

  for (const sample of SAMPLE_RESUMES) {
    it(`generates a valid, readable PDF for ${sample.name}`, () => {
      const pdfPath = generateSamplePdf(sample);
      expect(fs.existsSync(pdfPath)).toBe(true);
      const stat = fs.statSync(pdfPath);
      expect(stat.size).toBeGreaterThan(1000); // Valid PDF with content
    });
  }

  it('handles a long multi-page resume cleanly across two pages without stranded headings', () => {
    const longResumeText = `Alexander Hamilton
alexander@treasury.gov | New York, NY

PROFESSIONAL SUMMARY
Senior economic statesman and founding financial architect with extensive experience in sovereign debt management and national fiscal policy.

PROFESSIONAL EXPERIENCE
Secretary of the Treasury 1789 - 1795
Department of the Treasury
• Established the First Bank of the United States.
• Formulated the Report on Public Credit and consolidated state war debts into federal obligations.
• Established the Revenue Marine service to enforce customs duties.

Senior Military Aide-de-Camp 1777 - 1781
Continental Army
• Drafted crucial correspondence, treaties, and intelligence briefs for General Washington.
• Commanded pivotal assault on Redoubt 10 during the Siege of Yorktown.

Member of the Continental Congress 1782 - 1783
Continental Congress
• Advocated for fiscal reform and the creation of an independent federal revenue stream.
• Authored comprehensive resolutions on national defense and confederation commerce.

Senior Founding Partner 1783 - 1789
Hamilton & Associates Law
• Handled landmark constitutional law and maritime disputes in New York City.
• Defended loyalist property rights under the Treaty of Paris in Rutgers v. Waddington.

Co-Author & Organizer 1787 - 1788
The Federalist Papers
• Authored 51 of 85 Federalist essays explaining constitutional checks and balances.
• Secured ratification of the United States Constitution in the New York Ratifying Convention.

Senior Legal Counsel 1795 - 1801
Private Legal Practice
• Provided counsel to major banking corporations and merchant syndicates across New England.
• Advocated for judicial independence in early state appellate court cases.

Major General & Inspector General 1798 - 1800
United States Army
• Organized regular army modernization and tactical officer readiness programs during the Quasi-War.
• Formulated standardized field service regulations and logistic supply structures.

Senior Editorial Director 1801 - 1804
New York Evening Post
• Founded daily newspaper to publish principled political analysis and economic commentary.
• Authored editorials analyzing constitutional disputes and international neutrality treaties.`;

    const sample = {
      id: 'alexander-hamilton-long',
      name: 'Alexander Hamilton (Long Multi-Page)',
      role: 'Founding Statesman',
      category: 'synthetic' as const,
      text: longResumeText,
    };

    const pdfPath = generateSamplePdf(sample);
    expect(fs.existsSync(pdfPath)).toBe(true);
    const stat = fs.statSync(pdfPath);
    expect(stat.size).toBeGreaterThan(2000);
  });
});
