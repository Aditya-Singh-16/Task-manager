import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Layout from "../components/Layout";
import { getProjects, createProject } from "../utils/api";
import toast from "react-hot-toast";

function CreateProjectModal({ onClose, onCreated }) {
  const [form, setForm] = useState({ name: "", description: "" });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error("Project name required");
    setLoading(true);
    try {
      const res = await createProject(form);
      toast.success("Project created!");
      onCreated(res.data);
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.msg || "Failed to create project");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>New Project</h3>
          <button className="btn btn-icon btn-secondary" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label">Project Name *</label>
              <input
                className="form-input"
                placeholder="e.g. Website Redesign"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                autoFocus
              />
            </div>
            <div className="form-group">
              <label className="form-label">Description (optional)</label>
              <textarea
                className="form-input"
                placeholder="What is this project about?"
                rows={3}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                style={{ resize: "vertical" }}
              />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? "Creating..." : "Create Project"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Projects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const fetchProjects = () => {
    getProjects()
      .then((res) => setProjects(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(fetchProjects, []);

  const handleCreated = (project) => {
    setProjects((prev) => [{ ...project, myRole: "admin", _count: { tasks: 0, members: 1 } }, ...prev]);
  };

  return (
    <Layout>
      <div className="page-header" style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <div>
          <h2>Projects</h2>
          <p>{projects.length} project{projects.length !== 1 ? "s" : ""} found</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)} style={{ marginTop: 8 }}>
          + New Project
        </button>
      </div>

      <div className="page-body">
        {loading ? (
          <div className="loading-center"><div className="loading-spinner" /></div>
        ) : projects.length === 0 ? (
          <div className="empty-state">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V7z"/>
            </svg>
            <h3>No projects yet</h3>
            <p>Create your first project to get started</p>
            <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => setShowModal(true)}>
              Create Project
            </button>
          </div>
        ) : (
          <div className="projects-grid">
            {projects.map((p) => (
              <Link to={`/projects/${p.id}`} key={p.id} className="project-card">
                <div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                    <div className="project-card-name">{p.name}</div>
                    <span className={`badge badge-${p.myRole}`}>{p.myRole}</span>
                  </div>
                  {p.description && <div className="project-card-desc">{p.description}</div>}
                </div>
                <div className="project-card-meta">
                  <div className="project-card-stats">
                    <div className="project-stat">
                      <strong>{p._count?.tasks ?? 0}</strong> tasks
                    </div>
                    <div className="project-stat">
                      <strong>{p._count?.members ?? 0}</strong> members
                    </div>
                  </div>
                  <span style={{ fontSize: 11, color: "var(--text2)" }}>
                    {new Date(p.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <CreateProjectModal onClose={() => setShowModal(false)} onCreated={handleCreated} />
      )}
    </Layout>
  );
}
