import { Router } from "express";

import {
  registerOrganizationController,
} from "./organizations.controller.js";

const router = Router();

router.post(
  "/register",
  registerOrganizationController,
);

export default router;