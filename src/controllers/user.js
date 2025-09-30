const mongoose = require("mongoose");
const User = require("../models/User");
const Orders = require("../models/Order");
const bcrypt = require("bcrypt");
const { getUser } = require("../config/getUser");
const Order = require("../models/Order");

const getOneUser = async (req, res) => {
  try {
    const user = await getUser(req, res);

    return res.status(201).json({
      success: true,
      data: user,
    });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

const getUserByAdmin = async (req, res) => {
  try {
    const id = req.params.uid;

    const pageQuery = req.params.page;
    const limitQuery = req.params.limit;

    const limit = parseInt(limitQuery) || 10;
    const page = parseInt(pageQuery) || 1;

    // Calculate skip correctly
    const skip = limit * (page - 1);

    const currentUser = await User.findOne({ _id: id });

    const totalOrders = await Orders.countDocuments({ "user._id": id });

    const orders = await Orders.find({ "user._id": id }, null, {
      skip: skip * (page - 1),
      limit: skip,
    }).sort({ createdAt: -1 });

    if (!currentUser) {
      return res.status(404).json({
        success: false,
        message: "User Not Found",
      });
    }

    return res.status(201).json({
      success: true,
      data: {
        user: currentUser,
        orders,
        count: Math.ceil(totalOrders / limit),
      },
    });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

const updateUser = async (req, res) => {
  const user = await getUser(req, res);

  const uid = user._id.toString();

  try {
    const data = await req.body;
    const profile = await User.findByIdAndUpdate(
      uid,
      { ...data },
      {
        new: true,
        runValidators: true,
      }
    ).select("-password");

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "User Not Found",
      });
    }

    return res.status(200).json({
      success: true,
      data: profile,
    });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

const getInvoice = async (req, res) => {
  try {
    const user = await getUser(req, res);
    const { limit = 10, page = 1 } = req.query;

    const skip = parseInt(limit) * (parseInt(page) - 1) || 0;
    const totalOrderCount = await Orders.countDocuments();

    const orders = await Orders.find({ "user.email": user.email }, null, {
      skip: skip,
      limit: parseInt(limit),
    }).sort({
      createdAt: -1,
    });

    return res.status(200).json({
      success: true,
      data: orders,
      count: Math.ceil(totalOrderCount / parseInt(limit)),
    });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

const changePassword = async (req, res) => {
  try {
    const user = await getUser(req, res);
    const uid = user._id.toString();
    const { password, newPassword, confirmPassword } = await req.body;

    // Find the user by ID
    const userWithPassword = await User.findById(uid).select("password");

    if (!userWithPassword) {
      return res
        .status(404)
        .json({ success: false, message: "User Not Found" });
    }

    // Check if the old password matches the stored hashed password
    const passwordMatch = await bcrypt.compare(
      password,
      userWithPassword.password
    );

    if (passwordMatch) {
      // Check if the new password and confirm password match
      if (newPassword !== confirmPassword) {
        return res
          .status(400)
          .json({ success: false, message: "New Password Mismatch" });
      }
      if (password === newPassword) {
        return NextResponse.json(
          {
            success: false,
            message: "Please Enter A New Password ",
          },
          { status: 400 }
        );
      }
      // Hash the new password before updating
      const hashedNewPassword = await bcrypt.hash(newPassword, 10);

      // Update the password with the hashed version
      const updatedUser = await User.findByIdAndUpdate(
        uid,
        { password: hashedNewPassword },
        {
          new: true,
          runValidators: true,
        }
      );

      if (!updatedUser) {
        return res
          .status(404)
          .json({ success: false, message: "User Not Found" });
      }

      return res
        .status(201)
        .json({ success: true, message: "Password Changed" });
    } else {
      return res
        .status(400)
        .json({ success: false, message: "Old Password Incorrect" });
    }
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

const updateShippingAddress = async (req, res) => {
  try {
    const allowedFields = ["address", "city", "zip", "country", "state"];
    const updates = {};

    // ✅ Validate only provided fields
    for (const field of allowedFields) {
      if (field in req.body) {
        const value = req.body[field];
        if (!value || !value.toString().trim()) {
          return res.status(400).json({
            success: false,
            message: `${field.charAt(0).toUpperCase() +
              field.slice(1)} is required.`,
            type: "validationError",
          });
        }
        updates[`shippingAddress.${field}`] = value.toString().trim();
      }
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: "No valid fields provided for update.",
        type: "validationError",
      });
    }

    // ✅ Update only specified fields
    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updates },
      { new: true, runValidators: true }
    ).select("-password");

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
        type: "notFoundError",
      });
    }

    res.status(200).json({
      success: true,
      message: "Shipping address updated successfully.",
      data: updatedUser.shippingAddress,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message || "Server error",
      type: "serverError",
    });
  }
};

/**
 * Delete user account and all associated data
 * @route DELETE /api/users/account
 * @access Private
 */
const deleteAccount = async (req, res) => {
  let session;

  try {
    const { password } = req.body;
    const userId = req.user._id;

    // Validate password
    if (!password) {
      return res.status(400).json({
        success: false,
        message: "Password is required to confirm account deletion.",
      });
    }

    // Start session for transaction
    session = await mongoose.startSession();
    session.startTransaction();

    // Find user with password selected for verification
    const user = await User.findById(userId)
      .select("+password")
      .session(session);
    if (!user) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message:
          "Invalid password. Please enter your correct password to delete your account.",
      });
    }

    // Store user email for logging before deletion
    const userEmail = user.email;

    // Step 1: Delete all orders associated with the user
    // const deleteOrdersResult = await Order.deleteMany(
    //   { "user._id": userId },
    //   { session }
    // );

    // console.log(`Deleted ${deleteOrdersResult.deletedCount} orders for user ${userEmail}`);

    // Step 2: Delete associated transactions (if you have a separate Transaction model)
    // If transactions are embedded in orders, this step might not be needed
    /*
    const Transaction = require("../models/Transaction");
    const deleteTransactionsResult = await Transaction.deleteMany(
      { userId: userId },
      { session }
    );
    console.log(`Deleted ${deleteTransactionsResult.deletedCount} transactions for user ${userEmail}`);
    */

    //  Delete the user account
    const deleteUserResult = await User.deleteOne({ _id: userId }, { session });

    if (deleteUserResult.deletedCount === 0) {
      await session.abortTransaction();
      session.endSession();
      return res.status(500).json({
        success: false,
        message: "Failed to delete user account.",
      });
    }

    // Commit the transaction
    await session.commitTransaction();
    session.endSession();

    console.log(`Successfully deleted account for user: ${userEmail}`);

    // Return success response
    return res.status(200).json({
      success: true,
      message: "Account and all associated data have been permanently deleted.",
      data: {
        // deletedOrders: deleteOrdersResult.deletedCount,
        // deletedTransactions: deleteTransactionsResult?.deletedCount || 0,
        userEmail: userEmail,
      },
    });
  } catch (error) {
    // Abort transaction on any error
    if (session) {
      await session.abortTransaction();
      session.endSession();
    }

    console.error("Account deletion error:", error);

    // Handle specific error types
    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID.",
      });
    }

    return res.status(500).json({
      success: false,
      message:
        "An error occurred while deleting your account. Please try again.",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

module.exports = {
  getOneUser,
  updateUser,
  getInvoice,
  changePassword,
  getUserByAdmin,
  updateShippingAddress,
  deleteAccount,
};
