const prisma = require("../config/db");

// Create task
exports.createTask = async (req, res) => {
  try {
    const { title, description, projectId, assignedTo, priority, dueDate, status } = req.body;

    if (!title || title.trim().length < 2) {
      return res.status(400).json({ msg: "Task title must be at least 2 characters" });
    }
    if (!projectId) {
      return res.status(400).json({ msg: "Project ID is required" });
    }

    // Check user is member of this project
    const membership = await prisma.projectMember.findUnique({
      where: { userId_projectId: { userId: req.user.id, projectId: parseInt(projectId) } },
    });
    if (!membership) return res.status(403).json({ msg: "You are not a member of this project" });

    // Validate priority
    const validPriorities = ["low", "medium", "high"];
    const validStatuses = ["todo", "in-progress", "done"];

    const task = await prisma.task.create({
      data: {
        title: title.trim(),
        description: description?.trim() || null,
        projectId: parseInt(projectId),
        assignedTo: assignedTo ? parseInt(assignedTo) : null,
        priority: validPriorities.includes(priority) ? priority : "medium",
        status: validStatuses.includes(status) ? status : "todo",
        dueDate: dueDate ? new Date(dueDate) : null,
      },
    });

    res.status(201).json(task);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get all tasks for a project
exports.getTasks = async (req, res) => {
  try {
    const projectId = parseInt(req.params.projectId);
    const { status, priority, assignedTo } = req.query;

    // Check membership
    const membership = await prisma.projectMember.findUnique({
      where: { userId_projectId: { userId: req.user.id, projectId } },
    });
    if (!membership) return res.status(403).json({ msg: "Access denied" });

    const filters = { projectId };
    if (status) filters.status = status;
    if (priority) filters.priority = priority;
    if (assignedTo) filters.assignedTo = parseInt(assignedTo);

    const tasks = await prisma.task.findMany({
      where: filters,
      orderBy: [{ createdAt: "desc" }],
    });

    // Enrich with assignee info
    const userIds = [...new Set(tasks.map((t) => t.assignedTo).filter(Boolean))];
    let usersMap = {};
    if (userIds.length > 0) {
      const users = await prisma.user.findMany({
        where: { id: { in: userIds } },
        select: { id: true, name: true, email: true },
      });
      users.forEach((u) => (usersMap[u.id] = u));
    }

    const enriched = tasks.map((t) => ({
      ...t,
      assignee: t.assignedTo ? usersMap[t.assignedTo] || null : null,
    }));

    res.json(enriched);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get single task
exports.getTask = async (req, res) => {
  try {
    const task = await prisma.task.findUnique({ where: { id: parseInt(req.params.taskId) } });
    if (!task) return res.status(404).json({ msg: "Task not found" });

    // Check membership
    const membership = await prisma.projectMember.findUnique({
      where: { userId_projectId: { userId: req.user.id, projectId: task.projectId } },
    });
    if (!membership) return res.status(403).json({ msg: "Access denied" });

    res.json(task);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Update task
exports.updateTask = async (req, res) => {
  try {
    const taskId = parseInt(req.params.taskId);
    const { title, description, status, priority, assignedTo, dueDate } = req.body;

    const existing = await prisma.task.findUnique({ where: { id: taskId } });
    if (!existing) return res.status(404).json({ msg: "Task not found" });

    const membership = await prisma.projectMember.findUnique({
      where: { userId_projectId: { userId: req.user.id, projectId: existing.projectId } },
    });
    if (!membership) return res.status(403).json({ msg: "Access denied" });

    const validPriorities = ["low", "medium", "high"];
    const validStatuses = ["todo", "in-progress", "done"];

    const updated = await prisma.task.update({
      where: { id: taskId },
      data: {
        ...(title && { title: title.trim() }),
        ...(description !== undefined && { description: description?.trim() || null }),
        ...(status && validStatuses.includes(status) && { status }),
        ...(priority && validPriorities.includes(priority) && { priority }),
        ...(assignedTo !== undefined && { assignedTo: assignedTo ? parseInt(assignedTo) : null }),
        ...(dueDate !== undefined && { dueDate: dueDate ? new Date(dueDate) : null }),
      },
    });

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Delete task
exports.deleteTask = async (req, res) => {
  try {
    const taskId = parseInt(req.params.taskId);

    const existing = await prisma.task.findUnique({ where: { id: taskId } });
    if (!existing) return res.status(404).json({ msg: "Task not found" });

    const membership = await prisma.projectMember.findUnique({
      where: { userId_projectId: { userId: req.user.id, projectId: existing.projectId } },
    });
    if (!membership) return res.status(403).json({ msg: "Access denied" });
    if (membership.role !== "admin") return res.status(403).json({ msg: "Only admins can delete tasks" });

    await prisma.task.delete({ where: { id: taskId } });
    res.json({ msg: "Task deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Update task status only (quick update)
exports.updateTaskStatus = async (req, res) => {
  try {
    const taskId = parseInt(req.params.taskId);
    const { status } = req.body;

    const validStatuses = ["todo", "in-progress", "done"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ msg: "Invalid status" });
    }

    const existing = await prisma.task.findUnique({ where: { id: taskId } });
    if (!existing) return res.status(404).json({ msg: "Task not found" });

    const membership = await prisma.projectMember.findUnique({
      where: { userId_projectId: { userId: req.user.id, projectId: existing.projectId } },
    });
    if (!membership) return res.status(403).json({ msg: "Access denied" });

    const updated = await prisma.task.update({ where: { id: taskId }, data: { status } });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
