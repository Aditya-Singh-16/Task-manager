const jwt = require("jsonwebtoken");

exports.authenticate = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ msg: "No token provided" });
    }
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ msg: "Token expired, please login again" });
    }
    return res.status(401).json({ msg: "Invalid token" });
  }
};

exports.requireProjectAdmin = async (req, res, next) => {
  try {
    const prisma = require("../config/db");
    const projectId = parseInt(req.params.projectId || req.body.projectId);
    if (!projectId) return res.status(400).json({ msg: "Project ID required" });

    const membership = await prisma.projectMember.findUnique({
      where: { userId_projectId: { userId: req.user.id, projectId } },
    });

    if (!membership || membership.role !== "admin") {
      return res.status(403).json({ msg: "Only project admins can do this" });
    }
    next();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
