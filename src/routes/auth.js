const express = require("express");
const router = express.Router();
const authController = require("../controllers/auth");
const verifyToken = require("../config/jwt");

router.post("/auth/register", authController.registerUser);

router.post("/auth/login", authController.loginUser);

router.post("/auth/forget-password", authController.forgetPassword);

router.post("/auth/reset-password", authController.resetPassword);

router.post("/auth/verify-otp", verifyToken, authController.verifyOtp);

router.post("/auth/resend-otp", verifyToken, authController.resendOtp);

// router.get("/profile", verifyToken, userController.getProfile);

router.get("/auth/verify-token", verifyToken, (req, res) => {
  try {
    res.json({
      success: true,
      message: "Token is valid",
      user: req.user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Internal server error during verification",
    });
  }
});

module.exports = router;
