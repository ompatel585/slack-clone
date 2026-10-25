import "../instrument.mjs";
import express from "express";
import { ENV } from "./config/env.js";
import { connectDB } from "./config/db.js";
import { clerkMiddleware } from "@clerk/express";
import { functions, inngest } from "./config/inngest.js";
import { serve } from "inngest/express";
import chatRoutes from "./routes/chat.route.js";
import { errorHandler, notFound } from "./middleware/error.middleware.js";

import cors from "cors";
import mongoose from "mongoose";

import * as Sentry from "@sentry/node";

const app = express();
const isProduction = ENV.NODE_ENV === "production";

// CLIENT_URL may list several origins separated by commas (e.g. production + preview deployments)
const allowedOrigins = ENV.CLIENT_URL.split(",").map((origin) => origin.trim());

app.use(express.json());
app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(clerkMiddleware()); // req.auth will be available in the request object

// Intentional crash route for checking the Sentry setup — never exposed in production
if (!isProduction) {
    app.get("/debug-sentry", () => {
        throw new Error("My first Sentry error!");
    });
}

app.get("/", (req, res) => {
    res.send("Hello World! 123");
});

app.get("/api/health", (req, res) => {
    res.status(200).json({
        status: "ok",
        database: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
        timestamp: new Date().toISOString(),
    });
});

app.use("/api/inngest", serve({ client: inngest, functions }));
app.use("/api/chat", chatRoutes);

app.use(notFound);
Sentry.setupExpressErrorHandler(app);
app.use(errorHandler);

const startServer = async () => {
    try {
        await connectDB();
    } catch (error) {
        console.error("Error starting server:", error.message);
        // Exiting is right for a local server, but would kill the Vercel function in production
        if (!isProduction) process.exit(1); // Exit the process with a failure code
        return;
    }

    if (!isProduction) {
        app.listen(ENV.PORT, () => {
            console.log("Server started on port:", ENV.PORT);
        });
    }
};

startServer();

export default app;
