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

module.exports = router;
