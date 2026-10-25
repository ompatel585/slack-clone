import { StreamChat } from "stream-chat";
import { ENV } from "./env.js";

export const streamClient = StreamChat.getInstance(ENV.STREAM_API_KEY, ENV.STREAM_API_SECRET);

// Helpers used by Inngest re-throw after logging so a failed step is retried instead of silently passing

export const upsertStreamUser = async (userData) => {
    try {
        await streamClient.upsertUser(userData);
        console.log("Stream user upserted successfully:", userData.name);
        return userData;
    } catch (error) {
        console.error("Error upserting Stream user:", error.message);
        throw error;
    }
};

export const deleteStreamUser = async (userId) => {
    try {
        await streamClient.deleteUser(userId);
        console.log("Stream user deleted successfully:", userId);
    } catch (error) {
        // Already gone (e.g. never synced) — nothing left to clean up
        if (error.status === 404) return;
        console.error("Error deleting Stream user:", error.message);
        throw error;
    }
};

export const generateStreamToken = (userId) => {
    try {
        const userIdString = userId.toString();
        return streamClient.createToken(userIdString);
    } catch (error) {
        console.error("Error generating Stream token:", error.message);
        return null;
    }
};

const CHANNEL_PAGE_SIZE = 30;

export const addUserToPublicChannels = async (newUserId) => {
    // queryChannels returns 10 channels by default, so page through all of them
    for (let offset = 0; ; offset += CHANNEL_PAGE_SIZE) {
        const publicChannels = await streamClient.queryChannels(
            { discoverable: true },
            { created_at: 1 },
            { limit: CHANNEL_PAGE_SIZE, offset }
        );

        for (const channel of publicChannels) {
            await channel.addMembers([newUserId]);
        }

        if (publicChannels.length < CHANNEL_PAGE_SIZE) break;
    }
};
