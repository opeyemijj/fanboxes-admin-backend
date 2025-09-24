const Shop = require("../models/Shop");
const User = require("../models/User");
const Product = require("../models/Product");
const Orders = require("../models/Order");
const Payment = require("../models/Payment");
const otpGenerator = require("otp-generator");

const nodemailer = require("nodemailer");
const _ = require("lodash");
const getBlurDataURL = require("../config/getBlurDataURL");
const { getVendor, getAdmin, getUser } = require("../config/getUser");
const { singleFileDelete } = require("../config/uploader");
const sendEmail = require("../config/mailer");
const getWelcomeEmailContent = require("../email-templates/newVendorAccount");
const { splitUserName, getUserFromToken } = require("../helpers/userHelper");
const Category = require("../models/Category");
const SubCategory = require("../models/SubCategory");
const { ASSIGN_TO_ME } = require("../helpers/const");
// Admin apis
const getShopsByAdmin = async (req, res) => {
  console.log("Come here to get the influeners");
  const user = getUserFromToken(req);
  const dataAccessType = user.dataAccess;

  try {
    const { limit = 10, page = 1, search = "" } = req.query;

    const parsedLimit = parseInt(limit);
    const parsedPage = parseInt(page);
    const skip = (parsedPage - 1) * parsedLimit;

    let matchQuery = {};

    // ✅ Apply Assign To Me condition
    if (
      dataAccessType &&
      dataAccessType.toLowerCase() === ASSIGN_TO_ME.toLowerCase()
    ) {
      matchQuery.assignTo = { $in: [user._id] };
    }

    // ✅ Apply search condition if given
    if (search && search.trim() !== "") {
      matchQuery.title = { $regex: search, $options: "i" };
    }

    const totalShop = await Shop.countDocuments(matchQuery);

    const shops = await Shop.find(matchQuery, null, {
      skip,
      limit: parsedLimit,
    })
      .select([
        "vendor",
        "logo",
        "slug",
        "status",
        "products",
        "title",
        "approvedAt",
        "approved",
        "isBanned",
        "isActive",
        "instagramLink",
        "visitedCount",
        "categoryDetails",
        "assignTo", // keep it if you want to debug
      ])
      .populate({
        path: "vendor",
        select: ["firstName", "lastName", "cover"],
      })
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      data: shops,
      count: Math.ceil(totalShop / parsedLimit),
      currentPage: parsedPage,
      total: totalShop,
    });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

