const admin = require("../config/firebase");

async function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "No token provided" });
  }

  const token = authHeader.split(" ")[1]; // Extract the token part

  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    req.userId = decodedToken.uid; // Set Firebase UID in request
    next();
  } catch (err) {
    return res.status(401).json({ error: "Expired or Invalid Token" });
  }
}

module.exports = verifyToken;
