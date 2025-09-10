const getBlurDataURL = require("../config/getBlurDataURL");
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

const createSlide = async (req, res) => {
  try {
    const { blob, images, ...body } = req.body;

    const updatedImages = await Promise.all(
      images.map(async (image) => {
        const blurDataURL = await getBlurDataURL(image.url);
        return { ...image, blurDataURL };
      })
    );

    const count = await HeroCarousel.countDocuments({});

    await HeroCarousel.create({
      ...body,
      images: updatedImages,
      slug: `${req.body.title}-${Math.floor(100 + Math.random() * 900)}`,
      order: count + 1,
    });

    res.status(201).json({
      success: true,
      message: "Slide has been successfully created.",
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

module.exports = { getSlideByAdmin, createSlide };
