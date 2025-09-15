const express = require("express");
const router = express.Router();
const AdminTransactionController = require("../controllers/adminTransactionController");
const verifyToken = require("../config/jwt");
const transactionController = require("../controllers/transactionController");

// Admin manual top-up for any user
router.post(
  "/admin/credit-user",
  verifyToken,
  AdminTransactionController.manualTopup
);

// Admin manual debit for any user
router.post(
  "/admin/debit-user",
  verifyToken,
  AdminTransactionController.manualDebit
);

// Admin manual transfer between users
router.post(
  "/admin/transfer",
  verifyToken,
  AdminTransactionController.manualTransfer
);

// Get all users with balances (admin only)
router.get(
  "/admin/users-balances",
  verifyToken,
  AdminTransactionController.getAllUsersBalances
);

// get specific user's balance (admin only)
router.get(
  "/admin/user-balance/:userId",
  verifyToken,
  transactionController.getUserBalance
);

module.exports = router;
