const express = require("express");
const path = require("path");
const Database = require("better-sqlite3");

const app = express();
const PORT = process.env.PORT || 3000;
const db = new Database(process.env.DB_FILE || path.join(__dirname, "dashboard.db"));
db.pragma("journal_mode = WAL");
db.exec(`
  CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT DEFAULT '',
    status TEXT NOT NULL DEFAULT 'Pending'
      CHECK(status IN ('Pending','In Progress','Completed')),
    priority TEXT NOT NULL DEFAULT 'Medium'
      CHECK(priority IN ('Low','Medium','High')),
    due_date TEXT DEFAULT '',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )
`);
const count = db.prepare("SELECT COUNT(*) AS total FROM tasks").get().total;
if (!count) {
  const insert = db.prepare("INSERT INTO tasks (title,description,status,priority,due_date) VALUES (?,?,?,?,?)");
  [
    ["Prepare monthly report", "Compile the latest team performance numbers.", "In Progress", "High", "2026-11-10"],
    ["Review customer feedback", "Read and categorize recent feedback.", "Pending", "Medium", "2026-11-12"],
    ["Update product roadmap", "Move completed milestones and confirm priorities.", "Completed", "Low", "2026-11-05"],
    ["Plan team meeting", "Prepare agenda and invite participants.", "Pending", "Low", "2026-11-14"]
  ].forEach(t => insert.run(...t));
}
app.use(express.json());
app.use(express.static(__dirname));

app.get("/api/tasks", (req, res) => {
  const { search = "", status = "All" } = req.query;
  let sql = "SELECT * FROM tasks WHERE (title LIKE ? OR description LIKE ?)";
  const params = [`%${search}%`, `%${search}%`];
  if (status !== "All") { sql += " AND status = ?"; params.push(status); }
  sql += " ORDER BY CASE priority WHEN 'High' THEN 1 WHEN 'Medium' THEN 2 ELSE 3 END, id DESC";
  res.json(db.prepare(sql).all(...params));
});
app.get("/api/stats", (_req, res) => {
  const rows = db.prepare("SELECT status, COUNT(*) AS total FROM tasks GROUP BY status").all();
  const stats = { total: 0, pending: 0, progress: 0, completed: 0 };
  rows.forEach(r => {
    stats.total += r.total;
    if (r.status === "Pending") stats.pending = r.total;
    if (r.status === "In Progress") stats.progress = r.total;
    if (r.status === "Completed") stats.completed = r.total;
  });
  res.json(stats);
});
app.post("/api/tasks", (req, res) => {
  const { title, description = "", status = "Pending", priority = "Medium", due_date = "" } = req.body;
  if (!title || !title.trim()) return res.status(400).json({ error: "Task title is required." });
  if (!["Pending","In Progress","Completed"].includes(status) || !["Low","Medium","High"].includes(priority))
    return res.status(400).json({ error: "Invalid status or priority." });
  const result = db.prepare("INSERT INTO tasks (title,description,status,priority,due_date) VALUES (?,?,?,?,?)")
    .run(title.trim(), description, status, priority, due_date);
  res.status(201).json(db.prepare("SELECT * FROM tasks WHERE id = ?").get(result.lastInsertRowid));
});
app.put("/api/tasks/:id", (req, res) => {
  const { title, description = "", status, priority, due_date = "" } = req.body;
  if (!title || !title.trim()) return res.status(400).json({ error: "Task title is required." });
  if (!["Pending","In Progress","Completed"].includes(status) || !["Low","Medium","High"].includes(priority))
    return res.status(400).json({ error: "Invalid status or priority." });
  const result = db.prepare("UPDATE tasks SET title=?, description=?, status=?, priority=?, due_date=? WHERE id=?")
    .run(title.trim(), description, status, priority, due_date, req.params.id);
  if (!result.changes) return res.status(404).json({ error: "Task not found." });
  res.json(db.prepare("SELECT * FROM tasks WHERE id = ?").get(req.params.id));
});
app.delete("/api/tasks/:id", (req, res) => {
  const result = db.prepare("DELETE FROM tasks WHERE id = ?").run(req.params.id);
  if (!result.changes) return res.status(404).json({ error: "Task not found." });
  res.json({ success: true });
});
app.listen(PORT, () => console.log(`TaskFlow is running at http://localhost:${PORT}`));
