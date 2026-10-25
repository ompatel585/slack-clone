import * as Sentry from "@sentry/node"
import { ENV } from "./src/config/env.js";

const isProduction = ENV.NODE_ENV === "production";

Sentry.init({
    // Sentry stays disabled when no DSN is configured
    dsn: ENV.SENTRY_DSN,
    environment: ENV.NODE_ENV,
    // Trace every request locally, sample 10% in production to protect the quota
    tracesSampleRate: isProduction ? 0.1 : 1.0,
    // Local variables and default PII (IP addresses, headers) help debugging
    // but must not be sent to a third party from production
    includeLocalVariables: !isProduction,
    sendDefaultPii: !isProduction,
});
