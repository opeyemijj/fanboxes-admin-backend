const express = require("express");
const router = express.Router();
const { collectRoutes } = require("../utils/routeCollector");
const credit = require("../controllers/credit");
const verifyToken = require("../config/jwt");
const { withSlug } = require("../helpers/routeSlugHelper");

router.post(
  "/admin/credits",
  verifyToken,
  withSlug(credit.createCreditByAdmin, "add_new_conversion")
);

router.get(
  "/admin/credits",
  verifyToken,
  withSlug(credit.getCreditsByAdmin, "view_convesion_listing")
);

router.get(
  "/admin/credits/:slug",
  verifyToken,
  withSlug(credit.getCreditBySlug, "view_credit_details")
);

router.put(
  "/admin/credits/:slug",
  verifyToken,
  withSlug(credit.updateCreditBySlug, "edit_credit")
);

module.exports = router;
