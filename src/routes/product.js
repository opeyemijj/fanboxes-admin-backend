const express = require("express");
const router = express.Router();
const product = require("../controllers/product");
const vendor_product = require("../controllers/vendor-product");

// Import verifyToken function
const verifyToken = require("../config/jwt");
const { withSlug } = require("../helpers/routeSlugHelper");

// Admin routes

router.post(
  "/admin/products",
  verifyToken,
  product.createProductByAdmin,
  withSlug(product.createProductByAdmin, "add_new_box")
);

router.put(
  "/admin/products/multiple-assign",
  verifyToken,
  product.updateMulitpleAssignInProductsByAdmin
);

router.put(
  "/admin/products/:slug",
  verifyToken,
  product.updateProductByAdmin,
  withSlug(product.updateProductByAdmin, "edit_box")
);

router.get(
  "/admin/products",
  verifyToken,
  product.getProductsByAdmin,
  withSlug(product.getProductsByAdmin, "view_box_listing")
);

router.get(
  "/admin/products/:slug",
  verifyToken,
  product.getOneProductByAdmin,
  withSlug(product.getOneProductByAdmin, "view_box_details")
);

router.put(
  "/admin/products/active/:slug",
  verifyToken,
  product.updateProductActiveInactiveByAdmin,
  withSlug(product.updateProductActiveInactiveByAdmin, "approve_box")
);

router.put(
  "/admin/products/assign/:slug",
  verifyToken,
  withSlug(product.updateAssignInProductByAdmin, "assign_box_to_user")
);

router.put(
  "/admin/products/item-odds-visibility/:slug",
  verifyToken,
  product.updateItemOddHideShowByAdmin,
  withSlug(product.updateItemOddHideShowByAdmin, "hide_unhide_item_odd")
);

router.put(
  "/admin/products/banned/:slug",
  verifyToken,
  product.bannedProductByAdmin,
  withSlug(product.bannedProductByAdmin, "ban_unban_box")
);

router.post(
  "/admin/products/boxItem",
  verifyToken,
  product.createBoxItemByAdmin,
  withSlug(product.createBoxItemByAdmin, "add_box_item")
);

router.put(
  "/admin/products/boxItem/:slug",
  verifyToken,
  product.updateBoxItemByAdmin,
  withSlug(product.updateBoxItemByAdmin, "edit_box_item")
);

router.put(
  "/admin/products/boxItemOdd/:slug",
  verifyToken,
  product.updateBoxItemOddByAdmin,
  withSlug(product.updateBoxItemOddByAdmin, "auto_calculate_item_odds")
);

router.delete(
  "/admin/products/:slug",
  verifyToken,
  product.deletedProductByAdmin,
  withSlug(product.deletedProductByAdmin, "delete_box")
);

router.delete(
  "/admin/products/item/:boxSlug/:itemSlug",
  verifyToken,
  product.deleteBoxItemByAdmin,
  withSlug(product.deleteBoxItemByAdmin, "delete_box_item")
);

//Vendor routes
router.post(
  "/vendor/products",
  verifyToken,
  vendor_product.createProductByVendor
);

router.post(
  "/vendor/products/boxItem",
  verifyToken,
  vendor_product.createBoxItemByVendor
);

router.put(
  "/vendor/products/boxItem/:slug",
  verifyToken,
  vendor_product.updateBoxItemByVendor
);

router.delete(
  "/vendor/products/item/:boxSlug/:itemSlug",
  verifyToken,
  vendor_product.deleteBoxItemByVendor
);

router.get("/vendor/products", verifyToken, vendor_product.getProductsByVendor);
router.get(
  "/vendor/products/:slug",
  verifyToken,
  vendor_product.getOneProductVendor
);
router.put(
  "/vendor/products/:slug",
  verifyToken,
  vendor_product.updateProductByVendor
);

router.put(
  "/vendor/products/boxItemOdd/:slug",
  verifyToken,
  vendor_product.updateBoxItemOddByVendor
);

router.delete(
  "/vendor/products/:slug",
  verifyToken,
  vendor_product.deletedProductByVendor
);
// User routes

router.get("/products", product.getProducts);
router.get("/products/filters", product.getFilters);
router.get("/filters/:shop", product.getFiltersByShop);
router.get("/filters/:shop/:category", product.getFiltersByCategory);
router.get(
  "/filters/:shop/:category/:subcategory",
  product.getFiltersBySubCategory
);
router.get("/category/products/:category", product.getProductsByCategory);
router.get(
  "/subcategory/products/:subcategory",
  product.getProductsBySubCategory
);
router.get("/compaign/products/:slug", product.getProductsByCompaign);

router.get("/shop/products/:shop", product.getProductsByShop);
router.get("/products/:slug", product.getOneProductBySlug);
router.get("/products-slugs", product.getAllProductSlug);
router.get("/related-products/:pid", product.relatedProducts);
router.post("/compare/products", product.getCompareProducts);

module.exports = router;
