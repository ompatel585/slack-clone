export const protectRoute =  (req,res,next) => {
    // userId is present on every @clerk/express auth object; isAuthenticated is not
    const { userId } = req.auth();

    if (!userId) {
        return res.status(401).json({ message: "Unauthorized - you must be logged in" });
    }

    next();
}
