const getBlurDataURL = require("../config/getBlurDataURL");
const HeroCarousel = require("../models/HeroCarousel");

const getSlidesByAdmin = async (req, res) => {
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
      slug: `${req.body.title?.toLowerCase().replace(/\s+/g, "")}-${Math.floor(
        100 + Math.random() * 900
      )}`,
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

const getSlideByAdmin = async (req, res) => {
  try {
    const { slug } = req.params;
    const slide = await HeroCarousel.findOne({ slug });

    if (!slide) {
      return res.status(400).json({
        success: false,
        message: "We couldn't find the slide you're looking for",
      });
    }

    res.status(201).json({ success: true, data: slide });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

const updateSlideBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    const { blob, images, ...body } = req.body;

    const updatedImages = await Promise.all(
      images.map(async (image) => {
        const blurDataURL = await getBlurDataURL(image.url);
        return { ...image, blurDataURL };
      })
    );

    await HeroCarousel.findOneAndUpdate(
      { slug },
      {
        ...body,
        images: updatedImages,
      },
      { new: true, runValidators: true }
    );

    res.status(201).json({
      success: true,
      message: "Slide details have been successfully updated.",
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const deleteSlideBySlug = async (req, res) => {
  try {
    const { slug } = req.params;

    const slide = await HeroCarousel.findOneAndDelete({ slug });
    if (!slide) {
      return res.status(400).json({
        success: false,
        message: "We couldn't find the slide you're looking for",
      });
    }

    return res.status(201).json({
      success: true,
      message: "Slide has been successfully deleted.",
    });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

module.exports = {
  getSlideByAdmin,
  createSlide,
  getSlidesByAdmin,
  updateSlideBySlug,
  deleteSlideBySlug,
};