const createShopByAdmin = async (req, res) => {
  let newVendorUser = null;
  try {
    const { logo, cover, ...others } = req.body;
    let requestData = req.body;
    requestData.paymentInfo = {
      ...requestData.paymentInfo,
      holderName: requestData.title,
    };

    const logoBlurDataURL = await getBlurDataURL(logo.url);
    const coverBlurDataURL = await getBlurDataURL(cover.url);

    // console.log(req.body, "Check the req bod");

    const newUserName = splitUserName(requestData?.paymentInfo?.holderName);
    const newUserEmail = requestData?.paymentInfo?.holderEmail;
    const newUserPhone = requestData?.phone;
    const newUserGender = "male";

    const existingUser = await User.findOne({ email: newUserEmail });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "An account with this email already exists.",
      });
    }

    const otp = otpGenerator.generate(6, {
      upperCaseAlphabets: false,
      specialChars: false,
      lowerCaseAlphabets: false,
      digits: true,
    });

    const newUserPassword = `${newUserName.firstName}2025${Math.random()
      .toString(36)
      .substring(2, 7)}`;

    const category = await Category.findOne({
      _id: req.body.category,
    });

    let subCategory = null;
    let tempSubCategoryDetails = null;

    if (req.body.subCategory?.length > 10) {
      subCategory = await SubCategory.findOne({
        _id: req.body.subCategory,
      });
    }

    const tempCategoryDetails = {
      _id: category._id,
      name: category.name,
      slug: category.slug,
      metaTitle: category.metaTitle,
      cover: category.cover,
    };

    if (subCategory) {
      tempSubCategoryDetails = {
        _id: subCategory._id,
        name: subCategory.name,
        slug: subCategory.slug,
        metaTitle: subCategory.metaTitle,
        cover: subCategory.cover,
      };
    }

    newVendorUser = await User.create({
      firstName: newUserName.firstName,
      lastName: newUserName.lastName,
      gender: newUserGender,
      phone: newUserPhone,
      email: newUserEmail.toLowerCase(),
      otp,
      role: "vendor",
      password: newUserPassword,
    });

    const tempVendorDetails = {
      _id: newVendorUser._id,
      firstName: newVendorUser.firstName,
      lastName: newVendorUser.lastName,
      gender: newVendorUser.gender,
    };

    // const htmlContent = getWelcomeEmailContent(
    //   newUserEmail,
    //   newUserPassword,
    //   otp
    // );

    // try {
    //   await sendEmail({
    //     to: "a.shahadath@shoutty.app",
    //     subject: "Welcome to Fanbox! 🎉 Your account is ready",
    //     html: htmlContent,
    //   });
    // } catch (err) {
    //   console.log("Failed email sending: ", err);
    // }

    // return res.status(400).json({ success: false, message: "Testing" });

    const shop = await Shop.create({
      vendor: newVendorUser._id,
      vendorDetails: tempVendorDetails,

      ...others,
      slug: `${req.body?.title?.toLowerCase().replace(/\s+/g, "")}-${Math.floor(
        100 + Math.random() * 900
      )}`,
      logo: {
        ...logo,
        blurDataURL: logoBlurDataURL,
      },
      cover: {
        ...cover,
        blurDataURL: coverBlurDataURL,
      },
      paymentInfo: {
        ...requestData.paymentInfo,
        holderName: requestData.title,
      },
      status: "draft",
      categoryDetails: tempCategoryDetails,
      subCategoryDetails: subCategory ? tempSubCategoryDetails : null,
      subCategory: subCategory ? req.body.subCategory : null,
    });

    return res.status(200).json({
      success: true,
      data: shop,
      message: "Influencer has been successfully created.",
    });
  } catch (error) {
    try {
      if (newVendorUser) {
        await User.deleteOne({ _id: newVendorUser._id });
      }
    } catch (e) {
      return res.status(400).json({ success: false, message: e.message });
    }

    return res.status(400).json({ success: false, message: error.message });
  }
};

async function getTotalEarningsByShopId(shopId) {
  // const result = await Payment.find({ shop: shopId });
  const pipeline = [
    {
      $match: {
        shop: shopId,
        status: "paid", // Filter by shop ID and paid status
      },
    },
    {
      $group: {
        _id: null, // Group all documents (optional, set shop ID for grouping by shop)
        totalEarnings: { $sum: "$totalIncome" }, // Calculate sum of totalIncome for paid payments
        totalCommission: { $sum: "$totalCommission" }, // Calculate sum of totalIncome for paid payments
      },
    },
  ];

  const result = await Payment.aggregate(pipeline);

  if (result.length > 0) {
    return result[0]; // Return total earnings from paid payments
  } else {
    return {
      totalEarnings: 0,
      totalCommission: 0,
    }; // Return 0 if no paid payments found for the shop
  }
}

