require("dotenv").config();
const express = require("express");
const cors    = require("cors");
const bcrypt  = require("bcryptjs");
const multer  = require("multer");
const XLSX    = require("xlsx");
const pool    = require("./database");

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

const app = express();
app.use(cors());
app.use(express.json());

// ─── STUDENTS ────────────────────────────────────────────────────────────────

app.post("/api/students", async (req, res) => {
  const { name, username, password, dept, year, rollNo, email, phone } = req.body;
  if (!name || !username || !password || !dept || !year || !rollNo || !email)
    return res.status(400).json({ error: "All fields are required." });
  try {
    const exists = await pool.query(
      `SELECT id FROM students WHERE username=$1 OR "rollNo"=$2 OR email=$3`,
      [username, rollNo, email]
    );
    if (exists.rows.length) return res.status(409).json({ error: "Username, Roll No or Email already exists." });
    const hashed = bcrypt.hashSync(password, 10);
    const result = await pool.query(
      `INSERT INTO students (name, username, password, dept, year, "rollNo", email, phone) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id`,
      [name, username, hashed, dept, year, rollNo, email, phone || ""]
    );
    await pool.query(`INSERT INTO attendance ("studentId", present, total) VALUES ($1,0,0) ON CONFLICT DO NOTHING`, [result.rows[0].id]);
    res.json({ message: "Student added successfully." });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post("/api/staff", async (req, res) => {
  const { name, username, password, role, dept, subject, email } = req.body;
  if (!name || !username || !password || !role || !email)
    return res.status(400).json({ error: "All fields are required." });
  try {
    const exists = await pool.query("SELECT id FROM staff WHERE username=$1 OR email=$2", [username, email]);
    if (exists.rows.length) return res.status(409).json({ error: "Username or Email already exists." });
    const hashed = bcrypt.hashSync(password, 10);
    await pool.query(
      "INSERT INTO staff (name, username, password, role, dept, subject, email) VALUES ($1,$2,$3,$4,$5,$6,$7)",
      [name, username, hashed, role, dept || null, subject || null, email]
    );
    res.json({ message: `${role} added successfully.` });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Bulk upload students via Excel
app.post("/api/students/bulk", upload.single("file"), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded." });
  try {
    const wb   = XLSX.read(req.file.buffer, { type: "buffer" });
    const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { defval: "" });
    if (!rows.length) return res.status(400).json({ error: "Excel file is empty." });

    let added = 0, skipped = 0;
    const errors = [];
    const client = await pool.connect();

    try {
      await client.query("BEGIN");
      for (let i = 0; i < rows.length; i++) {
        const row      = rows[i];
        const name     = String(row.name     || row.Name     || "").trim();
        const username = String(row.username || row.Username || "").trim();
        const password = String(row.password || row.Password || "").trim();
        const dept     = String(row.dept     || row.Dept     || row.Department || "CSE").trim();
        const year     = String(row.year     || row.Year     || "1st").trim();
        const rollNo   = String(row.rollNo   || row.RollNo   || row.roll_no   || "").trim();
        const email    = String(row.email    || row.Email    || "").trim();
        const phone    = String(row.phone    || row.Phone    || "").trim();

        if (!name || !username || !password || !rollNo || !email) {
          errors.push(`Row ${i + 2}: missing required fields`); skipped++; continue;
        }
        const exists = await client.query(
          `SELECT id FROM students WHERE username=$1 OR "rollNo"=$2 OR email=$3`,
          [username, rollNo, email]
        );
        if (exists.rows.length) {
          errors.push(`Row ${i + 2}: ${username} already exists`); skipped++; continue;
        }
        const hashed = bcrypt.hashSync(password, 10);
        const result = await client.query(
          `INSERT INTO students (name, username, password, dept, year, "rollNo", email, phone) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id`,
          [name, username, hashed, dept, year, rollNo, email, phone]
        );
        await client.query(`INSERT INTO attendance ("studentId", present, total) VALUES ($1,0,0) ON CONFLICT DO NOTHING`, [result.rows[0].id]);
        added++;
      }
      await client.query("COMMIT");
    } catch (e) {
      await client.query("ROLLBACK");
      throw e;
    } finally { client.release(); }

    res.json({ message: `${added} student(s) added, ${skipped} skipped.`, errors });
  } catch (e) { res.status(500).json({ error: "Failed to process file: " + e.message }); }
});

// ─── AUTH ────────────────────────────────────────────────────────────────────

app.post("/api/login", async (req, res) => {
  const { username, password } = req.body;
  try {
    const sRes = await pool.query("SELECT * FROM students WHERE username=$1", [username]);
    if (sRes.rows.length) {
      const student = sRes.rows[0];
      if (!bcrypt.compareSync(password, student.password))
        return res.status(401).json({ error: "Invalid credentials." });
      const { password: _, ...safe } = student;
      return res.json({ user: { ...safe, id: `s${student.id}`, dbId: student.id }, role: "student" });
    }
    const stRes = await pool.query("SELECT * FROM staff WHERE username=$1", [username]);
    if (stRes.rows.length) {
      const staff = stRes.rows[0];
      if (!bcrypt.compareSync(password, staff.password))
        return res.status(401).json({ error: "Invalid credentials." });
      const { password: _, ...safe } = staff;
      return res.json({ user: { ...safe, id: `${safe.role[0]}${staff.id}`, dbId: staff.id }, role: safe.role });
    }
    res.status(401).json({ error: "Invalid credentials." });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── REQUESTS ────────────────────────────────────────────────────────────────

app.get("/api/requests", async (req, res) => {
  try {
    const { rows } = await pool.query(`SELECT * FROM requests ORDER BY "submittedAt" DESC`);
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post("/api/requests", async (req, res) => {
  const { studentId, studentName, dept, type, reason, from, to } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO requests ("studentId","studentName",dept,type,reason,"fromDate","toDate") VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id`,
      [studentId, studentName, dept, type, reason, from, to]
    );
    res.json({ id: result.rows[0].id, message: "Request submitted." });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.patch("/api/requests/:id", async (req, res) => {
  const { professorStatus, hodStatus, status } = req.body;
  const fields = [], vals = [];
  if (professorStatus !== undefined) { fields.push(`"professorStatus"=$${fields.length + 1}`); vals.push(professorStatus); }
  if (hodStatus       !== undefined) { fields.push(`"hodStatus"=$${fields.length + 1}`);       vals.push(hodStatus); }
  if (status          !== undefined) { fields.push(`status=$${fields.length + 1}`);             vals.push(status); }
  if (!fields.length) return res.status(400).json({ error: "Nothing to update." });
  vals.push(req.params.id);
  try {
    await pool.query(`UPDATE requests SET ${fields.join(", ")} WHERE id=$${vals.length}`, vals);
    res.json({ message: "Updated." });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── ANNOUNCEMENTS ───────────────────────────────────────────────────────────

app.get("/api/announcements", async (req, res) => {
  try {
    const { rows } = await pool.query("SELECT * FROM announcements ORDER BY date DESC");
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post("/api/announcements", async (req, res) => {
  const { title, body, by } = req.body;
  try {
    const result = await pool.query("INSERT INTO announcements (title, body, by) VALUES ($1,$2,$3) RETURNING id", [title, body, by]);
    res.json({ id: result.rows[0].id });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── ATTENDANCE ──────────────────────────────────────────────────────────────

app.get("/api/attendance", async (req, res) => {
  try {
    const { rows } = await pool.query("SELECT * FROM attendance");
    const map = {};
    rows.forEach(r => { map[`s${r.studentId}`] = { present: r.present, total: r.total }; });
    res.json(map);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.patch("/api/attendance/:studentDbId", async (req, res) => {
  const { present } = req.body;
  const id = req.params.studentDbId;
  try {
    await pool.query(
      `INSERT INTO attendance ("studentId", present, total) VALUES ($1,$2,1)
       ON CONFLICT ("studentId") DO UPDATE SET
         present = attendance.present + $3,
         total   = attendance.total + 1`,
      [id, present ? 1 : 0, present ? 1 : 0]
    );
    res.json({ message: "Attendance updated." });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── RESET PASSWORD ──────────────────────────────────────────────────────────

app.post("/api/reset-password/:id", async (req, res) => {
  const { newPassword } = req.body;
  if (!newPassword || newPassword.length < 6)
    return res.status(400).json({ error: "Password must be at least 6 characters." });
  try {
    const hashed = bcrypt.hashSync(newPassword, 10);
    const result = await pool.query("UPDATE students SET password=$1 WHERE id=$2", [hashed, req.params.id]);
    if (result.rowCount === 0) return res.status(404).json({ error: "Student not found." });
    res.json({ message: "Password reset successfully." });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── STUDENTS LIST ───────────────────────────────────────────────────────────

app.get("/api/students", async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, name, username, dept, year, "rollNo", email, phone, "createdAt" FROM students`
    );
    res.json(rows.map(s => ({ ...s, id: `s${s.id}`, dbId: s.id })));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── START ───────────────────────────────────────────────────────────────────

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`✅ Backend running on http://localhost:${PORT}`));
