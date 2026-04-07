import React, { useState, useRef } from "react";
import * as XLSX from "xlsx";
import { useAuth } from "../context/AuthContext";

const REQUIRED_COLS = ["name", "username", "password", "rollNo", "email"];
const ALL_COLS      = ["name", "username", "password", "rollNo", "email", "dept", "year", "phone"];

function downloadTemplate() {
  const sample = [
    { name: "John Doe",   username: "john123",  password: "pass123", rollNo: "CS24001", email: "john@college.edu",  dept: "CSE", year: "1st", phone: "9876543210" },
    { name: "Jane Smith", username: "jane456",  password: "pass456", rollNo: "CS24002", email: "jane@college.edu",  dept: "ECE", year: "2nd", phone: "9876543211" },
  ];
  const ws = XLSX.utils.json_to_sheet(sample);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Students");
  XLSX.writeFile(wb, "students_template.xlsx");
}

export default function ExcelUpload() {
  const { bulkUpload } = useAuth();
  const inputRef = useRef();
  const [preview, setPreview]   = useState(null);   // parsed rows
  const [fileName, setFileName] = useState("");
  const [parseErr, setParseErr] = useState("");
  const [result, setResult]     = useState(null);
  const [loading, setLoading]   = useState(false);

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setResult(null); setParseErr("");
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const wb   = XLSX.read(ev.target.result, { type: "array" });
        const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { defval: "" });
        if (!rows.length) return setParseErr("File is empty.");
        // normalise keys to lowercase
        const normalised = rows.map(r => {
          const out = {};
          Object.keys(r).forEach(k => { out[k.toLowerCase().replace(/\s/g, "")] = String(r[k]).trim(); });
          return out;
        });
        const missing = REQUIRED_COLS.filter(c => !(c.toLowerCase() in normalised[0]));
        if (missing.length) return setParseErr(`Missing columns: ${missing.join(", ")}`);
        setPreview(normalised);
      } catch {
        setParseErr("Could not read file. Make sure it is a valid .xlsx or .xls file.");
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleUpload = async () => {
    if (!preview) return;
    setLoading(true);
    const file = inputRef.current.files[0];
    const res  = await bulkUpload(file);
    setLoading(false);
    setResult(res);
    if (!res.error) { setPreview(null); setFileName(""); inputRef.current.value = ""; }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) { inputRef.current.files = e.dataTransfer.files; handleFile({ target: { files: [file] } }); }
  };

  return (
    <div className="excel-upload">
      <div className="excel-header">
        <div>
          <h3 style={{ marginBottom: 4 }}>📊 Bulk Upload via Excel</h3>
          <p style={{ fontSize: 13, color: "#64748b" }}>Upload an Excel file to add multiple students at once.</p>
        </div>
        <button className="template-btn" onClick={downloadTemplate}>⬇️ Download Template</button>
      </div>

      {/* drop zone */}
      <div
        className={`drop-zone ${preview ? "drop-zone-ready" : ""}`}
        onDragOver={e => e.preventDefault()}
        onDrop={handleDrop}
        onClick={() => inputRef.current.click()}
      >
        <input ref={inputRef} type="file" accept=".xlsx,.xls" style={{ display: "none" }} onChange={handleFile} />
        {fileName
          ? <p>📄 <strong>{fileName}</strong> — {preview ? `${preview.length} rows ready` : "parsing..."}</p>
          : <p>📂 Drag & drop your Excel file here, or <span style={{ color: "#4f46e5", fontWeight: 600 }}>click to browse</span></p>
        }
      </div>

      {parseErr && <p className="error" style={{ marginTop: 8 }}>⚠️ {parseErr}</p>}

      {/* result */}
      {result && (
        <div className={result.error ? "error" : "success-msg"} style={{ marginTop: 12 }}>
          {result.error ? `⚠️ ${result.error}` : `✅ ${result.message}`}
          {result.errors?.length > 0 && (
            <ul style={{ marginTop: 8, paddingLeft: 18, fontSize: 13 }}>
              {result.errors.map((e, i) => <li key={i}>{e}</li>)}
            </ul>
          )}
        </div>
      )}

      {/* preview table */}
      {preview && (
        <div style={{ marginTop: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8, flexWrap: "wrap", gap: 8 }}>
            <p style={{ fontSize: 13, color: "#374151" }}>Preview — first {Math.min(preview.length, 5)} of {preview.length} rows</p>
            <div style={{ display: "flex", gap: 8 }}>
              <button className="filter-btn" onClick={() => { setPreview(null); setFileName(""); inputRef.current.value = ""; setResult(null); }}>✖ Clear</button>
              <button className="login-btn" style={{ background: "#4f46e5", padding: "8px 20px", fontSize: 14, width: "auto" }} onClick={handleUpload} disabled={loading}>
                {loading ? "Uploading..." : `⬆️ Upload ${preview.length} Students`}
              </button>
            </div>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>{ALL_COLS.map(c => <th key={c}>{c}</th>)}</tr>
              </thead>
              <tbody>
                {preview.slice(0, 5).map((row, i) => (
                  <tr key={i}>
                    {ALL_COLS.map(c => <td key={c}>{c === "password" ? "••••••" : (row[c] || "—")}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
