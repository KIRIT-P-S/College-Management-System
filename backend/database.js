require("dotenv").config();
const { Pool } = require("pg");
const bcrypt   = require("bcryptjs");

const pool = new Pool(
  process.env.DATABASE_URL
    ? { connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } }
    : {
        host:     process.env.DB_HOST     || "localhost",
        port:     parseInt(process.env.DB_PORT) || 5432,
        database: process.env.DB_NAME     || "college_portal",
        user:     process.env.DB_USER     || "postgres",
        password: process.env.DB_PASSWORD || "",
      }
);

// Test connection
pool.connect((err, client, release) => {
  if (err) { console.error("❌ PostgreSQL connection failed:", err.message); process.exit(1); }
  console.log("✅ PostgreSQL connected");
  release();
});

async function initDB() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS students (
      id         SERIAL PRIMARY KEY,
      name       TEXT NOT NULL,
      username   TEXT UNIQUE NOT NULL,
      password   TEXT NOT NULL,
      dept       TEXT NOT NULL,
      year       TEXT NOT NULL,
      "rollNo"   TEXT UNIQUE NOT NULL,
      email      TEXT UNIQUE NOT NULL,
      phone      TEXT DEFAULT '',
      "createdAt" DATE DEFAULT CURRENT_DATE
    );

    CREATE TABLE IF NOT EXISTS staff (
      id       SERIAL PRIMARY KEY,
      name     TEXT NOT NULL,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role     TEXT NOT NULL,
      dept     TEXT,
      subject  TEXT,
      email    TEXT UNIQUE NOT NULL
    );

    CREATE TABLE IF NOT EXISTS requests (
      id               SERIAL PRIMARY KEY,
      "studentId"      INTEGER NOT NULL REFERENCES students(id),
      "studentName"    TEXT NOT NULL,
      dept             TEXT NOT NULL,
      type             TEXT NOT NULL,
      reason           TEXT NOT NULL,
      "fromDate"       TEXT NOT NULL,
      "toDate"         TEXT NOT NULL,
      status           TEXT DEFAULT 'Pending',
      "professorStatus" TEXT DEFAULT 'Pending',
      "hodStatus"      TEXT DEFAULT 'Pending',
      "submittedAt"    DATE DEFAULT CURRENT_DATE
    );

    CREATE TABLE IF NOT EXISTS announcements (
      id    SERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      body  TEXT NOT NULL,
      by    TEXT NOT NULL,
      date  DATE DEFAULT CURRENT_DATE
    );

    CREATE TABLE IF NOT EXISTS attendance (
      id          SERIAL PRIMARY KEY,
      "studentId" INTEGER NOT NULL UNIQUE REFERENCES students(id),
      present     INTEGER NOT NULL DEFAULT 0,
      total       INTEGER NOT NULL DEFAULT 0
    );
  `);

  // Seed staff
  const { rows: staffRows } = await pool.query("SELECT COUNT(*) AS c FROM staff");
  if (parseInt(staffRows[0].c) === 0) {
    const seedStaff = [
      { name: "Dr. Ramesh Kumar",   username: "ramesh", password: "prof123",  role: "professor",  dept: "CSE", subject: "Data Structures", email: "ramesh@college.edu" },
      { name: "Dr. Priya Nair",     username: "priya",  password: "prof123",  role: "professor",  dept: "ECE", subject: "Circuits",        email: "priya@college.edu"  },
      { name: "Prof. Suresh Menon", username: "suresh", password: "hod123",   role: "hod",        dept: "CSE", subject: null,              email: "suresh@college.edu" },
      { name: "Prof. Anita Rao",    username: "anita",  password: "hod123",   role: "hod",        dept: "ECE", subject: null,              email: "anita@college.edu"  },
      { name: "Dr. V. Krishnan",    username: "admin",  password: "mgmt123",  role: "management", dept: null,  subject: null,              email: "admin@college.edu"  },
    ];
    for (const s of seedStaff) {
      await pool.query(
        "INSERT INTO staff (name, username, password, role, dept, subject, email) VALUES ($1,$2,$3,$4,$5,$6,$7)",
        [s.name, s.username, bcrypt.hashSync(s.password, 10), s.role, s.dept, s.subject, s.email]
      );
    }
    console.log("✅ Staff seeded");
  }

  // Seed announcements
  const { rows: annRows } = await pool.query("SELECT COUNT(*) AS c FROM announcements");
  if (parseInt(annRows[0].c) === 0) {
    await pool.query("INSERT INTO announcements (title, body, by) VALUES ($1,$2,$3)", ["Semester Exams Schedule", "End semester exams begin from August 1st.", "Management"]);
    await pool.query("INSERT INTO announcements (title, body, by) VALUES ($1,$2,$3)", ["Holiday Notice", "College will remain closed on July 20th.", "Management"]);
    console.log("✅ Announcements seeded");
  }
}

initDB().catch(err => { console.error("❌ DB init failed:", err.message); process.exit(1); });

module.exports = pool;
