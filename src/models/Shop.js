const mongoose = require("mongoose");

const ShopSchema = new mongoose.Schema(
  {
    vendor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    vendorDetails: {
      type: mongoose.Schema.Types.Mixed, // 👈 allows any kind of object/value
      default: {},
    },
    logo: {
      _id: {
        type: String,
        required: [true, "image-id-required-error"],
      },
      url: {
        type: String,
        required: [true, "image-url-required-error"],
      },
      blurDataURL: {
        type: String,
        required: [true, "image-blur-data-url-required-error"],
      },
    },
    cover: {
      _id: {
        type: String,
        required: [true, "image-id-required-error"],
      },
      url: {
        type: String,
        required: [true, "image-url-required-error"],
      },
      blurDataURL: {
        type: String,
        required: [true, "image-blur-data-url-required-error"],
      },
    },
    title: {
      type: String,
      required: [true, "title is required."],
      maxlength: [100, "title cannot exceed 100 characters."],
    },

    description: {
      type: String,
      maxlength: [500, "Description cannot exceed 500 characters."],
    },

    slug: {
      type: String,
      unique: true,
      required: true,
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: false,
    },
    isBanned: {
      type: Boolean,
      default: false,
    },
    followers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
    ],
    phone: {
      type: String,
      unique: true,
      required: true,
    },
    approved: {
      type: Boolean,
      required: true,
      default: true,
    },
    approvedAt: {
      type: Date,
    },

    website: {
      type: String,
    },
    status: {
      type: String,
      enum: [
        "approved",
        "draft",
        "pending",
        "in review",
        "action required",
        "blocked",
        "rejected",
      ],
      required: true,
    },
    message: {
      type: String,
    },
    products: [
      {
        type: mongoose.Types.ObjectId,
        ref: "Product",
      },
    ],
    paymentInfo: {
      holderName: {
        type: String,
        required: true,
      },
      holderEmail: {
        type: String,
        required: true,
      },
      bankName: {
        type: String,
      },
      AccountNo: {
        type: Number,
      },
    },
    address: {
      country: { type: String },
      city: { type: String },
      state: { type: String },
      streetAddress: { type: String },
    },
  },
  {
    timestamps: true,
  }
);

const Shop = mongoose.models.Shop || mongoose.model("Shop", ShopSchema);
module.exports = Shop;
