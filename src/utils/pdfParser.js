/**
 * pdfParser.js  –  pdfjs-dist v5 + Vite
 */
import * as pdfjsLib from "pdfjs-dist";
// Vite ?url import gives the correct hashed URL at runtime
import workerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";

pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;

/* ─── Extract text lines from PDF file ──────────── */
export async function extractTextFromPdf(file) {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) }).promise;

  const allLines = [];

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const content = await page.getTextContent();

    // Group items that share the same Y coordinate into lines
    const lineMap = new Map(); // y → [{x, str}]
    for (const item of content.items) {
      if (!item.str || !item.str.trim()) continue;
      const y = Math.round(item.transform[5]);
      const x = item.transform[4];
      if (!lineMap.has(y)) lineMap.set(y, []);
      lineMap.get(y).push({ x, str: item.str });
    }

    // Sort Y descending (top of page first), then X ascending (left to right)
    const sortedYs = [...lineMap.keys()].sort((a, b) => b - a);
    for (const y of sortedYs) {
      const parts = lineMap.get(y).sort((a, b) => a.x - b.x);
      const line = parts.map((p) => p.str).join(" ").trim();
      if (line) allLines.push(line);
    }
  }

  return allLines;
}

/* ─── Helpers ────────────────────────────────────── */
const uid = () => `${Date.now()}-${Math.random().toString(36).slice(2)}`;

const DATE_PATTERN =
  /\b(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)[,.]?\s*\d{2,4}|\b\d{4}\b|present|current\b/gi;

const EMAIL_RE = /[\w.+-]+@[\w-]+\.[a-z]{2,}/i;
const PHONE_RE = /(?:\+?1[\s.-]?)?\(?\d{3}\)?[\s.\-–]\d{3}[\s.\-–]\d{4}/;
const LINKEDIN_RE = /linkedin\.com\/in\/[^\s|,]*/i;
const GITHUB_RE = /github\.com\/[^\s|,]*/i;

function extractDates(text) {
  const matches = [...text.matchAll(DATE_PATTERN)].map((m) => m[0].trim());
  return { startDate: matches[0] || "", endDate: matches[1] || "" };
}

function isSectionHeading(line) {
  const t = line.trim();
  // Short, possibly ALL-CAPS or Title Case, no punctuation at end
  if (t.length > 60) return false;
  return /^(work\s+experience|experience|employment\s*history|education|certifications?|certificates?|skills?|technical\s+skills?|professional\s+summary|summary|profile|objective|about\s+me|awards?|projects?)/i.test(t);
}

function getSectionKey(line) {
  const t = line.toLowerCase().trim();
  if (/experience|employment/.test(t)) return "experience";
  if (/education/.test(t)) return "education";
  if (/certif/.test(t)) return "certifications";
  if (/skill/.test(t)) return "skills";
  if (/summary|profile|objective|about/.test(t)) return "summary";
  return null;
}

