import { ENV } from "../config/env.js";

export const notFound = (req, res) => {
    res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
};

// Express only treats a middleware as an error handler when it declares all four arguments
export const errorHandler = (err, req, res, next) => {
    if (res.headersSent) return next(err);

    const status = err.status || err.statusCode || 500;
    if (status >= 500) console.error("Unhandled error:", err);

    res.status(status).json({
        // Don't leak internals of server errors to clients
        message: status >= 500 ? "Internal server error" : err.message,
        ...(ENV.NODE_ENV !== "production" && { stack: err.stack }),
    });
};
