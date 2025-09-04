const express = require("express");
const router = express.Router();
const subcategories = require("../controllers/subcategory");

// Import verifyToken function
const verifyToken = require("../config/jwt");
const { withSlug } = require("../helpers/routeSlugHelper");

// Admin Subcategory routes with slugs
router.post(
  "/admin/subcategories",
  verifyToken,
  withSlug(subcategories.createSubCategory, "create_subcategory")
);

router.get(
  "/admin/subcategories",
  verifyToken,
  withSlug(subcategories.getAllSubCategories, "fetch_subcategories")
);

router.get(
  "/admin/subcategories/:slug",
  verifyToken,
  withSlug(subcategories.getSubCategoriesBySlug, "fetch_single_subcategory")
);

router.put(
  "/admin/subcategories/:slug",
  verifyToken,
  withSlug(subcategories.updateSubCategoriesBySlug, "update_subcategory")
);

router.delete(
  "/admin/subcategories/:slug",
  verifyToken,
  withSlug(subcategories.deleteSubCategoriesBySlug, "delete_subcategory")
);
router.get(
  "/admin/subcategories/all",
  verifyToken,
  subcategories.getSubCategories
);

// User routes

router.get("/subcategories", subcategories.getSubCategories);
router.get("/subcategories/all", subcategories.getAllSubCategories);

router.get("/subcategories/:slug", subcategories.getSubCategoriesBySlug);
router.get("/subcategory-title/:slug", subcategories.getSubCategoryNameBySlug);

module.exports = router;
