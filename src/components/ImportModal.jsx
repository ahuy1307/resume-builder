import { useState, useCallback } from "react";
import { extractTextFromPdf } from "../utils/pdfParser";
import { parseWithGemini } from "../utils/geminiParser";
import { parseResumeText } from "../utils/pdfParser";

export default function ImportModal({ onImport, onClose }) {
  const [status, setStatus] = useState("idle"); // idle | loading | done | error
  const [statusMsg, setStatusMsg] = useState("");
  const [error, setError] = useState("");
  const [dragging, setDragging] = useState(false);
  const envApiKey = (import.meta.env.VITE_GEMINI_API_KEY || "").trim();

  const process = useCallback(async (file) => {
    if (!file || file.type !== "application/pdf") {
      setError("Please upload a PDF file.");
      setStatus("error");
      return;
    }
    setStatus("loading");
    setError("");

    try {
      setStatusMsg("Extracting text from PDF…");
      const lines = await extractTextFromPdf(file);

      let parsed;
      if (envApiKey) {
        setStatusMsg("Sending to Gemini AI…");
        const rawText = lines.join("\n");
        parsed = await parseWithGemini(rawText, envApiKey);
      } else {
        setStatusMsg("Parsing with heuristics…");
        parsed = parseResumeText(lines);
      }

      setStatus("done");
      setStatusMsg("Done!");
      setTimeout(() => { onImport(parsed); onClose(); }, 700);
    } catch (e) {
      console.error(e);
      setError(e.message || "Failed to parse PDF.");
      setStatus("error");
    }
  }, [envApiKey, onImport, onClose]);

  const onFile = (e) => { if (e.target.files[0]) process(e.target.files[0]); };
  const onDrop = (e) => { e.preventDefault(); setDragging(false); process(e.dataTransfer.files[0]); };

  return (
    <div className="import-overlay" onClick={onClose}>
      <div className="import-modal" onClick={(e) => e.stopPropagation()}>
        <button className="import-close" onClick={onClose}>×</button>
        <h3 className="import-title">Import Resume from PDF</h3>

        {/* Dropzone */}
        <label
          className={`import-dropzone${dragging ? " dragging" : ""}${status === "done" ? " done" : ""}`}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
        >
          <input type="file" accept="application/pdf" onChange={onFile} style={{ display: "none" }} disabled={status === "loading"} />

          {status === "idle" && (
            <>
              <span className="import-icon">📄</span>
              <span className="import-drop-label">Drop PDF here</span>
              <span className="import-drop-sub">or click to browse</span>
            </>
          )}
          {status === "loading" && (
            <>
              <span className="import-icon spin">⟳</span>
              <span className="import-drop-label">{statusMsg}</span>
            </>
          )}
          {status === "done" && (
            <>
              <span className="import-icon">✓</span>
              <span className="import-drop-label">Done! Filling in…</span>
            </>
          )}
          {status === "error" && (
            <>
              <span className="import-icon">⚠</span>
              <span className="import-drop-label" style={{ color: "#c53030", fontSize: 13 }}>{error}</span>
              <span className="import-drop-sub">Click to try again</span>
            </>
          )}
        </label>

        <p className="import-footer">
          {envApiKey
            ? "🤖 AI mode — Gemini extracts the resume with high accuracy"
            : "🔧 Basic mode — heuristic parser (results may vary)"}
        </p>
      </div>
    </div>
  );
}
