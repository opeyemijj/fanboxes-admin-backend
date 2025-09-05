const mongoose = require("mongoose");
const HeroCarousel = require("../models/HeroCarousel");

// @desc    Get all hero carousel items
// @route   GET /api/hero-carousel
// @access  Public
const getHeroCarousel = async (req, res) => {
  try {
    const { sort = "order", order = "asc", isActive, search } = req.query;

    // Build query object
    let query = {};

    // Filter by active status
    if (isActive !== undefined) {
      query.isActive = isActive === "true";
    }

    // Search functionality (searches title, highlight, and description)
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { highlight: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    // Define sort options
    const sortOptions = {};
    const validSortFields = ["order", "id", "title", "createdAt", "updatedAt"];
    const validOrders = ["asc", "desc", "ascending", "descending", 1, -1];

    // Validate and set sort field
    const sortField = validSortFields.includes(sort) ? sort : "order";

    // Validate and set sort order
    let sortOrder = 1; // default ascending
    if (order === "desc" || order === "descending" || order === -1) {
      sortOrder = -1;
    } else if (order === "asc" || order === "ascending" || order === 1) {
      sortOrder = 1;
    }

    sortOptions[sortField] = sortOrder;

    // If sorting by order, add secondary sort by createdAt for consistency
    if (sortField === "order") {
      sortOptions.createdAt = 1;
    }

    // Execute query
    const carouselItems = await HeroCarousel.find(query)
      .sort(sortOptions)
      .select("-__v") // Exclude version key
      .lean();

    res.status(200).json({
      success: true,
      count: carouselItems.length,
      data: carouselItems,
      filters: {
        sort: sortField,
        order: sortOrder === 1 ? "asc" : "desc",
        isActive: isActive ? isActive === "true" : undefined,
        search: search || undefined,
      },
    });
  } catch (error) {
    console.error("Error fetching hero carousel:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching carousel items",
      error: process.env.NODE_ENV === "production" ? undefined : error.message,
    });
  }
};

// @desc    Get active hero carousel items (for frontend display)
// @route   GET /api/hero-carousel/active
// @access  Public
const getActiveHeroCarousel = async (req, res) => {
  try {
    const carouselItems = await HeroCarousel.find({ isActive: true })
      .sort({ order: 1, createdAt: 1 })
      .select("-__v -isActive") // Exclude unnecessary fields for frontend
      .lean();

    res.status(200).json({
      success: true,
      count: carouselItems.length,
      data: carouselItems,
    });
  } catch (error) {
    console.error("Error fetching active hero carousel:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching active carousel items",
      error: process.env.NODE_ENV === "production" ? undefined : error.message,
    });
  }
};

// @desc    Get single carousel item by ID
// @route   GET /api/hero-carousel/:id
// @access  Public
const getCarouselItemById = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if ID is a MongoDB ObjectId or numeric ID
    let item;
    if (mongoose.Types.ObjectId.isValid(id)) {
      item = await HeroCarousel.findById(id)
        .select("-__v")
        .lean();
    } else {
      item = await HeroCarousel.findOne({ id: parseInt(id) })
        .select("-__v")
        .lean();
    }

    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Carousel item not found",
      });
    }

    res.status(200).json({
      success: true,
      data: item,
    });
  } catch (error) {
    console.error("Error fetching carousel item:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching carousel item",
      error: process.env.NODE_ENV === "production" ? undefined : error.message,
    });
  }
};

module.exports = {
  getHeroCarousel,
  getActiveHeroCarousel,
  getCarouselItemById,
};
