import express from "express";
import { createChannel, joinChannel, listPublicChannels } from "../controllers/channel.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

router.use(protectRoute);

router.post("/", createChannel);
router.get("/public", listPublicChannels);
router.post("/:id/join", joinChannel);

export default router;
