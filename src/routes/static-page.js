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

router.get(
  "/admin/static-pages/:slug",
  verifyToken,
  staticPage.getStaticBySlug
);

router.put(
  "/admin/static-pages/:slug",
  verifyToken,
  staticPage.updateStaticPageBySlug
);

router.delete(
  "/admin/static-pages/:slug",
  verifyToken,
  staticPage.deleteStaticPageBySlug
);

module.exports = router;
