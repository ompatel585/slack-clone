import { Inngest } from "inngest";
import { connectDB } from "./db.js";
import { User } from "../models/user.model.js";
import { addUserToPublicChannels, deleteStreamUser, upsertStreamUser } from "./stream.js";
// Create a client to send and receive events
export const inngest = new Inngest({ id: "slack-clone" });

// Clerk users may sign up without an email or a first/last name, so every field needs a fallback
const toUserProfile = (clerkUser) => {
    const {
        id,
        email_addresses = [],
        primary_email_address_id,
        first_name,
        last_name,
        username,
        image_url,
    } = clerkUser;

    const primaryEmail =
        email_addresses.find((address) => address.id === primary_email_address_id) ?? email_addresses[0];
    const email = primaryEmail?.email_address ?? `${id}@users.noreply.slap`;
    const fullName = [first_name, last_name].filter(Boolean).join(" ").trim();

    return {
        clerkId: id,
        email,
        name: fullName || username || email.split("@")[0],
        image: image_url,
    };
};

const toStreamUser = (profile) => ({
    id: profile.clerkId.toString(),
    name: profile.name,
    image: profile.image,
});

// Upsert instead of create so Inngest retries and replayed events stay idempotent
const saveUser = async (profile) => {
    await connectDB();
    await User.findOneAndUpdate({ clerkId: profile.clerkId }, profile, {
        upsert: true,
        runValidators: true,
        setDefaultsOnInsert: true,
    });
};

const syncUser = inngest.createFunction(
    {id : "sync-user"},
    {event : "clerk/user.created"},
    async({event, step})=>{
        const profile = toUserProfile(event.data);

        await step.run("save-user-to-db", () => saveUser(profile));
        await step.run("upsert-stream-user", () => upsertStreamUser(toStreamUser(profile)));
        await step.run("add-to-public-channels", () => addUserToPublicChannels(profile.clerkId));
    }
)

const updateUser = inngest.createFunction(
    { id: "update-user" },
    { event: "clerk/user.updated" },
    async ({ event, step }) => {
        const profile = toUserProfile(event.data);

        await step.run("update-user-in-db", () => saveUser(profile));
        await step.run("update-stream-user", () => upsertStreamUser(toStreamUser(profile)));
    }
);

const deleteUserFromDB = inngest.createFunction(
    { id: "delete-user-from-db" },
    { event: "clerk/user.deleted" },
    async ({ event, step }) => {
        const { id } = event.data;

        await step.run("delete-user-from-db", async () => {
            await connectDB();
            await User.deleteOne({ clerkId: id });
        });
        await step.run("delete-stream-user", () => deleteStreamUser(id.toString()));
    }
);

export const functions = [syncUser, updateUser, deleteUserFromDB];
