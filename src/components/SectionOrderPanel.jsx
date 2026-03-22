import { useState, useRef, useEffect } from "react";

const SECTION_META = {
  summary:        { label: "Professional Summary" },
  experience:     { label: "Work Experience"      },
  education:      { label: "Education"            },
  certifications: { label: "Certifications"       },
  skills:         { label: "Skills"               },
  projects:       { label: "Projects"             },
};

export const DEFAULT_SECTION_ORDER = ["summary", "experience", "projects", "education", "certifications", "skills"];

// Grip SVG
const Grip = () => (
  <svg width="11" height="15" viewBox="0 0 11 15" fill="currentColor">
    <circle cx="3" cy="2.5"  r="1.3"/><circle cx="8.5" cy="2.5"  r="1.3"/>
    <circle cx="3" cy="7.5"  r="1.3"/><circle cx="8.5" cy="7.5"  r="1.3"/>
    <circle cx="3" cy="12.5" r="1.3"/><circle cx="8.5" cy="12.5" r="1.3"/>
  </svg>
);

const EyeOn = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
  </svg>
);
const EyeOff = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
    <line x1="1" y1="1" x2="23" y2="23"/>
  </svg>
);

export default function SectionOrderPanel({ order, onChange, hidden, onHiddenChange }) {
  const [dragIdx, setDragIdx] = useState(null);
  const [dropGap, setDropGap] = useState(null);
  const [clone,   setClone]   = useState(null);

  const listRef = useRef(null);
  const dropRef = useRef(null);
  const fromRef = useRef(null);

  useEffect(() => { dropRef.current = dropGap; }, [dropGap]);

  const calcGap = (clientY) => {
    const items = [...(listRef.current?.querySelectorAll(".sop-item") ?? [])];
    for (let i = 0; i < items.length; i++) {
      const r = items[i].getBoundingClientRect();
      if (clientY < r.top + r.height / 2) return i;
    }
    return items.length;
  };

  const startDrag = (e, idx) => {
    e.preventDefault();
    const items = [...(listRef.current?.querySelectorAll(".sop-item") ?? [])];
    const r = items[idx]?.getBoundingClientRect();
    if (!r) return;

    const offsetY = e.clientY - r.top;
    fromRef.current = idx;
    dropRef.current = idx;
    setDragIdx(idx);
    setDropGap(idx);
    setClone({ x: r.left, y: r.top, w: r.width, h: r.height, offsetY });

    const onMove = (e) => {
      setClone(prev => prev ? { ...prev, y: e.clientY - prev.offsetY } : null);
      const g = calcGap(e.clientY);
      if (g !== dropRef.current) { dropRef.current = g; setDropGap(g); }
    };

    const onUp = () => {
      const from = fromRef.current;
      const to   = dropRef.current;
      if (from != null && to != null) {
        const ins = from < to ? to - 1 : to;
        if (from !== ins) {
          const next = [...order];
          const [moved] = next.splice(from, 1);
          next.splice(ins, 0, moved);
          onChange(next);
        }
      }
      setDragIdx(null); setDropGap(null); setClone(null);
      fromRef.current = null;
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup",   onUp);
    };

    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup",   onUp);
  };

  const toggleHide = (key) => {
    const next = new Set(hidden);
    if (next.has(key)) next.delete(key); else next.add(key);
    onHiddenChange(next);
  };

  const isDragging = dragIdx !== null;

  const Placeholder = () => (
    <div style={{
      height: clone?.h || 44,
      border: "2px dashed #aaa",
      borderRadius: 8,
      background: "rgba(0,0,0,.03)",
      margin: "3px 0",
      boxSizing: "border-box",
    }} />
  );

  return (
    <div className="section-order-panel" style={{ userSelect: isDragging ? "none" : "auto" }}>
      <p className="section-order-hint">
        Drag <strong>⠿</strong> to reorder · <strong>👁</strong> to show/hide
      </p>

      <div className="section-order-list" ref={listRef}>
        {isDragging && dropGap === 0 && dragIdx !== 0 && <Placeholder />}

        {order.map((key, idx) => {
          const meta    = SECTION_META[key] || { label: key };
          const isGhost = isDragging && dragIdx === idx;
          const isHidden = hidden?.has(key);
          const showAfter = isDragging && dropGap === idx + 1 && dragIdx !== idx && dragIdx !== idx + 1;

          return (
            <div key={key} className="sop-slot">
              <div className={`sop-item${isGhost ? " ghost" : ""}${isHidden ? " sop-hidden" : ""}`}>
                <div className="sop-grip" onMouseDown={(e) => startDrag(e, idx)} title="Drag to reorder">
                  <Grip />
                </div>
                <span className="sop-label" style={{ opacity: isHidden ? 0.45 : 1 }}>{meta.label}</span>
                <button
                  className={`sop-eye${isHidden ? " sop-eye-off" : ""}`}
                  onClick={() => toggleHide(key)}
                  title={isHidden ? "Show section" : "Hide section"}
                >
                  {isHidden ? <EyeOff /> : <EyeOn />}
                </button>
              </div>

              {showAfter && <Placeholder />}
            </div>
          );
        })}
      </div>

      {clone && (
        <div style={{ position: "fixed", left: clone.x, top: clone.y, width: clone.w, height: clone.h, pointerEvents: "none", zIndex: 9999 }}>
          <div className="sop-item is-clone">
            <div className="sop-grip"><Grip /></div>
            <span className="sop-label">{SECTION_META[order[dragIdx]]?.label}</span>
          </div>
        </div>
      )}
    </div>
  );
}
