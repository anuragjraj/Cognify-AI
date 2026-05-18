const jwt    = require("jsonwebtoken");
const prisma = require("../db");

module.exports = async (req, res, next) => {
  const header = req.headers.authorization;
  const token  = header?.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: "No token" });
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user    = await prisma.user.findUnique({ where: { id: payload.id } });
    if (!user) return res.status(401).json({ error: "User not found" });
    // Check plan expiry
    if (user.plan === "pro" && user.planExpiresAt && user.planExpiresAt < new Date()) {
      await prisma.user.update({ where: { id: user.id }, data: { plan: "free" } });
      user.plan = "free";
    }
    req.user = user;
    next();
  } catch { return res.status(401).json({ error: "Invalid token" }); }
};
