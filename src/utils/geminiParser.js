/**
 * geminiParser.js
 * Use Gemini Flash (free tier) to parse raw PDF text → structured resume JSON
 */

const GEMINI_ENDPOINT = (key) =>
  `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`;
const ENV_API_KEY = (import.meta.env.VITE_GEMINI_API_KEY || "").trim();

const SYSTEM_PROMPT = `You are a resume parser. Extract structured data from the resume text provided.
Return ONLY valid JSON (no markdown, no explanation) with exactly this shape:
{
  "personalInfo": {
    "name": "",
    "email": "",
    "phone": "",
    "location": "",
    "linkedin": "",
    "linkedinLabel": "LinkedIn",
    "github": "",
    "githubLabel": ""
  },
  "summary": "",
  "experience": [
    {
      "id": "exp-1",
      "title": "",
      "company": "",
      "startDate": "",
      "endDate": "",
      "location": "",
      "bullets": [""]
    }
  ],
  "education": [
    {
      "id": "edu-1",
      "institution": "",
      "degree": "",
      "startDate": "",
      "endDate": ""
    }
  ],
  "certifications": [
    {
      "id": "cert-1",
      "name": "",
      "issuer": "",
      "date": ""
    }
  ],
  "skills": [
    {
      "id": "skill-1",
      "label": "",
      "value": ""
    }
  ],
  "sectionTitles": {
    "summary": "Professional Summary",
    "experience": "Work Experience",
    "education": "Education",
    "certifications": "Certifications",
    "skills": "Skills"
  }
}
Rules:
- For bullets: each bullet point is a separate string in the array
- For skills: use a single text field per row. Keep "label" always empty and put the full skill line in "value"
- For dates: keep original format from the resume (e.g. "Jan 2024", "2020 - 2022", "Present")
- Generate unique IDs with prefix: exp-1, exp-2… edu-1… cert-1… skill-1…
- If a field is missing, use empty string ""
- Keep bullets as written in the original resume, do not paraphrase`;

export async function parseWithGemini(rawText, apiKey) {
  const key = (apiKey || ENV_API_KEY || "").trim();
  if (!key) {
    throw new Error("Missing Gemini API key. Set VITE_GEMINI_API_KEY in your environment.");
  }
  const body = {
    contents: [
      {
        parts: [
          { text: SYSTEM_PROMPT + "\n\nResume text:\n" + rawText.slice(0, 30000) },
        ],
      },
    ],
    generationConfig: {
      temperature: 0,
      responseMimeType: "application/json",
    },
  };

  const res = await fetch(GEMINI_ENDPOINT(key), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || `Gemini API error ${res.status}`);
  }

  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";

  // Strip any markdown code fences just in case
  const json = text.replace(/^```json\s*/i, "").replace(/```\s*$/, "").trim();
  return JSON.parse(json);
}
