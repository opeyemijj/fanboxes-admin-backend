const mongoose = require("mongoose");

const PaymentGatewaySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required."],
      maxlength: [100, "Name cannot exceed 100 characters."],
      trim: true,
    },

    primaryKey: {
      type: String,
      required: [true, "Primary Key is required."],
      trim: true,
    },

    paymentMethod: {
      type: String,
      required: [true, "Payment Method is required."],
    },

    otherKey1: {
      type: String,
      default: null,
      trim: true,
    },

    otherKey2: {
      type: String,
      default: null,
      trim: true,
    },

    slug: {
      type: String,
      unique: true,
      required: true,
      index: true,
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

const PaymentGateway =
  mongoose.models.PaymentGateway ||
  mongoose.model("PaymentGateway", PaymentGatewaySchema);

module.exports = PaymentGateway;
