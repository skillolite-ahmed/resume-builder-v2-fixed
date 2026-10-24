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
Analyze the resume text below and return valid JSON ONLY. No markdown ticks, no conversational text.

Return JSON matching this exact structure:
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
          "title": "Job Title e.g. Assistant Manager",
          "subtitle": "Company Name e.g. M1xchange",
          "location": "Location if present",
          "date": "Date range e.g. Nov 2025 - Present",
          "bullets": ["Bullet 1", "Bullet 2"]
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
          "description": "Project details...",
          "bullets": ["Detail 1"]
        }
      ]
    }
  ],
  "rawText": "",
  "templateId": "professional-classic"
}

CRITICAL RULES:
1. Fix OCR spacing or text scrambling (e.g. separate titles, companies, dates).
2. Ensure every job entry has its own 'title', 'subtitle', 'date', and 'bullets'.
3. Return ONLY the raw JSON object.

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
    return parsedData;
  } catch (error: any) {
    console.error("Gemini Parsing Error:", error);
    throw error;
  }
}
