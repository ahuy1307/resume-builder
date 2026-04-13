/**
 * Vercel serverless function — POST /api/parse
 * Proxies the Gemini API call so the key never leaves the server.
 */

const GEMINI_ENDPOINT =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";

const SYSTEM_PROMPT = `You are a resume parser. Extract structured data from the resume text provided.
Return ONLY valid JSON (no markdown, no explanation) with exactly this shape:
{
  "personalInfo": {
    "name": "",
    "position": "",
    "email": "",
    "phone": "",
    "location": "",
    "linkedin": "",
    "linkedinLabel": "LinkedIn",
    "github": "",
    "githubLabel": "",
    "dob": ""
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
- "position": the person's job title or professional tagline (e.g. "Senior Software Engineer", "Full Stack Developer"). Extract from the header area of the resume if present, otherwise leave empty.
- "dob": date of birth if explicitly stated in the resume (e.g. "01/01/1990", "January 1, 1990"), otherwise leave empty.
- For bullets: each bullet point is a separate string in the array
- For skills: use a single text field per row. Keep "label" always empty and put the full skill line in "value"
- For dates: keep original format from the resume (e.g. "Jan 2024", "2020 - 2022", "Present")
- Generate unique IDs with prefix: exp-1, exp-2… edu-1… cert-1… skill-1…
- If a field is missing, use empty string ""
- Keep bullets as written in the original resume, do not paraphrase`;

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "GEMINI_API_KEY not configured on server." });
  }

  const { rawText } = req.body;
  if (!rawText || typeof rawText !== "string") {
    return res.status(400).json({ error: "Missing rawText in request body." });
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

  const geminiRes = await fetch(`${GEMINI_ENDPOINT}?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!geminiRes.ok) {
    const err = await geminiRes.json().catch(() => ({}));
    return res.status(geminiRes.status).json({
      error: err?.error?.message || `Gemini API error ${geminiRes.status}`,
    });
  }

  const data = await geminiRes.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
  const json = text.replace(/^```json\s*/i, "").replace(/```\s*$/, "").trim();

  try {
    return res.status(200).json(JSON.parse(json));
  } catch {
    return res.status(500).json({ error: "Failed to parse Gemini response as JSON." });
  }
}
