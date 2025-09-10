const express = require("express");
const router = express.Router();
const slide = require("../controllers/slide");
const { withSlug } = require("../helpers/routeSlugHelper");
const verifyToken = require("../config/jwt");

router.get(
  "/admin/slides",
  verifyToken,
  withSlug(slide.getSlideByAdmin, "view_slide_listing")
);

router.post(
  "/admin/slides",
  verifyToken,
  withSlug(slide.createSlide, "add_new_slide")
);

module.exports = router;
