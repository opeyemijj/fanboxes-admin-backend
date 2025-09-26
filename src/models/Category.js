const mongoose = require("mongoose");

const CategorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required."],
      maxlength: [100, "Name cannot exceed 100 characters."],
      unique: true,
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
    status: {
      type: String,
      required: true,
    },
    subCategories: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "SubCategory",
      },
    ],
  },
  {
    timestamps: true,
  }
);

const Category =
  mongoose.models.Category || mongoose.model("Category", CategorySchema);
module.exports = Category;
