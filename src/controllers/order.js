const mongoose = require("mongoose");
const Notifications = require("../models/Notification");
const Products = require("../models/Product");
const Orders = require("../models/Order");
const Coupons = require("../models/CouponCode");
const User = require("../models/User");
const Shop = require("../models/Shop");
const nodemailer = require("nodemailer");
const fs = require("fs");
const path = require("path");
const { getVendor, getAdmin } = require("../config/getUser");
const { getUserFromToken } = require("../helpers/userHelper");
const Order = require("../models/Order");
const { ASSIGN_TO_ME } = require("../helpers/const");
const transactionService = require("../services/transactionService");
const { generateReferenceId } = require("../helpers/transactionHelpers");

function isExpired(expirationDate) {
  const currentDateTime = new Date();
  return currentDateTime >= new Date(expirationDate);
}
function generateOrderNumber() {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  let orderNumber = "";

  // Generate a random alphabet character
  orderNumber += alphabet.charAt(Math.floor(Math.random() * alphabet.length));

  // Generate 4 random digits
  for (let i = 0; i < 6; i++) {
    orderNumber += Math.floor(Math.random() * 10);
  }

  return orderNumber;
}
function readHTMLTemplate() {
  const htmlFilePath = path.join(
    process.cwd(),
    "src/email-templates",
    "order.html"
  );
  return fs.readFileSync(htmlFilePath, "utf8");
}

