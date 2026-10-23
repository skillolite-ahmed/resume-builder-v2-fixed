import type { ContactInfo, ResumeData, ResumeEntry, ResumeSection, SectionType, SkillCategory } from '../types/resume';

// Known section heading patterns mapped to SectionType
const SECTION_MAPPINGS: { pattern: RegExp; type: SectionType }[] = [
  {
    pattern: /^(?:(?:professional\s+)?summary|profile|about(?:\s+me)?|objective|executive\s+summary)$/i,
    type: 'summary',
  },
  {
    pattern: /^(?:(?:professional\s+|work\s+|employment\s+)?experience|work\s+history|employment\s+history|career\s+history)$/i,
    type: 'experience',
  },
  {
    pattern: /^education\s*(?:&|and)\s*certifications$/i,
    type: 'education',
  },
  {
    pattern: /^(?:education|academic\s+background|academic\s+history|qualifications)$/i,
    type: 'education',
  },
  {
    pattern: /^(?:(?:technical\s+|core\s+|key\s+)?skills(?:\s*&(?:amp;)?\s*abilities)?|technologies|tools\s*&(?:amp;)?\s*technologies|core\s+competencies)$/i,
    type: 'skills',
  },
  {
    pattern: /^(?:(?:key\s+|academic\s+|personal\s+|technical\s+)?projects)$/i,
    type: 'projects',
  },
  {
    pattern: /^(?:certifications(?:\s*&(?:amp;)?\s*training)?|licenses|credentials|training)$/i,
    type: 'certifications',
  },
  {
    pattern: /^(?:(?:key\s+)?achievements|awards|honours|honors|scholarships)$/i,
    type: 'awards',
  },
  {
    pattern: /^(?:publications|research|patents|patents\s*&(?:amp;)?\s*research)$/i,
    type: 'publications',
  },
  {
    pattern: /^(?:volunteer\s+experience|volunteering|leadership)$/i,
    type: 'custom',
  },
  {
    pattern: /^(?:languages(?:\s+known)?|language\s+proficiency)$/i,
    type: 'languages',
  },
];

// Date detection regex matching common formats
const DATE_RANGE_REGEX = /(?:(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)[,\s.]+(?:\d{4}|\d{2})|\b(?:19|20)\d{2}\b)\s*(?:–|-|—|to|\/)\s*(?:Present|Current|Ongoing|(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)[,\s.]+(?:\d{4}|\d{2})|\b(?:19|20)\d{2}\b)/i;
const SINGLE_DATE_REGEX = /(?:(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)[,\s.]+(?:19|20)\d{2}|\b(?:19|20)\d{2}\b)/i;

/**
 * Clean up raw text (null bytes, invalid chars, unicode dash normalization)
 */
export function sanitizeRawText(text: string): string {
  if (!text) return '';
  return text
    // Remove null bytes and strange surrogate control chars often extracted from PDFs
    .replace(/\x00/g, '')
    // Normalize dashes and minus signs
    .replace(/[\u2010\u2011\u2012\u2013\u2014\u2015\u2212]/g, '-')
    // Normalize quotes
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    // Remove weird mojibake artifacts like 'ã ' or ''
    .replace(/[ãâà¸¬]+/g, ' ')
    .replace(/\uFFFD/g, ' ')
    // Normalize line endings
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n');
}

/**
 * Deduplicate items while maintaining order
 */
function unique<T>(arr: T[]): T[] {
  return Array.from(new Set(arr));
}

/**
 * Extract contact information from candidate header lines
 */
