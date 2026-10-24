import { GoogleGenerativeAI } from '@google/generative-ai';

export async function parseResumeWithGemini(rawText: string) {
  const text = rawText?.trim?.() ?? '';

  if (!text) {
    return {
      contact: { name: '' },
      sections: [],
      rawText: '',
      templateId: 'professional-classic',
    };
  }

  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('Missing VITE_GEMINI_API_KEY');
  }

  const model = new GoogleGenerativeAI(apiKey).getGenerativeModel({
    model: 'gemini-pro',
  });

  const prompt = `
You are an expert resume parsing engine.

Return valid JSON only, matching this exact shape:
{
  contact: { name: string, email?: string, phone?: string, location?: string, linkedin?: string, github?: string, website?: string },
  sections: [
    {
      id: string,
      title: string,
      type: "summary" | "experience" | "education" | "skills" | "projects" | "certifications" | "awards" | "publications" | "languages" | "custom",
      content?: string,
      entries?: [
        { id: string, title?: string, subtitle?: string, date?: string, location?: string, description?: string, bullets?: string[], metadata?: { [key: string]: string }, rawText?: string }
      ],
      skillCategories?: [ { category?: string, skills: string[] } ],
      rawText?: string
    }
  ],
  rawText: string,
  templateId: "professional-classic",
  density?: "auto" | "compact" | "spacious"
}

CRITICAL RULES FOR SCRAPED PDF TEXT:
1. Fix OCR errors: "SOL" -> "SQL", "Power El" -> "Power BI", "MIxchange" -> "M1xchange".
2. The input text is highly scrambled. Job titles, dates, and companies are mixed up.
3. Carefully reconstruct the Experience section. ALWAYS separate the Job Title (title), Company (subtitle), Location (location), and Dates (date) into their exact fields.
4. Example mapping:
   "Senior Relationship Manager - EnKash Gurugram Jun 2022 Sep 2023"
   MUST become:
   title: "Senior Relationship Manager", subtitle: "EnKash", location: "Gurugram", date: "Jun 2022 - Sep 2023".
5. Treat sentences that start with bullet points or action verbs as 'bullets' inside the entry. DO NOT use job responsibilities as job titles.
6. Return ONLY JSON. No markdown blocks.

Resume text:
${text}
`;

  try {
    const result = await model.generateContent(prompt);
    const response = result.response.text();
    
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("AI did not return a valid JSON object.");
    }
    
    return JSON.parse(jsonMatch[0]);
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    throw new Error(error.message || 'Failed to generate AI content');
  }
}
