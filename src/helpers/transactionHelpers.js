const mongoose = require("mongoose");
const TransactionService = require("../services/transactionService");

/**
 * Utility functions for common transaction operations
 */
class TransactionHelpers {
  /**
   * Validate transaction amount
   */
  static validateAmount(amount) {
    if (!amount || amount <= 0) {
      throw new Error("Amount must be greater than 0");
    }
    if (amount > 1000000) {
      throw new Error("Amount exceeds maximum limit");
    }
    return Math.round(amount * 100) / 100; // Round to 2 decimal places
  }

  /**
   * Validate ObjectId
   */
  static validateObjectId(id, fieldName = "ID") {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new Error(`Invalid ${fieldName}`);
    }
    return new mongoose.Types.ObjectId(id);
  }

  /**
   * Generate transaction reference ID
   */
  static generateReferenceId(prefix = "TXN") {
    const timestamp = Date.now();
    const random = Math.random()
      .toString(36)
      .substring(2, 8)
      .toUpperCase();
    return `${prefix}_${timestamp}_${random}`;
  }

  /**
   * Format currency amount
   */
  static formatCurrency(amount, currency = "USD") {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
    }).format(amount);
  }

  /**
   * Check if user has sufficient balance
   */
  static async checkSufficientBalance(
    userId,
    amount,
    balanceType = "available"
  ) {
    const balance = await TransactionService.getUserBalance(userId);

    let availableAmount = 0;
    switch (balanceType) {
      case "available":
        availableAmount = balance.availableBalance;
        break;
      case "pending":
        availableAmount = balance.pendingBalance;
        break;
      case "both":
        availableAmount = balance.totalBalance;
        break;
    }

    return availableAmount >= amount;
  }

  /**
   * Calculate transaction fees (if applicable)
   */
  static calculateTransactionFee(amount, feePercentage = 0) {
    if (feePercentage <= 0) return 0;
    return Math.round(amount * (feePercentage / 100) * 100) / 100;
  }

  /**
   * Validate transaction parameters
   */
  static validateTransactionParams(params) {
    const required = [
      "userId",
      "amount",
      "transactionType",
      "balanceType",
      "status",
      "createdBy",
    ];

    for (const field of required) {
      if (!params[field]) {
        throw new Error(`Missing required field: ${field}`);
      }
    }

    // Validate enums
    if (!["credit", "debit"].includes(params.transactionType)) {
      throw new Error("Invalid transaction type");
    }

    if (!["available", "pending", "both"].includes(params.balanceType)) {
      throw new Error("Invalid balance type");
    }

    if (!["pending", "completed", "failed"].includes(params.status)) {
      throw new Error("Invalid status");
    }

    return true;
  }

  /**
   * Create transaction summary for reporting
   */
  static createTransactionSummary(transactions) {
    const summary = {
      totalTransactions: transactions.length,
      totalCredits: 0,
      totalDebits: 0,
      netAmount: 0,
      completedTransactions: 0,
      pendingTransactions: 0,
      failedTransactions: 0,
    };

    transactions.forEach((txn) => {
      if (txn.transactionType === "credit") {
        summary.totalCredits += txn.amount;
      } else {
        summary.totalDebits += txn.amount;
      }

      switch (txn.status) {
        case "completed":
          summary.completedTransactions++;
          break;
        case "pending":
          summary.pendingTransactions++;
          break;
        case "failed":
          summary.failedTransactions++;
          break;
      }
    });

    summary.netAmount = summary.totalCredits - summary.totalDebits;
    return summary;
  }
}

module.exports = TransactionHelpers;
