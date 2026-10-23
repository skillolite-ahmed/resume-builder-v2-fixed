import { describe, it, expect } from 'vitest';
import { exportToPDFBlob, generateFilename } from '../utils/pdfExport';
import type { ResumeData } from '../types/resume';

describe('pdf export', () => {
  it('creates a valid PDF blob with content for a multi-page resume', async () => {
    const resume: ResumeData = {
      contact: {
        name: 'Alex Morgan',
        email: 'alex@example.com',
        phone: '+1 415 555 0101',
        location: 'San Francisco, CA',
      },
      rawText: 'Alex Morgan',
      templateId: 'professional-classic',
      sections: [
        {
          id: 'summary',
          title: 'PROFESSIONAL SUMMARY',
          type: 'summary',
          content: 'Experienced product engineer with a strong record in distributed systems and developer tooling.',
        },
        {
          id: 'experience',
          title: 'PROFESSIONAL EXPERIENCE',
          type: 'experience',
          entries: [
            {
              id: 'job-1',
              title: 'Senior Staff Engineer',
              subtitle: 'Northwind Systems',
              date: '2021 - Present',
              location: 'San Francisco, CA',
              bullets: [
                'Drove architecture improvements for a high-throughput internal platform used by dozens of teams.',
                'Reduced page load latency by 42% through targeted performance work across the client and service layers.',
              ],
            },
          ],
        },
      ],
    };

    const blob = await exportToPDFBlob(resume, { candidateName: resume.contact.name });
    expect(blob.type).toBe('application/pdf');
    expect(blob.size).toBeGreaterThan(1000);
  });

  it('generates a sanitized filename from a candidate name', () => {
    expect(generateFilename('Mohd Sohail')).toBe('Mohd_Sohail_Resume.pdf');
    expect(generateFilename('')).toBe('Resume.pdf');
  });
});
