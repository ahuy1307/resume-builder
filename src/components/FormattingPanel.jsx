import { useState } from "react";
import { HEADING_FONTS, BODY_FONTS } from "../data/defaultFormatting";
import FormSection from "./FormSection";

function Stepper({ label, value, onChange, min, max, step = 1, unit = "%" }) {
  return (
    <div className="stepper-group">
      <span className="stepper-label">{label}</span>
      <div className="stepper-row">
        <button
          className="stepper-btn"
          onClick={() => onChange(Math.max(min, value - step))}
          disabled={value <= min}
        >−</button>
        <span className="stepper-value">{value}{unit}</span>
        <button
          className="stepper-btn"
          onClick={() => onChange(Math.min(max, value + step))}
          disabled={value >= max}
        >+</button>
      </div>
      <span className="stepper-range">{min}{unit} – {max}{unit}</span>
    </div>
  );
}

function Slider({ label, value, onChange, min, max, step = 1, unit = "mm" }) {
  return (
    <div className="slider-group">
      <div className="slider-header">
        <span className="slider-label">{label}</span>
        <span className="slider-value">{value}{unit}</span>
      </div>
      <input
        type="range"
        className="slider-input"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </div>
  );
}

function FontSelect({ label, value, onChange, options }) {
  return (
    <div className="field-group">
      <label>{label}</label>
      <select className="font-select" value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((f) => (
          <option key={f} value={f} style={{ fontFamily: `${f}, sans-serif` }}>{f}</option>
        ))}
      </select>
    </div>
  );
}

/* ── tiny reusable Toggle ───────────────────────── */
function Toggle({ label, checked, onChange }) {
  return (
    <label className="sop-toggle-row" style={{ cursor: "pointer" }}>
      <span className="sop-toggle-label">{label}</span>
      <div className={`sop-toggle-switch${checked ? " on" : ""}`} onClick={() => onChange(!checked)}>
        <div className="sop-toggle-thumb" />
      </div>
    </label>
  );
}

/* ── tiny reusable RowLabel ─────────────────────── */
function RowLabel({ label, children }) {
  return (
    <div className="sop-avatar-size-row">
      <span className="sop-toggle-label">{label}</span>
      {children}
    </div>
  );
}

