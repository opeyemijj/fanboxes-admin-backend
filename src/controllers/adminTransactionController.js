const { checkIsAdmin } = require("../helpers/userHelper");
const { init } = require("../models/Brand");
const User = require("../models/User");
const RoleBasedTransactionService = require("../services/roleBasedTransactionService");
const TransactionService = require("../services/transactionService");

class AdminTransactionController {
  /**
   * Admin manual top-up for any user account
   */
  async manualTopup(req, res) {
    try {
      const requestingUser = req.user;
      console.log(requestingUser, "Check the requested user");

      // Authorization check - only admin and super admin can do manual top-ups
      if (!checkIsAdmin(requestingUser.role)) {
        return res.status(403).json({
          success: false,
          message: "Access denied. Only admins can perform manual top-ups.",
        });
      }

      const {
        userId,
        amount,
        balanceType = "available", // available, pending, or both
        description,
        referenceId,
        remarks,
      } = req.body;

      // Validation
      if (!userId || !amount || amount <= 0) {
        return res.status(400).json({
          success: false,
          message: "User ID and valid amount are required.",
        });
      }

      if (!["available", "pending", "both"].includes(balanceType)) {
        return res.status(400).json({
          success: false,
          message: "Balance type must be available, pending, or both.",
        });
      }

      // Perform the manual top-up
      const transaction = await RoleBasedTransactionService.adminManualTopup({
        transactionType: "credit",
        userId,
        amount: Number.parseFloat(amount),
        balanceType,
        description:
          description ||
          `Manual top-up by admin ${requestingUser.firstName} ${requestingUser.lastName}`,
        adminId: requestingUser._id,
        referenceId,
        remarks,
        initiatedBy: {
          firstName: requestingUser.firstName,
          lastName: requestingUser.lastName,
          id: requestingUser._id,
          role: requestingUser?.role,
        },
      });

      // Get updated balance
      const updatedBalance = await TransactionService.getUserBalance(userId);

      // console.log(updatedBalance, "okk see");

      try {
        const updatedUserBalance = await User.findOneAndUpdate(
          { _id: userId },
          {
            $set: { balanceCredits: Number(updatedBalance?.availableBalance) },
          },
          { new: true, runValidators: true }
        );
      } catch (error) {
        console.log(error, "Failed to update user balance");
      }

      res.status(201).json({
        success: true,
        message: "Manual top-up completed successfully",
        data: {
          transaction,
          updatedBalance,
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * Admin manual debit for any user account
   */
  async manualDebit(req, res) {
    try {
      const requestingUser = req.user;

      // Authorization check
      if (
        requestingUser.role !== "admin" &&
        requestingUser.role !== "super admin"
      ) {
        return res.status(403).json({
          success: false,
          message: "Access denied. Only admins can perform manual debits.",
        });
      }

      const {
        userId,
        amount,
        balanceType = "available",
        description,
        referenceId,
        remarks,
      } = req.body;

      // Validation
      if (!userId || !amount || amount <= 0) {
        return res.status(400).json({
          success: false,
          message: "User ID and valid amount are required.",
        });
      }

      // Perform the manual debit
      const transaction = await RoleBasedTransactionService.adminManualDebit({
        userId,
        amount: Number.parseFloat(amount),
        balanceType,
        description:
          description ||
          `Manual debit by admin ${requestingUser.firstName} ${requestingUser.lastName}`,
        adminId: requestingUser._id,
        referenceId,
        remarks,
      });

      // Get updated balance
      const updatedBalance = await TransactionService.getUserBalance(userId);

      res.status(201).json({
        success: true,
        message: "Manual debit completed successfully",
        data: {
          transaction,
          updatedBalance,
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * Admin transfer between users
   */
  async manualTransfer(req, res) {
    try {
      const requestingUser = req.user;

      // Authorization check
      if (
        requestingUser.role !== "admin" &&
        requestingUser.role !== "super admin"
      ) {
        return res.status(403).json({
          success: false,
          message: "Access denied. Only admins can perform manual transfers.",
        });
      }

      const {
        fromUserId,
        toUserId,
        amount,
        fromBalanceType = "available",
        toBalanceType = "available",
        description,
        referenceId,
        remarks,
      } = req.body;

      // Validation
      if (!fromUserId || !toUserId || !amount || amount <= 0) {
        return res.status(400).json({
          success: false,
          message: "From user ID, to user ID, and valid amount are required.",
        });
      }

      if (fromUserId === toUserId) {
        return res.status(400).json({
          success: false,
          message: "Cannot transfer to the same user.",
        });
      }

      // Perform the manual transfer
      const result = await RoleBasedTransactionService.adminManualTransfer({
        fromUserId,
        toUserId,
        amount: Number.parseFloat(amount),
        fromBalanceType,
        toBalanceType,
        description:
          description ||
          `Manual transfer by admin ${requestingUser.firstName} ${requestingUser.lastName}`,
        adminId: requestingUser._id,
        referenceId,
        remarks,
      });

      res.status(201).json({
        success: true,
        message: "Manual transfer completed successfully",
        data: result,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * Get all users with their current balances (admin only)
   */
  async getAllUsersBalances(req, res) {
    try {
      const requestingUser = req.user;

      // Authorization check
      if (
        requestingUser.role !== "admin" &&
        requestingUser.role !== "super admin"
      ) {
        return res.status(403).json({
          success: false,
          message: "Access denied. Only admins can view all user balances.",
        });
      }

      const { page = 1, limit = 20, search } = req.query;

      // Get users with balances
      const result = await TransactionService.getAllUsersWithBalances(
        Number.parseInt(page),
        Number.parseInt(limit),
        search
      );

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
}

module.exports = new AdminTransactionController();
