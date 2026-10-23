export function isTextImportSupported(file: File): boolean {
  const name = file.name.toLowerCase();
  if (file.type === 'application/pdf' || name.endsWith('.pdf')) {
    return false;
  }

  return (
    file.type.startsWith('text/') ||
    file.type === 'application/json' ||
    name.endsWith('.txt') ||
    name.endsWith('.md') ||
    name.endsWith('.json') ||
    name.endsWith('.csv')
  );
}

export async function readTextFile(file: File): Promise<string> {
  if (!isTextImportSupported(file)) {
    throw new Error('Unsupported file type. Please upload a plain-text resume file (.txt, .md, or .json) or paste your text directly.');
  }

  return await file.text();
}