export default function FormattingPanel({
  fmt, onChange,
  showAvatar, onShowAvatarChange,
  showDob, onShowDobChange,
  avatarSize, onAvatarSizeChange,
  avatarShape, onAvatarShapeChange,
  avatarRadius, onAvatarRadiusChange,
  avatarSide, onAvatarSideChange,
  headerAlign, onHeaderAlignChange,
}) {
  const set = (key, value) => onChange({ ...fmt, [key]: value });

  return (
    <div className="formatting-panel">

      {/* ── Personal Info ── */}
      <FormSection title={
        <span style={{ display:"flex", alignItems:"center", gap:7 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
          </svg>
          Personal Info
        </span>
      } defaultOpen={true}>

        {/* Avatar toggle */}
        <Toggle label="Show Avatar (Photo)" checked={showAvatar} onChange={onShowAvatarChange} />

        {showAvatar && (<>
          {/* Size slider */}
          <div className="sop-avatar-size-row">
            <span className="sop-toggle-label" style={{ flexShrink: 0 }}>Photo Size</span>
            <div className="sop-avatar-size-controls">
              <button className="sop-size-btn" onClick={() => onAvatarSizeChange(Math.max(60, avatarSize - 10))} disabled={avatarSize <= 60}>−</button>
              <input className="sop-size-slider" type="range" min={60} max={200} step={5} value={avatarSize} onChange={(e) => onAvatarSizeChange(Number(e.target.value))} />
              <button className="sop-size-btn" onClick={() => onAvatarSizeChange(Math.min(200, avatarSize + 10))} disabled={avatarSize >= 200}>+</button>
              <span className="sop-size-val">{avatarSize}px</span>
            </div>
          </div>

          {/* Shape */}
          <RowLabel label="Photo Shape">
            <div className="sop-shape-picker">
              <button
                className={`sop-shape-btn${avatarRadius >= 45 ? " active" : ""}`}
                onClick={() => { onAvatarShapeChange("circle"); onAvatarRadiusChange(50); }}
              >
                <svg width="15" height="15" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="2"/></svg>
                Circle
              </button>
              <button
                className={`sop-shape-btn${avatarRadius <= 5 ? " active" : ""}`}
                onClick={() => { onAvatarShapeChange("square"); onAvatarRadiusChange(0); }}
              >
                <svg width="15" height="15" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="3" fill="none" stroke="currentColor" strokeWidth="2"/></svg>
                Square
              </button>
            </div>
          </RowLabel>

          {/* Corner Radius slider */}
          <div className="sop-avatar-size-row">
            <span className="sop-toggle-label" style={{ flexShrink: 0 }}>Corner Radius</span>
            <div className="sop-avatar-size-controls">
              <button className="sop-size-btn" onClick={() => { onAvatarRadiusChange(Math.max(0, avatarRadius - 5)); onAvatarShapeChange("custom"); }} disabled={avatarRadius <= 0}>−</button>
              <input className="sop-size-slider" type="range" min={0} max={50} step={1} value={avatarRadius} onChange={(e) => { onAvatarRadiusChange(Number(e.target.value)); onAvatarShapeChange("custom"); }} />
              <button className="sop-size-btn" onClick={() => { onAvatarRadiusChange(Math.min(50, avatarRadius + 5)); onAvatarShapeChange("custom"); }} disabled={avatarRadius >= 50}>+</button>
              <span className="sop-size-val">{avatarRadius}%</span>
            </div>
          </div>

          {/* Side */}
          <RowLabel label="Photo Position">
            <div className="sop-shape-picker">
              <button className={`sop-shape-btn${avatarSide === "left" ? " active" : ""}`} onClick={() => onAvatarSideChange("left")}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="2" y="4" width="8" height="16" rx="1"/>
                  <line x1="14" y1="8" x2="22" y2="8"/>
                  <line x1="14" y1="12" x2="22" y2="12"/>
                  <line x1="14" y1="16" x2="19" y2="16"/>
                </svg>
                Left
              </button>
              <button className={`sop-shape-btn${avatarSide === "right" ? " active" : ""}`} onClick={() => onAvatarSideChange("right")}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="14" y="4" width="8" height="16" rx="1"/>
                  <line x1="2" y1="8" x2="10" y2="8"/>
                  <line x1="2" y1="12" x2="10" y2="12"/>
                  <line x1="2" y1="16" x2="7" y2="16"/>
                </svg>
                Right
              </button>
            </div>
          </RowLabel>
        </>)}

        {/* DOB toggle */}
        <Toggle label="Show Date of Birth" checked={showDob} onChange={onShowDobChange} />

        <div className="sop-personal-divider" />

        {/* Section title alignment */}
        <RowLabel label="Section Title Align">
          <div className="sop-align-picker">
            {["left", "center", "right"].map(a => (
              <button
                key={a}
                className={`sop-align-btn${headerAlign === a ? " active" : ""}`}
                onClick={() => onHeaderAlignChange(a)}
                title={a.charAt(0).toUpperCase() + a.slice(1)}
              >
                {a === "left"   && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="15" y2="12"/><line x1="3" y1="18" x2="18" y2="18"/></svg>}
                {a === "center" && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="6" y1="12" x2="18" y2="12"/><line x1="4" y1="18" x2="20" y2="18"/></svg>}
                {a === "right"  && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="9" y1="12" x2="21" y2="12"/><line x1="6" y1="18" x2="21" y2="18"/></svg>}
              </button>
            ))}
          </div>
        </RowLabel>
      </FormSection>

      {/* ── Typography ── */}
      <FormSection title={
        <span style={{display:'flex',alignItems:'center',gap:7}}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 7h16M4 12h16M4 17h10"/></svg>
          Typography
        </span>
      } defaultOpen={true}>
        <FontSelect
          label="Heading Font (Section titles)"
          value={fmt.headingFont}
          onChange={(v) => set("headingFont", v)}
          options={HEADING_FONTS}
        />
        {/* Bold headings toggle */}
        <div className="field-group" style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <label style={{ margin: 0, cursor: "pointer", display: "flex", alignItems: "center", gap: 7, userSelect: "none" }}>
            <input
              type="checkbox"
              checked={!!fmt.headingBold}
              onChange={(e) => set("headingBold", e.target.checked)}
              style={{ width: 15, height: 15, accentColor: "#555", cursor: "pointer" }}
            />
            <span style={{ fontWeight: 600 }}>Bold headings</span>
          </label>
        </div>
        <FontSelect
          label="Body Font (Content)"
          value={fmt.bodyFont}
          onChange={(v) => set("bodyFont", v)}
          options={BODY_FONTS}
        />
        <Stepper label="Heading Size" value={fmt.headingSizeScale} onChange={(v) => set("headingSizeScale", v)} min={50} max={200} step={5} />
        <Stepper label="Body Size" value={fmt.bodySizeScale} onChange={(v) => set("bodySizeScale", v)} min={50} max={200} step={5} />
        <Stepper label="Line Spacing" value={fmt.lineSpacingScale} onChange={(v) => set("lineSpacingScale", v)} min={80} max={200} step={5} />
      </FormSection>

      {/* ── Margins & Spacing ── */}
      <FormSection title={
        <span style={{display:'flex',alignItems:'center',gap:7}}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 3H3M21 21H3M3 12h6m6 0h6"/></svg>
          Margins &amp; Spacing
        </span>
      } defaultOpen={true}>
        <div className="slider-section-title">MARGINS</div>
        <Slider label="Top & Bottom" value={fmt.marginTopBottom} onChange={(v) => set("marginTopBottom", v)} min={5} max={40} step={1} unit="mm" />
        <Slider label="Left & Right" value={fmt.marginLeftRight} onChange={(v) => set("marginLeftRight", v)} min={5} max={40} step={1} unit="mm" />
        <div className="slider-section-title" style={{ marginTop: 12 }}>SPACING</div>
        <Slider label="Between Sections" value={fmt.sectionSpacing} onChange={(v) => set("sectionSpacing", v)} min={2} max={30} step={1} unit="pt" />
        <Slider label="Title → Content" value={fmt.titleContentSpacing} onChange={(v) => set("titleContentSpacing", v)} min={2} max={20} step={1} unit="pt" />
        <Slider label="Between Content Blocks" value={fmt.contentBlockSpacing} onChange={(v) => set("contentBlockSpacing", v)} min={2} max={20} step={1} unit="pt" />
      </FormSection>
    </div>
  );
}