export function extractContact(headerLines: string[]): ContactInfo {
  const fullText = headerLines.join(' ');
  const contact: ContactInfo = {
    name: '',
  };

  // 1. Candidate Name (the first non-empty line that isn't purely an email/url)
  for (const line of headerLines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    // Check if line is purely contact info
    if (trimmed.includes('@') || /^\+?[\d\s-().]{8,}$/.test(trimmed) || /linkedin\.com|github\.com/i.test(trimmed)) {
      continue;
    }
    // Remove any trailing title or summary tokens
    const cleaned = trimmed.replace(/\s*\|\s*.*$/, '').replace(/Summary$/i, '').trim();
    if (cleaned.length >= 2 && cleaned.length <= 60 && !contact.name) {
      contact.name = cleaned;
      break;
    }
  }

  // Fallback if not found
  if (!contact.name && headerLines.length > 0) {
    contact.name = headerLines[0].trim();
  }

  // 2. Email extraction & deduplication
  const emailMatches = fullText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/gi);
  if (emailMatches && emailMatches.length > 0) {
    contact.email = unique(emailMatches.map(e => e.toLowerCase()))[0];
  }

  // 3. Phone extraction
  // Matches international +91..., (xxx) xxx-xxxx, 10-digit numbers
  const phoneMatches = fullText.match(/(?:\+?\d{1,3}[\s-]?)?\(?\d{2,4}\)?[\s.-]?\d{3,5}[\s.-]?\d{3,5}/g);
  if (phoneMatches) {
    for (const p of phoneMatches) {
      const digitsOnly = p.replace(/\D/g, '');
      // Ensure it is 10-15 digits and not a year or zip code
      if (digitsOnly.length >= 10 && digitsOnly.length <= 14 && !digitsOnly.startsWith('19') && !digitsOnly.startsWith('20')) {
        contact.phone = p.trim();
        break;
      }
    }
  }

  // 4. LinkedIn
  const linkedinMatch = fullText.match(/(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/([a-zA-Z0-9_-]+)/i);
  if (linkedinMatch) {
    contact.linkedin = `linkedin.com/in/${linkedinMatch[1]}`;
  }

  // 5. GitHub
  const githubMatch = fullText.match(/(?:https?:\/\/)?(?:www\.)?github\.com(?:\/([a-zA-Z0-9_-]+))?/i);
  if (githubMatch) {
    contact.github = githubMatch[1] ? `github.com/${githubMatch[1]}` : 'github.com';
  }

  // 6. Portfolio / Personal Website
  const urlMatches = fullText.match(/https?:\/\/[^\s|)]+/gi);
  if (urlMatches) {
    for (const url of urlMatches) {
      if (!url.includes('linkedin.com') && !url.includes('github.com')) {
        contact.website = url;
        break;
      }
    }
  }

  // 7. Location extraction
  for (const line of headerLines) {
    const parts = line.split('|').map(p => p.trim());
    for (const part of parts) {
      // Don't mistake emails, urls, phones, or name for location
      if (part.includes('@') || /linkedin|github|http/i.test(part) || /\d{8,}/.test(part) || part === contact.name) {
        continue;
      }
      if (
        /Gurugram|Noida|Delhi|Bangalore|Bengaluru|Mumbai|Hyderabad|Pune|Chennai|Kolkata|Gauhati|Cambridge|Remote|India|USA|UK|Canada|California|New York|London/i.test(part) ||
        /^[a-zA-Z\s]+,\s*[a-zA-Z\s]+$/.test(part)
      ) {
        contact.location = part.replace(/^[ã\s,•·]+|[ã\s,•·]+$/g, '').trim();
        break;
      }
    }
    if (contact.location) break;
  }

  return contact;
}

/**
 * Match a line to see if it starts or is a section heading
 */
interface SectionHeadingMatch {
  title: string;
  type: SectionType;
  remainder?: string;
}

