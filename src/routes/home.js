const express = require("express");
const router = express.Router();
const homeController = require("../controllers/home");
const heroCarouselController = require("../controllers/heroCarousel");

// Hero Carousel Route
router.get("/home/hero-carousel", heroCarouselController.getHeroCarousel);
router.get(
  "/home/hero-carousel/active",
  heroCarouselController.getActiveHeroCarousel
);

// Other Home Routes
router.get("/home/categories", homeController.getCategories);
router.get("/home/products/top", homeController.getTopRatedProducts);
router.get("/home/products/best-selling", homeController.getBestSellerProducts);
router.get("/home/products/featured", homeController.getFeaturedProducts);
router.get("/home/brands", homeController.getBrands);

module.exports = router;
