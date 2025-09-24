const express = require("express");
const router = express.Router();
const orderRoutes = require("../controllers/order");
// Import verifyToken function
const verifyToken = require("../config/jwt");
const { withSlug } = require("../helpers/routeSlugHelper");
//user routes
router.post("/orders", orderRoutes.createOrder);
router.get("/orders/:id", orderRoutes.getOrderById);

//admin routes
router.get(
  "/admin/orders",
  verifyToken,
  withSlug(orderRoutes.getOrdersByAdmin, "view_order_listing")
);
router.get("/admin/orders/:id", verifyToken, orderRoutes.getOneOrderByAdmin);
router.put("/admin/orders/:id", verifyToken, orderRoutes.updateOrderByAdmin);
router.delete("/admin/orders/:id", verifyToken, orderRoutes.deleteOrderByAdmin);

//vendor routes
router.get("/vendor/orders", verifyToken, orderRoutes.getOrdersByVendor);

router.put(
  "/admin/orders/assign/:slug",
  verifyToken,
  withSlug(orderRoutes.updateAssignInOrderByAdmin, "assign_order_to_user")
);

router.put(
  "/admin/orders/tracking/:slug",
  verifyToken,
  withSlug(orderRoutes.updateTrackingInOrderByAdmin, "update_order_tracking")
);

router.put(
  "/admin/orders/shipping/:slug",
  verifyToken,
  withSlug(orderRoutes.updateShippingInOrderByAdmin, "update_order_shipping")
);

router.post("/orders/create", orderRoutes.createOrder2);

module.exports = router;
