const router = require("express").Router();
const { authenticate } = require("../middleware/authMiddleware");
const {
  createTask,
  getTasks,
  getTask,
  updateTask,
  deleteTask,
  updateTaskStatus,
} = require("../controllers/taskController");

router.post("/", authenticate, createTask);
router.get("/project/:projectId", authenticate, getTasks);
router.get("/:taskId", authenticate, getTask);
router.put("/:taskId", authenticate, updateTask);
router.patch("/:taskId/status", authenticate, updateTaskStatus);
router.delete("/:taskId", authenticate, deleteTask);

module.exports = router;
