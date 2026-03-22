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
          <option key={f} value={f} style={{ fontFamily: f }}>{f}</option>
        ))}
      </select>
    </div>
  );
}

export default function FormattingPanel({ fmt, onChange }) {
  const set = (key, value) => onChange({ ...fmt, [key]: value });

  return (
    <div className="formatting-panel">
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
