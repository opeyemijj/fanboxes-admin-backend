const express = require("express");
const router = express.Router();
const slide = require("../controllers/slide");
const { withSlug } = require("../helpers/routeSlugHelper");
const verifyToken = require("../config/jwt");

router.get(
  "/admin/slides",
  verifyToken,
  withSlug(slide.getSlidesByAdmin, "view_slide_listing")
);

router.get(
  "/admin/slides/:slug",
  verifyToken,
  withSlug(slide.getSlideByAdmin, "view_slide_details")
);

router.post(
  "/admin/slides",
  verifyToken,
  withSlug(slide.createSlide, "add_new_slide")
);

router.put(
  "/admin/slides/:slug",
  verifyToken,
  withSlug(slide.updateSlideBySlug, "edit_slide")
);

module.exports = router;