function matchSectionHeading(line: string, isFirstNonEmptyLine: boolean): SectionHeadingMatch | null {
  const trimmed = line.trim().replace(/^#+\s*/, '').replace(/:$/, '').trim();
  if (!trimmed) return null;

  // Exact match against known headings
  for (const mapping of SECTION_MAPPINGS) {
    if (mapping.pattern.test(trimmed)) {
      return {
        title: trimmed.toUpperCase(),
        type: mapping.type,
      };
    }
  }

  // Check if line starts with a known section keyword followed by an entry on same line
  // e.g., "EXPERIENCE OASIS INFOBYTE" or "Projects Blood Bank Management System"
  const firstWordMatch = trimmed.match(/^(EXPERIENCE|PROJECTS|CERTIFICATIONS|EDUCATION|SKILLS|PUBLICATIONS|AWARDS)\s+(.+)$/i);
  if (firstWordMatch) {
    const headingWord = firstWordMatch[1];
    const remainder = firstWordMatch[2];
    for (const mapping of SECTION_MAPPINGS) {
      if (mapping.pattern.test(headingWord)) {
        return {
          title: headingWord.toUpperCase(),
          type: mapping.type,
          remainder,
        };
      }
    }
  }

  // If this is the very first non-empty line of the document, it's the candidate's name!
  // It is never a custom section heading unless explicitly matched above as a known section.
  if (isFirstNonEmptyLine) {
    return null;
  }

  // Check for custom/unknown uppercase or Markdown headings
  const isMarkdownHeader = /^#{1,4}\s+[A-Za-z0-9\s&/-]{2,40}$/.test(line.trim());
  const words = trimmed.split(/\s+/);
  const isAllUpperHeader =
    /^[A-Z\s&/'-]{3,35}$/.test(trimmed) &&
    words.length >= 2 &&
    words.length <= 5;

  if (isMarkdownHeader || isAllUpperHeader) {
    // Avoid mistaking numbers or years as headers
    if (!/\d/.test(trimmed)) {
      return {
        title: trimmed.toUpperCase(),
        type: 'custom',
      };
    }
  }

  return null;
}

/**
 * Parse entries in structured sections (Experience, Education, Projects, Certifications, Custom)
 */
function parseEntries(lines: string[]): ResumeEntry[] {
  const entries: ResumeEntry[] = [];
  let currentEntry: ResumeEntry | null = null;

  function commitEntry() {
    if (currentEntry) {
      if (currentEntry.title || currentEntry.subtitle || (currentEntry.bullets && currentEntry.bullets.length > 0) || currentEntry.description) {
        entries.push(currentEntry);
      }
      currentEntry = null;
    }
  }

  let i = 0;
  while (i < lines.length) {
    const line = lines[i].trim();
    if (!line) {
      i++;
      continue;
    }

    // Is it a bullet point?
    const bulletMatch = line.match(/^[-*•·▪◆]\s*(.+)$/);
    if (bulletMatch) {
      const bulletText = bulletMatch[1].trim();
      if (!currentEntry) {
        currentEntry = { id: `entry-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`, bullets: [] };
      }
      if (!currentEntry.bullets) currentEntry.bullets = [];
      currentEntry.bullets.push(bulletText);
      i++;
      continue;
    }

    // Check if line contains a date range or standalone date
    const dateRangeMatch = line.match(DATE_RANGE_REGEX);
    const singleDateMatch = line.match(SINGLE_DATE_REGEX);
    const dateFound = dateRangeMatch ? dateRangeMatch[0] : (singleDateMatch ? singleDateMatch[0] : null);

    // Check if line has pipe delimiters: e.g. "Web Developer Intern | Oasis InfoByte | April 2023 - May 2023"
    if (line.includes('|')) {
      const parts = line.split('|').map(p => p.trim()).filter(Boolean);
      commitEntry();
      currentEntry = {
        id: `entry-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        bullets: [],
      };

      for (const part of parts) {
        if (DATE_RANGE_REGEX.test(part) || SINGLE_DATE_REGEX.test(part)) {
          currentEntry.date = part;
        } else if (!currentEntry.title) {
          currentEntry.title = part;
        } else if (!currentEntry.subtitle) {
          currentEntry.subtitle = part;
        } else if (!currentEntry.location && /Remote|India|USA|UK|[A-Z][a-z]+,\s*[A-Z][a-z]+/i.test(part)) {
          currentEntry.location = part;
        } else {
          currentEntry.description = (currentEntry.description ? currentEntry.description + ' | ' : '') + part;
        }
      }
      i++;
      continue;
    }

    // Check if line is formatted as "Title: Description" (common in projects)
    const colonMatch = line.match(/^([^:]{5,60}):\s+(.+)$/);
    if (colonMatch && !line.startsWith('http') && !line.startsWith('mailto')) {
      commitEntry();
      currentEntry = {
        id: `entry-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        title: colonMatch[1].trim(),
        description: colonMatch[2].trim(),
        bullets: [],
      };
      i++;
      continue;
    }

    // Check if line contains a Degree and Institution on same line without a date (e.g. "Master of Business Administration (MBA) Graphic Era Hill University")
    const instMatch = line.match(/^(.+?)\s+([A-Z][a-zA-Z\s&.-]*(?:University|College|Institute|School|Academy).*)$/i);
    if (instMatch && !dateFound) {
      commitEntry();
      currentEntry = {
        id: `entry-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        title: instMatch[1].trim(),
        subtitle: instMatch[2].trim(),
        bullets: [],
      };
      i++;
      continue;
    }

    // If the line has a date
    if (dateFound) {
      const remainder = line.replace(dateFound, '').trim();

      // Check if remainder is a distinct qualification / job title / project rather than just a location or subtitle
      const isDistinctNewTitle =
        remainder.length > 20 ||
        /(?:Certification|Certificate|Bachelor|Master|Degree|Engineer|Developer|Analyst|Consultant|Executive|Manager|Specialist)/i.test(remainder);

      // If we already have an active entry without a date, associate this date with the active entry ONLY if line is date-only or date+location!
      if (currentEntry && !currentEntry.date && (!currentEntry.bullets || currentEntry.bullets.length === 0) && !isDistinctNewTitle) {
        currentEntry.date = dateFound;
        if (remainder) {
          if (/Remote|Urban|Karnataka|Delhi|India|USA|UK|Full-time|Part-time|Intern/i.test(remainder)) {
            currentEntry.location = remainder;
          } else if (!currentEntry.subtitle) {
            currentEntry.subtitle = remainder;
          } else {
            currentEntry.description = (currentEntry.description ? currentEntry.description + ' ' : '') + remainder;
          }
        }
        i++;
        continue;
      }

      // Otherwise, commit previous entry and start a new entry with this date
      commitEntry();
      currentEntry = {
        id: `entry-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        date: dateFound,
        title: remainder || undefined,
        bullets: [],
      };

      // Check next line for subtitle / company
      if (i + 1 < lines.length) {
        const nextLine = lines[i + 1].trim();
        if (nextLine && !nextLine.match(/^[-*•·▪◆]/) && !matchSectionHeading(nextLine, false) && !DATE_RANGE_REGEX.test(nextLine)) {
          if (!currentEntry.title) {
            currentEntry.title = nextLine;
          } else {
            currentEntry.subtitle = nextLine;
          }
          i++; // consumed nextLine
        }
      }
      i++;
      continue;
    }

    // New potential title line (if no entry active, or current entry already has bullets)
    if (!currentEntry || (currentEntry.bullets && currentEntry.bullets.length > 0)) {
      commitEntry();
      currentEntry = {
        id: `entry-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        title: line,
        bullets: [],
      };
      i++;
      continue;
    }

    // If currentEntry has a title but no subtitle and no bullets, this line might be the company/location
    if (currentEntry && !currentEntry.subtitle && (!currentEntry.bullets || currentEntry.bullets.length === 0)) {
      if (/Remote|Urban|Karnataka|Delhi|India|USA|UK|Full-time|Part-time|Intern/i.test(line)) {
        currentEntry.location = line;
      } else {
        currentEntry.subtitle = line;
      }
      i++;
      continue;
    }

    // If currentEntry has title and subtitle, but no location yet, check if this line is location
    if (currentEntry && currentEntry.subtitle && !currentEntry.location && (!currentEntry.bullets || currentEntry.bullets.length === 0)) {
      if (/Hong Kong|Remote|Urban|Karnataka|Delhi|India|USA|UK|Canada|California|New York|London/i.test(line) || /^[A-Z][a-zA-Z\s]+,\s*[A-Z][a-zA-Z\s]+$/.test(line) || line.split(/\s+/).length <= 3) {
        currentEntry.location = line;
        i++;
        continue;
      }
    }

    // Otherwise, treat as descriptive text or continuation bullet
    if (currentEntry) {
      if (currentEntry.bullets && currentEntry.bullets.length > 0) {
        const lastIdx = currentEntry.bullets.length - 1;
        currentEntry.bullets[lastIdx] += ' ' + line;
      } else {
        currentEntry.description = currentEntry.description ? currentEntry.description + ' ' + line : line;
      }
    }

    i++;
  }

  commitEntry();
  return entries;
}

/**
 * Parse Skills section into categories and skill tokens
 */
function parseSkills(lines: string[]): SkillCategory[] {
  const categories: SkillCategory[] = [];

  for (const rawLine of lines) {
    const line = rawLine.trim().replace(/^[-*•·▪◆]\s*/, '');
    if (!line) continue;

    const colonIdx = line.indexOf(':');
    if (colonIdx > 0 && colonIdx < 45) {
      const catName = line.substring(0, colonIdx).trim();
      const skillsText = line.substring(colonIdx + 1).trim();
      const skills = skillsText.split(/[,•·|/]/).map(s => s.trim()).filter(Boolean);
      categories.push({
        category: catName,
        skills: skills.length > 0 ? skills : [skillsText],
      });
    } else {
      const skills = line.split(/[,•·|]/).map(s => s.trim()).filter(Boolean);
      if (skills.length > 0) {
        categories.push({
          skills,
        });
      }
    }
  }

  return categories;
}

/**
 * Universal Resume Parser
 */
export function parseResume(rawInput: string): ResumeData {
  const sanitized = sanitizeRawText(rawInput);
  const rawLines = sanitized.split('\n');

  // Find first non-empty line index
  let firstNonEmptyIdx = -1;
  for (let i = 0; i < rawLines.length; i++) {
    if (rawLines[i].trim().length > 0) {
      firstNonEmptyIdx = i;
      break;
    }
  }

  // Find section header indices
  interface SectionHeaderLoc {
    index: number;
    match: SectionHeadingMatch;
  }

  const headerLocs: SectionHeaderLoc[] = [];
  for (let i = 0; i < rawLines.length; i++) {
    const line = rawLines[i].trim();
    if (!line) continue;
    const isFirstNonEmpty = (i === firstNonEmptyIdx);
    const match = matchSectionHeading(line, isFirstNonEmpty);
    if (match) {
      headerLocs.push({ index: i, match });
    }
  }

  // Header lines are everything before the first recognized section
  const firstHeaderIdx = headerLocs.length > 0 ? headerLocs[0].index : rawLines.length;
  const headerLines = rawLines.slice(0, firstHeaderIdx).filter(l => l.trim().length > 0);
  const contact = extractContact(headerLines);

  const sections: ResumeSection[] = [];

  // Parse each section according to boundaries
  for (let h = 0; h < headerLocs.length; h++) {
    const currentLoc = headerLocs[h];
    const nextIndex = h + 1 < headerLocs.length ? headerLocs[h + 1].index : rawLines.length;

    let sectionLines = rawLines.slice(currentLoc.index + 1, nextIndex);
    // If the header had remainder on the same line (e.g. "EXPERIENCE OASIS INFOBYTE"), prepend remainder
    if (currentLoc.match.remainder) {
      sectionLines = [currentLoc.match.remainder, ...sectionLines];
    }

    const sectionType = currentLoc.match.type;
    const sectionTitle = currentLoc.match.title;
    const rawSectionText = sectionLines.join('\n').trim();

    const sec: ResumeSection = {
      id: `sec-${h}-${Date.now()}`,
      title: sectionTitle,
      type: sectionType,
      rawText: rawSectionText,
    };

    if (sectionType === 'summary') {
      sec.content = sectionLines.map(l => l.trim()).filter(Boolean).join(' ');
    } else if (sectionType === 'skills') {
      sec.skillCategories = parseSkills(sectionLines);
    } else if (sectionType === 'awards') {
      const hasDates = sectionLines.some(l => DATE_RANGE_REGEX.test(l) || SINGLE_DATE_REGEX.test(l));
      if (!hasDates) {
        const plainLines = sectionLines.map(l => l.trim().replace(/^[-*•·▪◆]\s*/, '')).filter(Boolean);
        sec.entries = plainLines.length > 0 ? [
          {
            id: `entry-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
            bullets: plainLines,
          },
        ] : [];
      } else {
        sec.entries = parseEntries(sectionLines);
      }
    } else {
      sec.entries = parseEntries(sectionLines);
    }

    sections.push(sec);
  }

  return {
    contact,
    sections,
    rawText: rawInput,
    templateId: 'professional-classic',
  };
}
