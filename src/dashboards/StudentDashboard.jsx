import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import Layout from "../components/Layout";

const TABS = ["Dashboard", "My Requests", "New Request", "Attendance", "Announcements"];

export default function StudentDashboard() {
  const { user, logout, requests, submitRequest, announcements, attendance } = useAuth();
  const [tab, setTab] = useState("Dashboard");
  const [form, setForm] = useState({ type: "Leave", reason: "", from: "", to: "" });
  const [submitted, setSubmitted] = useState(false);

  const myRequests = requests.filter(r => String(r.studentId) === String(user.dbId));
  const att    = attendance[user.id] || { present: 0, total: 0 };
  const attPct = att.total ? Math.round((att.present / att.total) * 100) : 0;

  const handleSubmit = (e) => {
    e.preventDefault();
    submitRequest({ ...form, studentId: user.dbId, studentName: user.name, dept: user.dept });
    setForm({ type: "Leave", reason: "", from: "", to: "" });
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 3000);
  };

  const statusBadge = (s) => <span className={`badge badge-${s.toLowerCase()}`}>{s}</span>;

  const sidebar = (
    <>
      <div className="sidebar-header">
        <div className="avatar">🎓</div>
        <div>
          <strong>{user.name}</strong>
          <p>{user.rollNo} • {user.dept}</p>
          <p>{user.year} Year</p>
        </div>
      </div>
      <nav>
        {TABS.map(t => (
          <button key={t} className={tab === t ? "nav-btn active" : "nav-btn"} onClick={() => setTab(t)}>{t}</button>
        ))}
      </nav>
      <button className="logout-btn" onClick={logout}>🚪 Logout</button>
    </>
  );

  return (
    <Layout sidebarColor="#4f46e5" sidebar={sidebar}>
      {tab === "Dashboard" && (
        <div>
          <h2>Welcome, {user.name.split(" ")[0]}! 👋</h2>
          <div className="stats-grid">
            <div className="stat-card" style={{ "--c": "#4f46e5" }}>
              <span className="stat-num">{myRequests.length}</span>
              <span>Total Requests</span>
            </div>
            <div className="stat-card" style={{ "--c": "#f59e0b" }}>
              <span className="stat-num">{myRequests.filter(r => r.status === "Pending").length}</span>
              <span>Pending</span>
            </div>
            <div className="stat-card" style={{ "--c": "#10b981" }}>
              <span className="stat-num">{myRequests.filter(r => r.status === "Approved").length}</span>
              <span>Approved</span>
            </div>
            <div className="stat-card" style={{ "--c": attPct >= 75 ? "#10b981" : "#ef4444" }}>
              <span className="stat-num">{attPct}%</span>
              <span>Attendance</span>
            </div>
          </div>
          <div className="section-card">
            <h3>📢 Latest Announcements</h3>
            {announcements.slice(0, 2).map(a => (
              <div key={a.id} className="announcement-item">
                <strong>{a.title}</strong>
                <p>{a.body}</p>
                <small>{a.date} • {a.by}</small>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "My Requests" && (
        <div>
          <h2>My Requests</h2>
          {myRequests.length === 0 ? <p className="empty">No requests submitted yet.</p> : (
            <div className="table-wrap">
              <table>
                <thead><tr><th>Type</th><th>Reason</th><th>From</th><th>To</th><th>Prof.</th><th>HOD</th><th>Status</th></tr></thead>
                <tbody>
                  {myRequests.map(r => (
                    <tr key={r.id}>
                      <td><span className={`type-badge type-${r.type.toLowerCase()}`}>{r.type}</span></td>
                      <td>{r.reason}</td>
                      <td>{r.fromDate}</td>
                      <td>{r.toDate}</td>
                      <td>{statusBadge(r.professorStatus)}</td>
                      <td>{statusBadge(r.hodStatus)}</td>
                      <td>{statusBadge(r.status)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {tab === "New Request" && (
        <div>
          <h2>Submit New Request</h2>
          <div className="form-card">
            {submitted && <div className="success-msg">✅ Request submitted successfully!</div>}
            <form onSubmit={handleSubmit}>
              <label>Request Type</label>
              <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                <option>Leave</option>
                <option>OD</option>
                <option>Permission</option>
                <option>Medical Leave</option>
              </select>
              <label>Reason</label>
              <textarea rows={3} placeholder="Describe your reason..." value={form.reason} onChange={e => setForm({ ...form, reason: e.target.value })} required />
              <div className="date-row">
                <div>
                  <label>From Date</label>
                  <input type="date" value={form.from} onChange={e => setForm({ ...form, from: e.target.value })} required />
                </div>
                <div>
                  <label>To Date</label>
                  <input type="date" value={form.to} onChange={e => setForm({ ...form, to: e.target.value })} required />
                </div>
              </div>
              <button type="submit" className="submit-btn">Submit Request</button>
            </form>
          </div>
        </div>
      )}

      {tab === "Attendance" && (
        <div>
          <h2>My Attendance</h2>
          <div className="section-card">
            <div className="att-summary">
              <div className="att-circle" style={{ "--pct": attPct, "--color": attPct >= 75 ? "#10b981" : "#ef4444" }}>
                <span>{attPct}%</span>
              </div>
              <div className="att-details">
                <p>Present: <strong>{att.present}</strong> days</p>
                <p>Total: <strong>{att.total}</strong> days</p>
                <p>Absent: <strong>{att.total - att.present}</strong> days</p>
                <p className={attPct >= 75 ? "good" : "warn"}>
                  {attPct >= 75 ? "✅ Attendance is satisfactory" : "⚠️ Attendance below 75% — at risk!"}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === "Announcements" && (
        <div>
          <h2>Announcements</h2>
          {announcements.map(a => (
            <div key={a.id} className="announcement-item big">
              <strong>{a.title}</strong>
              <p>{a.body}</p>
              <small>{a.date} • Posted by {a.by}</small>
            </div>
          ))}
        </div>
      )}
    </Layout>
  );
}
