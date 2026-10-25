import { randomBytes } from "node:crypto";
import { streamClient } from "../config/stream.js";

const CHANNEL_TYPE = "messaging";
const MAX_DESCRIPTION_LENGTH = 200;
const MAX_INITIAL_MEMBERS = 100;
const CHANNEL_ID_PATTERN = /^[a-z0-9_-]{1,64}$/;

// "Product Launch!" -> "product-launch"
const normaliseChannelName = (name) =>
    String(name ?? "")
        .trim()
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9_-]/g, "")
        .replace(/-{2,}/g, "-")
        .slice(0, 40);

const toChannelSummary = (channel, isMember) => ({
    id: channel.id,
    cid: channel.cid,
    name: channel.data.name,
    description: channel.data.description ?? "",
    memberCount: channel.data.member_count ?? 0,
    isMember,
});

const findChannel = async (id) => {
    const [channel] = await streamClient.queryChannels(
        { type: CHANNEL_TYPE, id },
        {},
        { limit: 1, state: true, watch: false }
    );
    return channel;
};

export const createChannel = async (req, res) => {
    try {
        const { userId } = req.auth();
        const { name, description = "", isPrivate = false, memberIds = [] } = req.body ?? {};

        const channelName = normaliseChannelName(name);
        if (channelName.length < 2) {
            return res.status(400).json({
                message: "Channel names need at least 2 letters or numbers (dashes and underscores are allowed).",
            });
        }
        if (typeof description !== "string" || description.length > MAX_DESCRIPTION_LENGTH) {
            return res.status(400).json({ message: `Descriptions can be up to ${MAX_DESCRIPTION_LENGTH} characters.` });
        }
        if (!Array.isArray(memberIds) || memberIds.some((id) => typeof id !== "string" || !id)) {
            return res.status(400).json({ message: "memberIds must be a list of user ids." });
        }

        // Like Slack, channel names are unique across the workspace
        const existing = await streamClient.queryChannels(
            { type: CHANNEL_TYPE, name: channelName },
            {},
            { limit: 1, state: false, watch: false }
        );
        if (existing.length > 0) {
            return res.status(409).json({ message: `#${channelName} already exists. Try another name.` });
        }

        const members = [...new Set([userId, ...memberIds])].slice(0, MAX_INITIAL_MEMBERS);
        const id = `${channelName}-${randomBytes(3).toString("hex")}`;

        const channel = streamClient.channel(CHANNEL_TYPE, id, {
            name: channelName,
            description: description.trim(),
            private: Boolean(isPrivate),
            discoverable: !isPrivate,
            members,
            created_by_id: userId,
        });
        await channel.create();

        res.status(201).json({ channel: toChannelSummary(channel, true) });
    } catch (error) {
        console.error("Error creating channel:", error.message);
        res.status(500).json({ message: "Failed to create channel" });
    }
};

export const listPublicChannels = async (req, res) => {
    try {
        const { userId } = req.auth();
        const filter = { type: CHANNEL_TYPE, discoverable: true };
        const options = { limit: 100, state: false, watch: false };

        const [publicChannels, joinedChannels] = await Promise.all([
            streamClient.queryChannels(filter, { member_count: -1 }, options),
            streamClient.queryChannels({ ...filter, members: { $in: [userId] } }, {}, options),
        ]);

        const joined = new Set(joinedChannels.map((channel) => channel.cid));
        res.status(200).json({
            channels: publicChannels.map((channel) => toChannelSummary(channel, joined.has(channel.cid))),
        });
    } catch (error) {
        console.error("Error listing public channels:", error.message);
        res.status(500).json({ message: "Failed to load channels" });
    }
};

export const joinChannel = async (req, res) => {
    try {
        const { userId } = req.auth();
        const { id } = req.params;

        if (!CHANNEL_ID_PATTERN.test(id)) {
            return res.status(400).json({ message: "Invalid channel id" });
        }

        const channel = await findChannel(id);
        if (!channel) return res.status(404).json({ message: "Channel not found" });

        // Private channels are invite-only
        if (channel.data.private || !channel.data.discoverable) {
            return res.status(403).json({ message: "This channel is private. Ask a member to invite you." });
        }

        await channel.addMembers([userId]);
        res.status(200).json({ channel: toChannelSummary(channel, true) });
    } catch (error) {
        console.error("Error joining channel:", error.message);
        res.status(500).json({ message: "Failed to join channel" });
    }
};
