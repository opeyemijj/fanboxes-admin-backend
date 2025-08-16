const mongoose = require("mongoose");
const { Schema } = mongoose;

const productSchema = new Schema(
  {
    influencerId: {
      type: Schema.Types.ObjectId,
      required: [true, "Influencer ID is required."],
    },
    shop: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Shop",
      required: true,
    },
    slug: {
      type: String,
      required: [true, "Box slug is required."],
      unique: true,
      maxlength: [100, "Box slug cannot exceed 100 characters."],
    },
    name: {
      type: String,
      required: [true, "Name is required."],
      maxlength: [150, "Name cannot exceed 150 characters."],
    },
    description: {
      type: String,
      required: [true, "Description is required."],
      maxlength: [1000, "Description cannot exceed 1000 characters."],
    },
    priceSale: {
      type: Number,
      required: [true, "Sale price is required."],
    },
    currency: {
      type: String,
      required: [true, "Currency is required."],
      maxlength: [3, "Currency code must be 3 characters."],
      default: "USD",
    },
    status: {
      type: String,
      enum: {
        values: ["draft", "active", "paused", "archived"],
        message: "Status must be one of: draft, active, paused, or archived.",
      },
      default: "draft",
    },
    images: [
      {
        url: {
          type: String,
          required: [true],
        },
        _id: {
          type: String,
          required: [true],
        },
        blurDataURL: {
          type: String,
          required: [true, "image-blur-data-url-required-error"],
        },
      },
    ],
    category: {
      type: mongoose.Types.ObjectId,
      ref: "Category",
      required: [true, "please provide a category id"],
    },
    // subCategory: {
    //   type: mongoose.Types.ObjectId,
    //   ref: "SubCategory",
    //   required: [true, "please provide a sub category id"],
    // },
    items: [
      {
        name: {
          type: String,
          required: [true, "Item name is required."],
          maxlength: [100, "Item name cannot exceed 100 characters."],
        },
        slug: {
          type: String,
          required: [true, "Item slug is required."],
          unique: true,
          maxlength: [100, "Item slug cannot exceed 100 characters."],
        },
        description: {
          type: String,
          required: [true, "Description is required."],
          maxlength: [1000, "Description cannot exceed 1000 characters."],
        },
        images: [
          {
            url: {
              type: String,
              required: [true],
            },
            _id: {
              type: String,
              required: [true],
            },
            blurDataURL: {
              type: String,
              required: [true, "image-blur-data-url-required-error"],
            },
          },
        ],
        value: {
          type: Number,
          required: [true, "Item value is required."],
          min: [0, "Item value cannot be negative."],
          max: [1000000, "Item value cannot exceed 1,000,000."],
        },
        weight: {
          type: Number,
          required: [true, "Item weight is required."],
          min: [0, "Weight cannot be negative."],
          max: [100, "Weight percentage cannot exceed 100."],
        },
        odd: {
          type: Number,
          required: [true, "Item odd is required."],
          min: [0, "Weight cannot be negative."],
          max: [100, "Weight percentage cannot exceed 100."],
        },
        status: {
          type: String,
          enum: {
            values: ["available", "sold"],
            message:
              "Status must be one of: draft, active, paused, or archived.",
          },
          default: "available",
        },
        // rangeStart: {
        //   type: Number,
        //   required: [true, "Range start is required."],
        //   min: [0, "Range start cannot be less than 0."],
        //   max: [1, "Range start cannot exceed 1."],
        // },
        // rangeEnd: {
        //   type: Number,
        //   required: [true, "Range end is required."],
        //   min: [0, "Range end cannot be less than 0."],
        //   max: [1, "Range end cannot exceed 1."],
        // },
      },
    ],
  },
  { timestamps: true }
);

const Product =
  mongoose.models.Product || mongoose.model("Product", productSchema);

module.exports = Product;
