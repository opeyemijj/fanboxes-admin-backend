const mongoose = require("mongoose");

// Define the interface for the Spin document
const SpinSchema = new mongoose.Schema(
  {
    boxId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    boxDetails: {
      type: mongoose.Schema.Types.Mixed, // 👈 allows any kind of object/value
      default: {},
    },
    vendorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    vendorDetails: {
      type: mongoose.Schema.Types.Mixed, // 👈 allows any kind of object/value
      default: {},
    },
    clientSeed: {
      type: String,
      required: [true, "client seed is required."],
    },
    serverSeed: {
      type: String,
      required: [true, "server seed is required."],
    },
    serverSeedHash: {
      type: String,
      required: [true, "server seed hash is required."],
    },
    nonce: {
      type: Number,
      required: [true, "Nonce is required."],
    },
    winningItem: {
      type: mongoose.Schema.Types.Mixed, // 👈 allows any kind of object/value
      default: {},
    },
    hash: {
      type: String,
      required: [true, "hash is required."],
    },
  },
  { timestamps: true }
);

// Define the Spin model
const Spin = mongoose.models.Spin || mongoose.model("Spin", SpinSchema);
module.exports = Spin;
