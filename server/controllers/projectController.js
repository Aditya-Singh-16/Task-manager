const prisma = require("../config/db");

// Create project
exports.createProject = async (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name || name.trim().length < 2) {
      return res.status(400).json({ msg: "Project name must be at least 2 characters" });
    }

    const project = await prisma.project.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        createdBy: req.user.id,
        members: {
          create: { userId: req.user.id, role: "admin" },
        },
      },
      include: {
        members: { include: { user: { select: { id: true, name: true, email: true } } } },
      },
    });

    res.status(201).json(project);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get all projects for current user
exports.getProjects = async (req, res) => {
  try {
    const memberships = await prisma.projectMember.findMany({
      where: { userId: req.user.id },
      include: {
        project: {
          include: {
            _count: { select: { tasks: true, members: true } },
            members: { include: { user: { select: { id: true, name: true, email: true } } } },
          },
        },
      },
    });

    const projects = memberships.map((m) => ({
      ...m.project,
      myRole: m.role,
    }));

    res.json(projects);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get single project
exports.getProject = async (req, res) => {
  try {
    const projectId = parseInt(req.params.projectId);

    const membership = await prisma.projectMember.findUnique({
      where: { userId_projectId: { userId: req.user.id, projectId } },
    });
    if (!membership) return res.status(403).json({ msg: "Access denied" });

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        members: { include: { user: { select: { id: true, name: true, email: true, role: true } } } },
        tasks: true,
      },
    });

    if (!project) return res.status(404).json({ msg: "Project not found" });

    res.json({ ...project, myRole: membership.role });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Update project
exports.updateProject = async (req, res) => {
  try {
    const projectId = parseInt(req.params.projectId);
    const { name, description } = req.body;

    if (!name || name.trim().length < 2) {
      return res.status(400).json({ msg: "Project name must be at least 2 characters" });
    }

    const project = await prisma.project.update({
      where: { id: projectId },
      data: { name: name.trim(), description: description?.trim() || null },
    });

    res.json(project);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Delete project
exports.deleteProject = async (req, res) => {
  try {
    const projectId = parseInt(req.params.projectId);
    await prisma.project.delete({ where: { id: projectId } });
    res.json({ msg: "Project deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Add member to project
exports.addMember = async (req, res) => {
  try {
    const projectId = parseInt(req.params.projectId);
    const { email, role } = req.body;

    if (!email) return res.status(400).json({ msg: "Email is required" });

    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (!user) return res.status(404).json({ msg: "No user found with this email" });

    const existing = await prisma.projectMember.findUnique({
      where: { userId_projectId: { userId: user.id, projectId } },
    });
    if (existing) return res.status(400).json({ msg: "User is already a member" });

    const member = await prisma.projectMember.create({
      data: {
        userId: user.id,
        projectId,
        role: role === "admin" ? "admin" : "member",
      },
      include: { user: { select: { id: true, name: true, email: true } } },
    });

    res.status(201).json(member);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Remove member
exports.removeMember = async (req, res) => {
  try {
    const projectId = parseInt(req.params.projectId);
    const userId = parseInt(req.params.userId);

    if (userId === req.user.id) {
      return res.status(400).json({ msg: "Cannot remove yourself from the project" });
    }

    await prisma.projectMember.delete({
      where: { userId_projectId: { userId, projectId } },
    });

    res.json({ msg: "Member removed successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Update member role
exports.updateMemberRole = async (req, res) => {
  try {
    const projectId = parseInt(req.params.projectId);
    const userId = parseInt(req.params.userId);
    const { role } = req.body;

    if (!["admin", "member"].includes(role)) {
      return res.status(400).json({ msg: "Role must be admin or member" });
    }

    const member = await prisma.projectMember.update({
      where: { userId_projectId: { userId, projectId } },
      data: { role },
      include: { user: { select: { id: true, name: true, email: true } } },
    });

    res.json(member);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