const createOrder = async (req, res) => {
  try {
    const {
      items,
      user,
      currency,
      conversionRate,
      paymentMethod,
      paymentId,
      couponCode,
      totalItems,
      shipping,
      description,
    } = await req.body;

    if (!items || !items.length) {
      return res
        .status(400)
        .json({ success: false, message: "Please Provide Item(s)" });
    }

    const products = await Products.find({
      _id: { $in: items.map((item) => item.pid) },
    });

    const updatedItems = items.map((item) => {
      const product = products.find((p) => p._id.toString() === item.pid);
      const price = product ? product.priceSale : 0;
      const total = price * item.quantity;

      Products.findOneAndUpdate(
        { _id: item.pid, available: { $gte: 0 } },
        { $inc: { available: -item.quantity, sold: item.quantity } },
        { new: true, runValidators: true }
      ).exec();

      return {
        ...item,
        total,
        shop: product?.shop,
        imageUrl: product.images.length > 0 ? product.images[0].url : "",
      };
    });

    const grandTotal = updatedItems.reduce((acc, item) => acc + item.total, 0);
    let discount = 0;

    if (couponCode) {
      const couponData = await Coupons.findOne({ code: couponCode });

      const expired = isExpired(couponData.expire);
      if (expired) {
        return res
          .status(400)
          .json({ success: false, message: "CouponCode Is Expired" });
      }
      // Add the user's email to the usedBy array of the coupon code
      await Coupons.findOneAndUpdate(
        { code: couponCode },
        { $addToSet: { usedBy: user.email } }
      );

      if (couponData && couponData.type === "percent") {
        const percentLess = couponData.discount;
        discount = (percentLess / 100) * grandTotal;
      } else if (couponData) {
        discount = couponData.discount;
      }
    }

    let discountedTotal = grandTotal - discount;
    discountedTotal = discountedTotal || 0;

    const existingUser = await User.findOne({ email: user.email });
    const orderNo = await generateOrderNumber();
    const orderCreated = await Orders.create({
      paymentMethod,
      paymentId,
      discount,
      currency,
      description: description || "",
      conversionRate,
      total: discountedTotal + Number(shipping),
      subTotal: grandTotal,
      shipping,
      items: updatedItems.map(({ image, ...others }) => others),
      user: existingUser ? { ...user, _id: existingUser._id } : user,
      totalItems,
      orderNo,
      status: "pending",
    });

    await Notifications.create({
      opened: false,
      title: `${user.firstName} ${user.lastName} placed an order from ${user.city}.`,
      paymentMethod,
      orderId: orderCreated._id,
      city: user.city,
      cover: user?.cover?.url || "",
    });

    let htmlContent = readHTMLTemplate();

    htmlContent = htmlContent.replace(
      /{{recipientName}}/g,
      `${user.firstName} ${user.lastName}`
    );

    let itemsHtml = "";
    updatedItems.forEach((item) => {
      itemsHtml += `
        <tr style='border-bottom: 1px solid #e4e4e4;'>
          <td style="border-radius: 8px; box-shadow: 0 0 5px rgba(0, 0, 0, 0.1); overflow: hidden; border-spacing: 0; border: 0">
            <img src="${item.imageUrl}" alt="${item.name}" style="width: 62px; height: 62px; object-fit: cover; border-radius: 8px;">
          </td>
          <td style=" padding: 10px; border-spacing: 0; border: 0">${item.name}</td>         
          <td style=" padding: 10px; border-spacing: 0; border: 0">${item.sku}</td>
          <td style=" padding: 10px; border-spacing: 0; border: 0">${item.quantity}</td>
          <td style=" padding: 10px; border-spacing: 0; border: 0">${item.priceSale}</td>
        </tr>
      `;
    });

    htmlContent = htmlContent.replace(/{{items}}/g, itemsHtml);
    htmlContent = htmlContent.replace(/{{grandTotal}}/g, orderCreated.subTotal);
    htmlContent = htmlContent.replace(/{{Shipping}}/g, orderCreated.shipping);
    htmlContent = htmlContent.replace(/{{subTotal}}/g, orderCreated.total);

    let transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.RECEIVING_EMAIL,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    let mailOptions = {
      from: process.env.RECEIVING_EMAIL,
      to: user.email,
      subject: "Your Order Confirmation",
      html: htmlContent,
    };

    await transporter.sendMail(mailOptions);

    return res.status(201).json({
      success: true,
      message: "Order Placed",
      orderId: orderCreated._id,
      data: items.name,
      orderNo,
    });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};
const getOrderById = async (req, res) => {
  try {
    const id = req.params.id;
    const orderGet = await Orders.findById(id); // Remove curly braces around _id: id

    if (!orderGet) {
      return res
        .status(404)
        .json({ success: false, message: "Order Not Found" });
    }

    return res.status(200).json({
      success: true,
      data: orderGet,
    });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};
const getOrdersByAdmin = async (req, res) => {
  const user = getUserFromToken(req);
  const dataAccessType = user.dataAccess;

  console.log("Checking the query");
  try {
    const {
      page: pageQuery,
      limit: limitQuery,
      search: searchQuery,
      status,
      shop,
    } = req.query;

    const limit = parseInt(limitQuery) || 10;
    const page = parseInt(pageQuery) || 1;

    console.log(status, "Checking searchQuery");

    const skip = limit * (page - 1);
    let matchQuery = {};

    // ✅ Apply Assign To Me condition
    if (
      dataAccessType &&
      dataAccessType.toLowerCase() === ASSIGN_TO_ME.toLowerCase()
    ) {
      matchQuery.assignTo = { $in: [user._id] };
    }

    if (shop) {
      const currentShop = await Shop.findOne({ slug: shop }).select(["_id"]);

      matchQuery["items.shop"] = currentShop._id;
    }

    if (status) {
      matchQuery.status = status;
    }

    const totalOrders = await Orders.countDocuments({
      $or: [
        { "user.firstName": { $regex: searchQuery || "", $options: "i" } },
        { "user.lastName": { $regex: searchQuery || "", $options: "i" } },
      ],
      ...matchQuery,
    });

    const orders = await Orders.aggregate([
      {
        $match: {
          ...matchQuery,
          ...(searchQuery
            ? {
                $or: [
                  { name: { $regex: searchQuery, $options: "i" } },
                  { "user.firstName": { $regex: searchQuery, $options: "i" } },
                  { "user.lastName": { $regex: searchQuery, $options: "i" } },
                ],
              }
            : {}),
        },
      },
      { $sort: { createdAt: -1 } },
      { $skip: skip },
      { $limit: limit },
    ]);

    return res.status(200).json({
      success: true,
      data: orders,
      total: totalOrders,
      count: Math.ceil(totalOrders / parseInt(limit)),
      currentPage: page,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const getOneOrderByAdmin = async (req, res) => {
  try {
    const id = req.params.id;
    await Notifications.findOneAndUpdate(
      { orderId: id },
      {
        opened: true,
      },
      {
        new: true,
        runValidators: true,
      }
    );
    const orderGet = await Orders.findById({ _id: id });
    if (!orderGet) {
      return res.status(404).json({
        success: false,
        message: "Order Not Found",
      });
    }

    return res.status(200).json({
      success: true,
      data: orderGet,
    });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};
const updateOrderByAdmin = async (req, res) => {
  try {
    const id = req.params.id;
    const data = await req.body;
    const order = await Orders.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true,
    });
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order Not Found",
      });
    }
    return res.status(200).json({
      success: true,
      message: "Order Updated",
    });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};
const deleteOrderByAdmin = async (req, res) => {
  try {
    const orderId = req.params.id;

    // Find the order to be deleted
    const order = await Orders.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order Not Found",
      });
    }

    // Delete the order from the Orders collection
    await Orders.findByIdAndDelete(orderId);

    // Remove the order ID from the user's order array
    await User.findOneAndUpdate(
      { _id: order.user },
      { $pull: { orders: orderId } }
    );

    // Delete notifications related to the order
    await Notifications.deleteMany({ orderId });

    return res.status(200).json({
      success: true,
      message: "Order Deleted",
    });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

const updateAssignInOrderByAdmin = async (req, res) => {
  try {
    const user = getUserFromToken(req);
    if (!user) {
      return res
        .status(403)
        .json({ success: false, message: "Please Login To Continue" });
    }
    const { slug } = req.params;

    const { selectedUsers, selectedUserDetails } = req.body;

    const targetOrder = await Orders.findOne({ _id: slug });
    if (!targetOrder) {
      return res.status(404).json({
        success: false,
        message: "Box not found. Unable to assign user.",
      });
    }

    const updated = await Orders.updateOne(
      { _id: slug },
      {
        $set: {
          assignTo: selectedUsers || [],
          assignToDetails: selectedUserDetails || [],
          assignedBy: user._id,
          assignedByDetails: {
            _id: user._id,
            firstName: user.firstName,
            lastName: user.lastName,
          },
        },
      },
      { new: true, runValidators: true }
    );

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: "Oops! Something went wrong while assigning users.",
      });
    }

    return res.status(201).json({
      success: true,
      data: updated,
      message: "Great! Your selected users are now assigned.",
    });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

const updateMulitpleAssignInOrderByAdmin = async (req, res) => {
  try {
    const user = getUserFromToken(req);
    if (!user) {
      return res
        .status(403)
        .json({ success: false, message: "Please Login To Continue" });
    }

    const { selectedItems, selectedUsers, selectedUserDetails } = req.body;

    if (!selectedItems?.length || !selectedUsers?.length) {
      return res.status(400).json({
        success: false,
        message: "Please select at least one order and one user.",
      });
    }

    // iterate over all orders
    for (const orderId of selectedItems) {
      const order = await Orders.findById(orderId);
      if (!order) continue; // skip invalid orders

      const assignTo = order.assignTo || [];
      const assignToDetails = order.assignToDetails || [];

      // iterate over each selected user
      selectedUsers.forEach((userId, index) => {
        if (!assignTo.includes(userId)) {
          assignTo.push(userId);
          assignToDetails.push(selectedUserDetails[index]);
        }
      });

      order.assignTo = assignTo;
      order.assignToDetails = assignToDetails;
      order.assignedBy = user._id;
      order.assignedByDetails = {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
      };

      await order.save();
    }

    return res.status(200).json({
      success: true,
      message: "Users assigned successfully to selected orders.",
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message || "Something went wrong.",
    });
  }
};

const updateTrackingInOrderByAdmin = async (req, res) => {
  try {
    const { slug } = req.params;

    const { trackingNumber, ...body } = req.body;

    const targetOrder = await Orders.findOne({ _id: slug });
    if (!targetOrder) {
      return res.status(404).json({
        success: false,
        message: "Order not found. Unable to create Tracking Info.",
      });
    }

    const isTrackingNumberExist = await Orders.findOne({
      "trackingInfo.trackingNumber": trackingNumber?.toLowerCase(),
    });

    if (isTrackingNumberExist && isTrackingNumberExist._id != slug) {
      return res.status(400).json({
        success: false,
        message: "Oops! This tracking number has already been used.",
      });
    }

    const updated = await Orders.findOneAndUpdate(
      { _id: slug },
      {
        trackingInfo: {
          ...body,
          trackingNumber: trackingNumber.toLowerCase(),
        },
      },
      { new: true, runValidators: true }
    );

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: "Oops! Something went wrong while update tracking info.",
      });
    }

    return res.status(201).json({
      success: true,
      data: updated,
      message: "Success! Tracking details have been saved.",
    });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

