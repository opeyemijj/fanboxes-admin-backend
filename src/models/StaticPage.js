const mongoose = require("mongoose");

const StaticPageSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    htmlContent: {
      type: String, // will store full HTML markup
      required: true,
    },
    slug: {
      type: String,
      unique: true,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const StaticPage =
  mongoose.models.StaticPage || mongoose.model("StaticPage", StaticPageSchema);
module.exports = StaticPage;
