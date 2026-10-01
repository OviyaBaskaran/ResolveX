import { Router } from "express";

import {
  getOrganizationsController,
  updateOrganizationStatusController,
} from "./platform-organizations.controller.js";

import {
  platformAuthMiddleware,
} from "../../middlewares/platform-auth.middleware.js";

const router = Router();

router.get(
  "/",
  platformAuthMiddleware,
  getOrganizationsController,
);

router.patch(
  "/:organizationId/status",
  platformAuthMiddleware,
  updateOrganizationStatusController,
);

export default router;