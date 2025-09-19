const mongoose = require("mongoose");

const TransactionRecordSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Types.ObjectId, ref: "User", required: true },
    userData: {
      firstName: String,
      lastName: String,
      email: String,
      id: mongoose.Types.ObjectId,
    },
    role: {
      type: String,
      required: true,
      enum: ["admin", "super admin", "vendor", "user"],
      required: true,
    },
    amount: { type: Number, required: true },
    transactionType: {
      type: String,
      required: true,
      enum: ["credit", "debit"],
    },
    category: {
      type: String,
      enum: [
        "refund",
        "deposit",
        "spend",
        "withdrawal",
        "adjustment",
        "spin resell",
      ],
      required: true,
    },
    status: {
      type: String,
      required: true,
      enum: ["pending", "completed", "failed"],
    },
    description: { type: String },
    referenceId: { type: String },
    source: { type: String }, // e.g., "order payment", "refund", "top-up"
    metadata: { type: mongoose.Schema.Types.Mixed },
    availableBalance: { type: Number, required: true, default: 0 },
    pendingBalance: { type: Number }, //CURRENTLY NOT IN USE
    transactionDate: { type: Date, default: Date.now },
    deletedAt: { type: Date, default: null },
    deletedBy: { type: mongoose.Types.ObjectId, ref: "User", default: null },
    isDeleted: { type: Boolean, default: false },
    remarks: { type: String },
    orderId: { type: mongoose.Types.ObjectId, ref: "Order" },
    paymentMethod: { type: String }, // e.g., "credit card", "paypal", "wallet", "manual top-up", "manual debit"
    transactionMode: {
      type: String,
      enum: ["online", "offline"],
      default: "online",
    },
    gatewayResponse: { type: mongoose.Schema.Types.Mixed, default: {} },
    failureReason: { type: String },
    currency: { type: String },
    exchangeRate: { type: Number, default: 1 },
    taxAmount: { type: Number, default: 0 },
    taxDetails: { type: mongoose.Schema.Types.Mixed },
    isRefunded: { type: Boolean, default: false },
    refundedAt: { type: Date },
    refundedBy: { type: mongoose.Types.ObjectId, ref: "User" },
    refundReason: { type: String },
    fxRate: { type: Number },
    creditRate: { type: Number },
    relatedTransaction: {
      type: mongoose.Types.ObjectId,
      ref: "TransactionRecord",
    },
  },
  { timestamps: true }
);

const TransactionRecord =
  mongoose.model.TransactionRecord ||
  mongoose.model("TransactionRecord", TransactionRecordSchema);
module.exports = TransactionRecord;
