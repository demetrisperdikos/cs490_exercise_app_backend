const express = require("express");
const router = express.Router();
const { authMe } = require("../controllers/auth_logic.js");
const { requireAuthedUser, fakeAuthedUser } = require("../utils/security.js");

router.get("/me", fakeAuthedUser, authMe);

module.exports = router;
