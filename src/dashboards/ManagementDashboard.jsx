import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import Layout from "../components/Layout";
import AddUserForm from "../components/AddUserForm";

const TABS = ["Dashboard", "All Requests", "Students", "Add User", "Announcements", "Post Announcement", "Reports"];

export default function ManagementDashboard() {
  const { user, logout, requests, announcements, addAnnouncement, attendance, students, resetPassword } = useAuth();
  const [tab, setTab]           = useState("Dashboard");
  const [annForm, setAnnForm]   = useState({ title: "", body: "" });
  const [posted, setPosted]     = useState(false);
  const [filterDept, setFilterDept]   = useState("All");
  const [filterYear, setFilterYear]   = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [resetState, setResetState]   = useState({});

  const depts    = ["All", "CSE", "ECE", "MECH", "CIVIL", "EEE"];
  const filtered = filterDept === "All" ? requests : requests.filter(r => r.dept === filterDept);

  const handlePost = async (e) => {
    e.preventDefault();
    await addAnnouncement({ ...annForm, by: user.name });
    setAnnForm({ title: "", body: "" });
    setPosted(true);
    setTimeout(() => setPosted(false), 3000);
  };

  const rs    = (dbId) => resetState[dbId] || { newPassword: "", msg: "", error: "" };
  const setRs = (dbId, patch) => setResetState(prev => ({ ...prev, [dbId]: { ...rs(dbId), ...patch } }));

  const handleReset = async (dbId) => {
    setRs(dbId, { msg: "", error: "" });
    const result = await resetPassword(dbId, rs(dbId).newPassword);
    if (result?.error) setRs(dbId, { error: result.error });
    else setRs(dbId, { msg: result.message, newPassword: "" });
  };

  const statusBadge = (s) => <span className={`badge badge-${s.toLowerCase()}`}>{s}</span>;

  const totalApproved = requests.filter(r => r.status === "Approved").length;
  const totalPending  = requests.filter(r => r.status === "Pending").length;
  const totalRejected = requests.filter(r => r.status === "Rejected").length;

  const sidebar = (
    <>
      <div className="sidebar-header">
        <div className="avatar">🏢</div>
        <div>
          <strong>{user.name}</strong>
          <p>{user.role}</p>
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
    <Layout sidebarColor="#dc2626" sidebar={sidebar}>
      {tab === "Dashboard" && (
        <div>
          <h2>Management Dashboard 🏢</h2>
          <div className="stats-grid">
            <div className="stat-card" style={{ "--c": "#dc2626" }}>
              <span className="stat-num">{requests.length}</span>
              <span>Total Requests</span>
            </div>
            <div className="stat-card" style={{ "--c": "#f59e0b" }}>
              <span className="stat-num">{totalPending}</span>
              <span>Pending</span>
            </div>
            <div className="stat-card" style={{ "--c": "#10b981" }}>
              <span className="stat-num">{totalApproved}</span>
              <span>Approved</span>
            </div>
            <div className="stat-card" style={{ "--c": "#ef4444" }}>
              <span className="stat-num">{totalRejected}</span>
              <span>Rejected</span>
            </div>
            <div className="stat-card" style={{ "--c": "#6366f1" }}>
              <span className="stat-num">{students.length}</span>
              <span>Total Students</span>
            </div>
            <div className="stat-card" style={{ "--c": "#7c3aed" }}>
              <span className="stat-num">{announcements.length}</span>
              <span>Announcements</span>
            </div>
          </div>
        </div>
      )}

      {tab === "All Requests" && (
        <div>
          <h2>All Requests</h2>
          <div className="filter-row">
            {depts.map(d => (
              <button key={d} className={filterDept === d ? "filter-btn active" : "filter-btn"} onClick={() => setFilterDept(d)}>{d}</button>
            ))}
          </div>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Student</th><th>Dept</th><th>Type</th><th>Reason</th><th>From</th><th>To</th><th>Prof.</th><th>HOD</th><th>Final</th></tr></thead>
              <tbody>
                {filtered.map(r => (
                  <tr key={r.id}>
                    <td>{r.studentName}</td>
                    <td>{r.dept}</td>
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
        </div>
      )}

      {tab === "Students" && (() => {
        const deptOpts = ["All", "CSE", "ECE", "MECH", "CIVIL", "EEE"];
        const yearOpts = ["All", "1st", "2nd", "3rd", "4th"];
        const q = searchQuery.toLowerCase();
        const filteredStudents = students.filter(s =>
          (filterDept === "All" || s.dept === filterDept) &&
          (filterYear === "All" || s.year === filterYear) &&
          (!q || s.name.toLowerCase().includes(q) || s.rollNo.toLowerCase().includes(q) || s.username.toLowerCase().includes(q) || s.email.toLowerCase().includes(q))
        );
        return (
          <div>
            <h2>Students 🎓 <span style={{ fontSize: 15, color: "#64748b", fontWeight: 400 }}>({filteredStudents.length} of {students.length})</span></h2>

            {/* filters */}
            <div className="student-filters">
              <input
                className="search-input"
                placeholder="🔍 Search by name, roll no, username, email..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
              <div className="filter-row" style={{ marginBottom: 0 }}>
                <span style={{ fontSize: 13, color: "#64748b", alignSelf: "center" }}>Dept:</span>
                {deptOpts.map(d => (
                  <button key={d} className={filterDept === d ? "filter-btn active" : "filter-btn"} onClick={() => setFilterDept(d)}>{d}</button>
                ))}
              </div>
              <div className="filter-row" style={{ marginBottom: 0 }}>
                <span style={{ fontSize: 13, color: "#64748b", alignSelf: "center" }}>Year:</span>
                {yearOpts.map(y => (
                  <button key={y} className={filterYear === y ? "filter-btn active" : "filter-btn"} onClick={() => setFilterYear(y)}>{y}</button>
                ))}
              </div>
              {(filterDept !== "All" || filterYear !== "All" || searchQuery) && (
                <button className="filter-btn" style={{ color: "#dc2626", borderColor: "#dc2626" }}
                  onClick={() => { setFilterDept("All"); setFilterYear("All"); setSearchQuery(""); }}>
                  ✖ Clear Filters
                </button>
              )}
            </div>

            {filteredStudents.length === 0
              ? <p className="empty">No students match the current filters.</p>
              : <div className="table-wrap">
                  <table>
                    <thead><tr><th>Name</th><th>Roll No</th><th>Dept</th><th>Year</th><th>Username</th><th>Email</th><th>Reset Password</th></tr></thead>
                    <tbody>
                      {filteredStudents.map(s => (
                        <tr key={s.dbId}>
                          <td>{s.name}</td>
                          <td>{s.rollNo}</td>
                          <td>{s.dept}</td>
                          <td>{s.year}</td>
                          <td>{s.username}</td>
                          <td>{s.email}</td>
                          <td>
                            <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
                              <input
                                type="password"
                                placeholder="New password"
                                value={rs(s.dbId).newPassword}
                                onChange={e => setRs(s.dbId, { newPassword: e.target.value })}
                                style={{ padding: "5px 8px", border: "1.5px solid #e2e8f0", borderRadius: 6, fontSize: 13, width: 130 }}
                              />
                              <button
                                onClick={() => handleReset(s.dbId)}
                                style={{ padding: "5px 12px", background: "#dc2626", color: "white", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 13, whiteSpace: "nowrap" }}
                              >Reset</button>
                            </div>
                            {rs(s.dbId).msg   && <small style={{ color: "#16a34a", display: "block", marginTop: 4 }}>✅ {rs(s.dbId).msg}</small>}
                            {rs(s.dbId).error && <small style={{ color: "#dc2626", display: "block", marginTop: 4 }}>⚠️ {rs(s.dbId).error}</small>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
            }
          </div>
        );
      })()}

      {tab === "Add User" && (
        <div>
          <h2>Add User ➕</h2>
          <AddUserForm allowedRoles={["student", "professor", "hod", "management"]} />
        </div>
      )}

      {tab === "Announcements" && (
        <div>
          <h2>All Announcements</h2>
          {announcements.map(a => (
            <div key={a.id} className="announcement-item big">
              <strong>{a.title}</strong><p>{a.body}</p><small>{a.date} • Posted by {a.by}</small>
            </div>
          ))}
        </div>
      )}

      {tab === "Post Announcement" && (
        <div>
          <h2>Post Announcement</h2>
          <div className="form-card">
            {posted && <div className="success-msg">✅ Announcement posted successfully!</div>}
            <form onSubmit={handlePost}>
              <label>Title</label>
              <input placeholder="Announcement title..." value={annForm.title} onChange={e => setAnnForm({ ...annForm, title: e.target.value })} required />
              <label>Message</label>
              <textarea rows={4} placeholder="Write your announcement..." value={annForm.body} onChange={e => setAnnForm({ ...annForm, body: e.target.value })} required />
              <button type="submit" className="submit-btn" style={{ background: "#dc2626" }}>📢 Post Announcement</button>
            </form>
          </div>
        </div>
      )}

      {tab === "Reports" && (
        <div>
          <h2>Reports</h2>
          <div className="section-card">
            <h3>Attendance Overview</h3>
            {students.map(s => {
              const att = attendance[s.id] || { present: 0, total: 0 };
              const pct = att.total ? Math.round((att.present / att.total) * 100) : 0;
              return (
                <div key={s.id} className="att-row">
                  <div>
                    <strong>{s.name}</strong>
                    <small> — {s.dept} — {s.rollNo}</small>
                  </div>
                  <div className="progress-wrap">
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: `${pct}%`, background: pct >= 75 ? "#10b981" : "#ef4444" }} />
                    </div>
                    <span className={pct >= 75 ? "good" : "warn"}>{pct}%</span>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="section-card">
            <h3>Request Summary by Department</h3>
            {["CSE", "ECE", "MECH", "CIVIL", "EEE"].map(dept => {
              const dr = requests.filter(r => r.dept === dept);
              if (!dr.length) return null;
              return (
                <div key={dept} className="dept-summary">
                  <strong>{dept}</strong>
                  <span>Total: {dr.length}</span>
                  <span className="good">Approved: {dr.filter(r => r.status === "Approved").length}</span>
                  <span className="warn">Pending: {dr.filter(r => r.status === "Pending").length}</span>
                  <span style={{ color: "#ef4444" }}>Rejected: {dr.filter(r => r.status === "Rejected").length}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </Layout>
  );
}
