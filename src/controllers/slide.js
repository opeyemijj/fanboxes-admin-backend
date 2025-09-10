const HeroCarousel = require("../models/HeroCarousel");

const getSlideByAdmin = async (req, res) => {
  try {
    const slides = await HeroCarousel.find().sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      data: slides,
      message: "Slides fetched successfully",
    });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

module.exports = { getSlideByAdmin };
