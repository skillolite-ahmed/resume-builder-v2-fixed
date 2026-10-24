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
Extract complete resume information from the text below. Return valid JSON ONLY. No markdown, no conversational text.

MANDATORY JSON STRUCTURE:
{
  "contact": {
    "name": "Full Name",
    "email": "email",
    "phone": "phone",
    "location": "location",
    "linkedin": "linkedin"
  },
  "sections": [
    {
      "id": "summary",
      "title": "Professional Summary",
      "type": "summary",
      "content": "Summary text"
    },
    {
      "id": "experience",
      "title": "Professional Experience",
      "type": "experience",
      "entries": [
        {
          "id": "exp-1",
          "title": "Job Title",
          "subtitle": "Company Name",
          "date": "Date Range",
          "bullets": ["Bullet 1", "Bullet 2"]
        }
      ]
    },
    {
      "id": "skills",
      "title": "Skills",
      "type": "skills",
      "skillCategories": [
        { "category": "Technical & Business", "skills": ["SQL", "Python", "Power BI", "Advanced Excel"] }
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
          "description": "Project overview",
          "bullets": ["Detail 1"]
        }
      ]
    }
  ],
  "templateId": "professional-classic"
}

Resume text:
${text}
`;

  try {
    const result = await model.generateContent(prompt);
    const response = result.response.text();
    
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Invalid JSON returned from AI");
    }
    
    const parsedData = JSON.parse(jsonMatch[0]);
    parsedData.rawText = text;
    parsedData.templateId = parsedData.templateId || 'professional-classic';

    // Sanitizer to ensure all array structures exist
    if (parsedData.sections) {
      parsedData.sections.forEach((sec: any) => {
        if (sec.entries) {
          sec.entries.forEach((entry: any, index: number) => {
            if (!entry.id) entry.id = `entry-${index + 1}`;
            if (typeof entry.bullets === 'string') entry.bullets = [entry.bullets];
            if (!Array.isArray(entry.bullets)) entry.bullets = [];
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
