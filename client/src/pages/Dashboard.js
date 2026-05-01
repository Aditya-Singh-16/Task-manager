import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Layout from "../components/Layout";
import { getDashboard } from "../utils/api";
import { useAuth } from "../context/AuthContext";

const StatusBadge = ({ status }) => (
  <span className={`badge badge-${status}`}>{status.replace("-", " ")}</span>
);

const PriorityBadge = ({ priority }) => (
  <span className={`badge badge-${priority}`}>{priority}</span>
);

function formatDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDashboard()
      .then((res) => setData(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <Layout>
      <div className="loading-center"><div className="loading-spinner" /></div>
    </Layout>
  );

  const { stats, recentTasks, projects } = data || {};

  return (
    <Layout>
      <div className="page-header">
        <h2>Good morning, {user?.name?.split(" ")[0]} 👋</h2>
        <p>Here's what's happening with your projects today.</p>
      </div>

      <div className="page-body">
        {/* Stats */}
        <div className="stats-grid">
          <div className="stat-card purple">
            <div className="stat-value">{stats?.totalProjects ?? 0}</div>
            <div className="stat-label">Total Projects</div>
          </div>
          <div className="stat-card blue">
            <div className="stat-value">{stats?.totalTasks ?? 0}</div>
            <div className="stat-label">Tasks Assigned</div>
          </div>
          <div className="stat-card green">
            <div className="stat-value">{stats?.completedTasks ?? 0}</div>
            <div className="stat-label">Completed</div>
          </div>
          <div className="stat-card yellow">
            <div className="stat-value">{stats?.inProgressTasks ?? 0}</div>
            <div className="stat-label">In Progress</div>
          </div>
          <div className="stat-card red">
            <div className="stat-value">{stats?.overdueTasks ?? 0}</div>
            <div className="stat-label">Overdue</div>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
          {/* Recent Tasks */}
          <div className="card">
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700 }}>My Recent Tasks</h3>
            </div>
            {recentTasks?.length === 0 ? (
              <p style={{ color: "var(--text2)", fontSize: 14 }}>No tasks assigned yet.</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {recentTasks?.map((task) => (
                  <div key={task.id} style={{
                    background: "var(--surface2)",
                    border: "1px solid var(--border)",
                    borderRadius: 8,
                    padding: "12px 14px",
                  }}>
                    <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 6 }}>{task.title}</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                      <StatusBadge status={task.status} />
                      <PriorityBadge priority={task.priority} />
                      {task.project && (
                        <Link to={`/projects/${task.project.id}`} style={{ fontSize: 11, color: "var(--accent2)" }}>
                          {task.project.name}
                        </Link>
                      )}
                      {task.dueDate && (
                        <span style={{ fontSize: 11, color: "var(--text2)", marginLeft: "auto" }}>
                          Due {formatDate(task.dueDate)}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* My Projects */}
          <div className="card">
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700 }}>My Projects</h3>
              <Link to="/projects" className="btn btn-secondary btn-sm">View All</Link>
            </div>
            {projects?.length === 0 ? (
              <p style={{ color: "var(--text2)", fontSize: 14 }}>No projects yet.</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {projects?.slice(0, 5).map((p) => (
                  <Link
                    to={`/projects/${p.id}`}
                    key={p.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      background: "var(--surface2)",
                      border: "1px solid var(--border)",
                      borderRadius: 8,
                      padding: "12px 14px",
                      textDecoration: "none",
                      transition: "border-color 0.15s",
                    }}
                  >
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600 }}>{p.name}</div>
                      <div style={{ fontSize: 11, color: "var(--text2)", marginTop: 2 }}>
                        {p._count?.tasks ?? 0} tasks · {p._count?.members ?? 0} members
                      </div>
                    </div>
                    <span className={`badge badge-${p.myRole}`}>{p.myRole}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
