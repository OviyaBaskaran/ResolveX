import { Router } from "express";

import {
  loginPlatformAdminController,
} from "./platform-auth.controller.js";

const router = Router();

router.post(
  "/login",
  loginPlatformAdminController,
);

export default router;