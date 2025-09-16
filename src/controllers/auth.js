// controllers/userController.js
const User = require("../models/User");
const Products = require("../models/Product");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const otpGenerator = require("otp-generator");
const nodemailer = require("nodemailer");
const fs = require("fs");
const path = require("path");
const { getUser } = require("../config/getUser");
const Role = require("../models/role");
const { ALL_DATA_ACCESS } = require("../helpers/const");
const { checkIsAdmin } = require("../helpers/userHelper");
const registerUser = async (req, res) => {
  try {
    // Create user in the database
    const request = req.body; // No need to use await here
    const UserCount = await User.countDocuments();
    const existingUser = await User.findOne({ email: request.email });

    if (existingUser) {
      return res.status(400).json({
        UserCount,
        success: false,
        message: "User With This Email Already Exists",
      });
    }

    const otp = otpGenerator.generate(6, {
      upperCaseAlphabets: false,
      specialChars: false,
      lowerCaseAlphabets: false,
      digits: true,
    });
    // Create user with the generated OTP
    const user = await User.create({
      ...request,
      otp,
      role: Boolean(UserCount) ? request.role || "user" : "super admin",
      isVerified: true,
      isActive: true,
    });

    // Generate JWT token
    const token = jwt.sign(
      {
        _id: user._id,
        // email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d",
      }
    );
    // Path to the HTML file
    const htmlFilePath = path.join(
      process.cwd(),
      "src/email-templates",
      "otp.html"
    );

    // Read HTML file content
    let htmlContent = fs.readFileSync(htmlFilePath, "utf8");

    // Replace the placeholder with the OTP and user email
    htmlContent = htmlContent.replace(/<h1>[\s\d]*<\/h1>/g, `<h1>${otp}</h1>`);
    htmlContent = htmlContent.replace(/usingyourmail@gmail\.com/g, user.email);

    // Create nodemailer transporter
    let transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.RECEIVING_EMAIL, // Your Gmail email
        pass: process.env.EMAIL_PASSWORD, // Your Gmail password
      },
    });

    // Email options

    let mailOptions = {
      from: process.env.RECEIVING_EMAIL, // Your Gmail email
      to: user.email, // User's email
      subject: "Verify your email",
      html: htmlContent, // HTML content with OTP and user email
    };

    // Sen EMIL WILL ACTIVE Later
    // Send email
    // await transporter.sendMail(mailOptions);

    res.status(201).json({
      success: true,
      message: "Created User Successfully",
      otp,
      token,
      user,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
      status: 500,
    });
  }
};
const loginUser = async (req, res) => {
  try {
    const { email, password } = await req.body;
    // const user = await User.findOne({ email }).select("+password");

    const user = await User.findOne({
      email: { $regex: new RegExp(`^${email}$`, "i") },
    }).select("+password");

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User Not Found" });
    }

    if (!user.password) {
      return res
        .status(404)
        .json({ success: false, message: "User Password Not Found" });
    }

    const isPasswordMatch = await bcrypt.compare(password, user.password);

    if (!isPasswordMatch) {
      return res
        .status(400)
        .json({ success: false, message: "Incorrect Password" });
    }

    const token = jwt.sign(
      {
        _id: user._id,
        email: user.email,
        role: user.role,
        dataAccess: user.dataAccess || ALL_DATA_ACCESS,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: checkIsAdmin(user.role) ? "1d" : "7d",
      }
    );

    const userAssignedRoles = await Role.findOne({ _id: user?.roleId });

    const products = await Products.aggregate([
      {
        $match: {
          _id: { $in: user.wishlist },
        },
      },
      {
        $lookup: {
          from: "productreviews",
          localField: "productreviews",
          foreignField: "_id",
          as: "productreviews",
        },
      },
      {
        $addFields: {
          averageRating: { $avg: "$productreviews.rating" },
          image: { $arrayElemAt: ["$images", 0] },
        },
      },
      {
        $project: {
          image: { url: "$image.url", blurDataURL: "$image.blurDataURL" },
          name: 1,
          slug: 1,
          colors: 1,
          discount: 1,
          likes: 1,
          priceSale: 1,
          price: 1,
          averageRating: 1,
          vendor: 1,
          shop: 1,
          createdAt: 1,
        },
      },
    ]);

    return res.status(201).json({
      success: true,
      message: "Login Successfully",
      token,
      user: {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        cover: user.cover,
        gender: user.gender,
        phone: user.phone,
        address: user.address,
        city: user.city,
        country: user.country,
        zip: user.zip,
        state: user.state,
        about: user.about,
        role: user.role,
        wishlist: products,
        permissions: userAssignedRoles ? userAssignedRoles.permissions : [],
      },
    });
  } catch (error) {
    return res.status(400).json({ success: false, error: error.message });
  }
};

