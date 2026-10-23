import { describe, it, expect } from 'vitest';
import { parseResume } from '../parser/universalParser';
import { validateResume } from '../validation/validator';
import { SAMPLE_RESUMES } from '../test-fixtures/sampleResumes';

describe('Chronology Analysis & Date Verification Tests', () => {
  it('detects concurrent employment periods non-destructively for Mohd Sohail', () => {
    const sohail = SAMPLE_RESUMES.find(s => s.id === 'mohd-sohail')!;
    const resume = parseResume(sohail.text);
    const val = validateResume(resume);

    const chronoItem = val.items.find(i => i.id === 'chronology-overlap');
    expect(chronoItem).toBeDefined();
    expect(chronoItem?.status).toBe('PASS');
    expect(chronoItem?.message).toContain('concurrent employment period');
    expect(chronoItem?.message).toContain('Business Operations Owner');
    expect(chronoItem?.message).toContain('Assistant Manager');
    expect(chronoItem?.details).toContain('Project date ranges are strictly excluded');
  });

  it('excludes project date ranges from employment chronology', () => {
    const raw = `Alex Rivers
alex@test.com | Remote

EXPERIENCE
Senior Software Engineer Jan 2021 - Present
Cloud Tech Inc
• Developing distributed cloud services.

PROJECTS
Open Source Database Engine 2022 - 2024
• High throughput storage engine.
Personal AI Assistant 2023 - Present
• Autonomous agent system.`;

    const resume = parseResume(raw);
    const val = validateResume(resume);

    const chronoItem = val.items.find(i => i.id === 'chronology-overlap');
    expect(chronoItem?.message).toContain('Linear employment chronology detected with no overlaps');
  });

  it('verifies that MBA has no date in source resume and does not invent one', () => {
    const sohail = SAMPLE_RESUMES.find(s => s.id === 'mohd-sohail')!;
    const resume = parseResume(sohail.text);
    const val = validateResume(resume);

    // Education section entries
    const eduSec = resume.sections.find(s => s.type === 'education')!;
    expect(eduSec.entries?.length).toBe(2);

    const mbaEntry = eduSec.entries?.find(e => /MBA/i.test(e.title || ''));
    expect(mbaEntry).toBeDefined();
    expect(mbaEntry?.title).toBe('Master of Business Administration (MBA)');
    expect(mbaEntry?.subtitle).toBe('Graphic Era Hill University');
    expect(mbaEntry?.date).toBeUndefined(); // NEVER invent a date!

    // The certification entry has 2017
    const certEntry = eduSec.entries?.find(e => /Data Analytics/i.test(e.title || ''));
    expect(certEntry).toBeDefined();
    expect(certEntry?.date).toBe('2017');

    // Validation item check
    const mbaItem = val.items.find(i => i.id === 'mba-source-verification');
    expect(mbaItem).toBeDefined();
    expect(mbaItem?.status).toBe('PASS');
    expect(mbaItem?.message).toContain('MBA Date: Verified as unspecified in source resume');
  });

  it('reports date comparison as unverified if original source text is unavailable', () => {
    const resumeWithoutRaw = {
      contact: { name: 'Test Candidate' },
      sections: [
        {
          id: 'sec-1',
          title: 'EDUCATION',
          type: 'education' as const,
          entries: [{ id: 'e1', title: 'Master of Business Administration (MBA)' }],
        },
      ],
      rawText: '', // unavailable
      templateId: 'professional-classic' as const,
    };

    const val = validateResume(resumeWithoutRaw);
    const mbaItem = val.items.find(i => i.id === 'mba-source-verification');
    expect(mbaItem?.status).toBe('NOT TESTED');
    expect(mbaItem?.message).toContain('Original source resume unavailable; comparison unverified');
  });

  it('preserves multiple projects as distinct entries with titles and descriptions', () => {
    const sohail = SAMPLE_RESUMES.find(s => s.id === 'mohd-sohail')!;
    const resume = parseResume(sohail.text);
    const projSec = resume.sections.find(s => s.type === 'projects')!;

    expect(projSec.entries?.length).toBe(2);
    expect(projSec.entries?.[0].title).toBe('ERP Sales Performance Dashboard');
    expect(projSec.entries?.[0].description).toContain('Built automated Power BI dashboards');
    expect(projSec.entries?.[1].title).toBe('Airbnb Data & Market Analysis');
    expect(projSec.entries?.[1].description).toContain('Conducted Exploratory Data Analysis');
  });

  it('preserves key achievements as clean bullet points', () => {
    const sohail = SAMPLE_RESUMES.find(s => s.id === 'mohd-sohail')!;
    const resume = parseResume(sohail.text);
    const achSec = resume.sections.find(s => s.type === 'awards')!;

    expect(achSec.entries?.length).toBe(1);
    expect(achSec.entries?.[0].bullets?.length).toBe(5);
    expect(achSec.entries?.[0].bullets?.[0]).toContain('₹250 Cr');
  });
});
