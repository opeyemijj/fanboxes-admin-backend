const express = require("express");
const router = express.Router();
const TransactionController = require("../controllers/transactionController");
const verifyToken = require("../config/jwt");

// Get current user's balance
router.get("/wallet/balance", verifyToken, TransactionController.getMyBalance);

// Get current user's transaction history
router.get(
  "/wallet/history",
  verifyToken,
  TransactionController.getMyTransactionHistory
);

// Get current user's balance and transaction history combined
router.get(
  "/wallet/balance-and-history",
  verifyToken,
  TransactionController.getMyBalanceAndHistory
);

// Get specific user's balance (admin access or own account)
// router.get(
//   "/balance/:userId",
//   authenticateUser,
//   requireAuth,
//   TransactionController.getUserBalance
// );

// // Get specific user's transaction history (admin access or own account)
// router.get(
//   "/history/:userId",
//   authenticateUser,
//   requireAuth,
//   TransactionController.getTransactionHistory
// );

module.exports = router;
