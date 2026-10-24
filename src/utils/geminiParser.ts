import {
  GoogleGenerativeAI,
  type GenerateContentRequest,
} from '@google/generative-ai';

import type { 
  ResumeData, 
  ContactInfo, 
  ResumeEntry, 
  ResumeSection, 
  SectionType, 
  TemplateId, 
  DensityMode 
} from '../types/resume';

const DEFAULT_TEMPLATE_ID: TemplateId = 'professional-classic';
const DEFAULT_DENSITY: DensityMode = 'auto';

const ALLOWED_SECTION_TYPES: SectionType[] = [
  'summary',
  'experience',
  'education',
  'skills',
  'projects',
  'certifications',
  'awards',
  'publications',
  'languages',
  'custom',
];

const VALID_TEMPLATE_IDS: TemplateId[] = [
  'professional-classic',
  'modern-clean',
  'executive',
  'creative',
  'minimalist',
];

function normalizeTemplateId(value?: string): TemplateId {
  if (typeof value === 'string' && VALID_TEMPLATE_IDS.includes(value as TemplateId)) {
    return value as TemplateId;
  }
  return DEFAULT_TEMPLATE_ID;
}

function normalizeDensity(value?: string): DensityMode {
  if (value === 'auto' || value === 'compact' || value === 'spacious') {
    return value;
  }
  return DEFAULT_DENSITY;
}

function normalizeSectionType(value?: string): SectionType {
  if (typeof value === 'string' && ALLOWED_SECTION_TYPES.includes(value as SectionType)) {
    return value as SectionType;
  }
  return 'custom';
}

function safeString(value: unknown): string | undefined {
  if (typeof value === 'string') return value.trim() || undefined;
  return undefined;
}

function safeStringArray(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const cleaned = value
    .map((item) => (typeof item === 'string' ? item.trim() : ''))
    .filter(Boolean);

  return cleaned.length ? cleaned : undefined;
}

function normalizeContact(partial?: Record<string, unknown>): ContactInfo {
  const contact: ContactInfo = {
    name: safeString(partial?.name) || 'Candidate',
  };

  const email = safeString(partial?.email);
  const phone = safeString(partial?.phone);
  const location = safeString(partial?.location);
  const linkedin = safeString(partial?.linkedin);
  const github = safeString(partial?.github);
  const website = safeString(partial?.website);

  if (email) contact.email = email;
  if (phone) contact.phone = phone;
  if (location) contact.location = location;
  if (linkedin) contact.linkedin = linkedin;
  if (github) contact.github = github;
  if (website) contact.website = website;

  return contact;
}

function normalizeEntry(entry: Record<string, unknown>, fallbackIndex: number): ResumeEntry {
  const bullets = safeStringArray(entry.bullets);

  const normalized: ResumeEntry = {
    id: safeString(entry.id) || `entry-${fallbackIndex}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    title: safeString(entry.title),
    subtitle: safeString(entry.subtitle),
    date: safeString(entry.date),
    location: safeString(entry.location),
    description: safeString(entry.description),
    bullets,
    metadata: undefined,
    rawText: safeString(entry.rawText),
  };

  if (entry.metadata && typeof entry.metadata === 'object' && !Array.isArray(entry.metadata)) {
    const metadata: Record<string, string> = {};
    Object.entries(entry.metadata).forEach(([key, value]) => {
      if (typeof value === 'string' && value.trim()) {
        metadata[key] = value.trim();
      }
    });
    if (Object.keys(metadata).length > 0) {
      normalized.metadata = metadata;
    }
  }

  return normalized;
}

function normalizeSection(section: Record<string, unknown>, fallbackIndex: number): ResumeSection {
  const entries = Array.isArray(section.entries)
    ? section.entries
        .filter((item): item is Record<string, unknown> => typeof item === 'object' && item !== null)
        .map((entry, idx) => normalizeEntry(entry, idx))
    : undefined;

  const skillCategories = Array.isArray(section.skillCategories)
    ? section.skillCategories
        .filter((item): item is Record<string, unknown> => typeof item === 'object' && item !== null)
        .map((item) => {
          const skills = safeStringArray(item.skills) || [];
          return {
            category: safeString(item.category),
            skills,
          };
        })
        .filter((item) => item.skills.length > 0)
    : undefined;

  return {
    id: safeString(section.id) || `section-${fallbackIndex}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    title: safeString(section.title) || `SECTION_${fallbackIndex + 1}`,
    type: normalizeSectionType(safeString(section.type)),
    content: safeString(section.content),
    entries: entries && entries.length ? entries : undefined,
    skillCategories: skillCategories && skillCategories.length ? skillCategories : undefined,
    rawText: safeString(section.rawText),
  };
}

/**
 * Extract the first JSON object from a Gemini text response.
 * This is intentionally robust against:
 * - markdown code fences
 * - explanatory text before/after the JSON
 * - leading/trailing whitespace
 * - conversational responses from Gemini
 */
function extractJsonObject(responseText: string): Record<string, unknown> {
  if (!responseText || !responseText.trim()) {
    throw new Error('Gemini returned an empty response.');
  }

  const trimmed = responseText.trim();

  // Primary extraction: first object-like block found in the response
  const braceMatch = trimmed.match(/\{[\s\S]*\}/);

  if (!braceMatch) {
    throw new Error('Gemini response did not contain a valid JSON object.');
  }

  const candidate = braceMatch[0];

  try {
    const parsed = JSON.parse(candidate) as Record<string, unknown>;
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return parsed;
    }
    throw new Error('Parsed candidate is not a JSON object.');
  } catch (error) {
    throw new Error(
      `Failed to parse Gemini JSON: ${error instanceof Error ? error.message : 'unknown parsing error'}`
    );
  }
}

