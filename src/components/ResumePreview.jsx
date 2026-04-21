import { Fragment, useState, useEffect, useRef, useCallback } from "react";
import { Trash2, List, Pencil } from "lucide-react";
import ImageCropModal from "./ImageCropModal";

/* ─── Constants ─────────────────────────────────── */
const MM_TO_PX = 96 / 25.4;
const PAGE_H_MM = 297;
const BASE_HEADING_PT  = 13.2;
const BASE_BODY_PT     = 10;
const BASE_LINE_HEIGHT = 1.5;
const DEFAULT_ORDER = ["summary","experience","projects","education","certifications","skills"];

/* ─── SVG Icons ─────────────────────────────────── */
const icons = {
  email:    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M22 7l-10 7L2 7"/></svg>,
  phone:    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81a19.79 19.79 0 01-3.07-8.68A2 2 0 012 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 14.92v2z"/></svg>,
  location: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>,
  linkedin: <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6zM2 9h4v12H2z"/><circle cx="4" cy="4" r="2"/></svg>,
  github:   <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 00-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0020 4.77 5.07 5.07 0 0019.91 1S18.73.65 16 2.48a13.38 13.38 0 00-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 005 4.77a5.44 5.44 0 00-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 009 18.13V22"/></svg>,
  remove:   <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>,
  add:      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14"/></svg>,
  calendar: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>,
  camera:   <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/></svg>,
};

const formatProfileHref = (value) => {
  const trimmedValue = String(value || "").trim();
  if (!trimmedValue) return "";
  return /^https?:\/\//i.test(trimmedValue) ? trimmedValue : `https://${trimmedValue}`;
};

/** Only show project title as a link when URL looks like a real web address (empty / extract noise → plain title). */
function isRealProjectUrl(url) {
  const t = String(url ?? "").trim();
  if (!t) return false;
  const lower = t.toLowerCase();
  const junk = new Set(["-", "—", "–", "n/a", "na", "none", "null", "nil", "#", "tbd", "todo", ".", "..", "/", "\\"]);
  if (junk.has(lower)) return false;
  const href = formatProfileHref(t);
  let u;
  try {
    u = new URL(href);
  } catch {
    return false;
  }
  const host = u.hostname;
  if (!host || host.length < 2) return false;
  if (host === "localhost" || host.startsWith("127.")) return true;
  if (!host.includes(".")) return false;
  return true;
}

/** Strip risky markup when persisting rich-text bullets (bold/italic from contentEditable). */
function sanitizeRichBulletHtml(html) {
  return String(html || "")
    .trim()
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
    .replace(/<\/?(?:script|iframe|object|embed|link|meta|style|base)\b[^>]*>/gi, "")
    .replace(/\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "")
    .replace(/javascript:/gi, "");
}

function readExpBulletContentsFromDom(items, rowRefs) {
  const r = items.length > 0 ? items : [""];
  return r.map((_, i) => {
    const el = rowRefs.current[i];
    const plain = (el?.innerText ?? "").replace(/\u00a0/g, " ").trim();
    if (!plain) return "";
    return sanitizeRichBulletHtml(el.innerHTML);
  });
}

/* ─── EditableField ───────────────────────────────
 *  contentEditable that only syncs state on blur,
 *  never re-renders mid-typing.
 */
function EditableField({ value, onChange, placeholder, className, style, tag: Tag = "span", multiline = false, lockCaretStart = false }) {
  const ref = useRef(null);
  const focused = useRef(false);
  const prevValue = useRef(value);
  const rafRef = useRef(null);
  const findFirstTextNode = useCallback((node) => {
    if (!node) return null;
    if (node.nodeType === Node.TEXT_NODE) return node;
    for (const child of node.childNodes) {
      const found = findFirstTextNode(child);
      if (found) return found;
    }
    return null;
  }, []);
  const placeCaretAtStart = useCallback((el) => {
    if (!el) return;
    const range = document.createRange();
    const sel = window.getSelection();
    const firstText = findFirstTextNode(el);
    if (firstText) range.setStart(firstText, 0);
    else range.setStart(el, 0);
    range.collapse(true);
    sel?.removeAllRanges();
    sel?.addRange(range);
  }, [findFirstTextNode]);

  const forceCaretAtStart = useCallback((el) => {
    if (!el) return;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      placeCaretAtStart(el);
    });
  }, [placeCaretAtStart]);

  useEffect(() => () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
  }, []);

  useEffect(() => {
    if (ref.current && !focused.current && value !== prevValue.current) {
      ref.current.innerText = value || "";
      prevValue.current = value;
    }
  }, [value]);

  useEffect(() => {
    if (ref.current) ref.current.innerText = value || "";
  }, []); // eslint-disable-line

  return (
    <Tag
      ref={ref}
      contentEditable
      suppressContentEditableWarning
      data-placeholder={placeholder}
      className={`rv-editable${!value ? " rv-editable-empty" : ""}${className ? " " + className : ""}`}
      style={style}
      onFocus={(e) => {
        focused.current = true;
        if (lockCaretStart) forceCaretAtStart(e.currentTarget);
      }}
      onBlur={(e) => {
        focused.current = false;
        const v = e.target.innerText;
        prevValue.current = v;
        if (v !== (value || "")) onChange(v);
      }}
      onInput={(e) => {
        // contentEditable can leave a stray <br> when empty; clear it so :empty placeholder appears.
        if (!e.currentTarget.innerText.trim()) e.currentTarget.innerHTML = "";
      }}
      onKeyDown={!multiline ? (e) => { if (e.key === "Enter") { e.preventDefault(); e.target.blur(); } } : undefined}
    />
  );
}

