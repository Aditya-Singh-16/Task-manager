import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import Layout from "../components/Layout";
import {
  getProject, getTasks, createTask, updateTask,
  updateTaskStatus, deleteTask, addMember, removeMember, deleteProject
} from "../utils/api";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";

const STATUSES = ["todo", "in-progress", "done"];
const PRIORITIES = ["low", "medium", "high"];



function TaskModal({ projectId, members, task, onClose, onSaved }) {
  const [form, setForm] = useState({
    title: task?.title || "",
    description: task?.description || "",
    status: task?.status || "todo",
    priority: task?.priority || "medium",
    assignedTo: task?.assignedTo || "",
    dueDate: task?.dueDate ? task.dueDate.split("T")[0] : "",
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return toast.error("Title required");
    setLoading(true);
    try {
      const payload = { ...form, projectId, assignedTo: form.assignedTo || null };
      const res = task
        ? await updateTask(task.id, payload)
        : await createTask(payload);
      toast.success(task ? "Task updated!" : "Task created!");
      onSaved(res.data, !!task);
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.msg || "Failed to save task");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 540 }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{task ? "Edit Task" : "New Task"}</h3>
          <button className="btn btn-icon btn-secondary" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label">Title *</label>
              <input className="form-input" placeholder="Task title" value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })} autoFocus />
            </div>
            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea className="form-input" rows={3} placeholder="Optional description"
                value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                style={{ resize: "vertical" }} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div className="form-group">
                <label className="form-label">Status</label>
                <select className="form-input" value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}>
                  {STATUSES.map((s) => <option key={s} value={s}>{s.replace("-", " ")}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Priority</label>
                <select className="form-input" value={form.priority}
                  onChange={(e) => setForm({ ...form, priority: e.target.value })}>
                  {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div className="form-group">
                <label className="form-label">Assign To</label>
                <select className="form-input" value={form.assignedTo}
                  onChange={(e) => setForm({ ...form, assignedTo: e.target.value })}>
                  <option value="">Unassigned</option>
                  {members?.map((m) => (
                    <option key={m.user.id} value={m.user.id}>{m.user.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Due Date</label>
                <input type="date" className="form-input" value={form.dueDate}
                  onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? "Saving..." : task ? "Update Task" : "Create Task"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function AddMemberModal({ projectId, onClose, onAdded }) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("member");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) return toast.error("Email required");
    setLoading(true);
    try {
      const res = await addMember(projectId, { email, role });
      toast.success("Member added!");
      onAdded(res.data);
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.msg || "Failed to add member");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Add Team Member</h3>
          <button className="btn btn-icon btn-secondary" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label">User Email *</label>
              <input type="email" className="form-input" placeholder="member@example.com"
                value={email} onChange={(e) => setEmail(e.target.value)} autoFocus />
            </div>
            <div className="form-group">
              <label className="form-label">Role</label>
              <select className="form-input" value={role} onChange={(e) => setRole(e.target.value)}>
                <option value="member">Member</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? "Adding..." : "Add Member"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ProjectDetail() {
  const { projectId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("tasks");
  const [taskModal, setTaskModal] = useState(null); // null | "create" | task object
  const [memberModal, setMemberModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState("");
  const [filterPriority, setFilterPriority] = useState("");

  const isAdmin = project?.myRole === "admin";

  const fetchAll = useCallback(async () => {
    try {
      const [projRes, taskRes] = await Promise.all([
        getProject(projectId),
        getTasks(projectId),
      ]);
      setProject(projRes.data);
      setTasks(taskRes.data);
    } catch (err) {
      toast.error("Failed to load project");
      navigate("/projects");
    } finally {
      setLoading(false);
    }
  }, [projectId, navigate]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

const refreshTasks = useCallback(async () => {
  const res = await getTasks(projectId, {
    ...(filterStatus && { status: filterStatus }),
    ...(filterPriority && { priority: filterPriority }),
  });
  setTasks(res.data);
}, [projectId, filterStatus, filterPriority]);

 useEffect(() => {
  if (project) refreshTasks();
}, [project, refreshTasks]);

  const handleTaskSaved = (savedTask, isEdit) => {
    if (isEdit) {
      setTasks((prev) => prev.map((t) => t.id === savedTask.id ? savedTask : t));
    } else {
      setTasks((prev) => [savedTask, ...prev]);
    }
  };

  const handleStatusChange = async (taskId, status) => {
    try {
      const res = await updateTaskStatus(taskId, status);
      setTasks((prev) => prev.map((t) => t.id === taskId ? res.data : t));
    } catch (err) {
      toast.error("Failed to update status");
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm("Delete this task?")) return;
    try {
      await deleteTask(taskId);
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
      toast.success("Task deleted");
    } catch (err) {
      toast.error(err.response?.data?.msg || "Failed to delete task");
    }
  };

  const handleDeleteProject = async () => {
    if (!window.confirm(`Delete project "${project.name}"? This cannot be undone.`)) return;
    try {
      await deleteProject(projectId);
      toast.success("Project deleted");
      navigate("/projects");
    } catch (err) {
      toast.error("Failed to delete project");
    }
  };

  const handleRemoveMember = async (memberId) => {
    if (!window.confirm("Remove this member?")) return;
    try {
      await removeMember(projectId, memberId);
      setProject((prev) => ({ ...prev, members: prev.members.filter((m) => m.userId !== memberId) }));
      toast.success("Member removed");
    } catch (err) {
      toast.error(err.response?.data?.msg || "Failed to remove member");
    }
  };

  // Group tasks by status for kanban
  const kanbanCols = {
    todo: tasks.filter((t) => t.status === "todo"),
    "in-progress": tasks.filter((t) => t.status === "in-progress"),
    done: tasks.filter((t) => t.status === "done"),
  };

  const colColors = { todo: "var(--text2)", "in-progress": "var(--blue)", done: "var(--green)" };
  const colLabels = { todo: "To Do", "in-progress": "In Progress", done: "Done" };

  if (loading) return (
    <Layout><div className="loading-center"><div className="loading-spinner" /></div></Layout>
  );

  return (
    <Layout>
      <div className="topbar">
        <div className="topbar-title">
          <div className="breadcrumb">
            <Link to="/projects">Projects</Link>
            <span className="breadcrumb-sep">/</span>
          </div>
          <span>{project?.name}</span>
          <span className={`badge badge-${project?.myRole}`}>{project?.myRole}</span>
        </div>
        <div className="topbar-actions">
          {isAdmin && (
            <>
              <button className="btn btn-secondary btn-sm" onClick={() => setMemberModal(true)}>
                + Add Member
              </button>
              <button className="btn btn-danger btn-sm" onClick={handleDeleteProject}>
                Delete
              </button>
            </>
          )}
        </div>
      </div>

      <div className="page-body" style={{ paddingTop: 24 }}>
        {project?.description && (
          <p style={{ color: "var(--text2)", fontSize: 14, marginBottom: 20 }}>{project.description}</p>
        )}

        {/* Tabs */}
        <div style={{ display: "flex", gap: 4, marginBottom: 20, borderBottom: "1px solid var(--border)", paddingBottom: 0 }}>
          {["tasks", "members"].map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)} style={{
              padding: "8px 18px",
              background: "none",
              color: activeTab === tab ? "var(--accent2)" : "var(--text2)",
              borderBottom: activeTab === tab ? "2px solid var(--accent)" : "2px solid transparent",
              fontWeight: 600,
              fontSize: 14,
              textTransform: "capitalize",
              transition: "all 0.15s",
            }}>
              {tab} {tab === "tasks" ? `(${tasks.length})` : `(${project?.members?.length ?? 0})`}
            </button>
          ))}
        </div>

        {/* Tasks Tab */}
        {activeTab === "tasks" && (
          <>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
              <div className="filters-row" style={{ margin: 0 }}>
                <select className="form-input" style={{ width: "auto", padding: "6px 12px", fontSize: 13 }}
                  value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                  <option value="">All Status</option>
                  {STATUSES.map((s) => <option key={s} value={s}>{s.replace("-", " ")}</option>)}
                </select>
                <select className="form-input" style={{ width: "auto", padding: "6px 12px", fontSize: 13 }}
                  value={filterPriority} onChange={(e) => setFilterPriority(e.target.value)}>
                  <option value="">All Priority</option>
                  {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <button className="btn btn-primary btn-sm" onClick={() => setTaskModal("create")}>
                + New Task
              </button>
            </div>

            {tasks.length === 0 ? (
              <div className="empty-state">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/>
                </svg>
                <h3>No tasks yet</h3>
                <p>Create your first task to get started</p>
              </div>
            ) : (
              <div className="kanban-grid">
                {STATUSES.map((status) => (
                  <div className="kanban-col" key={status}>
                    <div className="kanban-col-header">
                      <span style={{ color: colColors[status] }}>{colLabels[status]}</span>
                      <span className="kanban-col-count">{kanbanCols[status].length}</span>
                    </div>
                    <div className="kanban-tasks">
                      {kanbanCols[status].map((task) => (
                        <div key={task.id} className="task-card">
                          <div className="task-card-title">{task.title}</div>
                          {task.description && (
                            <p style={{ fontSize: 12, color: "var(--text2)", marginBottom: 8, lineHeight: 1.4 }}>
                              {task.description.length > 80 ? task.description.slice(0, 80) + "…" : task.description}
                            </p>
                          )}
                          <div className="task-card-meta">
                            <span className={`badge badge-${task.priority}`}>{task.priority}</span>
                            {task.assignee && (
                              <span className="task-card-assignee">
                                <div style={{
                                  width: 18, height: 18, borderRadius: "50%",
                                  background: "var(--accent)", display: "flex",
                                  alignItems: "center", justifyContent: "center",
                                  fontSize: 9, fontWeight: 700, color: "white"
                                }}>
                                  {task.assignee.name[0]}
                                </div>
                                {task.assignee.name.split(" ")[0]}
                              </span>
                            )}
                            {task.dueDate && (
                              <span style={{ fontSize: 10, color: "var(--text2)" }}>
                                {new Date(task.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                              </span>
                            )}
                          </div>
                          <div style={{ display: "flex", gap: 6, marginTop: 10, flexWrap: "wrap" }}>
                            {STATUSES.filter((s) => s !== status).map((s) => (
                              <button key={s} className="btn btn-secondary btn-sm"
                                style={{ fontSize: 10, padding: "3px 8px" }}
                                onClick={() => handleStatusChange(task.id, s)}>
                                → {s.replace("-", " ")}
                              </button>
                            ))}
                            <button className="btn btn-secondary btn-sm" style={{ fontSize: 10, padding: "3px 8px" }}
                              onClick={() => setTaskModal(task)}>Edit</button>
                            {isAdmin && (
                              <button className="btn btn-danger btn-sm" style={{ fontSize: 10, padding: "3px 8px" }}
                                onClick={() => handleDeleteTask(task.id)}>Del</button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Members Tab */}
        {activeTab === "members" && (
          <div className="card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700 }}>Team Members</h3>
              {isAdmin && (
                <button className="btn btn-primary btn-sm" onClick={() => setMemberModal(true)}>
                  + Add Member
                </button>
              )}
            </div>
            {project?.members?.map((m) => (
              <div key={m.id} className="member-row">
                <div className="member-info">
                  <div className="user-avatar" style={{ width: 36, height: 36, fontSize: 14 }}>
                    {m.user.name[0]}
                  </div>
                  <div>
                    <div className="member-name">
                      {m.user.name} {m.userId === user?.id && <span style={{ fontSize: 11, color: "var(--text2)" }}>(you)</span>}
                    </div>
                    <div className="member-email">{m.user.email}</div>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span className={`badge badge-${m.role}`}>{m.role}</span>
                  {isAdmin && m.userId !== user?.id && (
                    <button className="btn btn-danger btn-sm" style={{ padding: "4px 10px", fontSize: 11 }}
                      onClick={() => handleRemoveMember(m.userId)}>Remove</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {(taskModal === "create" || (taskModal && typeof taskModal === "object")) && (
        <TaskModal
          projectId={parseInt(projectId)}
          members={project?.members}
          task={taskModal === "create" ? null : taskModal}
          onClose={() => setTaskModal(null)}
          onSaved={handleTaskSaved}
        />
      )}

      {memberModal && (
        <AddMemberModal
          projectId={parseInt(projectId)}
          onClose={() => setMemberModal(false)}
          onAdded={(member) => setProject((prev) => ({ ...prev, members: [...prev.members, member] }))}
        />
      )}
    </Layout>
  );
}
