const mongoose = require("mongoose");

/* Define the interface for the SubCategory document */
const SubCategorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required."],
      maxlength: [100, "Name cannot exceed 100 characters."],
    },

    description: {
      type: String,
      maxlength: [500, "Description cannot exceed 500 characters."],
    },

    slug: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      required: true,
    },
    parentCategory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },
  },
  { timestamps: true }
);

const SubCategory =
  mongoose.models.SubCategory ||
  mongoose.model("SubCategory", SubCategorySchema);
module.exports = SubCategory;
