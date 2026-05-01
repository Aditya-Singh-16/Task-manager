import axios from "axios";

const API = axios.create({
  baseURL: "/api",
});

// Attach token to every request
API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle 401 globally
API.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);

// Auth
export const signup = (data) => API.post("/auth/signup", data);
export const login = (data) => API.post("/auth/login", data);
export const getMe = () => API.get("/auth/me");

// Projects
export const getProjects = () => API.get("/projects");
export const getProject = (id) => API.get(`/projects/${id}`);
export const createProject = (data) => API.post("/projects", data);
export const updateProject = (id, data) => API.put(`/projects/${id}`, data);
export const deleteProject = (id) => API.delete(`/projects/${id}`);
export const addMember = (projectId, data) => API.post(`/projects/${projectId}/members`, data);
export const removeMember = (projectId, userId) => API.delete(`/projects/${projectId}/members/${userId}`);
export const updateMemberRole = (projectId, userId, data) => API.put(`/projects/${projectId}/members/${userId}`, data);

// Tasks
export const getTasks = (projectId, params) => API.get(`/tasks/project/${projectId}`, { params });
export const getTask = (taskId) => API.get(`/tasks/${taskId}`);
export const createTask = (data) => API.post("/tasks", data);
export const updateTask = (taskId, data) => API.put(`/tasks/${taskId}`, data);
export const updateTaskStatus = (taskId, status) => API.patch(`/tasks/${taskId}/status`, { status });
export const deleteTask = (taskId) => API.delete(`/tasks/${taskId}`);

// Dashboard
export const getDashboard = () => API.get("/dashboard");

export default API;
