const express = require("express");
const router = express.Router();
const shop = require("../controllers/shop");
// Import verifyToken function
const verifyToken = require("../config/jwt");

// Helper to attach slug to route handler
function withSlug(handler, slug) {
  handler.slug = slug;
  return handler;
}

// Admin Shop routes with slugs
router.get(
  "/admin/shops",
  verifyToken,
  withSlug(shop.getShopsByAdmin, "view_influencer_listing")
);

router.post(
  "/admin/shops",
  verifyToken,
  withSlug(shop.createShopByAdmin, "add_new_influencer")
);

router.get(
  "/admin/shops/:slug",
  verifyToken,
  withSlug(shop.getOneShopByAdmin, "view_influencer_details")
);

router.put(
  "/admin/shops/:slug",
  verifyToken,
  withSlug(shop.updateOneShopByAdmin, "edit_influencer")
);

router.put("/admin/shops/status/:slug", verifyToken);

router.delete(
  "/admin/shops/:slug",
  verifyToken,
  withSlug(shop.deleteOneShopByAdmin, "delete_influencer")
);

router.put(
  "/admin/shops/active/:slug",
  verifyToken,
  withSlug(shop.updateShopActiveInactiveByAdmin, "approve_influencer")
);

router.put(
  "/admin/shops/banned/:slug",
  verifyToken,
  withSlug(shop.bannedShopByAdmin, "ban_unban_influencer")
);

router.get("/admin/all-shops", shop.getAllShopsByAdmin);

//Vendor routes
router.post("/vendor/shops", verifyToken, shop.createShopByVendor);
router.get("/vendor/shop/stats", verifyToken, shop.getShopStatsByVendor);
router.get("/vendor/shop", verifyToken, shop.getOneShopByVendor);
router.put("/vendor/shops/:slug", verifyToken, shop.updateOneShopByVendor);
router.delete("/vendor/shops/:slug", verifyToken, shop.deleteOneShopByVendor);

// create shop by user
router.post("/shops", verifyToken, shop.createShopByUser);
router.get("/user/shop", verifyToken, shop.getShopByUser);

//User routes
router.get("/shops", shop.getShops);
router.get("/all-shops", shop.getAllShops);

router.get("/shops/:slug", shop.getOneShopByUser);
router.get("/shops-slugs", shop.getShopsSlugs);
router.get("/shop-title/:slug", shop.getShopNameBySlug);
router.put("/shops/:shopId/follow", verifyToken, shop.followShop);
router.patch(
  "/influencer/:slug/visit",
  shop.incrementInfluencerVisitCountBySlug
);
module.exports = router;
