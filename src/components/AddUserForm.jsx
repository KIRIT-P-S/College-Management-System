import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import ExcelUpload from "./ExcelUpload";

const DEPTS = ["CSE", "ECE", "MECH", "CIVIL", "EEE"];
const EMPTY_STUDENT = { name: "", username: "", password: "", dept: "CSE", year: "1st", rollNo: "", email: "", phone: "" };
const EMPTY_STAFF   = { name: "", username: "", password: "", role: "professor", dept: "CSE", subject: "", email: "" };

export default function AddUserForm({ allowedRoles = ["student", "professor", "hod", "management"] }) {
  const { addUser } = useAuth();
  const [type, setType]           = useState(allowedRoles.includes("student") ? "student" : allowedRoles[0]);
  const [form, setForm]           = useState(type === "student" ? EMPTY_STUDENT : EMPTY_STAFF);
  const [msg, setMsg]             = useState("");
  const [error, setError]         = useState("");
  const [inputMode, setInputMode] = useState("manual"); // "manual" | "excel"

  const switchType = (t) => {
    setType(t);
    setForm(t === "student" ? EMPTY_STUDENT : { ...EMPTY_STAFF, role: t });
    setMsg(""); setError(""); setInputMode("manual");
  };

  const f = (field) => (e) => setForm(prev => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg(""); setError("");
    const endpoint = type === "student" ? "students" : "staff";
    const payload  = type === "student" ? form : { ...form, role: type };
    const result   = await addUser(endpoint, payload);
    if (result?.error) return setError(result.error);
    setMsg(result.message);
    setForm(type === "student" ? EMPTY_STUDENT : { ...EMPTY_STAFF, role: type });
  };

  return (
    <div className="form-card">
      {/* role tabs */}
      {allowedRoles.length > 1 && (
        <div className="mode-tabs" style={{ marginBottom: 20 }}>
          {allowedRoles.map(r => (
            <button key={r} className={type === r ? "mode-tab active" : "mode-tab"} onClick={() => switchType(r)}>
              {r.charAt(0).toUpperCase() + r.slice(1)}
            </button>
          ))}
        </div>
      )}

      {/* manual / excel toggle — only for student */}
      {type === "student" && (
        <div className="mode-tabs" style={{ marginBottom: 20, maxWidth: 280 }}>
          <button className={inputMode === "manual" ? "mode-tab active" : "mode-tab"} onClick={() => setInputMode("manual")}>✏️ Manual</button>
          <button className={inputMode === "excel" ? "mode-tab active" : "mode-tab"} onClick={() => setInputMode("excel")}>📊 Excel Upload</button>
        </div>
      )}

      {/* excel upload panel */}
      {type === "student" && inputMode === "excel" && <ExcelUpload />}

      {/* manual form */}
      {inputMode === "manual" && (
        <>
          {msg   && <div className="success-msg">✅ {msg}</div>}
          {error && <p className="error">⚠️ {error}</p>}

          <form onSubmit={handleSubmit}>
            <div className="reg-grid">
              <div className="reg-field"><label>Full Name *</label>
                <input placeholder="e.g. John Doe" value={form.name} onChange={f("name")} required />
              </div>
              <div className="reg-field"><label>Username *</label>
                <input placeholder="e.g. john123" value={form.username} onChange={f("username")} required />
              </div>
              <div className="reg-field"><label>Email *</label>
                <input type="email" placeholder="e.g. john@college.edu" value={form.email} onChange={f("email")} required />
              </div>
              <div className="reg-field"><label>Password *</label>
                <input type="password" placeholder="Min 6 characters" value={form.password} onChange={f("password")} required minLength={6} />
              </div>

              {type === "student" && <>
                <div className="reg-field"><label>Roll Number *</label>
                  <input placeholder="e.g. CS24001" value={form.rollNo} onChange={f("rollNo")} required />
                </div>
                <div className="reg-field"><label>Phone</label>
                  <input placeholder="e.g. 9876543210" value={form.phone} onChange={f("phone")} />
                </div>
                <div className="reg-field"><label>Department *</label>
                  <select value={form.dept} onChange={f("dept")}>{DEPTS.map(d => <option key={d}>{d}</option>)}</select>
                </div>
                <div className="reg-field"><label>Year *</label>
                  <select value={form.year} onChange={f("year")}>
                    {["1st","2nd","3rd","4th"].map(y => <option key={y}>{y}</option>)}
                  </select>
                </div>
              </>}

              {type !== "student" && <>
                <div className="reg-field"><label>Department</label>
                  <select value={form.dept} onChange={f("dept")}>{DEPTS.map(d => <option key={d}>{d}</option>)}</select>
                </div>
                {type === "professor" && (
                  <div className="reg-field"><label>Subject</label>
                    <input placeholder="e.g. Data Structures" value={form.subject} onChange={f("subject")} />
                  </div>
                )}
              </>}
            </div>

            <button type="submit" className="login-btn" style={{ background: "#4f46e5", marginTop: 12, width: "100%", padding: 12 }}>
              ➕ Add {type.charAt(0).toUpperCase() + type.slice(1)}
            </button>
          </form>
        </>
      )}
    </div>
  );
}
