const jwt = require("jsonwebtoken");
const { findUserByEmail } = require("../dataAccess/user_db.js");
const { SECRET_KEY } = require("../sql_config/config");

function getTokenFromHeader(req) {
  if (req.headers?.authorization) {
    const [scheme, token] = req.headers.authorization.split(" ");
    if (scheme.trim() === "Bearer") {
      return token;
    }
  }
  return undefined;
}

async function requireAuthedUser(req, res, next) {
  const token = req.headers.authorization;
  if (!token) {
    return res.status(401).json({
      message: "Access denied. Token is missing.",
    });
  }

  try {
    const token = getTokenFromHeader(req);
    const { email } = jwt.verify(token, SECRET_KEY);
    const rows = await findUserByEmail(email);
    req.userID = rows[0].userID;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid token.", "error": error });
  }
}

async function fakeAuthedUser(req, res, next) {
  console.log("fakeAuthedUser");
  req.userID = 1;
  next();
}

function createUserJwt(email) {
  return jwt.sign({ email: email }, SECRET_KEY, { expiresIn: "24h" }); //generateToken
}

module.exports = {
  requireAuthedUser,
  fakeAuthedUser,
  createUserJwt,
};
