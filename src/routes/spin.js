const express = require("express");
const router = express.Router();
const spin = require("../controllers/spin");
const verifyToken = require("../config/jwt");
const { withSlug } = require("../helpers/routeSlugHelper");

router.post("/admin/spin", verifyToken, spin.createSpin);
router.post("/admin/spin-verify", verifyToken, spin.spinVerify);
router.get(
  "/admin/spins",
  verifyToken,
  withSlug(spin.getSpinsByAdmin, "view_spin_listing")
);

router.post("/user/spin", verifyToken, spin.createSpin);
router.post("/user/spin-verify", verifyToken, spin.spinVerify);

module.exports = router;
