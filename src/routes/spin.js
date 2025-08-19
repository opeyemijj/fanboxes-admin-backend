const express = require("express");
const router = express.Router();
const spin = require("../controllers/spin");
const verifyToken = require("../config/jwt");

router.post("/admin/spin", verifyToken, spin.createSpinByAdmin);
router.post("/admin/spin-verify", verifyToken, spin.spinVerify);

module.exports = router;
