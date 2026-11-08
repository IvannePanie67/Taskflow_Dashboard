# TaskFlow Dashboard

A responsive task-management dashboard with all application files stored in one directory, built with **HTML, CSS, vanilla JavaScript, Express.js, and SQLite**. It supports full CRUD operations through a JSON REST API.

## Features

- Dashboard summary cards powered by live database counts
- Create, view, edit, and delete tasks
- Search by task title or description
- Filter tasks by status
- Priority and due-date fields
- Responsive desktop and mobile layout
- SQLite persistence; sample rows are inserted on first launch

## Requirements

- Node.js 18 or newer
- npm

## Run locally

```bash
npm install
npm start
```

Open http://localhost:3000.

For development with automatic server restart:

```bash
npm run dev
```

## REST API

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/tasks` | List tasks; optional `search` and `status` query parameters |
| GET | `/api/stats` | Dashboard totals |
| POST | `/api/tasks` | Create a task |
| PUT | `/api/tasks/:id` | Update a task |
| DELETE | `/api/tasks/:id` | Delete a task |

Example create request:

```json
{
  "title": "Prepare monthly report",
  "description": "Compile the latest numbers.",
  "status": "Pending",
  "priority": "High",
  "due_date": "2026-11-10"
}
```

## GitHub publishing

1. Create a **public** repository on GitHub, for example `taskflow-dashboard`.
2. Extract this ZIP and open a terminal in the folder containing `server.js` and `package.json`.
3. Run:

```bash
git init
git add .
git commit -m "Build TaskFlow CRUD dashboard"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/taskflow-dashboard.git
git push -u origin main
```

4. Confirm the repository visibility is **Public** and copy its URL.

## Screen-recording checklist

1. Start the app with `npm start`.
2. Record the dashboard on screen.
3. Demonstrate creating a task, editing it, searching/filtering, and deleting it.
4. Show that the dashboard counts update after each operation.
5. Stop recording and upload the video to Google Drive.
6. Set General access to **Anyone with the link — Viewer**, save, and copy the share link.

## Notes

- The SQLite database file is created automatically in the application directory on first run.
- For deployment on a host with ephemeral storage, configure `DB_FILE` to point to a persistent disk.
- This starter dashboard does not include user authentication. Add authentication and authorization before exposing it to multiple users on the public internet.