/* ─── Main parser ────────────────────────────────── */
export function parseResumeText(lines) {
  const resume = {
    personalInfo: {
      name: "", email: "", phone: "", location: "",
      linkedin: "", linkedinLabel: "LinkedIn",
      github: "", githubLabel: "",
    },
    summary: "",
    experience: [],
    education: [],
    certifications: [],
    skills: [],
    sectionTitles: {
      summary: "Professional Summary",
      experience: "Work Experience",
      education: "Education",
      certifications: "Certifications",
      skills: "Skills",
    },
  };

  if (!lines.length) return resume;

  /* ── Contact block: first 15 lines ── */
  let nameSet = false;
  for (let i = 0; i < Math.min(15, lines.length); i++) {
    const line = lines[i].trim();
    if (!line) continue;
    if (isSectionHeading(line)) break;

    if (EMAIL_RE.test(line) && !resume.personalInfo.email) {
      resume.personalInfo.email = (line.match(EMAIL_RE))[0];
    }
    if (PHONE_RE.test(line) && !resume.personalInfo.phone) {
      resume.personalInfo.phone = (line.match(PHONE_RE))[0];
    }
    if (LINKEDIN_RE.test(line)) {
      const m = line.match(LINKEDIN_RE)[0];
      resume.personalInfo.linkedin = "https://" + m;
    }
    if (GITHUB_RE.test(line)) {
      const m = line.match(GITHUB_RE)[0];
      resume.personalInfo.github = "https://" + m;
      resume.personalInfo.githubLabel = resume.personalInfo.github;
    }
    // Name: first non-contact, non-heading short line
    if (
      !nameSet &&
      !EMAIL_RE.test(line) && !PHONE_RE.test(line) &&
      !LINKEDIN_RE.test(line) && !GITHUB_RE.test(line) &&
      line.length < 60 && !isSectionHeading(line)
    ) {
      resume.personalInfo.name = line;
      nameSet = true;
    }
    // Location: city, state or country pattern appearing before sections
    if (!resume.personalInfo.location && /,\s*[A-Za-z]{2,}/.test(line) && !EMAIL_RE.test(line)) {
      resume.personalInfo.location = line;
    }
  }

  /* ── Split lines into sections ── */
  const sections = []; // [{key, label, lines[]}]
  let cur = { key: null, label: "", lines: [] };

  for (const line of lines) {
    const t = line.trim();
    if (!t) continue;
    const key = isSectionHeading(t) ? getSectionKey(t) : null;
    if (key) {
      sections.push(cur);
      cur = { key, label: t, lines: [] };
    } else {
      cur.lines.push(t);
    }
  }
  sections.push(cur);

  /* ── Parse each section ── */
  for (const sec of sections) {
    if (!sec.key) continue;

    // ── Summary ──
    if (sec.key === "summary") {
      resume.summary = sec.lines.join(" ").trim();
    }

    // ── Experience ──
    if (sec.key === "experience") {
      const jobs = [];
      let job = null;

      for (const line of sec.lines) {
        const hasDates = DATE_PATTERN.test(line);
        DATE_PATTERN.lastIndex = 0;

        if (hasDates && line.length < 150) {
          // This line contains dates → treat as job header
          if (job) jobs.push(job);
          const { startDate, endDate } = extractDates(line);
          // Strip the dates and separators to get title/company/location
          const cleaned = line
            .replace(DATE_PATTERN, "")
            .replace(/\s*[|·•–—\-]\s*/g, " | ")
            .replace(/\s{2,}/g, " ")
            .trim();
          DATE_PATTERN.lastIndex = 0;
          const parts = cleaned.split(" | ").map((s) => s.trim()).filter(Boolean);
          job = {
            id: uid(),
            title: parts[0] || "",
            company: parts[1] || "",
            location: parts[2] || "",
            startDate,
            endDate,
            bullets: [],
          };
        } else if (job) {
          // Treat as bullet
          const bullet = line.replace(/^[•\-‐‑‒–—*]\s*/, "").trim();
          if (bullet) job.bullets.push(bullet);
        } else {
          // No job started yet — treat as a job title line
          job = {
            id: uid(),
            title: line,
            company: "", location: "",
            startDate: "", endDate: "",
            bullets: [],
          };
        }
      }
      if (job) jobs.push(job);
      resume.experience = jobs.filter((j) => j.title || j.bullets.length);
    }

    // ── Education ──
    if (sec.key === "education") {
      const entries = [];
      let entry = null;

      for (const line of sec.lines) {
        const hasDates = DATE_PATTERN.test(line);
        DATE_PATTERN.lastIndex = 0;

        if (hasDates) {
          if (entry) entries.push(entry);
          const { startDate, endDate } = extractDates(line);
          const cleaned = line.replace(DATE_PATTERN, "").replace(/\s{2,}/g, " ").trim();
          DATE_PATTERN.lastIndex = 0;
          const parts = cleaned.split(/\s*[|·•–—\-]\s*/).map((s) => s.trim()).filter(Boolean);
          entry = {
            id: uid(),
            institution: parts[0] || cleaned,
            degree: parts[1] || "",
            startDate, endDate,
          };
        } else if (!entry) {
          entry = { id: uid(), institution: line, degree: "", startDate: "", endDate: "" };
        } else if (!entry.degree) {
          entry.degree = line;
        }
      }
      if (entry) entries.push(entry);
      resume.education = entries.filter((e) => e.institution);
    }

    // ── Certifications ──
    if (sec.key === "certifications") {
      for (const line of sec.lines) {
        const { startDate } = extractDates(line);
        const cleaned = line.replace(DATE_PATTERN, "").trim();
        DATE_PATTERN.lastIndex = 0;
        const parts = cleaned.split(/\s*[|·–—\-]\s*/).map((s) => s.trim()).filter(Boolean);
        if (parts[0]) {
          resume.certifications.push({
            id: uid(),
            name: parts[0],
            issuer: parts[1] || "",
            date: startDate,
          });
        }
      }
    }

    // ── Skills ──
    if (sec.key === "skills") {
      for (const line of sec.lines) {
        if (line.trim()) {
          resume.skills.push({ id: uid(), label: "", value: line.trim() });
        }
      }
    }
  }

  return resume;
}
