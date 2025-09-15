const mongoose = require("mongoose");

// Import your models (adjust paths as needed)
const User = require("../models/User");
const TransactionRecord = require("../models/TransactionRecord");
const { generateReferenceId } = require("../helpers/transactionHelpers");

class TransactionService {
  /**
   * Get the latest balance for a user
   */
  async getUserBalance(userId) {
    try {
      const latestTransaction = await TransactionRecord.findOne({
        user: userId,
        isDeleted: false,
      }).sort({ createdAt: -1 });

      if (!latestTransaction) {
        return {
          availableBalance: 0,
          pendingBalance: 0,
          totalBalance: 0,
        };
      }

      return {
        availableBalance: latestTransaction.availableBalance || 0,
        pendingBalance: latestTransaction.pendingBalance || 0,
        totalBalance:
          (latestTransaction.availableBalance || 0) +
          (latestTransaction.pendingBalance || 0),
      };
    } catch (error) {
      throw new Error(`Failed to get user balance: ${error.message}`);
    }
  }

  /**
   * Validate user exists and get their role
   */
  async validateUser(userId, session) {
    const user = await User.findById(userId).session(session);
    if (!user) {
      throw new Error("User not found");
    }
    if (!user.isActive) {
      throw new Error("User account is inactive");
    }
    return user;
  }

  /**
   * Validate amount is a positive whole number
   */
  validateAmount(amount) {
    if (!amount || amount <= 0) {
      throw new Error("Amount must be greater than 0");
    }

    if (!Number.isInteger(amount)) {
      throw new Error("Amount must be a whole number (no decimals allowed)");
    }

    if (amount > Number.MAX_SAFE_INTEGER) {
      throw new Error("Amount is too large");
    }
  }

  /**
   * Calculate new balances based on transaction
   */
  calculateNewBalances(currentBalance, amount, transactionType, balanceType) {
    this.validateAmount(amount);

    let newAvailableBalance = currentBalance.availableBalance || 0;
    let newPendingBalance = currentBalance.pendingBalance || 0;

    const multiplier = transactionType === "credit" ? 1 : -1;
    const adjustedAmount = amount * multiplier;

    switch (balanceType) {
      case "available":
        newAvailableBalance += adjustedAmount;
        break;
      case "pending":
        newPendingBalance += adjustedAmount;
        break;
      case "both":
        // Split amount equally between available and pending
        const halfAmount = adjustedAmount / 2;
        newAvailableBalance += halfAmount;
        newPendingBalance += halfAmount;
        break;
    }

    // Validate balances don't go negative for debits
    if (transactionType === "debit") {
      if (newAvailableBalance < 0) {
        throw new Error("Insufficient available balance");
      }
      if (newPendingBalance < 0) {
        throw new Error("Insufficient pending balance");
      }
    }

    return {
      availableBalance: newAvailableBalance,
      pendingBalance: newPendingBalance,
    };
  }

  /**
   * Create a single transaction record
   */
  async createTransaction(params) {
    const session = await mongoose.startSession();

    try {
      return await session.withTransaction(async () => {
        // Validate user
        const user = await this.validateUser(params.userId, session);

        // Get current balance
        const currentBalance = await this.getUserBalance(params.userId);

        // Calculate new balances
        const newBalances = this.calculateNewBalances(
          currentBalance,
          params.amount,
          params.transactionType,
          params.balanceType
        );

        // Create transaction record
        const transactionData = {
          user: params.userId,
          userData: {
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            id: user._id,
          },
          createdBy: params.createdBy,
          role: user.role,
          amount: params.amount,
          transactionType: params.transactionType,
          status: params.status,
          description:
            params.description || `${params.transactionType} transaction`,
          referenceId: params.referenceId,
          metadata: params.metadata || {},
          availableBalance: newBalances.availableBalance,
          //   pendingBalance: newBalances.pendingBalance; --- IGNORE ---
          orderId: params.orderId,
          paymentMethod: params.paymentMethod,
          transactionMode: params.transactionMode || "online",
          gatewayResponse: params.gatewayResponse || {},
          failureReason: params.failureReason,
          currency: params.currency || null,
          exchangeRate: params.exchangeRate || 1,
          taxAmount: params.taxAmount || 0,
          taxDetails: params.taxDetails,
          remarks: params.remarks,
          status: params.status || "completed",
          referenceId: generateReferenceId("TXN"),
          category: params?.category,
        };

        const transaction = new TransactionRecord(transactionData);
        await transaction.save({ session });

        return transaction;
      });
    } catch (error) {
      throw new Error(`Transaction failed: ${error.message}`);
    } finally {
      await session.endSession();
    }
  }

