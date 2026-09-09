import { Router } from "express";
import { add, create, list, members, remove, setManager } from "../controllers/team.controller.js";
import { requireAuth, requireRole } from "../middlewares/auth.middleware.js";

const router = Router();

router.post("/", requireAuth, requireRole("ORGANIZATION_ADMIN"), create);
router.get("/", requireAuth, requireRole("ORGANIZATION_ADMIN", "MANAGER"), list);
router.get("/:teamId/members", requireAuth, requireRole("ORGANIZATION_ADMIN", "MANAGER"), members);
router.patch("/:teamId/manager", requireAuth, requireRole("ORGANIZATION_ADMIN"), setManager);
router.post("/:teamId/members", requireAuth, requireRole("ORGANIZATION_ADMIN", "MANAGER"), add);
router.delete("/:teamId/members/:userId", requireAuth, requireRole("ORGANIZATION_ADMIN", "MANAGER"), remove);

export default router;