import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import Layout from "../components/Layout";
import AddUserForm from "../components/AddUserForm";

const TABS = ["Dashboard", "Pending Requests", "All Requests", "Mark Attendance", "Add Student", "Announcements"];

export default function ProfessorDashboard() {
  const { user, logout, requests, updateRequest, announcements, attendance, markAttendance, students } = useAuth();
  const [tab, setTab]         = useState("Dashboard");
  const [attMarked, setAttMarked] = useState(false);

  const deptRequests = requests.filter(r => r.dept === user.dept);
  const pending      = deptRequests.filter(r => r.professorStatus === "Pending");
  const deptStudents = students.filter(s => s.dept === user.dept);

  const handleAction = (id, action) => {
    const status = action === "approve" ? "Approved" : "Rejected";
    updateRequest(id, { professorStatus: status, status: status === "Rejected" ? "Rejected" : "Pending" });
  };

  const handleMarkAtt = (studentDbId, present) => {
    markAttendance(studentDbId, present);
    setAttMarked(true);
    setTimeout(() => setAttMarked(false), 2000);
  };

  const statusBadge = (s) => <span className={`badge badge-${s.toLowerCase()}`}>{s}</span>;

  const sidebar = (
    <>
      <div className="sidebar-header">
        <div className="avatar">👨‍🏫</div>
        <div>
          <strong>{user.name}</strong>
          <p>{user.subject}</p>
          <p>{user.dept} Dept.</p>
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
    <Layout sidebarColor="#0891b2" sidebar={sidebar}>
      {tab === "Dashboard" && (
        <div>
          <h2>Professor Dashboard 👨‍🏫</h2>
          <div className="stats-grid">
            <div className="stat-card" style={{ "--c": "#0891b2" }}>
              <span className="stat-num">{deptRequests.length}</span>
              <span>Total Requests</span>
            </div>
            <div className="stat-card" style={{ "--c": "#f59e0b" }}>
              <span className="stat-num">{pending.length}</span>
              <span>Awaiting Review</span>
            </div>
            <div className="stat-card" style={{ "--c": "#10b981" }}>
              <span className="stat-num">{deptRequests.filter(r => r.professorStatus === "Approved").length}</span>
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

      {tab === "Pending Requests" && (
        <div>
          <h2>Pending Requests — {user.dept}</h2>
          {pending.length === 0 ? <p className="empty">No pending requests.</p> : pending.map(r => (
            <div key={r.id} className="request-card">
              <div className="req-header">
                <span className={`type-badge type-${r.type.toLowerCase()}`}>{r.type}</span>
                <strong>{r.studentName}</strong>
                <small>Submitted {r.submittedAt}</small>
              </div>
              <p>{r.reason}</p>
              <p className="date-range">📅 {r.fromDate} → {r.toDate}</p>
              <div className="action-row">
                <button className="btn-approve" onClick={() => handleAction(r.id, "approve")}>✅ Approve & Forward to HOD</button>
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
              <thead><tr><th>Student</th><th>Type</th><th>Reason</th><th>From</th><th>To</th><th>Status</th></tr></thead>
              <tbody>
                {deptRequests.map(r => (
                  <tr key={r.id}>
                    <td>{r.studentName}</td>
                    <td><span className={`type-badge type-${r.type.toLowerCase()}`}>{r.type}</span></td>
                    <td>{r.reason}</td>
                    <td>{r.fromDate}</td>
                    <td>{r.toDate}</td>
                    <td>{statusBadge(r.professorStatus)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === "Mark Attendance" && (
        <div>
          <h2>Mark Attendance</h2>
          {attMarked && <div className="success-msg">✅ Attendance marked!</div>}
          <div className="section-card">
            {deptStudents.map(s => {
              const att = attendance[s.id] || { present: 0, total: 0 };
              const pct = att.total ? Math.round((att.present / att.total) * 100) : 0;
              return (
                <div key={s.id} className="att-row">
                  <div>
                    <strong>{s.name}</strong>
                    <small> {s.rollNo} • {pct}% ({att.present}/{att.total})</small>
                  </div>
                  <div className="att-actions">
                    <button className="btn-approve" onClick={() => handleMarkAtt(s.dbId, true)}>✅ Present</button>
                    <button className="btn-reject"  onClick={() => handleMarkAtt(s.dbId, false)}>❌ Absent</button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {tab === "Add Student" && (
        <div>
          <h2>Add Student ➕</h2>
          <AddUserForm allowedRoles={["student"]} />
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
