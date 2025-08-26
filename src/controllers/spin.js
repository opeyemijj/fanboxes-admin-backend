const { getAdmin, getUser } = require("../config/getUser");
const { ProvablyFair } = require("../helpers/spinHelper");
const Product = require("../models/Product");
const Spin = require("../models/Spin");
const User = require("../models/User");

const createSpinByAdmin = async (req, res) => {
  // const admin = await getAdmin(req, res);

  // if (!admin) {
  //   return res.status(401).json({
  //     success: false,
  //     message: "Sorry, you don't have the necessary access to this.",
  //   });
  // }
  try {
    const user = await getUser(req, res, true);
    const requestData = req.body;
    const boxId = requestData.boxId;
    const clientSeed = requestData.clientSeed;

    const boxDetails = await Product.findOne({ _id: boxId });
    // console.log(boxDetails, "Check teh box details");

    if (!boxDetails) {
      return res.status(404).json({
        success: false,
        message: "We couldn't find the box you're looking for.",
      });
    }

    if (!boxDetails?.items || boxDetails?.items.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "This box is currently empty." });
    }

    const vendorDetails = await User.findOne({ _id: boxDetails.vendor });
    if (!vendorDetails) {
      return res.status(404).json({
        success: false,
        message: "No influencer assigned to this box.",
      });
    }

    const previousNonce = await Spin.findOne({ boxId: boxId }).sort({
      nonce: -1,
    });
    const nonce = (previousNonce?.nonce || 0) + 1;

    // Generate server seed
    const serverSeed = ProvablyFair.generateServerSeed();
    const serverSeedHash = ProvablyFair.hashServerSeed(serverSeed);

    const result = ProvablyFair.generateSpinResult(
      serverSeed,
      clientSeed,
      nonce,
      boxDetails.items
    );

    if (!result.winningItem || result.winningItem === undefined) {
      return res.status(403).json({
        success: false,
        message: "Failed to calculate item details. Please try again.",
      });
    }
    const spinLog = {
      timestamp: new Date().toISOString(),
      clientSeed,
      serverSeed,
      serverSeedHash,
      nonce,
      winningItem: result.winningItem,
      hash: result.hash,
      normalized: result.normalized,
      boxId,
      itemsUsed: boxDetails.items.length,
      oddsMap: result.oddsMap,
    };

    console.log("📝 Spin log entry:", spinLog);

    const desireSpinData = {
      boxId: boxId,
      boxDetails: {
        _id: boxDetails._id,
        name: boxDetails.name,
        slug: boxDetails.slug,
        images: boxDetails.images,
        items: boxDetails?.items,
      },
      vendorId: boxDetails.vendor,
      vendorDetails: {
        _id: vendorDetails._id,
        firstName: vendorDetails.firstName,
        lastName: vendorDetails.lastName,
        gender: vendorDetails.gender,
      },
      userId: user._id,
      userDetails: {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        gender: user.gender,
      },
      shop: boxDetails.shop,
      shopDetails: boxDetails.shopDetails,
      winningItem: result.winningItem,
      nonce: nonce,
      clientSeed: clientSeed,
      serverSeed: serverSeed,
      serverSeedHash: serverSeedHash,
      normalized: result.normalized,
      hash: result.hash,
      oddsMap: result.oddsMap,
    };

    // console.log(desireSpinData, "Calling the spin data");

    const spin = await Spin.create({
      ...desireSpinData,
    });
    return res.status(200).json({
      success: true,
      data: spin,
    });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

const spinVerify = async (req, res) => {
  // const admin = await getAdmin(req, res);
  // if (!admin) {
  //   return res
  //     .status(401)
  //     .json({ success: false, message: "Sorry you don't have access" });
  // }
  try {
    const requestData = req.body;
    const clientSeed = requestData.clientSeed;
    const serverSeed = requestData.serverSeed;
    const nonce = requestData.nonce;

    const spin = await Spin.findOne({
      clientSeed: clientSeed,
      serverSeed: serverSeed,
      nonce: nonce,
    });

    if (!spin) {
      return res
        .status(401)
        .json({ success: false, message: "Verification failed" });
    }

    return res.status(200).json({
      success: true,
      message: "Success spin verification",
      data: spin,
    });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

const getSpinsByAdmin = async (req, res) => {
  try {
    const { limit = 10, page = 1 } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const totalShop = await Spin.countDocuments();

    const admin = await getAdmin(req, res);
    if (!admin) {
      return res.status(401).json({
        success: false,
        message: "Apologies, you don't have the required access to proceed.",
      });
    }
    const spin = await Spin.find({}, null, {
      skip: skip,
      limit: parseInt(limit),
    })
      .select([
        "boxId",
        "boxDetails",
        "vendorId",
        "vendorDetails",
        "userId",
        "userDetails",
        "shop",
        "shopDetails",
        "clientSeed",
        "serverSeed",
        "serverSeedHash",
        "nonce",
        "winningItem",
        "normalized",
        "hash",
        "createdAt",
      ])
      .sort({
        createdAt: -1,
      });

    // const spin = await Spin.find().sort({
    //   createdAt: -1,
    // });

    return res.status(200).json({
      success: true,
      data: spin,
      count: Math.ceil(totalShop / limit),
    });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};
module.exports = { createSpinByAdmin, spinVerify, getSpinsByAdmin };
