const express = require("express");
const router = express.Router();
const spin = require("../controllers/spin");

router.post("/admin/spin", spin.createSpinByAdmin);
router.post("/admin/spin-verify", spin.spinVerify);

module.exports = router;
