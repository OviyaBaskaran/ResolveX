import { Router } from "express";

import {
  loginController,
  refreshController,
} from "./auth.controller.js";

const router = Router();

router.post(
  "/login",
  loginController,
);

router.post(
  "/refresh",
  refreshController,
);

export default router;