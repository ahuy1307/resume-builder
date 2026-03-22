import { useRef, useEffect, useCallback } from "react";

export default function RichTextBullet({ value, onChange, placeholder }) {
  const editorRef = useRef(null);

  // Sync external value into the DOM (only when value changes from outside)
  useEffect(() => {
    const el = editorRef.current;
    if (!el) return;
    if (el.innerHTML !== value) {
      el.innerHTML = value;
    }
  }, [value]);

  const exec = useCallback((cmd) => {
    editorRef.current.focus();
    document.execCommand(cmd, false, null);
    onChange(editorRef.current.innerHTML);
  }, [onChange]);

  return (
    <div className="rte-wrap">
      <div className="rte-toolbar">
        <button type="button" title="Bold" onMouseDown={(e) => { e.preventDefault(); exec("bold"); }}>
          <strong>B</strong>
        </button>
        <button type="button" title="Italic" onMouseDown={(e) => { e.preventDefault(); exec("italic"); }}>
          <em>I</em>
        </button>
        <button type="button" title="Underline" onMouseDown={(e) => { e.preventDefault(); exec("underline"); }}>
          <u>U</u>
        </button>
      </div>
      <div
        ref={editorRef}
        className="rte-editor"
        contentEditable
        suppressContentEditableWarning
        data-placeholder={placeholder}
        onInput={() => onChange(editorRef.current.innerHTML)}
        onBlur={() => onChange(editorRef.current.innerHTML)}
      />
    </div>
  );
}
