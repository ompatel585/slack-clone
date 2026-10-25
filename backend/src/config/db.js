import mongoose from 'mongoose';
import { ENV } from './env.js';

// Shared across Inngest invocations and serverless warm starts so we connect only once
let connectionPromise = null;

export const connectDB = async() => {
    if (mongoose.connection.readyState === 1) return mongoose.connection;

    if (!connectionPromise) {
        connectionPromise = mongoose
            .connect(ENV.MONGO_URI)
            .then((conn) => {
                console.log("MongoDB connected successfully!", conn.connection.host);
                return conn.connection;
            })
            .catch((error) => {
                connectionPromise = null; // let the next call retry
                console.error("Error connecting to the database:", error.message);
                // Throw instead of process.exit so callers (server start, Inngest retries) decide what to do
                throw error;
            });
    }

    return connectionPromise;
}
