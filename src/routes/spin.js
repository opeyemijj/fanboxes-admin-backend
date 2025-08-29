const express = require("express");
const router = express.Router();
const spin = require("../controllers/spin");
const verifyToken = require("../config/jwt");

router.post("/admin/spin", verifyToken, spin.createSpin);
router.post("/admin/spin-verify", verifyToken, spin.spinVerify);
router.get("/admin/spins", verifyToken, spin.getSpinsByAdmin);

router.post("/user/spin", verifyToken, spin.createSpin);
router.post("/user/spin-verify", verifyToken, spin.spinVerify);

module.exports = router;