/* --- BulletEditor: native textarea (stable) -- */
function BulletEditor({ bullets = [], onChange, editable, placeholder = "Click to add bullet points…" }) {
  const [showToolbar, setShowToolbar] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const normalizeLine = useCallback((line) => String(line || "").replace(/^[•*\-]\s*/, "").trim(), []);
  const looksLikeBullets = useCallback((items) => {
    const list = (items || []).filter(Boolean).map((x) => String(x).trim());
    return list.length > 0 && list.every((line) => /^[•*\-]\s+/.test(line));
  }, []);
  const toText = useCallback((items, asBullets) => {
    const lines = (items || []).filter(Boolean).map(normalizeLine).filter(Boolean);
    return asBullets ? lines.map((line) => `• ${line}`).join("\n") : lines.join("\n");
  }, [normalizeLine]);
  const toBullets = useCallback((text, asBullets) => {
    const lines = String(text || "")
      .split(/\r?\n/)
      .map(normalizeLine)
      .filter(Boolean);
    return asBullets ? lines.map((line) => `• ${line}`) : lines;
  }, [normalizeLine]);

  const [bulletMode, setBulletMode] = useState(() => looksLikeBullets(bullets));
  const [text, setText] = useState(() => toText(bullets, looksLikeBullets(bullets)));
  const taRef = useRef(null);

  const withSelection = useCallback((fn) => {
    const ta = taRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    fn(ta, start, end);
  }, []);

  const applyInlineTag = useCallback((tag) => {
    withSelection((ta, start, end) => {
      const open = `<${tag}>`;
      const close = `</${tag}>`;
      const selected = ta.value.slice(start, end);
      const replacement = `${open}${selected}${close}`;
      ta.setRangeText(replacement, start, end, "end");
      setText(ta.value);
      ta.focus();
      const caretPos = selected ? start + replacement.length : start + open.length;
      ta.setSelectionRange(caretPos, caretPos);
    });
  }, [withSelection]);

  const toggleBulletPrefix = useCallback(() => {
    withSelection((ta, start, end) => {
      const value = ta.value;
      const blockStart = value.lastIndexOf("\n", Math.max(0, start - 1)) + 1;
      const blockEndIdx = value.indexOf("\n", end);
      const blockEnd = blockEndIdx === -1 ? value.length : blockEndIdx;
      const block = value.slice(blockStart, blockEnd);
      const lines = block.split("\n");
      const nonEmpty = lines.filter((l) => l.trim());
      const hasBullets = nonEmpty.length > 0 && nonEmpty.every((l) => l.startsWith("• "));
      const updated = lines.map((l) => {
        if (!l.trim()) return l;
        if (hasBullets) return l.replace(/^•\s*/, "");
        return l.startsWith("• ") ? l : `• ${l}`;
      });
      const replacement = updated.join("\n");
      ta.setRangeText(replacement, blockStart, blockEnd, "preserve");
      setText(ta.value);
      setBulletMode(!hasBullets);
      ta.focus();
    });
  }, [withSelection]);

  useEffect(() => {
    if (isFocused) return;
    const mode = looksLikeBullets(bullets);
    setBulletMode(mode);
    setText(toText(bullets, mode));
  }, [bullets, isFocused, looksLikeBullets, toText]);

  if (!editable) {
    const items = bullets
      .filter(Boolean)
      .map((line) => normalizeLine(line))
      .filter(Boolean);
    return items.length > 0 ? (
      <ul className="rv-bullets">
        {items.map((b, i) => <li key={i}>{b}</li>)}
      </ul>
    ) : null;
  }

  return (
    <div className="rv-bullet-editor-wrap">
      {showToolbar && (
        <div className="rv-bullet-toolbar-float">
          <button
            className="rv-bt-btn"
            title="Bold"
            onMouseDown={(e) => { e.preventDefault(); applyInlineTag("b"); }}
          ><b>B</b></button>
          <button
            className="rv-bt-btn"
            title="Italic"
            onMouseDown={(e) => { e.preventDefault(); applyInlineTag("i"); }}
          ><i>I</i></button>
          <button
            className="rv-bt-btn"
            title="Underline"
            onMouseDown={(e) => { e.preventDefault(); applyInlineTag("u"); }}
          ><u>U</u></button>
          <div className="rv-bt-sep" />
          <button
            className={`rv-bt-btn rv-bt-list${bulletMode ? " rv-bt-list-on" : ""}`}
            title="Toggle bullet list"
            onMouseDown={(e) => {
              e.preventDefault();
              toggleBulletPrefix();
            }}
          >
            <List size={14} />
          </button>
        </div>
      )}
      <textarea
        ref={taRef}
        className="rv-bullet-editor-textarea"
        placeholder={placeholder}
        value={text}
        onFocus={() => { setShowToolbar(true); setIsFocused(true); }}
        onBlur={() => {
          setShowToolbar(false);
          setIsFocused(false);
          const cleaned = toBullets(text, bulletMode);
          setText(toText(cleaned, bulletMode));
          onChange(cleaned);
        }}
        onChange={(e) => {
          const v = e.target.value;
          setText(v);
          const asBullets = looksLikeBullets(v.split(/\r?\n/));
          if (asBullets !== bulletMode) setBulletMode(asBullets);
        }}
      />
    </div>
  );
}

