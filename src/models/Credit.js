const mongoose = require("mongoose");

const CreditSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required."],
      maxlength: [100, "Name cannot exceed 100 characters."],
    },

    type: {
      type: String,
      required: true,
    },

    value: {
      type: Number,
      required: true,
    },

    valueType: {
      type: String,
      required: true,
    },

    slug: {
      type: String,
      unique: true,
      required: true,
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

const Credit = mongoose.models.Credit || mongoose.model("Credit", CreditSchema);
module.exports = Credit;
