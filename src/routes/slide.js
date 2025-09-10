const express = require("express");
const router = express.Router();
const slide = require("../controllers/slide");
const { withSlug } = require("../helpers/routeSlugHelper");

router.get(
  "/admin/slides",
  withSlug(slide.getSlideByAdmin, "view_slide_listing")
);

module.exports = router;
