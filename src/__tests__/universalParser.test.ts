import { describe, it, expect } from 'vitest';
import { parseResume, sanitizeRawText, extractContact } from '../parser/universalParser';
import { validateResume } from '../validation/validator';
import { SAMPLE_RESUMES } from '../test-fixtures/sampleResumes';

describe('Sanitization & Text Normalization', () => {
  it('strips null bytes from PDF extractions', () => {
    const rawWithNulls = '\x00r\x00a\x00q\x00i\x00m\x002\x000\x00@\x00g\x00m\x00a\x00i\x00l\x00.\x00c\x00o\x00m';
    const sanitized = sanitizeRawText(rawWithNulls);
    expect(sanitized).toBe('jordan.lee@example.com');
  });

  it('normalizes unicode dashes and smart quotes', () => {
    const raw = '“Senior Lead” – 2022—2024';
    const sanitized = sanitizeRawText(raw);
    expect(sanitized).toBe('"Senior Lead" - 2022-2024');
  });

  it('removes mojibake artifacts like ã and â', () => {
    const raw = 'ã Greater Noidaã¸à¬ââhttps://linkedin.com';
    const sanitized = sanitizeRawText(raw);
    expect(sanitized).not.toContain('ã');
    expect(sanitized).toContain('Greater Noida');
  });
});

describe('Contact Extraction', () => {
  it('extracts candidate name, email, phone, location, and social links', () => {
    const headerLines = [
      'Alex Morgan',
      'warsi.sahil93@gmail.com | 8630875543 | Gurugram, Haryana | linkedin.com/in/mohd-sohail-76078910b',
    ];
    const contact = extractContact(headerLines);
    expect(contact.name).toBe('Alex Morgan');
    expect(contact.email).toBe('alex.morgan@example.com');
    expect(contact.phone).toBe('8630875543');
    expect(contact.location).toBe('Gurugram, Haryana');
    expect(contact.linkedin).toBe('linkedin.com/in/alex-morgan-demo');
  });

  it('deduplicates emails if repeated in header', () => {
    const headerLines = [
      'Taylor Chen',
      'taylor.chen@example.com | Sample City | linkedin.com/in/taylor-chen-demo',
    ];
    const contact = extractContact(headerLines);
    expect(contact.email).toBe('taylor.chen@example.com');
    expect(contact.name).toBe('Taylor Chen');
  });
});

describe('No Fabricated Fields Guarantee', () => {
  it('never outputs "Unknown Company" or "Unknown Title"', () => {
    for (const sample of SAMPLE_RESUMES) {
      const parsed = parseResume(sample.text);
      const validation = validateResume(parsed);
      expect(validation.unknownPlaceholdersCount).toBe(0);
      expect(validation.items.find(i => i.id === 'no-placeholders')?.status).toBe('PASS');
    }
  });
});

describe('Regression Tests: Supplied Reference Resumes', () => {
  it('correctly parses Mohd Sohail (Professional Resume reference)', () => {
    const sample = SAMPLE_RESUMES.find(s => s.id === 'mohd-sohail')!;
    const resume = parseResume(sample.text);
    const validation = validateResume(resume);

    expect(resume.contact.name).toBe('Alex Morgan');
    expect(resume.contact.email).toBe('alex.morgan@example.com');
    expect(resume.contact.phone).toBe('8630875543');
    expect(resume.contact.location).toBe('Gurugram, Haryana');

    const titles = resume.sections.map(s => s.title);
    expect(titles).toContain('PROFESSIONAL SUMMARY');
    expect(titles).toContain('PROFESSIONAL EXPERIENCE');
    expect(titles).toContain('SKILLS');
    expect(titles).toContain('EDUCATION & CERTIFICATIONS');
    expect(titles).toContain('PROJECTS');
    expect(titles).toContain('KEY ACHIEVEMENTS');

    expect(validation.overallStatus).toBe('PASS');
    expect(validation.wordPreservationRate).toBeGreaterThanOrEqual(90);
  });

  it('correctly parses Raqim Fraz (BTech graduate)', () => {
    const sample = SAMPLE_RESUMES.find(s => s.id === 'raqim-fraz')!;
    const resume = parseResume(sample.text);
    const validation = validateResume(resume);

    expect(resume.contact.name).toBe('JORDAN LEE');
    expect(resume.contact.email).toBe('jordan.lee@example.com');
    expect(resume.contact.phone).toBe('6299039814');

    const titles = resume.sections.map(s => s.title);
    expect(titles).toContain('PROFESSIONAL SUMMARY');
    expect(titles.some(t => t.includes('EXPERIENCE'))).toBe(true);
    expect(titles).toContain('PROJECTS');
    expect(titles).toContain('CERTIFICATIONS');

    // Experience entry has company and date
    const expSection = resume.sections.find(s => s.type === 'experience')!;
    expect(expSection.entries?.length).toBeGreaterThan(0);
    expect(expSection.entries?.[0].title).toBe('Web Developer Intern');
    expect(expSection.entries?.[0].date).toBe('April 2023 - May 2023');

    expect(validation.overallStatus).toBe('PASS');
  });

  it('correctly parses Nitika Yadav (Sales Executive)', () => {
    const sample = SAMPLE_RESUMES.find(s => s.id === 'nitika-yadav')!;
    const resume = parseResume(sample.text);
    const validation = validateResume(resume);

    expect(resume.contact.name).toBe('Taylor Chen');
    expect(resume.contact.email).toBe('taylor.chen@example.com');
    expect(resume.contact.location).toContain('New Delhi');

    const titles = resume.sections.map(s => s.title);
    expect(titles).toContain('PROFESSIONAL SUMMARY');
    expect(titles.some(t => t.includes('EXPERIENCE'))).toBe(true);
    expect(titles).toContain('EDUCATION');
    expect(titles).toContain('SKILLS');

    expect(validation.overallStatus).toBe('PASS');
  });

  it('correctly parses Biswa Lakshmi Rajkumari (Economics)', () => {
    const sample = SAMPLE_RESUMES.find(s => s.id === 'biswa-lakshmi')!;
    const resume = parseResume(sample.text);
    const validation = validateResume(resume);

    expect(resume.contact.name).toBe('SAM RIVERA');
    expect(resume.contact.email).toBe('sam.rivera@example.com');

    const titles = resume.sections.map(s => s.title);
    expect(titles).toContain('PROFESSIONAL SUMMARY');
    expect(titles.some(t => t.includes('EXPERIENCE'))).toBe(true);
    expect(titles).toContain('EDUCATION');
    expect(titles).toContain('KEY ACHIEVEMENTS');
    expect(titles).toContain('PROJECTS');
    expect(titles).toContain('SKILLS');

    expect(validation.overallStatus).toBe('PASS');
    expect(validation.unknownPlaceholdersCount).toBe(0);
  });
});

