export interface ContactInfo {
  name: string;
  email?: string;
  phone?: string;
  location?: string;
  linkedin?: string;
  github?: string;
  website?: string;
}

export interface ResumeEntry {
  id: string;
  title?: string; // Job title, Degree name, Project name, Certification name, etc.
  subtitle?: string; // Company name, Institution, Issuer, etc.
  date?: string; // e.g., "Nov 2025–Present", "2020–2023"
  location?: string; // e.g., "Gurugram, Haryana", "Remote"
  description?: string;
  bullets?: string[];
  metadata?: Record<string, string>;
  rawText?: string;
}

export interface SkillCategory {
  category?: string; // e.g. "Technical & Business", "Tools", "Languages"
  skills: string[];
}

export type SectionType =
  | 'summary'
  | 'experience'
  | 'education'
  | 'skills'
  | 'projects'
  | 'certifications'
  | 'awards'
  | 'publications'
  | 'languages'
  | 'custom';

export interface ResumeSection {
  id: string;
  title: string; // The original or user-defined title, e.g. "PROFESSIONAL EXPERIENCE"
  type: SectionType;
  content?: string; // Simple text/paragraph for summary or custom notes
  entries?: ResumeEntry[]; // Structured entries
  skillCategories?: SkillCategory[]; // Grouped skills
  rawText?: string;
}

export interface ResumeData {
  contact: ContactInfo;
  sections: ResumeSection[];
  rawText: string;
  templateId: 'professional-classic';
  density?: 'auto' | 'compact' | 'spacious';
}

export interface ValidationItem {
  id: string;
  label: string;
  status: 'PASS' | 'FAIL' | 'NOT TESTED' | 'BLOCKED';
  message: string;
  details?: string;
}

export interface ValidationSummary {
  overallStatus: 'PASS' | 'FAIL' | 'NOT TESTED' | 'BLOCKED';
  items: ValidationItem[];
  wordPreservationRate: number; // percentage of original non-stopword tokens retained
  missingWords?: string[];
  unknownPlaceholdersCount: number; // must be 0
}
