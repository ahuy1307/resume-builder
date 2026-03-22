import { useState } from "react";

export default function FormSection({ title, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="form-section">
      <button className="section-toggle" onClick={() => setOpen(!open)}>
        <span>{title}</span>
        <span className="toggle-icon">{open ? "▲" : "▼"}</span>
      </button>
      {open && <div className="section-body">{children}</div>}
    </div>
  );
}
