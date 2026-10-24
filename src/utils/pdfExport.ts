export interface PDFExportOptions {
  filename?: string;
  candidateName?: string;
}

/**
 * Clean filename from candidate name
 */
export function generateFilename(candidateName?: string): string {
  if (!candidateName || !candidateName.trim()) {
    return 'Resume.pdf';
  }
  const cleanName = candidateName
    .trim()
    .replace(/[^a-zA-Z0-9_\-\s]/g, '')
    .replace(/\s+/g, '_');
  return `${cleanName}_Resume.pdf`;
}

/**
 * Download PDF via native browser print dialog.
 *
 * Uses the browser's built-in print-to-PDF engine which produces:
 *   - A true vector PDF with selectable, searchable text
 *   - Correct word spacing (no html2canvas rasterisation artifacts)
 *   - Exact CSS @page margin and page-break rules
 *
 * The browser will show a "Save as PDF" option in its print dialog.
 * The suggested filename comes from document.title.
 */
export async function exportToPDFBlob(
  _element: HTMLElement,
  options?: PDFExportOptions
): Promise<Blob> {
  const fileName = options?.filename ?? generateFilename(options?.candidateName);

  // Delegate to the native print path — this is the only reliable way to
  // produce a vector PDF with correct typography in a browser environment.
  document.title = fileName.replace(/\.pdf$/i, '');
  printResume(options?.candidateName);

  // Return an empty blob as a placeholder; the actual file is saved by the
  // browser's print dialog, so there is no programmatic blob to return.
  return new Blob([], { type: 'application/pdf' });
}

/**
 * Native Vector Print to PDF (Selectable text, clickable links, exact CSS @page rules)
 */
export function printResume(candidateName?: string): void {
  const prevTitle = document.title;
  const docTitle = candidateName ? `${candidateName.replace(/\s+/g, '_')}_Resume` : 'Resume';
  document.title = docTitle;

  window.print();

  // Restore title after print dialog closes
  setTimeout(() => {
    document.title = prevTitle;
  }, 1000);
}