const getOneShopByAdmin = async (req, res) => {
  try {
    // const admin = await getAdmin(req, res);
    const { slug } = req.params;
    const shop = await Shop.findOne({ slug: slug });
    if (!shop) {
      return res
        .status(404)
        .json({ message: "We couldn’t find the shop you're looking for." });
    }
    const { totalCommission, totalEarnings } = await getTotalEarningsByShopId(
      shop._id
    );
    // stats
    const totalProducts = await Product.countDocuments({
      shop: shop._id,
    });
    const totalOrders = await Orders.countDocuments({
      "items.shop": shop._id,
    });

    return res.status(200).json({
      success: true,
      data: shop,
      totalOrders,
      totalEarnings,
      totalCommission,
      totalProducts,
    });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

const updateOneShopByAdmin = async (req, res) => {
  try {
    const { slug } = req.params;
    const shop = await Shop.findOne({ slug });

    // Check if the shop exists
    if (!shop) {
      return res.status(404).json({
        success: false,
        message:
          "The shop could not be found. Please check the name or try again.",
      });
    }

    const {
      slug: skippngSlug,
      logo,
      cover,
      status,
      paymentInfo,
      ...others
    } = req.body;
    const logoBlurDataURL = await getBlurDataURL(logo.url);
    const coverBlurDataURL = await getBlurDataURL(cover.url);

    const category = await Category.findOne({
      _id: req.body.category,
    });

    let subCategory = null;
    let tempSubCategoryDetails = null;

    if (req.body.subCategory?.length > 10) {
      subCategory = await SubCategory.findOne({
        _id: req.body.subCategory,
      });
    }

    const tempCategoryDetails = {
      _id: category._id,
      name: category.name,
      slug: category.slug,
      metaTitle: category.metaTitle,
      cover: category.cover,
    };

    if (subCategory) {
      tempSubCategoryDetails = {
        _id: subCategory._id,
        name: subCategory.name,
        slug: subCategory.slug,
        metaTitle: subCategory.metaTitle,
        cover: subCategory.cover,
      };
    }

    const updatedShop = await Shop.findOneAndUpdate(
      { slug: slug },
      {
        ...others,
        isActive: false,
        logo: { ...logo, blurDataURL: logoBlurDataURL },
        cover: { ...cover, blurDataURL: coverBlurDataURL },
        paymentInfo: shop.paymentInfo,
        status: status, // Update shop status
        categoryDetails: tempCategoryDetails,
        subCategoryDetails: subCategory ? tempSubCategoryDetails : null,
        subCategory: subCategory ? req.body.subCategory : null,
      },
      { new: true, runValidators: true }
    );

    // Find the vendor associated with the updated shop
    const vendor = await User.findById(updatedShop.vendor);

    // Email message
    let message;
    if (status === "approved") {
      message = "Your shop is now approved.";
    } else {
      message = "Your shop is not approved.";
    }

    // Send email

    return res.status(200).json({
      success: true,
      message: "Shop Information Successfully Updated",
    });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

const updateShopStatusByAdmin = async (req, res) => {
  try {
    const { sid } = req.params;
    const { status } = req.body;
    const updateStatus = await Shop.findOneAndUpdate(
      {
        _id: sid,
      },
      {
        status,
      },
      {
        new: true,
        runValidators: true,
      }
    );

    return res.status(200).json({
      success: true,
      message: "Status Successfully Updated",
    });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

const updateShopActiveInactiveByAdmin = async (req, res) => {
  try {
    const { slug } = req.params;
    const { isActive } = req.body;

    const updated = await Shop.findOneAndUpdate(
      { slug: slug },
      { $set: { isActive: isActive, status: isActive ? "approved" : "draft" } },
      { new: true, runValidators: true }
    );

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: "Influencer not found to update status",
      });
    }

    return res.status(201).json({
      success: true,
      data: updated,
      message: isActive
        ? "Influencer has been activated successfully."
        : "Influencer is inactive now",
    });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

const bannedShopByAdmin = async (req, res) => {
  try {
    const { slug } = req.params;
    const { isBanned } = req.body;

    const updated = await Shop.findOneAndUpdate(
      { slug: slug },
      { $set: { isBanned: isBanned } },
      { new: true, runValidators: true }
    );

    if (!updated) {
      return res
        .status(404)
        .json({ success: false, message: "Influencer not found to Banned" });
    }

    return res.status(201).json({
      success: true,
      data: updated,
      message: isBanned
        ? "Influencer has been banned successfully."
        : "Influencer has been Unbanned successfully.",
    });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

const updateAssignInShopByAdmin = async (req, res) => {
  try {
    const user = getUserFromToken(req);
    if (!user) {
      return res
        .status(401)
        .json({ success: false, message: "Please Login To Continue" });
    }
    const { slug } = req.params;

    const { selectedUsers, selectedUserDetails } = req.body;

    const targetBox = await Shop.findOne({ slug: slug });
    if (!targetBox) {
      return res.status(404).json({
        success: false,
        message: "Influencer not found. Unable to assign user.",
      });
    }

    const updated = await Shop.findOneAndUpdate(
      { slug: slug },
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

const deleteOneShopByAdmin = async (req, res) => {
  try {
    const { slug } = req.params;
    // const shop = await Shop.findOne({ slug, vendor: admin._id });
    const shop = await Shop.findOne({ slug });
    if (!shop) {
      return res.status(404).json({
        message:
          "We couldn't find the shop. Please try again or check the name.",
      });
    }
    await singleFileDelete(shop.cover._id);
    await singleFileDelete(shop.logo._id);

    // delete related products
    if (shop.products && shop.products.length > 0) {
      try {
        await Product.deleteMany({ _id: { $in: shop.products } });
        // assuming `products` is an array of product ObjectIds or their string representation
      } catch (e) {
        console.log("Failed to delete products: ", e);
      }
    }

    await Shop.deleteOne({ slug }); // Corrected to pass an object to deleteOne method

    // delete related user of this shop
    try {
      if (shop?.vendorDetails) {
        await User.deleteOne({ _id: shop?.vendorDetails._id });
      }
    } catch (e) {
      console.log(e, "Failed to delete user");
      // return res.status(400).json({ success: false, message: e.message });
    }
    return res.status(200).json({
      success: true,
      message: "Influencer has been successfully deleted.", // Corrected message typo
    });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};
// Vendor apis
const createShopByVendor = async (req, res) => {
  try {
    const vendor = await getVendor(req, res);
    const { logo, cover, ...others } = req.body;
    const logoBlurDataURL = await getBlurDataURL(logo?.url);
    const coverBlurDataURL = await getBlurDataURL(cover?.url);

    const tempVendorDetails = {
      _id: vendor._id,
      firstName: vendor.firstName,
      lastName: vendor.lastName,
      gender: vendor.gender,
    };

    const shop = await Shop.create({
      vendor: vendor._id.toString(),
      vendorDetails: tempVendorDetails,
      ...others,
      logo: {
        ...logo,
        blurDataURL: logoBlurDataURL,
      },
      cover: {
        ...cover,
        blurDataURL: coverBlurDataURL,
      },
      status: "draft",
    });

    return res.status(200).json({
      success: true,
      data: shop,
      message: "Shop has been successfully created.",
    });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};
const createShopByUser = async (req, res) => {
  try {
    const user = await getUser(req, res);
    const { logo, cover, ...others } = req.body;
    const logoBlurDataURL = await getBlurDataURL(logo?.url);
    const coverBlurDataURL = await getBlurDataURL(cover?.url);
    // const shop = user?.shop ? await Shop.findById(user?.shop.toString()) : null;
    // if (shop) {
    //   await Shop.findByIdAndUpdate(shop._id, {
    //     ...others,
    //     logo: {
    //       ...logo,
    //       blurDataURL: logoBlurDataURL,
    //     },
    //     cover: {
    //       ...cover,
    //       blurDataURL: coverBlurDataURL,
    //     },
    //     status: 'pending',
    //   });
    //   return res.status(200).json({
    //     success: true,
    //     message: 'Shop updated',
    //   });
    // }
    const createdShop = await Shop.create({
      vendor: user._id.toString(),
      ...others,
      logo: {
        ...logo,
        blurDataURL: logoBlurDataURL,
      },
      cover: {
        ...cover,
        blurDataURL: coverBlurDataURL,
      },
      status: "pending",
    });
    await User.findByIdAndUpdate(user._id.toString(), {
      shop: createdShop._id.toString(),
      role: "vendor",
    });

    return res.status(200).json({
      success: true,
      message: "Shop created",
    });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

const getOneShopByVendor = async (req, res) => {
  try {
    const vendor = await getVendor(req, res);

    const shop = await Shop.findOne({ vendor: vendor._id });
    if (!shop) {
      return res.status(404).json({
        message:
          "We couldn't locate the shop. Please double-check the name or try again.",
      });
    }
    return res.status(200).json({
      success: true,
      data: shop,
    });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};
const getShopByUser = async (req, res) => {
  try {
    const user = await getUser(req, res);

    const shop = await Shop.findOne({ vendor: user._id });
    if (!shop) {
      return res.status(200).json({ success: false, data: null });
    }
    return res.status(200).json({
      success: true,
      data: shop,
    });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

const updateOneShopByVendor = async (req, res) => {
  try {
    const { slug } = req.params;
    const vendor = await getVendor(req, res);
    const { logo, cover, ...others } = req.body;
    const logoBlurDataURL = await getBlurDataURL(logo?.url);
    const coverBlurDataURL = await getBlurDataURL(cover?.url);
    const updateShop = await Shop.findOneAndUpdate(
      {
        slug: slug,
        vendor: vendor._id.toString(),
      },
      {
        ...others,
        logo: {
          ...logo,
          blurDataURL: logoBlurDataURL,
        },
        cover: {
          ...cover,
          blurDataURL: coverBlurDataURL,
        },
      },
      {
        new: true,
        runValidators: true,
      }
    );

    return res.status(200).json({
      success: true,
      message: "Shop information has been successfully updated.",
      data: updateShop,
    });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};
const deleteOneShopByVendor = async (req, res) => {
  try {
    const { slug } = req.params;
    const vendor = await getVendor(req, res);
    const shop = await Shop.findOne({ slug: slug, vendor: vendor._id });
    if (!shop) {
      return res.status(404).json({
        message:
          "We couldn't find the shop you're looking for. Please verify the details or try again later.",
      });
    }
    // const dataaa = await singleFileDelete(shop?.logo?._id,shop?.cover?._id);
    await Shop.deleteOne({ _id: slug, vendor: vendor._id }); // Corrected to pass an object to deleteOne method
    return res.status(200).json({
      success: true,
      message: "Shop Deleted Successfully", // Corrected message typo
    });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

//User apis
const getShops = async (req, res) => {
  try {
    console.log("get shops called...");
    let { page, limit, paginated } = req.query;
    page = parseInt(page) || 1; // default page to 1 if not provided
    limit = parseInt(limit) || null; // default limit to null if not provided

    // Check if paginated query parameter is explicitly set to false
    const shouldPaginate = paginated !== "false";

    let shopsQuery = Shop.find({
      $or: [{ isBanned: false }, { isBanned: { $exists: false } }],
      isActive: true,
      status: "approved",
    })
      .select([
        "products",
        "slug",
        "title",
        "logo",
        "cover",
        "followers",
        "isFeatured",
        "visitedCount",
        "categoryDetails",
        "subCategoryDetails",
        "category",
        "description",
        "subCategory",
        "status",
        "isActive",
        "createdAt",
        "isBanned",
        "instagramLink",
      ])
      .sort({ createdAt: -1 });

    // Apply pagination only if limit is provided AND paginated is not false
    if (limit && shouldPaginate) {
      const startIndex = (page - 1) * limit;
      const totalShops = await Shop.countDocuments();
      const totalPages = Math.ceil(totalShops / limit);

      shopsQuery = shopsQuery.limit(limit).skip(startIndex);

      const pagination = {
        currentPage: page,
        totalPages: totalPages,
        totalShops: totalShops,
      };

      const shops = await shopsQuery.exec();

      return res.status(200).json({
        success: true,
        data: shops,
        pagination: pagination,
      });
    } else {
      // If paginated is false or limit is not provided, fetch all shops
      const shops = await shopsQuery.exec();

      return res.status(200).json({
        success: true,
        data: shops,
      });
    }
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

const getAllShopsByAdmin = async (req, res) => {
  try {
    const shops = await Shop.find({}).select(["title", "slug", "_id"]);
    return res.status(200).json({
      success: true,
      data: shops,
    });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};
const getAllShops = async (req, res) => {
  try {
    const shops = await Shop.find({}).select([
      "logo",
      "cover",
      "followers",
      "title",
      "description",
      "slug",
      "address",
    ]);
    return res.status(200).json({
      success: true,
      data: shops,
    });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

const getOneShopByUser = async (req, res) => {
  try {
    const { slug } = req.params;
    const shop = await Shop.findOne({ slug: slug });
    if (!shop) {
      return res.status(404).json({
        message:
          "We couldn't find the shop you're looking for. Please verify the details or try again later.",
      });
    }
    return res.status(200).json({
      success: true,
      data: shop,
    });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

const getShopsSlugs = async (req, res) => {
  try {
    const shops = await Shop.find().select(["slug"]);

    res.status(201).json({
      success: true,
      data: shops,
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const getShopNameBySlug = async (req, res) => {
  try {
    const shop = await Shop.findOne({
      slug: req.params.slug,
    }).select([
      "cover",
      "logo",
      "description",
      "title",
      "slug",
      "address",
      "phone",
      "createdAt",
    ]);

    res.status(201).json({
      success: true,
      data: shop,
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const getShopStatsByVendor = async (req, res) => {
  try {
    // const admin = await getAdmin(req, res);

    const shop = await Shop.findOne({ vendor: req.user._id });
    if (!shop) {
      return res.status(404).json({
        message:
          "We couldn't find the shop you're looking for. Please verify the details or try again later.",
      });
    }
    const { totalCommission, totalEarnings } = await getTotalEarningsByShopId(
      shop._id
    );
    // stats
    const totalProducts = await Product.countDocuments({
      shop: shop._id,
    });
    const totalOrders = await Orders.countDocuments({
      "items.shop": shop._id,
    });

    return res.status(200).json({
      success: true,
      data: shop,
      totalOrders,
      totalEarnings,
      totalCommission,
      totalProducts,
    });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};
const followShop = async (req, res) => {
  try {
    const userId = req.user._id;
    const shopId = req.params.shopId;

    // Find the shop by ID
    const shop = await Shop.findById(shopId);
    if (!shop) {
      return res.status(404).json({
        success: false,
        message:
          "We couldn't find the shop you're looking for. Please verify the details or try again later.",
      });
    }

    // Check if userId is already in the followers array
    const followersIndex = shop.followers.indexOf(userId);

    let message;
    if (followersIndex === -1) {
      // userId not in followers, add it
      shop.followers.push(userId);
      message = "Followed";
    } else {
      // userId already in followers, remove it
      shop.followers.splice(followersIndex, 1);
      message = "Unfollowed";
    }

    // Save the updated shop document
    await shop.save();

    return res.status(200).json({
      success: true,
      shopId,
      message: message,
    });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

const incrementInfluencerVisitCountBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    console.log({ slug }, "visited...");

    if (!slug) {
      return res.status(400).json({
        success: false,
        message: "Influencer slug is required",
      });
    }

    const updatedInfluencer = await Shop.findOneAndUpdate(
      { slug: slug },
      { $inc: { visitedCount: 1 } },
      { new: true }
    );

    if (!updatedInfluencer) {
      return res.status(404).json({
        success: false,
        message: "Influencer not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Visit count incremented successfully",
      data: {
        visitedCount: updatedInfluencer.visitedCount,
      },
    });
  } catch (error) {
    console.error("Error incrementing visit count:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

module.exports = {
  getShopsByAdmin,
  createShopByAdmin,
  getOneShopByAdmin,
  updateOneShopByAdmin,
  updateShopStatusByAdmin,
  deleteOneShopByAdmin,
  updateShopActiveInactiveByAdmin,
  bannedShopByAdmin,
  updateAssignInShopByAdmin,
  createShopByVendor,
  getOneShopByVendor,
  updateOneShopByVendor,
  deleteOneShopByVendor,
  getShops,
  getAllShops,
  getOneShopByUser,
  getShopsSlugs,
  getShopNameBySlug,
  createShopByUser,
  getShopByUser,
  getShopStatsByVendor,
  followShop,
  getAllShopsByAdmin,
  incrementInfluencerVisitCountBySlug,
};
