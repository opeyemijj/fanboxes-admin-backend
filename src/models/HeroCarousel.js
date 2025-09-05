const mongoose = require("mongoose");

const HeroCarouselSchema = new mongoose.Schema(
  {
    image: {
      type: String,
      required: true,
    },
    title: {
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
