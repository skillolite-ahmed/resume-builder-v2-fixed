import { describe, it, expect } from 'vitest';
import { isTextImportSupported, readTextFile } from '../utils/fileInput';

describe('file input validation', () => {
  it('accepts plain-text resume files and rejects PDFs', () => {
    const txtFile = new File(['resume text'], 'resume.txt', { type: 'text/plain' });
    const mdFile = new File(['# Summary'], 'resume.md', { type: 'text/markdown' });
    const pdfFile = new File(['binary'], 'resume.pdf', { type: 'application/pdf' });

    expect(isTextImportSupported(txtFile)).toBe(true);
    expect(isTextImportSupported(mdFile)).toBe(true);
    expect(isTextImportSupported(pdfFile)).toBe(false);
  });

  it('reads supported text inputs and rejects unsupported types', async () => {
    const txtFile = new File(['Name\nSummary'], 'resume.txt', { type: 'text/plain' });
    await expect(readTextFile(txtFile)).resolves.toContain('Name');

    const pdfFile = new File(['pdf-data'], 'resume.pdf', { type: 'application/pdf' });
    await expect(readTextFile(pdfFile)).rejects.toThrow('Unsupported file type');
  });
});
