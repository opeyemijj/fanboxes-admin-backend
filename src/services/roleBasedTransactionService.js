const TransactionService = require("./transactionService");

class RoleBasedTransactionService {
  /**
   * Admin manual top-up - admin manually credits a user's account
   */
  async adminManualTopup(params) {
    try {
      TransactionService.validateAmount(params.amount);

      const { adminId, ...transactionParams } = params;

      // Ensure this is a credit transaction for manual top-ups
      if (transactionParams.transactionType !== "credit") {
        throw new Error("Manual top-ups must be credit transactions");
      }

      return await TransactionService.createTransaction({
        ...transactionParams,
        paymentMethod: "manual top-up",
        category: "deposit",
        metadata: {
          ...transactionParams.metadata,
          isManualTopup: true,
          initiatedBy: params?.initiatedBy || null,
        },
      });
    } catch (error) {
      throw new Error(`Admin manual top-up failed: ${error.message}`);
    }
  }

  /**
   * Admin manual debit - admin manually debits a user's account (corrections, penalties, etc.)
   */
  async adminManualDebit(params) {
    try {
      TransactionService.validateAmount(params.amount);

      const { adminId, ...transactionParams } = params;

      // Ensure this is a debit transaction for manual debits
      if (transactionParams.transactionType !== "debit") {
        throw new Error("Manual debits must be debit transactions");
      }

      if (!transactionParams?.category) {
        throw new Error("Category for debit transactions is required");
      }

      return await TransactionService.createTransaction({
        ...transactionParams,
        createdBy: adminId,
        category: transactionParams.category,
        paymentMethod: params.paymentMethod,
        metadata: {
          ...transactionParams.metadata,
          isManualDebit: true,
          initiatedBy: params?.initiatedBy || null,
        },
      });
    } catch (error) {
      throw new Error(`Admin manual debit failed: ${error.message}`);
    }
  }

  /**
   * Admin manual transfer - admin manually transfers funds between any users
   */
  async adminManualTransfer(params) {
    try {
      TransactionService.validateAmount(params.amount);

      const { adminId, ...transferParams } = params;
      return await TransactionService.transferFunds({
        ...transferParams,
        createdBy: adminId,
        metadata: {
          ...transferParams.metadata,
          isManualTransfer: true,
        },
      });
    } catch (error) {
      throw new Error(`Admin manual transfer failed: ${error.message}`);
    }
  }

  /**
   * User transaction - limited to their own account
   */
  async userTransaction(params) {
    try {
      TransactionService.validateAmount(params.amount);

      const { requestingUserId, ...transactionParams } = params;

      // Users can only create transactions for themselves
      if (transactionParams.userId.toString() !== requestingUserId.toString()) {
        throw new Error(
          "Users can only create transactions for their own account"
        );
      }

      // Users cannot create credit transactions (only debits like purchases)
      if (transactionParams.transactionType === "credit") {
        throw new Error("Users cannot create credit transactions");
      }

      return await TransactionService.createTransaction({
        ...transactionParams,
        createdBy: requestingUserId,
      });
    } catch (error) {
      throw new Error(`User transaction failed: ${error.message}`);
    }
  }

  /**
   * Vendor transaction - can credit/debit their own account and receive payments
   */
  async vendorTransaction(params) {
    try {
      TransactionService.validateAmount(params.amount);

      const { vendorId, ...transactionParams } = params;

      // Vendors can only create transactions for themselves
      if (transactionParams.userId.toString() !== vendorId.toString()) {
        throw new Error(
          "Vendors can only create transactions for their own account"
        );
      }

      return await TransactionService.createTransaction({
        ...transactionParams,
        createdBy: vendorId,
      });
    } catch (error) {
      throw new Error(`Vendor transaction failed: ${error.message}`);
    }
  }

  /**
   * User transfer - can only send from their own account
   */
  async userTransfer(params) {
    try {
      TransactionService.validateAmount(params.amount);

      const { requestingUserId, ...transferParams } = params;

      // Users can only send from their own account
      if (
        transferParams.fromUserId.toString() !== requestingUserId.toString()
      ) {
        throw new Error("Users can only transfer from their own account");
      }

      return await TransactionService.transferFunds({
        ...transferParams,
        createdBy: requestingUserId,
      });
    } catch (error) {
      throw new Error(`User transfer failed: ${error.message}`);
    }
  }

  /**
   * Vendor transfer - can send from their own account
   */
  async vendorTransfer(params) {
    try {
      TransactionService.validateAmount(params.amount);

      const { vendorId, ...transferParams } = params;

      // Vendors can only send from their own account
      if (transferParams.fromUserId.toString() !== vendorId.toString()) {
        throw new Error("Vendors can only transfer from their own account");
      }

      return await TransactionService.transferFunds({
        ...transferParams,
        createdBy: vendorId,
      });
    } catch (error) {
      throw new Error(`Vendor transfer failed: ${error.message}`);
    }
  }

  /**
   * Process order payment - handles the complete payment flow
   */
  async processOrderPayment(
    buyerId,
    vendorId,
    amount,
    orderId,
    paymentMethod,
    adminId
  ) {
    try {
      TransactionService.validateAmount(amount);

      // Debit from buyer's available balance
      const buyerTransaction = await TransactionService.createTransaction({
        userId: buyerId,
        amount: amount,
        transactionType: "debit",
        balanceType: "available",
        status: "completed",
        description: `Payment for order #${orderId}`,
        referenceId: orderId.toString(),
        createdBy: adminId || buyerId,
        orderId: orderId,
        paymentMethod: paymentMethod,
        metadata: {
          orderPayment: true,
          vendorId: vendorId,
        },
      });

      // Credit to vendor's pending balance (pending until order completion)
      const vendorTransaction = await TransactionService.createTransaction({
        userId: vendorId,
        amount: amount,
        transactionType: "credit",
        balanceType: "pending",
        status: "completed",
        description: `Payment received for order #${orderId}`,
        referenceId: orderId.toString(),
        createdBy: adminId || buyerId,
        orderId: orderId,
        paymentMethod: paymentMethod,
        metadata: {
          orderPayment: true,
          buyerId: buyerId,
        },
      });

      return { buyerTransaction, vendorTransaction };
    } catch (error) {
      throw new Error(`Order payment processing failed: ${error.message}`);
    }
  }

  /**
   * Release vendor payment - move from pending to available when order is completed
   */
  async releaseVendorPayment(vendorId, amount, orderId, adminId) {
    try {
      TransactionService.validateAmount(amount);

      return await TransactionService.moveBalance(
        vendorId,
        amount,
        "pending",
        "available",
        adminId,
        `Payment released for completed order #${orderId}`,
        orderId.toString()
      );
    } catch (error) {
      throw new Error(`Payment release failed: ${error.message}`);
    }
  }
}

module.exports = new RoleBasedTransactionService();
