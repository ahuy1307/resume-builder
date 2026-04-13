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
  const [showAvatar, setShowAvatar] = useState(() => {
    try { return JSON.parse(localStorage.getItem("rb-show-avatar")) ?? false; }
    catch { return false; }
  });
  const [showDob, setShowDob] = useState(() => {
    try { return JSON.parse(localStorage.getItem("rb-show-dob")) ?? false; }
    catch { return false; }
  });
  const [avatarSize, setAvatarSize] = useState(() => {
    try { return JSON.parse(localStorage.getItem("rb-avatar-size")) ?? 110; }
    catch { return 110; }
  });
  const [avatarShape, setAvatarShape] = useState(() => {
    try { return localStorage.getItem("rb-avatar-shape") ?? "circle"; }
    catch { return "circle"; }
  });
  const [avatarRadius, setAvatarRadius] = useState(() => {
    try { return JSON.parse(localStorage.getItem("rb-avatar-radius")) ?? 50; }
    catch { return 50; }
  });
  const [headerAlign, setHeaderAlign] = useState(() => {
    try { return localStorage.getItem("rb-header-align") ?? "center"; }
    catch { return "center"; }
  });
  const [avatarSide, setAvatarSide] = useState(() => {
    try { return localStorage.getItem("rb-avatar-side") ?? "left"; }
    catch { return "left"; }
  });
  const [tab, setTab] = useState("layout");
  const [showImport, setShowImport] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [pendingDeleteKey, setPendingDeleteKey] = useState(null);
  const previewRef = useRef(null);

  useEffect(() => { localStorage.setItem("rb-resume",      JSON.stringify(resume));              }, [resume]);
  useEffect(() => { localStorage.setItem("rb-fmt-v3",      JSON.stringify(fmt));                 }, [fmt]);
  useEffect(() => { localStorage.setItem("rb-order",       JSON.stringify(sectionOrder));        }, [sectionOrder]);
  useEffect(() => { localStorage.setItem("rb-hidden",      JSON.stringify([...hiddenSections])); }, [hiddenSections]);
  useEffect(() => { localStorage.setItem("rb-show-avatar",  JSON.stringify(showAvatar));           }, [showAvatar]);
  useEffect(() => { localStorage.setItem("rb-show-dob",     JSON.stringify(showDob));              }, [showDob]);
  useEffect(() => { localStorage.setItem("rb-avatar-size",  JSON.stringify(avatarSize));           }, [avatarSize]);
  useEffect(() => { localStorage.setItem("rb-avatar-shape",  avatarShape);                          }, [avatarShape]);
  useEffect(() => { localStorage.setItem("rb-avatar-radius", JSON.stringify(avatarRadius));          }, [avatarRadius]);
  useEffect(() => { localStorage.setItem("rb-header-align", headerAlign);                          }, [headerAlign]);
  useEffect(() => { localStorage.setItem("rb-avatar-side",  avatarSide);                           }, [avatarSide]);

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
    setPendingDeleteKey(key);
  };

  const doDeleteCustomSection = () => {
    const key = pendingDeleteKey;
    if (!key) return;
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
    setPendingDeleteKey(null);
  };

  const handleDownloadPDF = () => { window.print(); };
  const handleClearAllData = () => {
    setResume(defaultResume);
    setFmt(defaultFormatting);
    setSectionOrder(DEFAULT_SECTION_ORDER);
    setHiddenSections(new Set(["projects"]));
    setShowAvatar(false);
    setShowDob(false);
    setAvatarSize(110);
    setAvatarShape("circle");
    setAvatarRadius(50);
    setHeaderAlign("center");
    setAvatarSide("left");
    localStorage.removeItem("rb-resume");
    localStorage.removeItem("rb-fmt-v3");
    localStorage.removeItem("rb-order");
    localStorage.removeItem("rb-hidden");
    localStorage.removeItem("rb-show-avatar");
    localStorage.removeItem("rb-show-dob");
    localStorage.removeItem("rb-avatar-size");
    localStorage.removeItem("rb-avatar-shape");
    localStorage.removeItem("rb-avatar-radius");
    localStorage.removeItem("rb-header-align");
    localStorage.removeItem("rb-avatar-side");
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

      {pendingDeleteKey && (
        <div className="import-overlay" onClick={() => setPendingDeleteKey(null)}>
          <div className="import-modal confirm-delete-modal" onClick={(e) => e.stopPropagation()}>
            <button className="import-close" onClick={() => setPendingDeleteKey(null)}>×</button>
            <div className="confirm-delete-icon">🗑️</div>
            <h3 className="import-title">Delete Section</h3>
            <p className="import-sub">
              Delete <strong>&ldquo;{resume.sectionTitles?.[pendingDeleteKey] || "Custom Section"}&rdquo;</strong>?
              <br />This action cannot be undone.
            </p>
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 16 }}>
              <button className="btn-import" onClick={() => setPendingDeleteKey(null)}>Cancel</button>
              <button className="btn-delete-confirm" onClick={doDeleteCustomSection}>Delete</button>
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
            {tab === "format"  && <FormattingPanel fmt={fmt} onChange={setFmt} showAvatar={showAvatar} onShowAvatarChange={setShowAvatar} showDob={showDob} onShowDobChange={setShowDob} avatarSize={avatarSize} onAvatarSizeChange={setAvatarSize} avatarShape={avatarShape} onAvatarShapeChange={setAvatarShape} avatarRadius={avatarRadius} onAvatarRadiusChange={setAvatarRadius} avatarSide={avatarSide} onAvatarSideChange={setAvatarSide} headerAlign={headerAlign} onHeaderAlignChange={setHeaderAlign} />}
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
                showAvatar={showAvatar}
                showDob={showDob}
                avatarSize={avatarSize}
                avatarShape={avatarShape}
                avatarRadius={avatarRadius}
                headerAlign={headerAlign}
                avatarSide={avatarSide}
              />
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
