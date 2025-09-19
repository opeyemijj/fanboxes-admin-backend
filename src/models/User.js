const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

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

const UserSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: [true, "Please enter a firstName"],
    },
    lastName: {
      type: String,
      // required: [true, 'Please enter a lastName'],
    },
    email: {
      type: String,
      required: [true, "Please enter an email"],
      unique: true,
    },
    password: {
      type: String,
      select: false,
      required: [true, "Please enter a password"],
      minlength: 8,
    },
    gender: {
      type: String,
      // enum: ['male', 'female', 'other'],
      // required: [true, 'Please enter a gender'],
    },

    currentBalance: {
      type: Number,
    },
    dataAccess: {
      type: String,
    },
    cover: {
      _id: {
        type: String,
      },
      url: { type: String },
      blurDataURL: {
        type: String,
      },
    },
    wishlist: [
      {
        type: mongoose.Types.ObjectId,
        ref: "Product",
      },
    ],
    orders: [
      {
        type: mongoose.Types.ObjectId,
        ref: "Order",
      },
    ],
    shop: { type: mongoose.Types.ObjectId, ref: "Shop" },
    recentProducts: [
      {
        type: mongoose.Types.ObjectId,
        ref: "Product",
      },
    ],
    phone: {
      type: String,
      // required: [true, 'Please provide a Phone Number.'],
      // maxlength: [20, 'Phone cannot be more than 20 characters.'],
    },
    roleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Role",
      required: false,
    },
    roleDetails: {
      type: mongoose.Schema.Types.Mixed, // 👈 allows any kind of object/value
      default: {},
    },
    status: {
      type: String,
    },
    // address: {
    //   type: String,
    // },
    // city: {
    //   type: String,
    // },
    // zip: {
    //   type: String,
    // },
    // country: {
    //   type: String,
    // },
    // state: {
    //   type: String,
    // },
    shippingAddress: ShippingAddressSubSchema,
    about: {
      type: String,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    otp: {
      type: String,
      required: true,
    },
    lastOtpSentAt: {
      type: Date,
    },
    commission: {
      type: Number,
    },
    role: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Hash the password before saving
UserSchema.pre("save", async function(next) {
  try {
    if (!this.isModified("password")) {
      return next();
    }

    const hashedPassword = await bcrypt.hash(this.password, 10);
    this.password = hashedPassword;
    return next();
  } catch (error) {
    return next(error);
  }
});

const User = mongoose.models.User || mongoose.model("User", UserSchema);
module.exports = User;