  /**
   * Transfer funds between two users
   */
  async transferFunds(params) {
    const session = await mongoose.startSession();

    try {
      return await session.withTransaction(async () => {
        // Validate both users
        const fromUser = await this.validateUser(params.fromUserId, session);
        const toUser = await this.validateUser(params.toUserId, session);

        // Get current balances
        const fromBalance = await this.getUserBalance(params.fromUserId);
        const toBalance = await this.getUserBalance(params.toUserId);

        // Calculate new balances for sender (debit)
        const fromNewBalances = this.calculateNewBalances(
          fromBalance,
          params.amount,
          "debit",
          params.fromBalanceType
        );

        // Calculate new balances for receiver (credit)
        const toNewBalances = this.calculateNewBalances(
          toBalance,
          params.amount,
          "credit",
          params.toBalanceType
        );

        // Create debit transaction for sender
        const fromTransactionData = {
          user: params.fromUserId,
          userData: {
            firstName: fromUser.firstName,
            lastName: fromUser.lastName,
            email: fromUser.email,
            id: fromUser._id,
          },
          role: fromUser.role,
          amount: params.amount,
          transactionType: "debit",
          status: "completed",
          description:
            params.description ||
            `Transfer to ${toUser.firstName} ${toUser.lastName}`,
          referenceId: params.referenceId,
          metadata: {
            ...params.metadata,
            transferType: "outgoing",
            recipientId: params.toUserId,
          },
          availableBalance: fromNewBalances.availableBalance,
          pendingBalance: fromNewBalances.pendingBalance,
          createdBy: params.createdBy,
          orderId: params.orderId,
          paymentMethod: params.paymentMethod,
          currency: params.currency || "USD",
          remarks: params.remarks,
        };

        // Create credit transaction for receiver
        const toTransactionData = {
          user: params.toUserId,
          role: toUser.role,
          amount: params.amount,
          transactionType: "credit",
          status: "completed",
          description:
            params.description ||
            `Transfer from ${fromUser.firstName} ${fromUser.lastName}`,
          referenceId: params.referenceId,
          metadata: {
            ...params.metadata,
            transferType: "incoming",
            senderId: params.fromUserId,
          },
          availableBalance: toNewBalances.availableBalance,
          pendingBalance: toNewBalances.pendingBalance,
          createdBy: params.createdBy,
          orderId: params.orderId,
          paymentMethod: params.paymentMethod,
          currency: params.currency || "USD",
          remarks: params.remarks,
        };

        // Save both transactions
        const fromTransaction = new TransactionRecord(fromTransactionData);
        const toTransaction = new TransactionRecord(toTransactionData);

        await fromTransaction.save({ session });
        await toTransaction.save({ session });

        // Link transactions
        fromTransaction.relatedTransaction = toTransaction._id;
        toTransaction.relatedTransaction = fromTransaction._id;

        await fromTransaction.save({ session });
        await toTransaction.save({ session });

        return { fromTransaction, toTransaction };
      });
    } catch (error) {
      throw new Error(`Transfer failed: ${error.message}`);
    } finally {
      await session.endSession();
    }
  }