describe('Synthetic Test Cases & Edge Cases', () => {
  it('handles fresher with no employment history', () => {
    const sample = SAMPLE_RESUMES.find(s => s.id === 'fresher-developer')!;
    const resume = parseResume(sample.text);
    const validation = validateResume(resume);

    expect(resume.contact.name).toBe('Aarav Sharma');
    const titles = resume.sections.map(s => s.title);
    expect(titles).toContain('EDUCATION');
    expect(titles).toContain('PROJECTS');
    expect(titles).toContain('SKILLS');
    expect(titles).toContain('CERTIFICATIONS');
    expect(titles).not.toContain('PROFESSIONAL EXPERIENCE');

    expect(validation.overallStatus).toBe('PASS');
  });

  it('handles unconventional sections (Publications, Volunteer, Patents) without dropping them', () => {
    const sample = SAMPLE_RESUMES.find(s => s.id === 'custom-sections')!;
    const resume = parseResume(sample.text);
    const validation = validateResume(resume);

    expect(resume.contact.name).toBe('Elena Rostova');
    const titles = resume.sections.map(s => s.title);
    expect(titles).toContain('PUBLICATIONS');
    expect(titles).toContain('VOLUNTEER EXPERIENCE');
    expect(titles).toContain('PATENTS & RESEARCH');
    expect(titles).toContain('LANGUAGES');

    expect(validation.overallStatus).toBe('PASS');
  });

  it('handles candidate with no dates in optional sections', () => {
    const raw = `Alex Morgan
alex@example.com | San Francisco, CA

SUMMARY
Full-stack software engineer specializing in developer tooling.

SKILLS
TypeScript, React, Node.js, GraphQL, Docker

HONORS & AWARDS
Hackathon First Prize Winner
Dean's Honor List`;

    const resume = parseResume(raw);
    const validation = validateResume(resume);
    expect(resume.contact.name).toBe('Alex Morgan');
    expect(validation.overallStatus).toBe('PASS');
  });

  it('handles dates on separate lines without cross-contamination', () => {
    const raw = `Jordan Lee
jordan@example.com | Chicago, IL

EXPERIENCE
Frontend Architect
Acme Corp
Jan 2021 - Dec 2023
Chicago, IL
• Led architecture migration to Next.js.

EDUCATION
BS in Computer Science
University of Illinois
2016 - 2020`;

    const resume = parseResume(raw);
    const expSec = resume.sections.find(s => s.type === 'experience')!;
    const eduSec = resume.sections.find(s => s.type === 'education')!;

    expect(expSec.entries?.[0].title).toBe('Frontend Architect');
    expect(expSec.entries?.[0].subtitle).toBe('Acme Corp');
    expect(expSec.entries?.[0].date).toBe('Jan 2021 - Dec 2023');

    expect(eduSec.entries?.[0].title).toBe('BS in Computer Science');
    expect(eduSec.entries?.[0].subtitle).toBe('University of Illinois');
    expect(eduSec.entries?.[0].date).toBe('2016 - 2020');
  });

  it('does not leak state between sequential parsing of different resumes', () => {
    const resume1 = parseResume(SAMPLE_RESUMES[0].text);
    const resume2 = parseResume(SAMPLE_RESUMES[1].text);

    expect(resume1.contact.name).toBe('Alex Morgan');
    expect(resume2.contact.name).toBe('JORDAN LEE');
    expect(resume2.contact.email).toBe('jordan.lee@example.com');
    expect(resume2.contact.email).not.toBe(resume1.contact.email);
  });
});
