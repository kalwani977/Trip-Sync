import jwt from "jsonwebtoken";

export const userMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({
      message: "Authorization header missing"
    });
  }

  // Extract token
  const token = authHeader.startsWith("Bearer ")
    ? authHeader.split(" ")[1]
    : authHeader;

  try {
    const decoded = jwt.verify(token, process.env.JWT_PASSWORD);

    // attach userId to request
    req.userId = decoded.id;

    next();
  } catch (err) {
    return res.status(403).json({
      message: "Invalid or expired token"
    });
  }
};
