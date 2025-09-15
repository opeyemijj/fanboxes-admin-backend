const express = require("express");
const router = express.Router();
const AdminTransactionController = require("../controllers/adminTransactionController");
const verifyToken = require("../config/jwt");
const transactionController = require("../controllers/transactionController");

// Admin manual top-up for any user
router.post(
  "/admin/wallet/credit-user",
  verifyToken,
  AdminTransactionController.manualTopup
);

// Admin manual debit for any user
router.post(
  "/admin/wallet/debit-user",
  verifyToken,
  AdminTransactionController.manualDebit
);

// Admin manual transfer between users
router.post(
  "/admin/wallet/transfer",
  verifyToken,
  AdminTransactionController.manualTransfer
);

// Get all users with balances (admin only)
router.get(
  "/admin/wallet/users-balances",
  verifyToken,
  AdminTransactionController.getAllUsersBalances
);

// get specific user's balance (admin only)
router.get(
  "/admin/wallet/user-balance/:userId",
  verifyToken,
  transactionController.getUserBalance
);

module.exports = router;
