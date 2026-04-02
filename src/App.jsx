import { useRef, useState, useEffect } from "react";
import ResumePreview from "./components/ResumePreview";
import FormattingPanel from "./components/FormattingPanel";
import SectionOrderPanel, { DEFAULT_SECTION_ORDER } from "./components/SectionOrderPanel";
import ImportModal from "./components/ImportModal";
import { defaultResume } from "./data/defaultResume";
import { defaultFormatting } from "./data/defaultFormatting";
import "./App.css";

export default function App() {
  const [resume, setResume] = useState(() => {
    try { return JSON.parse(localStorage.getItem("rb-resume")) || defaultResume; }
    catch { return defaultResume; }
  });
  const [fmt, setFmt] = useState(() => {
    try { return JSON.parse(localStorage.getItem("rb-fmt-v3")) || defaultFormatting; }
    catch { return defaultFormatting; }
  });
  const [sectionOrder, setSectionOrder] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("rb-order")) || [];
      if (!saved.length) return DEFAULT_SECTION_ORDER;
      // Append any new sections not yet in saved order
      const missing = DEFAULT_SECTION_ORDER.filter(k => !saved.includes(k));
      return [...saved, ...missing];
    } catch { return DEFAULT_SECTION_ORDER; }
  });
  const [hiddenSections, setHiddenSections] = useState(() => {
    try {
      const saved = localStorage.getItem("rb-hidden");
      return new Set(saved ? JSON.parse(saved) : ["projects"]);
    } catch { return new Set(["projects"]); }
  });
  const [tab, setTab] = useState("layout");
  const [showImport, setShowImport] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const previewRef = useRef(null);

  useEffect(() => { localStorage.setItem("rb-resume",  JSON.stringify(resume));       }, [resume]);
  useEffect(() => { localStorage.setItem("rb-fmt-v3",  JSON.stringify(fmt));          }, [fmt]);
  useEffect(() => { localStorage.setItem("rb-order",   JSON.stringify(sectionOrder)); }, [sectionOrder]);
  useEffect(() => { localStorage.setItem("rb-hidden",  JSON.stringify([...hiddenSections])); }, [hiddenSections]);

  const handleAddCustomSection = () => {
    const key = `custom_${Date.now()}`;
    setResume(prev => ({
      ...prev,
      [key]: [{ id: `${key}-1`, label: "", value: "" }],
      sectionTitles: { ...prev.sectionTitles, [key]: "Custom Section" }
    }));
    setSectionOrder(prev => [...prev, key]);
  };

  const handleRemoveCustomSection = (key) => {
    if (!window.confirm("Are you sure you want to delete this custom section permanently?")) return;
    setSectionOrder(prev => prev.filter(k => k !== key));
    setHiddenSections(prev => { const n = new Set(prev); n.delete(key); return n; });
    setResume(prev => {
      const next = { ...prev };
      delete next[key];
      if (next.sectionTitles) {
        delete next.sectionTitles[key];
      }
      return next;
    });
  };

  const handleDownloadPDF = () => { window.print(); };
  const handleClearAllData = () => {
    setResume(defaultResume);
    setFmt(defaultFormatting);
    setSectionOrder(DEFAULT_SECTION_ORDER);
    setHiddenSections(new Set(["projects"]));
    localStorage.removeItem("rb-resume");
    localStorage.removeItem("rb-fmt-v3");
    localStorage.removeItem("rb-order");
    localStorage.removeItem("rb-hidden");
    setShowResetConfirm(false);
  };

  return (
    <div className="app-shell">
      {/* Top Bar */}
      <header className="app-header">
        <div className="header-left">
          <span className="app-logo">📄</span>
          <span className="app-title">Resume Builder</span>
          <span className="app-badge">Edit on preview</span>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button className="btn-clear" onClick={() => setShowResetConfirm(true)}>
            Reset Data
          </button>
          <button className="btn-import" onClick={() => setShowImport(true)}>
            ⬆ Import PDF
          </button>
          <button className="btn-download" onClick={handleDownloadPDF}>
            ⬇ Download PDF
          </button>
        </div>
      </header>

      {showImport && (
        <ImportModal
          onImport={(parsed) => setResume(parsed)}
          onClose={() => setShowImport(false)}
        />
      )}

      {showResetConfirm && (
        <div className="import-overlay" onClick={() => setShowResetConfirm(false)}>
          <div className="import-modal" onClick={(e) => e.stopPropagation()}>
            <button className="import-close" onClick={() => setShowResetConfirm(false)}>×</button>
            <h3 className="import-title">Reset All Data</h3>
            <p className="import-sub">
              This will clear resume content and reset layout/format settings.
            </p>
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 8 }}>
              <button className="btn-import" onClick={() => setShowResetConfirm(false)}>Cancel</button>
              <button className="btn-clear" onClick={handleClearAllData}>Reset</button>
            </div>
          </div>
        </div>
      )}

      {/* Main Layout */}
      <main className="app-main">
        {/* Left – Settings Panel */}
        <aside className="editor-panel">
          <div className="editor-tabs">
            <button className={`editor-tab ${tab === "layout" ? "active" : ""}`} onClick={() => setTab("layout")}>
              Layout
            </button>
            <button className={`editor-tab ${tab === "format" ? "active" : ""}`} onClick={() => setTab("format")}>
              Formatting
            </button>
          </div>
          <div className="editor-scroll">
            {tab === "layout"  && <SectionOrderPanel order={sectionOrder} onChange={setSectionOrder} hidden={hiddenSections} onHiddenChange={setHiddenSections} sectionTitles={resume.sectionTitles} onAddCustomSection={handleAddCustomSection} onRemoveCustomSection={handleRemoveCustomSection} />}
            {tab === "format"  && <FormattingPanel fmt={fmt} onChange={setFmt} />}
          </div>
        </aside>

        {/* Right – Editable Preview */}
        <section className="preview-panel">
          <div className="preview-scroll">
            <div className="preview-paper-wrap">
              <ResumePreview
                resume={resume}
                fmt={fmt}
                sectionOrder={sectionOrder}
                hiddenSections={hiddenSections}
                onHideSection={(key) => setHiddenSections(prev => { const n = new Set(prev); n.add(key); return n; })}
                onChange={setResume}
                previewRef={previewRef}
              />
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