function normalizeResumeObject(
  rawText: string,
  payload: Record<string, unknown>,
  overrideTemplateId?: string,
  overrideDensity?: string
): ResumeData {
  const contact = normalizeContact(
    payload.contact && typeof payload.contact === 'object' && !Array.isArray(payload.contact)
      ? (payload.contact as Record<string, unknown>)
      : {}
  );

  const sectionsSource = Array.isArray(payload.sections) ? payload.sections : [];
  const sections: ResumeSection[] = sectionsSource
    .filter((item): item is Record<string, unknown> => typeof item === 'object' && item !== null)
    .map((section, index) => normalizeSection(section, index));

  const templateId = normalizeTemplateId(
    typeof overrideTemplateId === 'string' ? overrideTemplateId : safeString(payload.templateId)
  );

  const density = normalizeDensity(
    typeof overrideDensity === 'string' ? overrideDensity : safeString(payload.density)
  );

  const resume: ResumeData = {
    contact,
    sections,
    rawText,
    templateId,
    density,
  };

  if (!resume.sections.length) {
    resume.sections = [
      {
        id: `section-summary-${Date.now()}`,
        title: 'SUMMARY',
        type: 'summary',
        content: 'Professional summary not provided.',
      },
    ];
  }

  return resume;
}

export interface GeminiParserOptions {
  apiKey?: string;
  model?: string;
  templateId?: TemplateId;
  density?: DensityMode;
}

export async function parseResumeWithGemini(
  rawText: string,
  options: GeminiParserOptions = {}
): Promise<ResumeData> {
  if (!rawText || !rawText.trim()) {
    throw new Error('Resume text is empty.');
  }

  const apiKey = options.apiKey || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error(
      'Missing Gemini API key. Provide options.apiKey or set GEMINI_API_KEY in the environment.'
    );
  }

  const modelName = options.model || 'gemini-pro';

  const genAI = new GoogleGenerativeAI(apiKey);

  const systemInstruction = `
You are a strict resume-to-JSON parser for a React resume builder.

Return ONLY valid JSON with NO markdown fences, NO commentary, and NO extra text.

Your output must match this exact schema shape:

{
  "contact": {
    "name": "string",
    "email": "string?",
    "phone": "string?",
    "location": "string?",
    "linkedin": "string?",
    "github": "string?",
    "website": "string?"
  },
  "sections": [
    {
      "id": "string",
      "title": "string",
      "type": "summary|experience|education|skills|projects|certifications|awards|publications|languages|custom",
      "content": "string?",
      "entries": [
        {
          "id": "string",
          "title": "string?",
          "subtitle": "string?",
          "date": "string?",
          "location": "string?",
          "description": "string?",
          "bullets": ["string"],
          "metadata": { "key": "value" },
          "rawText": "string?"
        }
      ],
      "skillCategories": [
        {
          "category": "string?",
          "skills": ["string"]
        }
      ],
      "rawText": "string?"
    }
  ],
  "rawText": "string",
  "templateId": "professional-classic",
  "density": "auto"
}

CRITICAL RULES:
1. Convert parsed resume text precisely into the ResumeData contract.
2. For experience entries:
   - title = job title
   - subtitle = company/institution/organization
   - date = date range or date text
   - location = city/state/country or remote/onsite
   - bullets = itemized achievement bullets
   - description = optional summary sentence if present
3. For education entries:
   - title = degree/course
   - subtitle = school/institution
   - date = graduation or study period
   - location = campus/location
4. For skills:
   - prefer section.type = "skills"
   - use skillCategories[] with category and skills arrays when possible
5. Preserve original meaning and content; do not invent information.
6. Do not include duplicate or overlapping text across fields.
7. For each experience/education/project entry, keep title and subtitle distinct so templates can render cleanly.
8. Use valid JSON only. Escape double quotes correctly.
9. Do not wrap the answer in markdown such as \`\`\`json ... \`\`\`.
10. If the input is malformed or partial, still return a structurally valid object with best-effort parsing.
`;

  const model = genAI.getGenerativeModel({
    model: modelName,
    systemInstruction,
  });

  const generationConfig = {
    temperature: 0.1,
    topP: 0.8,
    maxOutputTokens: 4096,
    responseMimeType: 'application/json',
  } as const;

  const request: GenerateContentRequest = {
    contents: [
      {
        role: 'user',
        parts: [
          {
            text: `
Parse the following resume text and return only valid JSON matching the exact schema above.

Resume text:
${rawText}
`,
          },
        ],
      },
    ],
    generationConfig,
  };

  const result = await model.generateContent(request);
  const responseText =
    (await result.response)?.text?.() ||
    result?.response?.candidates?.[0]?.content?.parts
      ?.map((part: { text?: string }) => part?.text || '')
      .join('') ||
    '';

  const parsed = extractJsonObject(responseText);

  const normalized = normalizeResumeObject(
    rawText,
    parsed,
    options.templateId ? String(options.templateId) : undefined,
    options.density ? String(options.density) : undefined
  );

  normalized.templateId = normalizeTemplateId(String(normalized.templateId));
  normalized.density = normalizeDensity(String(normalized.density));

  return normalized;
}

export default parseResumeWithGemini;
