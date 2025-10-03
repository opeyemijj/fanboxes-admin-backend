const express = require("express");
const router = express.Router();
const { collectRoutes } = require("../utils/routeCollector");
const staticPage = require("../controllers/static-page");
const verifyToken = require("../config/jwt");
const { withSlug } = require("../helpers/routeSlugHelper");

router.post("/admin/static-pages", verifyToken, staticPage.createStaticByAdmin);

router.get(
  "/admin/static-pages",
  verifyToken,
  staticPage.getStaticPagesByAdmin
);

module.exports = router;
