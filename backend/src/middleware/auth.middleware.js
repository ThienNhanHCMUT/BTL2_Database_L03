const jwt = require("jsonwebtoken");

const ACCESS_SECRET =
  process.env.JWT_ACCESS_SECRET || "movieticket_access_secret_dev";

function requireAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization || "";
    const [scheme, token] = authHeader.split(" ");

    if (scheme !== "Bearer" || !token) {
      return res.status(401).json({
        message: "Thiếu access token.",
      });
    }

    const decoded = jwt.verify(token, ACCESS_SECRET);

    req.auth = {
      personId: decoded.personId || decoded.sub,
      customerId: decoded.customerId || null,
      username: decoded.username || null,
      role: decoded.role || "registered_customer",
    };

    next();
  } catch (error) {
    return res.status(401).json({
      message: "Access token không hợp lệ hoặc đã hết hạn.",
    });
  }
}

module.exports = {
  requireAuth,
};