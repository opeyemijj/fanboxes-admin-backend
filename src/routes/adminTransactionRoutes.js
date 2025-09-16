const express = require("express");
const router = express.Router();
const AdminTransactionController = require("../controllers/adminTransactionController");
const verifyToken = require("../config/jwt");
const transactionController = require("../controllers/transactionController");
const { withSlug } = require("../helpers/routeSlugHelper");

// Admin manual top-up for any user
router.post(
  "/admin/wallets/credit-user",
  verifyToken,
  withSlug(AdminTransactionController.manualTopup, "top_up")
);

// Admin manual debit for any user
router.post(
  "/admin/wallets/debit-user",
  verifyToken,
  AdminTransactionController.manualDebit
);

// Admin manual transfer between users
router.post(
  "/admin/wallets/transfer",
  verifyToken,
  AdminTransactionController.manualTransfer
);

// Get all users with balances (admin only)
router.get(
  "/admin/wallets/users-balances",
  verifyToken,
  AdminTransactionController.getAllUsersBalances
);

// get specific user's balance (admin only)
router.get(
  "/admin/wallets/user-balance/:userId",
  verifyToken,
  transactionController.getUserBalance
);

router.get(
  "/admin/transections",
  verifyToken,
  withSlug(
    transactionController.getTransectionsByAdmin,
    "view_transections_listing"
  )
);

module.exports = router;