/* --- SectionWrap: hover shows + Add ----- */
function SectionWrap({ hoverLabel, onAdd, children }) {
  const [hov, setHov] = useState(false);
  return (
    <div
      className="rv-section-wrap"
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
    >
      {children}
      {hov && onAdd && (
        <div className="rv-section-actions">
          <button className="rv-section-add-btn" onClick={onAdd}>
            + {hoverLabel}
          </button>
        </div>
      )}
    </div>
  );
}


/* ─── ExpBullets: contentEditable per bullet, Enter=new ─ */
function ExpBullets({ bullets = [], onChange, editable }) {
  const normalizeLine = (line) => String(line || "").replace(/^[•*-]\s*/, "").trim();
  const items = bullets.map(normalizeLine);
  const rowRefs = useRef([]);
  const wrapRef = useRef(null);
  const [showFmtBar, setShowFmtBar] = useState(false);

  /* flush all rows → call onChange */
  const flush = useCallback(() => {
    const contents = readExpBulletContentsFromDom(items, rowRefs);
    onChange(contents.map((c) => (c ? `• ${c}` : "")));
  }, [items, onChange]);

  /* place caret at end of a contentEditable node */
  const caretAtEnd = (el) => {
    if (!el) return;
    const range = document.createRange();
    const sel = window.getSelection();
    range.selectNodeContents(el);
    range.collapse(false);
    sel?.removeAllRanges();
    sel?.addRange(range);
    el.focus();
  };

  /* place caret at start */
  const caretAtStart = (el) => {
    if (!el) return;
    const range = document.createRange();
    const sel = window.getSelection();
    range.setStart(el, 0);
    range.collapse(true);
    sel?.removeAllRanges();
    sel?.addRange(range);
    el.focus();
  };

  const handleKeyDown = (e, idx) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const contents = readExpBulletContentsFromDom(items, rowRefs);
      contents.splice(idx + 1, 0, "");
      onChange(contents.map((c) => (c ? `• ${c}` : "")));
      setTimeout(() => caretAtStart(rowRefs.current[idx + 1]), 20);
    } else if (e.key === "Backspace") {
      const text = rowRefs.current[idx]?.innerText?.trim() ?? "";
      if (text === "" && items.length > 1) {
        e.preventDefault();
        const contents = readExpBulletContentsFromDom(items, rowRefs).filter((_, i) => i !== idx);
        onChange(contents.some((c) => c) ? contents.map((c) => (c ? `• ${c}` : "")) : [""]);
        const focusTarget = idx > 0 ? idx - 1 : 0;
        setTimeout(() => caretAtEnd(rowRefs.current[focusTarget]), 20);
      }
    }
  };

  /* sync ref innerHTML on item changes (when not focused) */
  useEffect(() => {
    items.forEach((txt, i) => {
      const el = rowRefs.current[i];
      if (el && document.activeElement !== el) {
        el.innerHTML = txt;
      }
    });
  }, [items]);

  if (!editable) {
    const visible = items.filter(Boolean);
    return visible.length > 0 ? (
      <ul className="rv-bullets">
        {visible.map((b, i) => <li key={i} dangerouslySetInnerHTML={{ __html: b }} />)}
      </ul>
    ) : null;
  }

  /* ensure at least one row */
  const rows = items.length > 0 ? items : [""];

  return (
    <div
      ref={wrapRef}
      className="rv-exp-bullets-wrap"
      onFocus={() => setShowFmtBar(true)}
      onBlur={(e) => {
        const w = wrapRef.current;
        if (w && !w.contains(e.relatedTarget)) setShowFmtBar(false);
      }}
    >
      {showFmtBar && (
        <div className="rv-exp-bullet-toolbar rv-bullet-toolbar-float" aria-label="Bullet formatting">
          <button
            type="button"
            className="rv-bt-btn"
            title="Bold (Ctrl+B)"
            onMouseDown={(e) => { e.preventDefault(); document.execCommand("bold"); }}
          ><b>B</b></button>
          <button
            type="button"
            className="rv-bt-btn"
            title="Italic (Ctrl+I)"
            onMouseDown={(e) => { e.preventDefault(); document.execCommand("italic"); }}
          ><i>I</i></button>
        </div>
      )}
      {rows.map((b, idx) => (
        <div key={idx} className="rv-exp-bullet-row">
          <span className="rv-bullet-dot">•</span>
          <div
            ref={(el) => { rowRefs.current[idx] = el; }}
            className="rv-exp-bullet-ce"
            contentEditable
            suppressContentEditableWarning
            data-placeholder="Add bullet point…"
            onBlur={flush}
            onKeyDown={(e) => handleKeyDown(e, idx)}
          />
          {items.length > 1 && (
            <button
              type="button"
              className="rv-tb-btn rv-tb-del rv-exp-bullet-del"
              onMouseDown={(e) => {
                e.preventDefault();
                const contents = readExpBulletContentsFromDom(items, rowRefs).filter((_, i) => i !== idx);
                onChange(contents.some((c) => c) ? contents.map((c) => (c ? `• ${c}` : "")) : [""]);
              }}
              title="Remove bullet"
            ><Trash2 size={11} /></button>
          )}
        </div>
      ))}
    </div>
  );
}

