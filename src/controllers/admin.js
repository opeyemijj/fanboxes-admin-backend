const User = require("../models/User");
const Order = require("../models/Order");
const Role = require("../models/role");
const otpGenerator = require("otp-generator");

const getUsersByAdmin = async (req, res) => {
  try {
    const { limit = 10, page = 1, search = "", userType } = req.query;

    const skip = parseInt(limit) * (parseInt(page) - 1) || 0;

    // Constructing query based on search input
    const nameQuery = search
      ? {
          $or: [
            { firstName: { $regex: search, $options: "i" } },
            { lastName: { $regex: search, $options: "i" } },
            { email: { $regex: search, $options: "i" } },
          ],
        }
      : {};

    let query = { ...nameQuery };

    if (userType) {
      if (userType === "admin") {
        // Exclude vendor and user roles
        query.role = { $nin: ["vendor", "user", "influencer"] };
      } else {
        // Exact match for role
        query.role = userType;
      }
    }

    const totalUserCounts = await User.countDocuments(query);

    const users = await User.find(query, null, {
      skip: skip,
      limit: parseInt(limit),
    }).sort({
      createdAt: -1,
    });

    return res.status(200).json({
      success: true,
      data: users,
      count: Math.ceil(totalUserCounts / parseInt(limit)),
    });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

const getAssignUsersByAdmin = async (req, res) => {
  console.log("Come here to get the user");
  try {
    const { limit = 1000, page = 1, search = "", userType } = req.query;

    const skip = parseInt(limit) * (parseInt(page) - 1) || 0;

    // Constructing query based on search input
    const nameQuery = search
      ? {
          $or: [
            { firstName: { $regex: search, $options: "i" } },
            { lastName: { $regex: search, $options: "i" } },
            { email: { $regex: search, $options: "i" } },
          ],
        }
      : {};

    let query = { ...nameQuery, isActive: true };

    if (userType) {
      if (userType === "admin") {
        // Exclude vendor and user roles
        query.role = { $nin: ["vendor", "user", "influencer"] };
      } else {
        // Exact match for role
        query.role = userType;
      }
    }

    const totalUserCounts = await User.countDocuments(query);

    const users = await User.find(query, null, {
      skip: skip,
      limit: parseInt(limit),
    }).sort({
      createdAt: -1,
    });

    return res.status(200).json({
      success: true,
      data: users,
      count: Math.ceil(totalUserCounts / parseInt(limit)),
    });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

const createAdminUserByAdmin = async (req, res) => {
  try {
    const requestData = req.body;
    const otp = otpGenerator.generate(6, {
      upperCaseAlphabets: false,
      specialChars: false,
      lowerCaseAlphabets: false,
      digits: true,
    });

    const assignedRole = await Role.findOne({ _id: requestData.roleId });
    if (!assignedRole) {
      return res.status(404).json({
        success: false,
        message: "Sorry we don't find your assigned role",
      });
    }

    const tempRoleDetails = {
      role: assignedRole.role,
      permissions: assignedRole.permissions,
    };

    const newAdminUser = await User.create({
      firstName: requestData.firstName,
      lastName: requestData.lastName,
      gender: requestData.gender,
      phone: requestData.phone,
      email: requestData.email,
      otp,
      role: assignedRole?.role?.toLowerCase(),
      roleId: assignedRole?._id,
      roleDetails: tempRoleDetails,
      password: requestData?.password,
      isActive: true,
    });

    return res.status(201).json({
      success: true,
      message: "User has been created successfully",
    });
  } catch (error) {
    console.error("Error saving permissions:", error);
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

const getAdminVendorByAdmin = async (req, res) => {
  try {
    const users = await User.find({
      role: { $regex: /(admin|vendor)/i }, // i = case-insensitive
    });

    return res.status(200).json({
      success: true,
      data: users,
    });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

const updateUserActiveInactiveByAdmin = async (req, res) => {
  try {
    const { slug } = req.params;
    const { isActive } = req.body;

    const updated = await User.findOneAndUpdate(
      { _id: slug },
      { $set: { isActive: isActive } },
      { new: true, runValidators: true }
    );

    if (!updated) {
      return res
        .status(404)
        .json({ success: false, message: "User not found to update status" });
    }

    return res.status(201).json({
      success: true,
      data: updated,
      message: isActive
        ? "User has been activated successfully."
        : "User is inactive now",
    });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

const updateAdminByAdmin = async (req, res) => {
  try {
    const { slug } = req.params;

    const requestData = req.body;

    const assignedRole = await Role.findOne({ _id: requestData.roleId });
    if (!assignedRole) {
      return res.status(404).json({
        success: false,
        message: "Sorry we don't find your assigned role",
      });
    }

    const tempRoleDetails = {
      role: assignedRole.role,
      permissions: assignedRole.permissions,
    };

    const updated = await User.findOneAndUpdate(
      { _id: slug },
      { ...requestData, role: assignedRole.role, roleDetails: tempRoleDetails },
      { new: true, runValidators: true }
    );

    if (!updated) {
      return res
        .status(404)
        .json({ success: false, message: "User not found to update status" });
    }

    return res.status(201).json({
      success: true,
      data: updated,
      message: "User has been updated successfully",
    });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

const getOrdersByUid = async (req, res) => {
  try {
    const id = req.params.id;
    const { limit = 10, page = 1 } = req.query;

    const skip = parseInt(limit) * (parseInt(page) - 1) || 0;

    const currentUser = await User.findById(id);

    const totalOrders = await Order.countDocuments({ "user._id": id });

    const orders = await Order.find({ "user._id": id }, null, {
      skip: skip,
      limit: parseInt(limit),
    }).sort({
      createdAt: -1,
    });

    if (!currentUser) {
      return res
        .status(404)
        .json({ success: false, message: "User Not Found" });
    }

    return res.status(200).json({
      success: true,
      user: currentUser,
      orders,
      count: Math.ceil(totalOrders / parseInt(limit)),
    });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

const UpdateRoleByAdmin = async (req, res) => {
  try {
    const id = req.params.id;
    const userToUpdate = await User.findById(id);

    if (!userToUpdate) {
      return res
        .status(404)
        .json({ success: false, message: "User Not Found." });
    }

    // Check if the user to update is a super admin
    if (userToUpdate.role === "super admin") {
      return res.status(403).json({
        success: false,
        message: "Cannot Change The Role Of A Super Admin.",
      });
    }

    // Toggle the user's role
    const newRole = userToUpdate.role === "user" ? "admin" : "user";

    // Update the user's role
    const updatedUser = await User.findByIdAndUpdate(
      id,
      { role: newRole },
      { new: true, runValidators: true }
    );

    return res.status(200).json({
      success: true,
      message: `${updatedUser.firstName} Is Now ${newRole}.`,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
module.exports = {
  getUsersByAdmin,
  getOrdersByUid,
  UpdateRoleByAdmin,
  getAdminVendorByAdmin,
  updateUserActiveInactiveByAdmin,
  createAdminUserByAdmin,
  updateAdminByAdmin,
  getAssignUsersByAdmin,
};
