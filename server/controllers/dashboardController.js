const prisma = require("../config/db");

exports.getDashboard = async (req, res) => {
  try {
    const userId = req.user.id;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get user's projects
    const memberships = await prisma.projectMember.findMany({
      where: { userId },
      include: {
        project: {
          include: { _count: { select: { tasks: true, members: true } } },
        },
      },
    });

    const projectIds = memberships.map((m) => m.projectId);

    // Task stats for tasks assigned to me
    const [totalTasks, completedTasks, inProgressTasks, todoTasks, overdueTasks] = await Promise.all([
      prisma.task.count({ where: { assignedTo: userId } }),
      prisma.task.count({ where: { assignedTo: userId, status: "done" } }),
      prisma.task.count({ where: { assignedTo: userId, status: "in-progress" } }),
      prisma.task.count({ where: { assignedTo: userId, status: "todo" } }),
      prisma.task.count({
        where: {
          assignedTo: userId,
          status: { not: "done" },
          dueDate: { lt: today },
        },
      }),
    ]);

    // Recent tasks assigned to me
    const recentTasks = await prisma.task.findMany({
      where: { assignedTo: userId },
      orderBy: { updatedAt: "desc" },
      take: 5,
      include: { project: { select: { id: true, name: true } } },
    });

    // All tasks in user's projects (for project overview)
    const allProjectTasks = projectIds.length > 0
      ? await prisma.task.groupBy({
          by: ["status"],
          where: { projectId: { in: projectIds } },
          _count: { id: true },
        })
      : [];

    res.json({
      stats: {
        totalTasks,
        completedTasks,
        inProgressTasks,
        todoTasks,
        overdueTasks,
        totalProjects: memberships.length,
      },
      recentTasks,
      projects: memberships.map((m) => ({
        ...m.project,
        myRole: m.role,
      })),
      projectTaskSummary: allProjectTasks,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