  /**
   * Move funds between balance types for the same user
   */
  async moveBalance(
    userId,
    amount,
    fromBalanceType,
    toBalanceType,
    createdBy,
    description,
    referenceId
  ) {
    this.validateAmount(amount);

    if (fromBalanceType === toBalanceType) {
      throw new Error("Cannot move balance to the same type");
    }

    const session = await mongoose.startSession();

    try {
      return await session.withTransaction(async () => {
        const user = await this.validateUser(userId, session);
        const currentBalance = await this.getUserBalance(userId);

        // Check if sufficient balance exists
        const sourceBalance =
          fromBalanceType === "available"
            ? currentBalance.availableBalance
            : currentBalance.pendingBalance;

        if (sourceBalance < amount) {
          throw new Error(`Insufficient ${fromBalanceType} balance`);
        }

        // Calculate new balances
        let newAvailableBalance = currentBalance.availableBalance;
        let newPendingBalance = currentBalance.pendingBalance;

        if (fromBalanceType === "available") {
          newAvailableBalance -= amount;
          newPendingBalance += amount;
        } else {
          newPendingBalance -= amount;
          newAvailableBalance += amount;
        }

        // Create transaction record
        const transactionData = {
          user: userId,
          userData: {
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            id: user._id,
          },
          // createdBy: createdBy,
          role: user.role,
          amount: amount,
          transactionType: "credit", // This is a balance movement, not a real credit/debit
          status: "completed",
          description:
            description ||
            `Move ${amount} from ${fromBalanceType} to ${toBalanceType}`,
          referenceId: referenceId,
          metadata: {
            balanceMovement: true,
            fromBalanceType,
            toBalanceType,
          },
          availableBalance: newAvailableBalance,
          pendingBalance: newPendingBalance,
          createdBy: createdBy,
          transactionMode: "online",
          currency: "USD",
        };

        const transaction = new TransactionRecord(transactionData);
        await transaction.save({ session });

        return transaction;
      });
    } catch (error) {
      throw new Error(`Balance movement failed: ${error.message}`);
    } finally {
      await session.endSession();
    }
  }

  /**
   * Get transaction history for a user
   */
  async getTransactionHistory(
    userId,
    limit = 50,
    skip = 0,
    status,
    transactionType
  ) {
    try {
      const query = {
        user: userId,
        isDeleted: false,
      };

      if (status) query.status = status;
      if (transactionType) query.transactionType = transactionType;

      return await TransactionRecord.find(query)
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip(skip)
        // .populate("createdBy", "firstName lastName email")
        .populate("relatedTransaction")
        .lean();
    } catch (error) {
      throw new Error(`Failed to get transaction history: ${error.message}`);
    }
  }

  /**
   * Get transaction count for pagination
   */
  async getTransactionCount(userId, status, transactionType) {
    try {
      const query = {
        user: userId,
        isDeleted: false,
      };

      if (status) query.status = status;
      if (transactionType) query.transactionType = transactionType;

      return await TransactionRecord.countDocuments(query);
    } catch (error) {
      throw new Error(`Failed to get transaction count: ${error.message}`);
    }
  }

  /**
   * Get all users with their current balances (admin function)
   */
  async getAllUsersWithBalances(page = 1, limit = 20, search) {
    try {
      const userQuery = { isActive: true };
      if (search) {
        userQuery.$or = [
          { firstName: { $regex: search, $options: "i" } },
          { lastName: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } },
        ];
      }

      // Get users with pagination
      const skip = (page - 1) * limit;
      const users = await User.find(userQuery)
        .select("firstName lastName email role isActive")
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip(skip)
        .lean();

      // Get balances for each user
      const usersWithBalances = await Promise.all(
        users.map(async (user) => {
          const balance = await this.getUserBalance(user._id);
          return {
            ...user,
            balance,
          };
        })
      );

      // Get total count
      const totalCount = await User.countDocuments(userQuery);

      return {
        users: usersWithBalances,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalCount / limit),
          totalCount,
          hasNext: page * limit < totalCount,
          hasPrev: page > 1,
        },
      };
    } catch (error) {
      throw new Error(`Failed to get users with balances: ${error.message}`);
    }
  }
}

module.exports = new TransactionService();
