const express = require("express");
const router = express.Router();
const spin = require("../controllers/spin");

router.post("/admin/spin", spin.createSpinByAdmin);

module.exports = router;
