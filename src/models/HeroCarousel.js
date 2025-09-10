const mongoose = require("mongoose");
const { Schema } = mongoose;

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

const HeroCarouselSchema = new mongoose.Schema(
  {
    images: {
      type: [imageSchema],
      validate: {
        validator: function(arr) {
          return arr.length > 0; // at least one image
        },
        message: "At least one image is required.",
      },
    },
    title: {
      type: String,
      required: true,
    },
    slug: {
      type: String,
      required: true,
    },
    highlight: {
      type: String,
      required: false,
    },
    description: {
      type: String,
      required: false,
    },
    buttonText: {
      type: String,
      required: false,
    },
    buttonLink: {
      type: String,
      required: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    order: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for ordering and filtering
HeroCarouselSchema.index({ isActive: 1, order: 1 });

const HeroCarousel =
  mongoose.models.HeroCarousel ||
  mongoose.model("HeroCarousel", HeroCarouselSchema);

module.exports = HeroCarousel;
