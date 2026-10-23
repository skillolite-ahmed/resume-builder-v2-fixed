import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { saveResumeToStorage, loadResumeFromStorage, clearResumeStorage } from '../utils/resumeStorage';
import type { ResumeData } from '../types/resume';

describe('resume persistence', () => {
  beforeEach(() => {
    const store = new Map<string, string>();
    Object.defineProperty(globalThis, 'localStorage', {
      value: {
        getItem: (key: string) => store.get(key) ?? null,
        setItem: (key: string, value: string) => store.set(key, value),
        removeItem: (key: string) => store.delete(key),
        clear: () => store.clear(),
      },
      configurable: true,
    });
  });

  afterEach(() => {
    clearResumeStorage();
  });

  it('saves and restores a stored resume without storing raw text', () => {
    const resume: ResumeData = {
      contact: {
        name: 'Jordan Lee',
        email: 'jordan@example.com',
        phone: '+1 555 0123',
        location: 'Chicago, IL',
      },
      sections: [
        {
          id: 'sec-1',
          title: 'PROFESSIONAL SUMMARY',
          type: 'summary',
          content: 'Senior product engineer and systems thinker.',
        },
      ],
      rawText: 'Very long raw resume text that should not be saved in storage',
      templateId: 'modern-minimal',
      density: 'compact',
    };

    saveResumeToStorage(resume);
    const restored = loadResumeFromStorage();

    expect(restored?.contact.name).toBe('Jordan Lee');
    expect(restored?.templateId).toBe('modern-minimal');
    expect(restored?.sections[0].content).toContain('Senior product engineer');
    expect(restored?.rawText).toBe('');
  });

  it('rejects malformed stored payloads without crashing', () => {
    globalThis.localStorage.setItem('resume-builder-v2:resume', '{ not valid json');
    expect(loadResumeFromStorage()).toBeNull();
  });
});
