import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import Layout from "../components/Layout";
import AddUserForm from "../components/AddUserForm";

const TABS = ["Dashboard", "Pending Approvals", "All Requests", "Department Stats", "Add User", "Announcements"];

export default function HODDashboard() {
  const { user, logout, requests, updateRequest, announcements, attendance, students } = useAuth();
  const [tab, setTab] = useState("Dashboard");

  const deptRequests = requests.filter(r => r.dept === user.dept);
  const pending      = deptRequests.filter(r => r.professorStatus === "Approved" && r.hodStatus === "Pending");
  const deptStudents = students.filter(s => s.dept === user.dept);

  const handleAction = (id, action) => {
    const status = action === "approve" ? "Approved" : "Rejected";
    updateRequest(id, { hodStatus: status, status });
  };

  const statusBadge = (s) => <span className={`badge badge-${s.toLowerCase()}`}>{s}</span>;

  const sidebar = (
    <>
      <div className="sidebar-header">
        <div className="avatar">🏛️</div>
        <div>
          <strong>{user.name}</strong>
          <p>HOD — {user.dept}</p>
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
    <Layout sidebarColor="#059669" sidebar={sidebar}>
      {tab === "Dashboard" && (
        <div>
          <h2>HOD Dashboard 🏛️</h2>
          <div className="stats-grid">
            <div className="stat-card" style={{ "--c": "#059669" }}>
              <span className="stat-num">{deptRequests.length}</span>
              <span>Total Requests</span>
            </div>
            <div className="stat-card" style={{ "--c": "#f59e0b" }}>
              <span className="stat-num">{pending.length}</span>
              <span>Awaiting HOD Approval</span>
            </div>
            <div className="stat-card" style={{ "--c": "#10b981" }}>
              <span className="stat-num">{deptRequests.filter(r => r.hodStatus === "Approved").length}</span>
              <span>Approved</span>
            </div>
            <div className="stat-card" style={{ "--c": "#6366f1" }}>
              <span className="stat-num">{deptStudents.length}</span>
              <span>Students</span>
            </div>
          </div>
          <div className="section-card">
            <h3>📢 Announcements</h3>
            {announcements.slice(0, 2).map(a => (
              <div key={a.id} className="announcement-item">
                <strong>{a.title}</strong><p>{a.body}</p><small>{a.date}</small>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "Pending Approvals" && (
        <div>
          <h2>Pending HOD Approvals — {user.dept}</h2>
          {pending.length === 0
            ? <p className="empty">No requests awaiting your approval.</p>
            : pending.map(r => (
              <div key={r.id} className="request-card">
                <div className="req-header">
                  <span className={`type-badge type-${r.type.toLowerCase()}`}>{r.type}</span>
                  <strong>{r.studentName}</strong>
                  <small>Submitted {r.submittedAt} • Professor: {statusBadge(r.professorStatus)}</small>
                </div>
                <p>{r.reason}</p>
                <p className="date-range">📅 {r.fromDate} → {r.toDate}</p>
                <div className="action-row">
                  <button className="btn-approve" onClick={() => handleAction(r.id, "approve")}>✅ Approve</button>
                  <button className="btn-reject"  onClick={() => handleAction(r.id, "reject")}>❌ Reject</button>
                </div>
              </div>
            ))}
        </div>
      )}

      {tab === "All Requests" && (
        <div>
          <h2>All Requests — {user.dept}</h2>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Student</th><th>Type</th><th>Reason</th><th>From</th><th>To</th><th>Prof.</th><th>HOD</th></tr></thead>
              <tbody>
                {deptRequests.map(r => (
                  <tr key={r.id}>
                    <td>{r.studentName}</td>
                    <td><span className={`type-badge type-${r.type.toLowerCase()}`}>{r.type}</span></td>
                    <td>{r.reason}</td>
                    <td>{r.fromDate}</td>
                    <td>{r.toDate}</td>
                    <td>{statusBadge(r.professorStatus)}</td>
                    <td>{statusBadge(r.hodStatus)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === "Department Stats" && (
        <div>
          <h2>Department Statistics — {user.dept}</h2>
          <div className="section-card">
            <h3>Student Attendance</h3>
            {deptStudents.map(s => {
              const att = attendance[s.id] || { present: 0, total: 0 };
              const pct = att.total ? Math.round((att.present / att.total) * 100) : 0;
              return (
                <div key={s.id} className="att-row">
                  <div>
                    <strong>{s.name}</strong>
                    <small> — {s.rollNo} — {s.year} Year</small>
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
        </div>
      )}

      {tab === "Add User" && (
        <div>
          <h2>Add User ➕</h2>
          <AddUserForm allowedRoles={["student", "professor"]} />
        </div>
      )}

      {tab === "Announcements" && (
        <div>
          <h2>Announcements</h2>
          {announcements.map(a => (
            <div key={a.id} className="announcement-item big">
              <strong>{a.title}</strong><p>{a.body}</p><small>{a.date} • {a.by}</small>
            </div>
          ))}
        </div>
      )}
    </Layout>
  );
}
