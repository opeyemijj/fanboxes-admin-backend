const mongoose = require("mongoose");
const TransactionService = require("../services/transactionService");
const RoleBasedTransactionService = require("../services/roleBasedTransactionService");
const TransactionRecord = require("../models/TransactionRecord");
const Spin = require("../models/Spin");
const Credit = require("../models/Credit");

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
        fromDate,
        toDate,
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
        transactionType,
        fromDate,
        toDate
      );

      const totalCount = await TransactionService.getTransactionCount(
        userId,
        status,
        transactionType,
        status,
        transactionType,
        fromDate,
        toDate
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

  async getTransectionsByAdmin(req, res) {
    try {
      const { limit = 10, page = 1, search = "" } = req.query;

      const parsedLimit = parseInt(limit);
      const parsedPage = parseInt(page);
      const skip = (parsedPage - 1) * parsedLimit;

      // Build search query
      const searchQuery = search
        ? {
            $or: [
              { "userData.firstName": { $regex: search, $options: "i" } },
              { "userData.lastName": { $regex: search, $options: "i" } },
              { transactionType: { $regex: search, $options: "i" } },
              { paymentMethod: { $regex: search, $options: "i" } },
              { status: { $regex: search, $options: "i" } },
            ],
          }
        : {};

      const totalTransections = await TransactionRecord.countDocuments(
        searchQuery
      );

      const transections = await TransactionRecord.find(searchQuery)
        .skip(skip)
        .limit(parsedLimit)
        .sort({ createdAt: -1 });

      return res.status(200).json({
        success: true,
        data: transections,
        count: Math.ceil(totalTransections / parsedLimit),
        total: totalTransections,
        currentPage: parsedPage,
      });
    } catch (error) {
      return res.status(400).json({ success: false, message: error.message });
    }
  }

  /**
   * Controller function to credit user's balance for spin resell
   */
  async creditSpinResell(req, res) {
    const session = await mongoose.startSession();

    try {
      await session.withTransaction(async () => {
        const { spinId } = req.body;
        const userId = req.user._id;

        if (!spinId) {
          throw new Error("Spin ID is required");
        }

        // Fetch the spin data
        const spin = await Spin.findById(spinId).session(session);
        if (!spin) {
          throw new Error("Spin record not found");
        }

        // Verify the spin belongs to the authenticated user
        if (spin.userId.toString() !== userId.toString()) {
          throw new Error(
            "Unauthorized access to resell spin item won, as this spin does not belong to you"
          );
        }

        // Get resell rule and conversion rate from app configuration
        const resellRule = await Credit.findOne({ type: "refund" })
          .select("value valueType")
          // .session(session)
          .lean();

        const cashToCreditConvRate = await Credit.findOne({
          type: "credit rate",
        })
          .select("value")
          // .session(session)
          .lean();

        console.log({ resellRule, cashToCreditConvRate });

        // Calculate resell amount
        const originalValue = spin.winningItem.value;
        let resellAmount = 0;

        if (resellRule.valueType === "percentage") {
          resellAmount = (originalValue * (resellRule.value / 100)).toFixed(0);
        } else {
          resellAmount = resellRule.value;
        }

        // Create transaction using TransactionService
        const transaction = await TransactionService.createTransaction({
          userId: userId,
          amount: parseInt(resellAmount),
          transactionType: "credit",
          category: "spin resell",
          status: "completed",
          description: `Credits claim for spin win: ${spin.winningItem.name}`,
          metadata: {
            spinResell: true,
            spinId: spin._id,
            originalItemValue: originalValue,
            box: {
              _id: spin.boxId,
              name: spin.boxDetails?.name,
              slug: spin.boxDetails?.slug,
              priceSale: spin.boxDetails?.priceSale,
              images: spin.boxDetails?.images,
              items: spin.boxDetails?.items,
            },
            spinResult: {
              oddsMap: spin.oddsMap,
              winningItem: spin.winningItem,
              verification: {
                clientSeed: spin.clientSeed,
                serverSeedHash: spin.serverSeedHash,
                nonce: spin.nonce,
                hash: spin.hash,
                normalized: spin.normalized, // Fixed typo: norrmalized → normalized
              },
              initiatedBy: {},
            },
            resellRule: resellRule,
            conversionRate: cashToCreditConvRate.value,
            calculatedAmount: resellAmount,
          },
          paymentMethod: "wallet",
          currency: "USD",
          remarks: `Resell of won item: ${spin.winningItem.name} from spin`,
        });

        // Mark the spin as processed for resell
        await Spin.findByIdAndUpdate(
          spinId,
          {
            $set: {
              processedForResell: true,
              resellTransactionRef: transaction.referenceId,
            },
          },
          { session }
        );

        return res.status(200).json({
          success: true,
          message: "Tokens credited successfully",
          data: {
            transaction,
            originalValue: originalValue,
            resellAmount: resellAmount,
            winningItem: spin.winningItem,
          },
        });
      });
    } catch (error) {
      console.error("Error in creditSpinResell:", error);

      return res.status(500).json({
        success: false,
        message: error.message || "Failed to process token claim",
        error: process.env.NODE_ENV === "development" ? error.stack : undefined,
      });
    } finally {
      await session.endSession();
    }
  }

  async getTransactionByRefId(req, res) {
    try {
      const refId = req.query.refId;
      if (!refId) {
        return res.status(400).json({
          success: false,
          message: "Transaction rreference is required",
        });
      }

      const transaction = await TransactionRecord.findOne({
        referenceId: refId,
      }).lean();
      if (!transaction) {
        return res
          .status(404)
          .json({ success: false, message: "transaction not found" });
      }

      return res
        .status(200)
        .json({
          success: true,
          message: "Transaction retreived successfully",
          data: transaction,
        });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message || "Failed to process token claim",
        error: process.env.NODE_ENV === "development" ? error.stack : undefined,
      });
    }
  }
}

module.exports = new TransactionController();
