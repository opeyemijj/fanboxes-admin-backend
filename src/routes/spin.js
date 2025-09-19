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

router.post(
  "admin/spins/verify",
  verifyToken,
  withSlug(spin.spinVerify, "verify_spin")
);

router.post("/user/spin", verifyToken, spin.createSpinByUser);
router.post("/user/spin-verify", verifyToken, spin.spinVerify);
router.get("/user/spin-history", verifyToken, spin.getSpinHistory);

module.exports = router;