const updateShippingInOrderByAdmin = async (req, res) => {
  try {
    const { slug } = req.params;

    const { ...body } = req.body;

    const targetOrder = await Orders.findOne({ _id: slug });
    if (!targetOrder) {
      return res.status(404).json({
        success: false,
        message: "Order not found. Unable to add Shipping Info.",
      });
    }

    if (!targetOrder?.trackingInfo) {
      return res.status(400).json({
        success: false,
        message: "Oops! No Tracking info for this order.",
      });
    }

    const updated = await Orders.findOneAndUpdate(
      { _id: slug },
      [
        {
          $set: {
            status: body.status,
            shippingInfo: {
              $concatArrays: [{ $ifNull: ["$shippingInfo", []] }, [body]],
            },
          },
        },
      ],
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: "Oops! Something went wrong while update shippping info.",
      });
    }

    return res.status(201).json({
      success: true,
      data: updated,
      message: "Success! Shipping info has been saved.",
    });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

// Vendor apis
const getOrdersByVendor = async (req, res) => {
  try {
    const vendor = await getVendor(req, res);
    const shop = await Shop.findOne({
      vendor: vendor._id.toString(),
    });
    if (!shop) {
      res.status(404).json({ success: false, message: "Shop not found" });
    }
    const { limit = 10, page = 1, search = "" } = req.query;

    const skip = parseInt(limit) * (parseInt(page) - 1) || 0;
    const pipeline = [
      {
        $match: {
          "items.shop": shop._id, // Assuming 'items.shop' refers to the shop ID associated with the order
          $or: [
            { "user.firstName": { $regex: new RegExp(search, "i") } },
            { "user.lastName": { $regex: new RegExp(search, "i") } },
          ],
        },
      },
    ];
    const totalOrderCount = await Orders.aggregate([
      ...pipeline,
      {
        $count: "totalOrderCount", // Name the count field as "totalOrderCount"
      },
    ]);
    // Access the count from the first element of the result array
    const count =
      totalOrderCount.length > 0 ? totalOrderCount[0].totalOrderCount : 0;

    const orders = await Orders.aggregate([
      ...pipeline,
      {
        $sort: { createdAt: -1 }, // Sort by createdAt in descending order
      },
      {
        $skip: skip, // Skip documents based on pagination
      },
      {
        $limit: parseInt(limit), // Limit the number of documents retrieved
      },
    ]);
    return res.status(200).json({
      success: true,
      data: orders,
      total: count,
      count: Math.ceil(count / parseInt(limit)),
      currentPage: page,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Helper function to generate unique order number
const generateOrderNo = async () => {
  const prefix = "FBX";
  const randomPart = Math.floor(100000 + Math.random() * 900000); // 6-digit random number
  const orderNo = `${prefix}${randomPart}`;

  // Ensure uniqueness
  const existing = await Order.findOne({ orderNo });
  if (existing) {
    return generateOrderNo(); // try again recursively
  }

  return orderNo;
};

// Controller: Create new order with transaction
const createOrder2 = async (req, res) => {
  let session;

  try {
    const {
      shippingFee,
      totalAmountPaid,
      discountApplied,
      status,
      items,
      note,
      // user,
      spinData,
      taxApplied = { percentage: "0%", amount: 0 },
      paymentMethod = "wallet", // Default to wallet
    } = req.body;

    let user = req?.user;

    if (!totalAmountPaid) {
      return res.status(400).json({
        success: false,
        message: "Total amount paid is required.",
      });
    }

    // For now, only process wallet payments
    if (paymentMethod !== "wallet") {
      return res.status(400).json({
        success: false,
        message: "Only wallet payments are currently supported.",
      });
    }

    // Validate user has sufficient balance if using wallet
    if (user?._id) {
      user = await User.findById(user._id);
      if (!user) {
        return res.status(400).json({
          success: false,
          message: "User not found.",
        });
      }

      // Use transaction service to get user balance
      const userBalance = await transactionService.getUserBalance(user._id);

      if (userBalance.availableBalance < totalAmountPaid) {
        return res.status(400).json({
          success: false,
          message: `Insufficient balance. Available: ${userBalance.availableBalance}, Required: ${totalAmountPaid}`,
        });
      }
    } else {
      return res.status(400).json({
        success: false,
        message: "User ID is required for wallet payments.",
      });
    }

    const orderNo = await generateOrderNo();

    // Start session only after validations
    session = await mongoose.startSession();
    session.startTransaction();

    // Create order
    const order = new Order({
      orderNo,
      shippingFee,
      totalAmountPaid,
      discountApplied,
      status: status || "pending",
      items,
      note,
      user,
      spinData,
      paymentMethod,
      taxApplied,
    });

    await order.save({ session });

    // Use the transaction service to create debit transaction
    const metadata = {
      orderType: spinData ? "post-spin" : "direct",
      itemsCount: items.length,
      initiatedBy: {
        firstName: user.firstName,
        lastName: user.lastName,
        id: user._id,
        role: user?.role,
      },
      orderDetails: {
        orderNo,
        totalAmountPaid,
        shippingFee,
        discountApplied,
        items,
      },
    };

    const transactionData = {
      userId: user._id,
      amount: totalAmountPaid,
      transactionType: "debit",
      status: "completed",
      description: `Order payment for #${orderNo}`,
      referenceId: generateReferenceId("ODR"),
      orderId: order._id,
      paymentMethod: "wallet",
      category: "spend",
      source: "order_payment",
      metadata,
      taxAmount: taxApplied.amount,
      taxDetails: taxApplied,
    };

    const transaction = await transactionService.createTransaction(
      transactionData,
      session
    );

    // Add transaction reference to order
    order.transaction = transaction;
    await order.save({ session });

    // Commit transaction
    await session.commitTransaction();
    session.endSession();

    // const populatedOrder = await Order.findById(order._id)
    //   .populate("transaction")
    //   .populate("user._id", "firstName lastName email");

    res.status(201).json({
      success: true,
      message: "Order created successfully",
      data: order,
    });
  } catch (error) {
    // Abort transaction on any error (only if session was started)
    if (session) {
      await session.abortTransaction();
      session.endSession();
    }

    console.error("Order creation error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Something went wrong while creating order",
    });
  }
};

const getOrderHistory = async (req, res) => {
  try {
    const userId = req?.user?._id;
    const { startDate, endDate, page = 1, limit = 20 } = req.query;

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(401).json({
        success: false,
        message: "Please Login to continue",
      });
    }

    // Build filter object
    const filter = { "user._id": userId };

    // Add date range filter if provided
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) {
        filter.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        filter.createdAt.$lte = new Date(endDate);
      }
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const parsedLimit = parseInt(limit);

    // Execute query with pagination and sorting
    const orders = await Order.find(filter)
      .sort({ createdAt: -1 }) // Latest first
      .skip(skip)
      .limit(parsedLimit)
      .lean();

    // Get total count for pagination info
    const total = await Order.countDocuments(filter);
    const totalProcessing = await Order.countDocuments({
      ...filter,
      status: { $in: ["processing", "confirmed"] },
    });
    const totalOnTheWay = await Order.countDocuments({
      ...filter,
      status: { $in: ["shipped", "out-for-delivery"] },
    });
    const totalDelivered = await Order.countDocuments({
      ...filter,
      status: "delivered",
    });

    res.status(200).json({
      success: true,
      data: orders,
      pagination: {
        page: parseInt(page),
        limit: parsedLimit,
        pages: Math.ceil(total / parsedLimit),
        total,
        totalDelivered,
        totalOnTheWay,
        totalProcessing,
      },
    });
  } catch (error) {
    console.error("Error fetching order history:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch order history",
    });
  }
};

module.exports = {
  createOrder,
  getOrderById,
  getOrdersByAdmin,
  getOneOrderByAdmin,
  updateOrderByAdmin,
  deleteOrderByAdmin,
  getOrdersByVendor,
  updateAssignInOrderByAdmin,
  updateMulitpleAssignInOrderByAdmin,
  updateTrackingInOrderByAdmin,
  updateShippingInOrderByAdmin,
  createOrder2,
  getOrderHistory,
};
