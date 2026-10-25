import { generateStreamToken } from "../config/stream.js";

export const getStreamToken = async (req, res) => {
    try {
        const { userId } = req.auth();
        const token = generateStreamToken(userId);

        // generateStreamToken returns null on failure — never hand the client an unusable token
        if (!token) {
            return res.status(500).json({ message: "Failed to generate Stream token" });
        }

        res.status(200).json({ token });
    } catch (error) {
        console.log("Error generating Stream token:", error);
        res.status(500).json({
            message: "Failed to generate Stream token",
        });
    }
};
