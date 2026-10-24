import { GoogleGenerativeAI } from '@google/generative-ai';
import type { ResumeData } from '../types/resume';

export async function parseResumeWithGemini(rawText: string): Promise<ResumeData> {
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
You are an expert resume parsing engine for a React Resume Builder app.
Analyze the resume text and return valid JSON ONLY. No markdown, no conversational text.

MANDATORY JSON STRUCTURE:
{
  "contact": {
    "name": "string",
    "email": "string",
    "phone": "string",
    "location": "string",
    "linkedin": "string",
    "github": "string",
    "website": "string"
  },
  "sections": [
    {
      "id": "summary",
      "title": "Professional Summary",
      "type": "summary",
      "content": "string"
    },
    {
      "id": "experience",
      "title": "Professional Experience",
      "type": "experience",
      "entries": [
        {
          "id": "exp-1",
          "title": "Job Title ONLY (e.g. Assistant Manager)",
          "subtitle": "Company Name ONLY (e.g. M1xchange)",
          "location": "Location if present",
          "date": "Date range ONLY (e.g. Nov 2025 - Present)",
          "bullets": ["Action bullet 1", "Action bullet 2"]
        }
      ]
    },
    {
      "id": "skills",
      "title": "Skills",
      "type": "skills",
      "skillCategories": [
        { "category": "Technical", "skills": ["SQL", "Python", "Power BI"] }
      ]
    },
    {
      "id": "education",
      "title": "Education & Certifications",
      "type": "education",
      "entries": [
        {
          "id": "edu-1",
          "title": "Degree Name",
          "subtitle": "Institution Name",
          "date": "Year"
        }
      ]
    },
    {
      "id": "projects",
      "title": "Projects",
      "type": "projects",
      "entries": [
        {
          "id": "proj-1",
          "title": "Project Name",
          "description": "Project details",
          "bullets": ["Detail 1"]
        }
      ]
    }
  ],
  "rawText": "",
  "templateId": "professional-classic"
}

STRICT RULES:
1. NEVER mix job titles, company names, and dates into a single field. Keep 'title', 'subtitle', 'location', and 'date' strictly separated.
2. Ensure every job bullet point is extracted as an item in the 'bullets' array, NOT lumped into a single paragraph string.
3. Return ONLY raw JSON.

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
    
    const parsedData = JSON.parse(jsonMatch[0]);
    parsedData.rawText = text;
    parsedData.templateId = parsedData.templateId || 'professional-classic';

    // Post-processing sanitizer to ensure bullets are always arrays
    if (parsedData.sections) {
      parsedData.sections.forEach((sec: any) => {
        if (sec.entries) {
          sec.entries.forEach((entry: any) => {
            if (typeof entry.bullets === 'string') {
              entry.bullets = [entry.bullets];
            }
            if (!Array.isArray(entry.bullets)) {
              entry.bullets = [];
            }
          });
        }
      });
    }

    return parsedData;
  } catch (error: any) {
    console.error("Gemini Parsing Error:", error);
    throw error;
  }
}
