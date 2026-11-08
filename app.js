const $ = id => document.getElementById(id);
const api = async (url, options = {}) => {
  const response = await fetch(url, { headers: { "Content-Type": "application/json" }, ...options });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "Something went wrong.");
  return data;
};
let toastTimer;
function toast(message) {
  $("toast").textContent = message; $("toast").classList.add("show");
  clearTimeout(toastTimer); toastTimer = setTimeout(() => $("toast").classList.remove("show"), 2600);
}
function escapeHtml(value = "") {
  return String(value).replace(/[&<>"']/g, c => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[c]));
}
function dateLabel(value) {
  if (!value) return "—";
  const d = new Date(value + "T00:00:00");
  return Number.isNaN(d.getTime()) ? escapeHtml(value) : d.toLocaleDateString(undefined, { month:"short", day:"numeric", year:"numeric" });
}
async function loadStats() {
  const s = await api("/api/stats");
  $("totalStat").textContent = s.total; $("progressStat").textContent = s.progress;
  $("pendingStat").textContent = s.pending; $("completedStat").textContent = s.completed;
}
async function loadTasks() {
  const params = new URLSearchParams({ search: $("searchInput").value, status: $("statusFilter").value });
  const tasks = await api("/api/tasks?" + params);
  $("taskRows").innerHTML = tasks.length ? tasks.map(t => `
    <tr>
      <td>${escapeHtml(t.title)}<span class="task-desc">${escapeHtml(t.description || "No description added")}</span></td>
      <td><span class="priority-${escapeHtml(t.priority)}">● ${escapeHtml(t.priority)}</span></td>
      <td><span class="pill status-${t.status.replaceAll(" ","-")}">${escapeHtml(t.status)}</span></td>
      <td>${dateLabel(t.due_date)}</td>
      <td><div class="row-actions"><button class="action-btn" data-edit="${t.id}">Edit</button><button class="action-btn" data-delete="${t.id}">Delete</button></div></td>
    </tr>`).join("") : '<tr><td colspan="5" class="empty">No tasks found. Create a task to get started.</td></tr>';
  $("resultCount").textContent = `${tasks.length} record${tasks.length === 1 ? "" : "s"} shown`;
}
async function refresh() { await Promise.all([loadStats(), loadTasks()]); }
function openModal(task) {
  $("taskForm").reset(); $("taskId").value = task?.id || "";
  $("title").value = task?.title || ""; $("description").value = task?.description || "";
  $("status").value = task?.status || "Pending"; $("priority").value = task?.priority || "Medium";
  $("dueDate").value = task?.due_date || ""; $("formError").textContent = "";
  $("modalTitle").textContent = task ? "Edit task" : "Create a task";
  $("saveBtn").textContent = task ? "Save changes" : "Save task";
  $("modalBackdrop").hidden = false; $("title").focus();
}
function closeModal() { $("modalBackdrop").hidden = true; }
$("addTaskBtn").addEventListener("click", () => openModal());
$("closeModal").addEventListener("click", closeModal);
$("cancelBtn").addEventListener("click", closeModal);
$("modalBackdrop").addEventListener("click", e => { if (e.target === $("modalBackdrop")) closeModal(); });
document.addEventListener("keydown", e => { if (e.key === "Escape") closeModal(); });
$("taskForm").addEventListener("submit", async e => {
  e.preventDefault();
  const id = $("taskId").value;
  const body = { title: $("title").value, description: $("description").value, status: $("status").value, priority: $("priority").value, due_date: $("dueDate").value };
  try {
    await api(id ? `/api/tasks/${id}` : "/api/tasks", { method: id ? "PUT" : "POST", body: JSON.stringify(body) });
    closeModal(); await refresh(); toast(id ? "Task updated successfully." : "Task created successfully.");
  } catch (err) { $("formError").textContent = err.message; }
});
$("taskRows").addEventListener("click", async e => {
  const editId = e.target.dataset.edit, deleteId = e.target.dataset.delete;
  try {
    if (editId) { const tasks = await api("/api/tasks"); const task = tasks.find(t => t.id === Number(editId)); if (task) openModal(task); }
    if (deleteId && confirm("Delete this task? This action cannot be undone.")) {
      await api(`/api/tasks/${deleteId}`, { method:"DELETE" }); await refresh(); toast("Task deleted.");
    }
  } catch (err) { toast(err.message); }
});
let searchTimer;
$("searchInput").addEventListener("input", () => { clearTimeout(searchTimer); searchTimer = setTimeout(() => loadTasks().catch(e => toast(e.message)), 250); });
$("statusFilter").addEventListener("change", () => loadTasks().catch(e => toast(e.message)));
$("refreshBtn").addEventListener("click", () => refresh().then(() => toast("Workspace refreshed.")).catch(e => toast(e.message)));
$("today").textContent = new Date().toLocaleDateString(undefined, { weekday:"short", month:"short", day:"numeric", year:"numeric" });
refresh().catch(err => { $("taskRows").innerHTML = `<tr><td colspan="5" class="empty">${escapeHtml(err.message)} — check that the server is running.</td></tr>`; });
