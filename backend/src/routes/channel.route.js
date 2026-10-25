import express from "express";
import {
    addMembers,
    createChannel,
    joinChannel,
    leaveChannel,
    listPublicChannels,
} from "../controllers/channel.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

router.use(protectRoute);

router.post("/", createChannel);
router.get("/public", listPublicChannels);
router.post("/:id/join", joinChannel);
router.post("/:id/members", addMembers);
router.post("/:id/leave", leaveChannel);

export default router;
