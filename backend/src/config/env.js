import "dotenv/config";

const REQUIRED_VARS = [
    "MONGO_URI",
    "CLERK_PUBLISHABLE_KEY",
    "CLERK_SECRET_KEY",
    "STREAM_API_KEY",
    "STREAM_API_SECRET",
];

// Inngest only needs its signing key outside the local dev server
const REQUIRED_IN_PRODUCTION = ["INNGEST_SIGNING_KEY"];

const required =
    process.env.NODE_ENV === "production"
        ? [...REQUIRED_VARS, ...REQUIRED_IN_PRODUCTION]
        : REQUIRED_VARS;

const missing = required.filter((key) => !process.env[key]);

if (missing.length > 0) {
    throw new Error(
        `Missing required environment variables: ${missing.join(", ")}. ` +
            "Copy backend/.env.example to backend/.env and fill them in."
    );
}

export const ENV = {
    PORT : process.env.PORT || 5000,
    MONGO_URI : process.env.MONGO_URI ,
    NODE_ENV : process.env.NODE_ENV || "development",
    CLIENT_URL : process.env.CLIENT_URL || "http://localhost:5173",
    CLERK_PUBLISHABLE_KEY : process.env.CLERK_PUBLISHABLE_KEY,
    CLERK_SECRET_KEY : process.env.CLERK_SECRET_KEY ,
    STREAM_API_KEY: process.env.STREAM_API_KEY,
    STREAM_API_SECRET : process.env.STREAM_API_SECRET,
    SENTRY_DSN : process.env.SENTRY_DSN,
    INNGEST_EVENT_KEY : process.env.INNGEST_EVENT_KEY,
    INNGEST_SIGNING_KEY : process.env.INNGEST_SIGNING_KEY,
}
