import { jsPDF } from 'jspdf';
import fs from 'fs';
import path from 'path';
import { parseResume } from '../src/parser/universalParser.js';
import { SAMPLE_RESUMES } from '../src/test-fixtures/sampleResumes.js';

const outDir = path.resolve('sample_outputs');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

function renderResumeToPdf(resumeData, outputPath) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 40;
  const contentWidth = pageWidth - margin * 2;
  let y = 45;

  function checkPageBreak(requiredSpace = 25) {
    if (y + requiredSpace > pageHeight - margin) {
      doc.addPage();
      y = 45;
    }
  }

  // Header: Name
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text((resumeData.contact.name || 'Candidate Name').toUpperCase(), pageWidth / 2, y, { align: 'center' });
  y += 18;

  // Contact line
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
    doc.setFontSize(8.5);
    doc.text(contacts.join('   |   '), pageWidth / 2, y, { align: 'center' });
    y += 10;
  }

  // Horizontal line under header
  doc.setDrawColor(30, 41, 59);
  doc.setLineWidth(1);
  doc.line(margin, y, pageWidth - margin, y);
  y += 14;

  // Sections
  for (const section of resumeData.sections) {
    checkPageBreak(35);

    // Section Title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.text(section.title.toUpperCase(), margin, y);
    y += 4;
    doc.setLineWidth(0.75);
    doc.line(margin, y, pageWidth - margin, y);
    y += 12;

    // Summary content
    if (section.content) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      const splitText = doc.splitTextToSize(section.content, contentWidth);
      for (const line of splitText) {
        checkPageBreak(12);
        doc.text(line, margin, y);
        y += 11;
      }
      y += 6;
    }

    // Skills
    if (section.type === 'skills' && section.skillCategories) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      for (const cat of section.skillCategories) {
        checkPageBreak(14);
        const prefix = cat.category ? `${cat.category}: ` : '';
        const fullSkillStr = `${prefix}${cat.skills.join(', ')}`;
        const splitText = doc.splitTextToSize(fullSkillStr, contentWidth);
        for (const line of splitText) {
          checkPageBreak(12);
          doc.text(line, margin, y);
          y += 11;
        }
      }
      y += 6;
    }

    // Entries
    if (section.entries) {
      for (const entry of section.entries) {
        checkPageBreak(28);

        // Title on left, Date on right
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        if (entry.title) {
          doc.text(entry.title, margin, y);
        }
        if (entry.date) {
          doc.text(entry.date, pageWidth - margin, y, { align: 'right' });
        }
        y += 11;

        // Subtitle (Company/School) & Location
        if (entry.subtitle || entry.location) {
          doc.setFont('helvetica', 'italic');
          doc.setFontSize(8.5);
          if (entry.subtitle) {
            doc.text(entry.subtitle, margin, y);
          }
          if (entry.location) {
            doc.setFont('helvetica', 'normal');
            doc.text(entry.location, pageWidth - margin, y, { align: 'right' });
          }
          y += 11;
        }

        // Description
        if (entry.description) {
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(8.5);
          const splitDesc = doc.splitTextToSize(entry.description, contentWidth);
          for (const line of splitDesc) {
            checkPageBreak(11);
            doc.text(line, margin, y);
            y += 10;
          }
        }

        // Bullets
        if (entry.bullets) {
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(8.5);
          for (const bullet of entry.bullets) {
            const splitBullet = doc.splitTextToSize(bullet, contentWidth - 12);
            for (let bIdx = 0; bIdx < splitBullet.length; bIdx++) {
              checkPageBreak(11);
              if (bIdx === 0) {
                doc.text('•', margin + 2, y);
              }
              doc.text(splitBullet[bIdx], margin + 12, y);
              y += 11;
            }
          }
        }

        y += 5; // Spacing after entry
      }
    }
  }

  const pdfBytes = doc.output('arraybuffer');
  fs.writeFileSync(outputPath, Buffer.from(pdfBytes));
}

// Generate for all samples
for (const sample of SAMPLE_RESUMES) {
  const resume = parseResume(sample.text);
  const outPath = path.join(outDir, `${sample.id}.pdf`);
  renderResumeToPdf(resume, outPath);
  console.log(`Generated ${sample.id}.pdf`);
}
