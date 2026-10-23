import type { ResumeData, ResumeEntry, ResumeSection } from '../types/resume';

const STORAGE_KEY = 'resume-builder-v2:resume';

export function isResumeData(value: unknown): value is ResumeData {
  if (!value || typeof value !== 'object') return false;
  const record = value as Record<string, unknown>;
  return Boolean(record.contact) && Array.isArray(record.sections) && typeof record.templateId !== 'undefined';
}

function normalizeEntry(value: unknown): ResumeEntry | null {
  if (!value || typeof value !== 'object') return null;
  const entry = value as Record<string, unknown>;
  return {
    id: typeof entry.id === 'string' ? entry.id : `entry-${Math.random().toString(36).slice(2, 9)}`,
    title: typeof entry.title === 'string' ? entry.title : undefined,
    subtitle: typeof entry.subtitle === 'string' ? entry.subtitle : undefined,
    date: typeof entry.date === 'string' ? entry.date : undefined,
    location: typeof entry.location === 'string' ? entry.location : undefined,
    description: typeof entry.description === 'string' ? entry.description : undefined,
    bullets: Array.isArray(entry.bullets) ? entry.bullets.filter((item): item is string => typeof item === 'string') : undefined,
    metadata: entry.metadata && typeof entry.metadata === 'object' ? Object.fromEntries(
      Object.entries(entry.metadata as Record<string, unknown>).filter(([, v]) => typeof v === 'string')
    ) : undefined,
    rawText: typeof entry.rawText === 'string' ? entry.rawText : undefined,
  };
}

function normalizeSection(value: unknown): ResumeSection | null {
  if (!value || typeof value !== 'object') return null;
  const section = value as Record<string, unknown>;
  const normalizedEntries = Array.isArray(section.entries)
    ? section.entries.map(normalizeEntry).filter((entry): entry is ResumeEntry => Boolean(entry))
    : undefined;

  const skillCategories = Array.isArray(section.skillCategories)
    ? section.skillCategories
        .filter((cat): cat is Record<string, unknown> => !!cat && typeof cat === 'object')
        .map(cat => ({
          category: typeof cat.category === 'string' ? cat.category : undefined,
          skills: Array.isArray(cat.skills)
            ? cat.skills.filter((skill): skill is string => typeof skill === 'string')
            : [],
        }))
        .filter(item => item.skills.length > 0)
    : undefined;

  return {
    id: typeof section.id === 'string' ? section.id : `section-${Math.random().toString(36).slice(2, 9)}`,
    title: typeof section.title === 'string' ? section.title : 'Untitled Section',
    type: (section.type === 'summary' || section.type === 'experience' || section.type === 'education' || section.type === 'skills' || section.type === 'projects' || section.type === 'certifications' || section.type === 'awards' || section.type === 'publications' || section.type === 'languages' || section.type === 'custom')
      ? section.type
      : 'custom',
    content: typeof section.content === 'string' ? section.content : undefined,
    entries: normalizedEntries && normalizedEntries.length > 0 ? normalizedEntries : undefined,
    skillCategories,
    rawText: typeof section.rawText === 'string' ? section.rawText : undefined,
  };
}

export function sanitizeStoredResume(value: unknown): ResumeData | null {
  if (!value || typeof value !== 'object') return null;

  const record = value as Record<string, unknown>;
  const contact = record.contact && typeof record.contact === 'object'
    ? (record.contact as Record<string, unknown>)
    : {};

  const templateId = record.templateId === 'modern-minimal' ? 'modern-minimal' : 'professional-classic';
  const sections = Array.isArray(record.sections)
    ? record.sections.map(normalizeSection).filter((section): section is ResumeSection => Boolean(section))
    : [];

  return {
    contact: {
      name: typeof contact.name === 'string' ? contact.name : '',
      email: typeof contact.email === 'string' ? contact.email : undefined,
      phone: typeof contact.phone === 'string' ? contact.phone : undefined,
      location: typeof contact.location === 'string' ? contact.location : undefined,
      linkedin: typeof contact.linkedin === 'string' ? contact.linkedin : undefined,
      github: typeof contact.github === 'string' ? contact.github : undefined,
      website: typeof contact.website === 'string' ? contact.website : undefined,
    },
    sections,
    rawText: typeof record.rawText === 'string' ? record.rawText : '',
    templateId,
    density: record.density === 'compact' || record.density === 'spacious' || record.density === 'auto' ? record.density : undefined,
  };
}

export function saveResumeToStorage(resume: ResumeData): void {
  if (typeof window === 'undefined' || !window.localStorage) return;

  const payload = {
    contact: resume.contact,
    sections: resume.sections,
    templateId: resume.templateId,
    density: resume.density,
    savedAt: new Date().toISOString(),
  };

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
}

export function loadResumeFromStorage(): ResumeData | null {
  if (typeof window === 'undefined' || !window.localStorage) return null;

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    const sanitized = sanitizeStoredResume(parsed);
    return sanitized;
  } catch {
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignore storage cleanup failure.
    }
    return null;
  }
}

export function clearResumeStorage(): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  window.localStorage.removeItem(STORAGE_KEY);
}
