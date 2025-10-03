const express = require("express");
const router = express.Router();
const payment = require("../controllers/payment");

// Import verifyToken function
const verifyToken = require("../config/jwt");
const { withSlug } = require("../helpers/routeSlugHelper");

// admin routes

router.post("/admin/payments", verifyToken, payment.createPayment);
router.post(
  "/admin/payments/gateway",
  verifyToken,
  payment.createPaymentGateWayByAdmin
);

router.get("/admin/payments", verifyToken, payment.getPaymentsByAdmin);
router.get(
  "/admin/payments/paymentgateways",
  verifyToken,
  payment.getPaymentGateWaysByAdmin
);

router.get(
  "/admin/payments/paymentgateways/:slug",
  verifyToken,
  payment.getPaymentGateWayBySlug
);

router.put(
  "/admin/payments/paymentgateways/:slug",
  verifyToken,
  payment.updatePayemntGateWayBySlug
);

router.delete(
  "/admin/payments/gateway/:slug",
  verifyToken,
  payment.deletePaymentGateWayBySlug
);

router.get("/admin/payments/:pid", verifyToken, payment.getPaymentDetailsById);
router.get("/admin/shops/:slug/income", verifyToken, payment.getIncomeByShop);
router.put("/admin/payments/:id", verifyToken, payment.updatePayment);
router.put(
  "/admin/payments/:pid/status",
  verifyToken,
  payment.updatePaymentStatus
);
router.delete("/admin/payments/:id", verifyToken, payment.deletePayment);
router.get(
  "/admin/payouts",
  verifyToken,
  withSlug(payment.getPayoutsByAdmin, "view_payout_listing")
);

// Vender routes
router.get("/vendor/shops/income", verifyToken, payment.getIncomeByvendor);
router.get("/vendor/payments", verifyToken, payment.getPaymentsByVender);
router.get("/vendor/payments/:pid", verifyToken, payment.getPaymentDetailsById);

module.exports = router;
