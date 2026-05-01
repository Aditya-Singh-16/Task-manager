const router = require("express").Router();
const { authenticate, requireProjectAdmin } = require("../middleware/authMiddleware");
const {
  createProject,
  getProjects,
  getProject,
  updateProject,
  deleteProject,
  addMember,
  removeMember,
  updateMemberRole,
} = require("../controllers/projectController");

router.post("/", authenticate, createProject);
router.get("/", authenticate, getProjects);
router.get("/:projectId", authenticate, getProject);
router.put("/:projectId", authenticate, requireProjectAdmin, updateProject);
router.delete("/:projectId", authenticate, requireProjectAdmin, deleteProject);

// Member management
router.post("/:projectId/members", authenticate, requireProjectAdmin, addMember);
router.delete("/:projectId/members/:userId", authenticate, requireProjectAdmin, removeMember);
router.put("/:projectId/members/:userId", authenticate, requireProjectAdmin, updateMemberRole);

module.exports = router;