/* ─── ExpItem: uses input fields for bullets ──────── */
function ExpItem({ exp, expStyle, editable, updItem, removeItem, onBulletsChange }) {
  const [hov, setHov] = useState(false);

  return (
    <div
      className={`rv-exp-item${hov && editable ? " hovered" : ""}`}
      style={{ ...expStyle, position: "relative" }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
    >
      {editable && hov && (
        <div className="rv-item-toolbar">
          <button
            className="rv-tb-btn rv-tb-del"
            onMouseDown={(e) => { e.preventDefault(); removeItem("experience", exp.id); }}
          ><Trash2 size={13} /></button>
        </div>
      )}

      <div className="rv-exp-header">
        <div className="rv-exp-title">
          <EditableField value={exp.title}   onChange={v => updItem("experience", exp.id, "title",   v)} placeholder="Job Title" style={{ fontWeight: 700 }} />
          <span className={`rv-exp-company-wrap${!exp.company ? " rv-exp-company-empty" : ""}`}>
            <span style={{ fontWeight: 400 }}> – </span>
            <EditableField value={exp.company} onChange={v => updItem("experience", exp.id, "company", v)} placeholder="Company" />
          </span>
        </div>
        <div className="rv-exp-meta" style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <EditableField value={exp.startDate} onChange={v => updItem("experience", exp.id, "startDate", v)} placeholder="Start" />
          <span> – </span>
          <EditableField value={exp.endDate} onChange={v => updItem("experience", exp.id, "endDate", v)} placeholder="End" />
          {(exp.location || editable) && (
            <><span> | </span><EditableField value={exp.location} onChange={v => updItem("experience", exp.id, "location", v)} placeholder="Location" /></>
          )}
        </div>
      </div>

      <ExpBullets
        bullets={exp.bullets}
        onChange={onBulletsChange}
        editable={editable}
      />
    </div>
  );
}

/* ─── ProjectItem ────────────────────────────────── */
function ProjectItem({ proj, projStyle, editable, updItem, removeItem, onBulletsChange, printMode = false }) {
  const [hov, setHov] = useState(false);
  const [projEditOpen, setProjEditOpen] = useState(false);
  const projEditFieldsRef = useRef(null);
  const hasLink = isRealProjectUrl(proj.url);

  useEffect(() => {
    if (printMode) setProjEditOpen(false);
  }, [printMode]);

  const flushProjectEditFields = useCallback(() => {
    const root = projEditFieldsRef.current;
    if (!root) return;
    const editables = root.querySelectorAll(".rv-editable");
    const titleRaw = editables[0] ? String(editables[0].innerText ?? "").trim() : "";
    const urlRaw = editables[1] ? String(editables[1].innerText ?? "").trim() : "";
    if (titleRaw !== String(proj.title ?? "").trim()) {
      updItem("projects", proj.id, "title", titleRaw);
    }
    if (urlRaw !== String(proj.url ?? "").trim()) {
      updItem("projects", proj.id, "url", urlRaw);
    }
  }, [proj.id, proj.title, proj.url, updItem]);

  const titleNode = (() => {
    if (editable && !printMode && projEditOpen) {
      return (
        <div ref={projEditFieldsRef} className="rv-proj-edit-fields">
          <EditableField
            value={proj.title}
            onChange={(v) => updItem("projects", proj.id, "title", v)}
            placeholder="Project Name"
            style={{ fontWeight: 700 }}
          />
          <EditableField
            value={proj.url}
            onChange={(v) => updItem("projects", proj.id, "url", v)}
            placeholder="Project URL"
            className="rv-proj-url-input"
          />
          <button
            type="button"
            className="rv-proj-edit-done"
            onClick={() => {
              flushProjectEditFields();
              setProjEditOpen(false);
            }}
          >
            Done
          </button>
        </div>
      );
    }
    if (hasLink) {
      return (
        <a
          href={formatProfileHref(proj.url)}
          target="_blank"
          rel="noreferrer"
          className="rv-proj-title-link"
          style={{ fontWeight: 700 }}
        >
          {String(proj.title || "").trim() || "Project"}
        </a>
      );
    }
    if (!editable) {
      return <span style={{ fontWeight: 700 }}>{proj.title}</span>;
    }
    return (
      <EditableField
        value={proj.title}
        onChange={(v) => updItem("projects", proj.id, "title", v)}
        placeholder="Project Name"
        style={{ fontWeight: 700 }}
      />
    );
  })();

  return (
    <div
      className={`rv-exp-item${hov && editable ? " hovered" : ""}`}
      style={{ ...projStyle, position: "relative" }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
    >
      {editable && hov && (
        <div className="rv-item-toolbar">
          <button
            type="button"
            className="rv-tb-btn"
            title="Edit name & link"
            onClick={() => setProjEditOpen(true)}
          >
            <Pencil size={13} />
          </button>
          <button
            type="button"
            className="rv-tb-btn rv-tb-del"
            onMouseDown={(e) => { e.preventDefault(); removeItem("projects", proj.id); }}
          ><Trash2 size={13} /></button>
        </div>
      )}

      <div className="rv-exp-header">
        <div className="rv-exp-title rv-proj-title-stack">
          {titleNode}
        </div>
        <div className="rv-exp-meta" style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <EditableField value={proj.startDate} onChange={v => updItem("projects", proj.id, "startDate", v)} placeholder="Start" />
          {(proj.startDate || proj.endDate || editable) && <span> – </span>}
          <EditableField value={proj.endDate} onChange={v => updItem("projects", proj.id, "endDate", v)} placeholder="End" />
        </div>
      </div>

      <ExpBullets
        bullets={proj.bullets || []}
        onChange={onBulletsChange}
        editable={editable}
      />
    </div>
  );
}

/* ─── Main Component ────────────────────────────── */
export default function ResumePreview({ resume, fmt, sectionOrder, hiddenSections, onChange, previewRef, showAvatar, showDob, avatarSize = 110, avatarShape = "circle", avatarRadius = 50, headerAlign = "center", avatarSide = "left", printMode = false }) {
  const { personalInfo: p, summary, experience, education, certifications, skills, sectionTitles = {} } = resume;
  const st = {
    summary: "Professional Summary",
    experience: "Work Experience",
    education: "Education",
    certifications: "Certifications",
    skills: "Skills",
    projects: "Projects",
    ...sectionTitles,
  };

  const [cropImageSrc, setCropImageSrc] = useState(null);

  /* Page break tracking */
  const [pageBreaks, setPageBreaks] = useState([]);
  useEffect(() => {
    const el = previewRef.current;
    if (!el) return;
    const obs = new ResizeObserver(() => {
      const h = el.offsetHeight / MM_TO_PX;
      const bs = [];
      for (let i = 1; i * PAGE_H_MM < h; i++) bs.push(i * PAGE_H_MM);
      setPageBreaks(bs);
    });
    obs.observe(el);
    return () => obs.disconnect();
  }, [previewRef]);

  /* State helpers */
  const upd = useCallback((path, value) => {
    if (!onChange) return;
    onChange(prev => {
      const next = JSON.parse(JSON.stringify(prev));
      const parts = path.split(".");
      let obj = next;
      for (let i = 0; i < parts.length - 1; i++) obj = obj[parts[i]];
      obj[parts[parts.length - 1]] = value;
      return next;
    });
  }, [onChange]);

  const updItem = useCallback((section, id, field, value) => {
    if (!onChange) return;
    onChange(prev => {
      const next = JSON.parse(JSON.stringify(prev));
      const item = next[section].find(x => x.id === id);
      if (item) item[field] = value;
      return next;
    });
  }, [onChange]);

  const addItem = useCallback((section) => {
    if (!onChange) return;
    const uid = () => Date.now() + Math.random();
    const isCustom = section.startsWith("custom_");
    const blankMap = {
      experience:     { id: uid(), title: "", company: "", startDate: "", endDate: "", location: "", bullets: [""] },
      education:      { id: uid(), institution: "", degree: "", startDate: "", endDate: "" },
      certifications: { id: uid(), name: "", issuer: "", date: "" },
      skills:         { id: uid(), label: "", value: "" },
      projects:       { id: uid(), title: "", url: "", startDate: "", endDate: "", bullets: [""] },
    };
    const blank = isCustom ? { id: uid(), label: "", value: "" } : blankMap[section];
    if (!blank) return;
    onChange(prev => ({ ...prev, [section]: [...(prev[section] || []), blank] }));
  }, [onChange]);

  const removeItem = useCallback((section, id) => {
    if (!onChange) return;
    onChange(prev => ({ ...prev, [section]: prev[section].filter(x => x.id !== id) }));
  }, [onChange]);

  const updBulletsForSection = useCallback((section, itemId, bullets) => {
    if (!onChange) return;
    onChange(prev => {
      const next = JSON.parse(JSON.stringify(prev));
      const item = next[section]?.find(x => x.id === itemId);
      if (item) item.bullets = bullets;
      return next;
    });
  }, [onChange]);

  /* Styles */
  const headingPt = (BASE_HEADING_PT * fmt.headingSizeScale) / 100;
  const bodyPt    = (BASE_BODY_PT    * fmt.bodySizeScale)    / 100;
  const lineH     = (BASE_LINE_HEIGHT * fmt.lineSpacingScale) / 100;

  const previewStyle = {
    "--rv-body-size": `${bodyPt}pt`,
    fontFamily: `${fmt.bodyFont}, sans-serif`,
    fontSize: "var(--rv-body-size)",
    lineHeight: lineH,
    padding: `${fmt.marginTopBottom}mm ${fmt.marginLeftRight}mm`,
    color: "#111",
    position: "relative",
  };
  const secStyle = { marginTop: `${fmt.sectionSpacing}pt` };
  const titStyle = {
    fontFamily: `${fmt.headingFont}, sans-serif`,
    fontSize: `${headingPt}pt`,
    fontWeight: fmt.headingBold ? 700 : 400,
    textAlign: headerAlign,
  };
  const divStyle = { marginBottom: `${fmt.titleContentSpacing}pt` };
  const expStyle = { marginBottom: `${fmt.contentBlockSpacing}pt` };

  const editable = !!onChange;
  const shouldRenderLinks = !editable || printMode;
  const contactItems = [
    { key: "location", value: p.location, placeholder: "Country", kind: "text" },
    { key: "phone", value: p.phone, placeholder: "+1 000 000 0000", kind: "text" },
    { key: "email", value: p.email, placeholder: "email@example.com", kind: "email" },
    { key: "linkedin", value: p.linkedin, placeholder: "linkedin.com/in/…", kind: "link" },
    { key: "github", value: p.github, placeholder: "github.com/…", kind: "link" },
  ];
  const visibleContactItems = editable ? contactItems : contactItems.filter((item) => item.value);

  /* Section renderers */
  const sectionRenderers = {
    summary: (
      <section key="summary" className="rv-section" style={secStyle}>
        <h2 className="rv-section-title" style={titStyle}>
          {editable
            ? <EditableField value={st.summary} onChange={v => upd("sectionTitles.summary", v)} placeholder="Section Title" />
            : st.summary}
        </h2>
        <hr className="rv-divider" style={divStyle} />
        <EditableField tag="p" className="rv-summary-text" value={summary} onChange={v => upd("summary", v)} placeholder="Write your summary here…" multiline />
      </section>
    ),

    experience: (
      <SectionWrap
        key="experience"
        sectionKey="experience"
        hoverLabel="Add Experience"
        onAdd={editable ? () => addItem("experience") : null}
      >
        <section className="rv-section" style={secStyle}>
          <h2 className="rv-section-title" style={titStyle}>
            {editable
              ? <EditableField value={st.experience} onChange={v => upd("sectionTitles.experience", v)} placeholder="Section Title" />
              : st.experience}
          </h2>
          <hr className="rv-divider" style={divStyle} />
          {experience.map(exp => (
            <ExpItem
              key={exp.id}
              exp={exp}
              expStyle={expStyle}
              editable={editable}
              updItem={updItem}
              removeItem={removeItem}
              onBulletsChange={(bullets) => updBulletsForSection("experience", exp.id, bullets)}
            />
          ))}
        </section>
      </SectionWrap>
    ),

    projects: (
      <SectionWrap key="projects" sectionKey="projects" hoverLabel="Add Project" onAdd={editable ? () => addItem("projects") : null}>
        <section className="rv-section" style={secStyle}>
          <h2 className="rv-section-title" style={titStyle}>
            {editable
              ? <EditableField value={st.projects} onChange={v => upd("sectionTitles.projects", v)} placeholder="Section Title" />
              : st.projects}
          </h2>
          <hr className="rv-divider" style={divStyle} />
          {(resume.projects || []).map(proj => (
            <ProjectItem
              key={proj.id}
              proj={proj}
              projStyle={expStyle}
              editable={editable}
              printMode={printMode}
              updItem={updItem}
              removeItem={removeItem}
              onBulletsChange={(bullets) => updBulletsForSection("projects", proj.id, bullets)}
            />
          ))}
        </section>
      </SectionWrap>
    ),


    education: (
      <SectionWrap key="education" sectionKey="education" hoverLabel="Add Education" onAdd={editable ? () => addItem("education") : null}>
        <section className="rv-section" style={secStyle}>
          <h2 className="rv-section-title" style={titStyle}>
            {editable
              ? <EditableField value={st.education} onChange={v => upd("sectionTitles.education", v)} placeholder="Section Title" />
              : st.education}
          </h2>
          <hr className="rv-divider" style={divStyle} />
          {education.map((edu) => (
            <div key={edu.id} className="rv-edu-item">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                <EditableField value={edu.institution} onChange={v => updItem("education", edu.id, "institution", v)} placeholder="Institution" style={{ fontWeight: 700 }} />
                <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                  <EditableField value={edu.startDate} onChange={v => updItem("education", edu.id, "startDate", v)} placeholder="Start" />
                  {(edu.startDate || edu.endDate) && <span> – </span>}
                  <EditableField value={edu.endDate} onChange={v => updItem("education", edu.id, "endDate", v)} placeholder="End" />
                  {editable && <button className="rv-item-remove" onClick={() => removeItem("education", edu.id)}><Trash2 size={12} /></button>}
                </div>
              </div>
              <EditableField tag="div" className="rv-edu-degree" value={edu.degree} onChange={v => updItem("education", edu.id, "degree", v)} placeholder="Degree / Field of Study" />
            </div>
          ))}
        </section>
      </SectionWrap>
    ),

    certifications: (
      <SectionWrap key="certifications" sectionKey="certifications" hoverLabel="Add Certification" onAdd={editable ? () => addItem("certifications") : null}>
        <section className="rv-section" style={secStyle}>
          <h2 className="rv-section-title" style={titStyle}>
            {editable
              ? <EditableField value={st.certifications} onChange={v => upd("sectionTitles.certifications", v)} placeholder="Section Title" />
              : st.certifications}
          </h2>
          <hr className="rv-divider" style={divStyle} />
          {certifications.map((cert) => (
            <div key={cert.id} className="rv-cert-item">
              <div className="rv-cert-left">
                <EditableField value={cert.name} onChange={v => updItem("certifications", cert.id, "name", v)} placeholder="Certification Name" style={{ fontWeight: 700 }} />
                <span> – </span>
                <EditableField value={cert.issuer} onChange={v => updItem("certifications", cert.id, "issuer", v)} placeholder="Issuer" />
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <EditableField className="rv-cert-date" value={cert.date} onChange={v => updItem("certifications", cert.id, "date", v)} placeholder="Date" />
                {editable && <button className="rv-item-remove" onClick={() => removeItem("certifications", cert.id)}><Trash2 size={12} /></button>}
              </div>
            </div>
          ))}
        </section>
      </SectionWrap>
    ),

    skills: (
      <SectionWrap key="skills" sectionKey="skills" hoverLabel="Add Skill Group" onAdd={editable ? () => addItem("skills") : null}>
        <section className="rv-section" style={secStyle}>
          <h2 className="rv-section-title" style={titStyle}>
            {editable
              ? <EditableField value={st.skills} onChange={v => upd("sectionTitles.skills", v)} placeholder="Section Title" />
              : st.skills}
          </h2>
          <hr className="rv-divider" style={divStyle} />
          <div className="rv-skills">
            {skills.map((skill) => (
              <div key={skill.id} className="rv-skill-row">
                <EditableField
                  value={skill.value || ""}
                  onChange={(v) => {
                    updItem("skills", skill.id, "value", v);
                    if (skill.label) updItem("skills", skill.id, "label", "");
                  }}
                  placeholder="Python, JavaScript, React, Node.js"
                />
                {editable && <button className="rv-item-remove" onClick={() => removeItem("skills", skill.id)}><Trash2 size={12} /></button>}
              </div>
            ))}
          </div>
        </section>
      </SectionWrap>
    ),
  };

  return (
    <div className="resume-preview" ref={previewRef} id="resume-preview" style={previewStyle}>

      {pageBreaks.map((mm, i) => (
        <div key={i} className="rv-page-break-indicator" style={{ top: `${mm}mm` }}>
          <span className="rv-page-label">Page {i + 2}</span>
        </div>
      ))}

      {/* Header */}
      <div
        className={`rv-header${showAvatar ? " rv-header-with-avatar" : ""}`}
        style={showAvatar && avatarSide === "right" ? { flexDirection: "row-reverse" } : undefined}
      >
        {/* Avatar column */}
        {showAvatar && (
          <div className="rv-avatar-col">
            <div
              className="rv-avatar-wrap"
              style={{
                width: avatarSize,
                height: avatarSize,
                borderRadius: `${avatarRadius}%`,
              }}
            >
              {p.avatar
                ? <img src={p.avatar} alt="Avatar" className="rv-avatar-img" />
                : (
                    <div className="rv-avatar-placeholder">
                      {icons.camera}
                      <span>Add Photo</span>
                    </div>
                  )
              }
              {editable && (
                <>
                  <label className="rv-avatar-overlay" title={p.avatar ? "Change photo" : "Upload photo"}>
                    {icons.camera}
                    <input
                      type="file"
                      accept="image/*"
                      style={{ display: "none" }}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const reader = new FileReader();
                        reader.onload = (ev) => setCropImageSrc(ev.target.result);
                        reader.readAsDataURL(file);
                        e.target.value = "";
                      }}
                    />
                  </label>
                  {p.avatar && (
                    <button
                      className="rv-avatar-remove"
                      title="Remove photo"
                      onClick={() => upd("personalInfo.avatar", "")}
                    >
                      {icons.remove}
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {/* Info column */}
        <div className="rv-header-info">
          <EditableField
            tag="h1"
            className="rv-name"
            value={p.name}
            onChange={v => upd("personalInfo.name", v)}
            placeholder="Your Name"
            lockCaretStart
            style={{ fontFamily: `${fmt.headingFont}, sans-serif` }}
          />
          {(p.position || editable) && (
            <EditableField
              tag="div"
              className={`rv-position${!p.position ? " rv-editable-empty" : ""}`}
              value={p.position}
              onChange={v => upd("personalInfo.position", v)}
              placeholder="Job Title / Position"
              lockCaretStart
            />
          )}
          <div className="rv-contacts">
            {visibleContactItems.length > 0 && (
              <div className="rv-contact-links">
                {visibleContactItems.map((item, index) => (
                  <Fragment key={item.key}>
                    {index > 0 && <span className="rv-contact-separator">|</span>}
                    <span className="rv-contact-item rv-contact-link-item">
                      {editable ? (
                        shouldRenderLinks && item.kind === "email" && item.value ? (
                          <a href={`mailto:${item.value}`}>{item.value}</a>
                        ) : shouldRenderLinks && item.kind === "link" && item.value ? (
                          <a href={formatProfileHref(item.value)} target="_blank" rel="noreferrer">
                            {item.value}
                          </a>
                        ) : (
                          <EditableField
                            value={item.value}
                            onChange={(v) => upd(`personalInfo.${item.key}`, item.kind === "link" ? formatProfileHref(v) : v)}
                            placeholder={item.placeholder}
                            lockCaretStart
                          />
                        )
                      ) : item.kind === "email" ? (
                        <a href={`mailto:${item.value}`}>{item.value}</a>
                      ) : item.kind === "link" ? (
                        <a href={formatProfileHref(item.value)} target="_blank" rel="noreferrer">
                          {item.value}
                        </a>
                      ) : (
                        <span>{item.value}</span>
                      )}
                    </span>
                  </Fragment>
                ))}
              </div>
            )}
            {showDob && (
              <>
                {visibleContactItems.length > 0 && <span className="rv-contact-separator">|</span>}
                <span className="rv-contact-item">
                  {icons.calendar}
                  <EditableField value={p.dob} onChange={v => upd("personalInfo.dob", v)} placeholder="Date of Birth" lockCaretStart />
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {(sectionOrder || DEFAULT_ORDER)
        .filter(key => !hiddenSections?.has(key))
        .map(key => {
          if (sectionRenderers[key]) return sectionRenderers[key];
          if (key.startsWith("custom_")) {
            const dataItems = resume[key] || [];
            const customTitle = st[key] || "Custom Section";
            return (
              <SectionWrap key={key} sectionKey={key} hoverLabel="Add Item" onAdd={editable ? () => addItem(key) : null}>
                <section className="rv-section" style={secStyle}>
                  <h2 className="rv-section-title" style={titStyle}>
                    {editable
                      ? <EditableField value={customTitle} onChange={v => upd(`sectionTitles.${key}`, v)} placeholder="Section Title" />
                      : customTitle}
                  </h2>
                  <hr className="rv-divider" style={divStyle} />
                  <div className="rv-skills">
                    {dataItems.map((item) => (
                      <div key={item.id} className="rv-skill-row">
                        <EditableField
                          value={item.value || ""}
                          onChange={(v) => {
                            updItem(key, item.id, "value", v);
                            if (item.label) updItem(key, item.id, "label", "");
                          }}
                          placeholder="Your custom items here"
                        />
                        {editable && <button className="rv-item-remove" onClick={() => removeItem(key, item.id)}><Trash2 size={12} /></button>}
                      </div>
                    ))}
                  </div>
                </section>
              </SectionWrap>
            );
          }
          return null;
        })}

      {cropImageSrc && (
        <ImageCropModal
          src={cropImageSrc}
          shape={avatarShape}
          onComplete={(croppedBase64) => {
            upd("personalInfo.avatar", croppedBase64);
            setCropImageSrc(null);
          }}
          onCancel={() => setCropImageSrc(null)}
        />
      )}
    </div>
  );
}
