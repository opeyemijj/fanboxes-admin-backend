const mongoose = require("mongoose");
const { Schema } = mongoose;

// Sub-schema for images
const ImageSubSchema = new mongoose.Schema({
  _id: {
    type: String,
  },
  url: {
    type: String,
  },
  blurDataURL: {
    type: String,
  },
});

const ItemboxSubSchema = new mongoose.Schema({
  ownerType: String,
  instagramLink: String,
  vendorDetails: {
    _id: mongoose.Types.ObjectId,
    firstName: String,
    lastName: String,
    gender: String,
  },

  logo: ImageSubSchema,
  cover: ImageSubSchema,
  title: String,
  description: String,
  slug: String,

  categoryDetails: {
    _id: mongoose.Types.ObjectId,
    name: String,
    slug: String,
  },

  subCategoryDetails: {
    _id: mongoose.Types.ObjectId,
    name: String,
    slug: String,
  },
});

// Sub-schema for items
const ItemSubSchema = new mongoose.Schema({
  name: {
    type: String,
  },
  slug: {
    type: String,
  },
  description: {
    type: String,
  },
  images: {
    type: [ImageSubSchema],
  },
  value: {
    type: Number,
  },
  weight: {
    type: Number,
  },
  odd: {
    type: Number,
  },
  status: {
    type: String,
    default: "available",
  },

  associatedBox: ItemboxSubSchema,
});

const ShippingAddressSubSchema = new mongoose.Schema({
  address: {
    type: String,
    required: [true, "Address is required."],
  },
  city: {
    type: String,
    required: [true, "City is required."],
  },
  zip: {
    type: String,
    required: [true, "Postal code is required."],
  },
  country: {
    type: String,
    required: [true, "Country is required."],
  },
  state: {
    type: String,
    required: [true, "State is required."],
  },
});

const UserSubSchema = new mongoose.Schema({
  _id: {
    type: mongoose.Types.ObjectId,
  },
  firstName: {
    type: String,
  },
  lastName: {
    type: String,
  },
  email: {
    type: String,
  },
  phone: {
    type: String,
  },
  shippingAddress: ShippingAddressSubSchema,
});

const TransactionSubSchema = new mongoose.Schema({
  _id: mongoose.Types.ObjectId,
  amount: Number,
  transactionType: String,
  category: String,
  status: String,
  description: String,
  referenceId: String,
  paymentMethod: String,
  transactionMode: String,
  currency: String,
  exchangeRate: Number,
  fxRate: Number,
  taxAmount: { type: Number, default: 0 },
  taxDetails: { type: mongoose.Schema.Types.Mixed },
  metadata: { type: mongoose.Schema.Types.Mixed },
});

const SpinSubSchema = new mongoose.Schema({
  oddsMap: {
    type: mongoose.Schema.Types.Mixed,
  },

  clientSeed: {
    type: String,
  },
  serverSeed: {
    type: String,
  },
  serverSeedHash: {
    type: String,
  },
  nonce: {
    type: Number,
  },
  winningItem: {
    type: mongoose.Schema.Types.Mixed,
  },
  normalized: {
    type: String,
  },
  hash: {
    type: String,
  },
});

const OrderSchema = new mongoose.Schema(
  {
    orderNo: {
      type: String,
      required: [true, "Order No is required."],
      unique: true,
    },

    shippingFee: {
      type: Number,
      default: 0,
    },

    totalAmountPaid: {
      type: Number,
      required: [true, "Total amount paid is required."],
    },

    discountApplied: {
      amount: { type: Number, default: 0 },
      type: {
        type: String,
        enum: ["percentage-off", "price-slash", "none"],
        default: "none",
      },
    },

    status: {
      type: String,
      enum: [
        "pending", // Order placed but not processed
        "confirmed", // Order confirmed by admin
        "processing", // Order being prepared for shipment
        "shipped", // Order has been shipped
        "out-for-delivery", // Order is with delivery carrier
        "delivered", // Order successfully delivered
        "cancelled", // Order cancelled by user or admin
        "refunded", // Order refunded
        "returned", // Order returned by customer
      ],
      default: "pending",
    },

    items: [ItemSubSchema],

    note: {
      type: String,
    },

    taxApplied: { type: mongoose.Schema.Types.Mixed },

    transaction: TransactionSubSchema,
    user: UserSubSchema,
    spinData: SpinSubSchema, //optional, if order was triggered after a successful spin

    // Tracking fields
    estimatedDelivery: {
      type: Date,
    },

    trackingNumber: {
      type: String,
    },

    carrier: {
      type: String,
    },

    trackingInfo: {
      trackingNumber: {
        type: String,
      },
      courier: {
        type: String,
      },
      shipped: {
        type: String,
      },
      expected: {
        type: String,
      },
    },

    shippingInfo: {
      status: {
        type: String,
      },
      statusDate: {
        type: String,
      },
      statusComment: {
        type: String,
      },
    },

    assignTo: [
      {
        type: String,
      },
    ],
    assignToDetails: [
      {
        type: mongoose.Schema.Types.Mixed, // 👈 allows any kind of object/value
        default: {},
      },
    ],
    assignedBy: {
      type: Schema.Types.Mixed,
    },
    assignedByDetails: {
      type: Schema.Types.Mixed,
    },
  },
  {
    timestamps: true,
  }
);

const Order = mongoose.models.Order || mongoose.model("Order", OrderSchema);
module.exports = Order;