const forgetPassword = async (req, res) => {
  try {
    const request = await req.body;
    const user = await User.findOne({ email: request.email });

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User Not Found " });
    }

    const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });
    // Constructing the link with the token
    const resetPasswordLink = `${request.origin}/auth/reset-password/${token}`;

    // Path to the HTML file
    const htmlFilePath = path.join(
      process.cwd(),
      "src/email-templates",
      "forget.html"
    );

    // Read HTML file content
    let htmlContent = fs.readFileSync(htmlFilePath, "utf8");

    // Replace the href attribute of the <a> tag with the reset password link
    // htmlContent = htmlContent.replace(
    //   /href="javascript:void\(0\);"/g,
    //   `href="${resetPasswordLink}"`
    // )
    htmlContent = htmlContent.replace(
      /href="javascript:void\(0\);"/g,
      `href="${resetPasswordLink}"`
    );
    // Create nodemailer transporter
    let transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.RECEIVING_EMAIL, // Your Gmail email
        pass: process.env.EMAIL_PASSWORD, // Your Gmail password
      },
    });

    // Email options
    let mailOptions = {
      from: process.env.RECEIVING_EMAIL, // Your Gmail email
      to: user.email, // User's email
      subject: "Verify your email",
      html: htmlContent, // HTML content with OTP and user email
    };

    // Send email synchronously
    await transporter.sendMail(mailOptions);

    return res.status(200).json({
      success: true,
      message: "Forgot Password Email Sent Successfully.",
      token,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = await req.body;

    // Verify the token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(400).json({
        success: false,
        message: "Invalid Or Expired Token. Please Request A New One.",
      });
    }

    // Find the user by ID from the token
    const user = await User.findById(decoded._id).select("password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User Not Found ",
      });
    }
    if (!newPassword || !user.password) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid Data. Both NewPassword And User Password Are Required.",
      });
    }

    // Check if the new password is the same as the old password
    const isSamePassword = await bcrypt.compare(newPassword, user.password);
    if (isSamePassword) {
      return res.status(400).json({
        success: false,
        message: "New Password Must Be Different From The Old Password.",
      });
    }
    // Update the user's password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await User.findByIdAndUpdate(user._id, {
      password: hashedPassword,
    });

    return res.status(201).json({
      success: true,
      message: "Password Updated Successfully.",
      user,
    });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};
const verifyOtp = async (req, res) => {
  try {
    const { otp } = req.body;
    const user = await getUser(req, res, "not-verified");
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User Not Found" });
    }
    // Check if OTP has already been verified
    if (user.isVerified) {
      return res
        .status(400)
        .json({ success: false, message: "OTP Has Already Been Verified" });
    }

    let message = "";
    // Verify the OTP
    if (otp === user.otp) {
      user.isVerified = true;
      await user.save();
      message = "OTP Verified Successfully";
      return res.status(200).json({ success: true, message });
    } else {
      message = "Invalid OTP";
      return res.status(400).json({ success: false, message });
    }
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
};

const resendOtp = async (req, res) => {
  try {
    const user = await getUser(req, res, "not-verified");

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User Not Found" });
    }
    if (user.isVerified) {
      return res.status(400).json({
        success: false,
        message: "OTP Has Already Been Verified",
      });
    }
    // Generate new OTP
    const otp = otpGenerator.generate(6, {
      upperCaseAlphabets: false,
      specialChars: false,
      lowerCaseAlphabets: false,
      digits: true,
    });
    // Update the user's OTP
    await User.findByIdAndUpdate(user._id, {
      otp: otp.toString(),
    });

    // Path to the HTML file
    const htmlFilePath = path.join(
      process.cwd(),
      "src/email-templates",
      "otp.html"
    );

    // Read HTML file content
    let htmlContent = fs.readFileSync(htmlFilePath, "utf8");

    // Replace the placeholder with the OTP and user email
    htmlContent = htmlContent.replace(/<h1>[\s\d]*<\/h1>/g, `<h1>${otp}</h1>`);
    htmlContent = htmlContent.replace(/usingyourmail@gmail\.com/g, user.email);

    // Create nodemailer transporter
    let transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.RECEIVING_EMAIL, // Your Gmail email
        pass: process.env.EMAIL_PASSWORD, // Your Gmail password
      },
    });

    // Email options
    let mailOptions = {
      from: process.env.RECEIVING_EMAIL, // Your Gmail email
      to: user.email, // User's email
      subject: "Verify your email",
      html: htmlContent, // HTML content with OTP and user email
    };

    // Send email
    await transporter.sendMail(mailOptions);

    // Return the response
    return res.status(200).json({
      success: true,
      message: "OTP Resent Successfully",
    });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};
module.exports = {
  registerUser,
  loginUser,
  forgetPassword,
  resetPassword,
  verifyOtp,
  resendOtp,
};
