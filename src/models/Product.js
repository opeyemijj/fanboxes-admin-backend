const mongoose = require("mongoose");
const { Schema } = mongoose;

// Sub-schema for images
const imageSchema = new Schema({
  url: {
    type: String,
    required: [true, "Image URL is required."],
  },
  _id: {
    type: String,
    required: [true, "Image ID is required."],
  },
  blurDataURL: {
    type: String,
    required: [true, "Image blurDataURL is required."],
  },
});

// Sub-schema for items
const itemSchema = new Schema({
  name: {
    type: String,
    required: [true, "Item name is required."],
    maxlength: [100, "Item name cannot exceed 100 characters."],
  },
  slug: {
    type: String,
    required: [true, "Item slug is required."],
  },
  description: {
    type: String,
    required: [true, "Description is required."],
    maxlength: [1000, "Description cannot exceed 1000 characters."],
  },
  images: {
    type: [imageSchema],
    validate: {
      validator: function(arr) {
        return arr.length > 0; // at least one image
      },
      message: "At least one image is required.",
    },
  },
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
    max: [1000, "Weight percentage cannot exceed 100."],
  },
  odd: {
    type: Number,
    required: [true, "Item odd is required."],
    min: [0, "Odd cannot be negative."],
    max: [1000, "Odd percentage cannot exceed 100."],
  },
  status: {
    type: String,
    enum: {
      values: ["available", "sold"],
      message: "Status must be either available or sold.",
    },
    default: "available",
  },
});

const productSchema = new Schema(
  {
    vendor: {
      type: Schema.Types.ObjectId,
      required: [true, "Influencer ID is required."],
    },

    shop: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Shop",
      required: true,
    },
    shopDetails: {
      type: mongoose.Schema.Types.Mixed, // 👈 allows any kind of object/value
      default: {},
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
    categoryDetails: {
      type: mongoose.Schema.Types.Mixed, // 👈 allows any kind of object/value
      default: {},
    },
    subCategory: {
      type: mongoose.Types.ObjectId,
      ref: "SubCategory",
      required: [false, "please provide a sub category id"],
    },
    subCategoryDetails: {
      type: mongoose.Schema.Types.Mixed, // 👈 allows any kind of object/value
      default: {},
    },

    items: {
      type: [itemSchema],
      validate: {
        validator: function(items) {
          const slugs = items.map((i) => i.slug);
          return slugs.length === new Set(slugs).size; // unique slugs
        },
        message: "Duplicate item slugs found within product.",
      },
    },
  },
  { timestamps: true }
);

const Product =
  mongoose.models.Product || mongoose.model("Product", productSchema);

// Pre-save hook to auto-generate item slugs if missing
productSchema.pre("save", function(next) {
  this.items.forEach((item) => {
    if (!item.slug) {
      item.slug = item.name.toLowerCase().replace(/\s+/g, "-");
    }
  });
  next();
});

module.exports = Product;
