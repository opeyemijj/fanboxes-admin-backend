const TransactionService = require("../services/transactionService");
const RoleBasedTransactionService = require("../services/roleBasedTransactionService");

class TransactionController {
  /**
   * Get user balance - accessible by user themselves, admin, or vendor
   */
  async getUserBalance(req, res) {
    try {
      const { userId } = req.params;
      const requestingUser = req.user; // Assuming user is attached to request via auth middleware

      // Authorization check
      if (
        requestingUser.role !== "admin" &&
        requestingUser.role !== "super admin" &&
        requestingUser._id.toString() !== userId
      ) {
        return res.status(403).json({
          success: false,
          message: "Access denied. You can only view your own balance.",
        });
      }

      const balance = await TransactionService.getUserBalance(userId);

      res.status(200).json({
        success: true,
        data: {
          userId,
          ...balance,
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
   * Get transaction history - accessible by user themselves, admin, or vendor
   */
  async getTransactionHistory(req, res) {
    try {
      const { userId } = req.params;
      const requestingUser = req.user;
      const {
        limit = 50,
        skip = 0,
        status,
        transactionType,
        page = 1,
      } = req.query;

      // Authorization check
      if (
        requestingUser.role !== "admin" &&
        requestingUser.role !== "super admin" &&
        requestingUser._id.toString() !== userId
      ) {
        return res.status(403).json({
          success: false,
          message:
            "Access denied. You can only view your own transaction history.",
        });
      }

      const actualSkip = (page - 1) * limit;
      const transactions = await TransactionService.getTransactionHistory(
        userId,
        Number.parseInt(limit),
        Number.parseInt(actualSkip),
        status,
        transactionType
      );

      // Get total count for pagination
      const totalCount = await TransactionService.getTransactionCount(
        userId,
        status,
        transactionType
      );

      res.status(200).json({
        success: true,
        data: {
          transactions,
          pagination: {
            currentPage: Number.parseInt(page),
            totalPages: Math.ceil(totalCount / limit),
            totalCount,
            hasNext: page * limit < totalCount,
            hasPrev: page > 1,
          },
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
   * Get current user's own balance (for authenticated user)
   */
  async getMyBalance(req, res) {
    try {
      const userId = req.user._id;
      const balance = await TransactionService.getUserBalance(userId);

      res.status(200).json({
        success: true,
        data: {
          userId,
          ...balance,
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
   * Get current user's own transaction history
   */
  async getMyTransactionHistory(req, res) {
    try {
      const userId = req.user._id;
      const {
        limit = 50,
        skip = 0,
        status,
        transactionType,
        page = 1,
      } = req.query;

      const actualSkip = (page - 1) * limit;
      const transactions = await TransactionService.getTransactionHistory(
        userId,
        Number.parseInt(limit),
        Number.parseInt(actualSkip),
        status,
        transactionType
      );

      const totalCount = await TransactionService.getTransactionCount(
        userId,
        status,
        transactionType
      );

      res.status(200).json({
        success: true,
        data: {
          transactions,
          pagination: {
            currentPage: Number.parseInt(page),
            totalPages: Math.ceil(totalCount / limit),
            totalCount,
            hasNext: page * limit < totalCount,
            hasPrev: page > 1,
          },
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
   * Get current user's balance and transaction history combined
   */
  async getMyBalanceAndHistory(req, res) {
    try {
      const userId = req.user._id;
      const {
        limit = 15,
        skip = 0,
        status,
        transactionType,
        page = 1,
      } = req.query;

      // Get balance
      const balance = await TransactionService.getUserBalance(userId);

      // Get transaction history
      const actualSkip = (page - 1) * limit;
      const transactions = await TransactionService.getTransactionHistory(
        userId,
        Number.parseInt(limit),
        Number.parseInt(actualSkip),
        status,
        transactionType
      );

      const totalCount = await TransactionService.getTransactionCount(
        userId,
        status,
        transactionType
      );

      res.status(200).json({
        success: true,
        data: {
          balance: {
            userId,
            ...balance,
          },
          transactions,
          pagination: {
            currentPage: Number.parseInt(page),
            totalPages: Math.ceil(totalCount / limit),
            totalCount,
            hasNext: page * limit < totalCount,
            hasPrev: page > 1,
          },
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
}

module.exports = new TransactionController();
