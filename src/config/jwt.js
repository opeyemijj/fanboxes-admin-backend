const jwt = require("jsonwebtoken");

function verifyToken(req, res, next) {
  // Get the token from headers (or cookies)
  const token = req?.headers?.authorization || req?.cookies?.token;

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Please log in to continue",
    });
  }

  // Verify the token
  jwt.verify(
    token.replace("Bearer ", ""),
    process.env.JWT_SECRET || "123456",
    (err, decoded) => {
      if (err) {
        // Clear the invalid token cookie (if it exists)
        res.setHeader("Set-Cookie", [
          "token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT",
          "userRole=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT",
        ]);

        return res.status(401).json({
          success: false,
          message: "Your session has expired. Please sign in again",
          redirect: "/auth/session", // Explicitly tell frontend to redirect
          error: err,
        });
      }

      // Token is valid! Attach user data to the request
      req.user = decoded;

      // Role-based route protection
      const path = req.originalUrl.toLowerCase();

      // Admin route protection
      if (
        path.includes("/admin") &&
        !["admin", "super admin"].includes(decoded.role)
      ) {
        res.setHeader("Set-Cookie", [
          "token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT",
          "userRole=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT",
        ]);
        return res.status(403).json({
          success: false,
          message: "Admin access required",
        });
      }

      // Vendor route protection
      if (path.includes("/vendor") && decoded.role !== "vendor") {
        res.setHeader("Set-Cookie", [
          "token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT",
          "userRole=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT",
        ]);
        return res.status(403).json({
          success: false,
          message: "Vendor access required",
        });
      }

      next();
    }
  );
}

module.exports = verifyToken;
