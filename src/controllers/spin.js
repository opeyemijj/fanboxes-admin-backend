const mongoose = require("mongoose");
const { getAdmin, getUser } = require("../config/getUser");
const { ProvablyFair } = require("../helpers/spinHelper");
const Product = require("../models/Product");
const Spin = require("../models/Spin");
const User = require("../models/User");
const transactionService = require("../services/transactionService");

const createSpin = async (req, res) => {
  // const admin = await getAdmin(req, res);

  // if (!admin) {
  //   return res.status(401).json({
  //     success: false,
  //     message: "Sorry, you don't have the necessary access to this.",
  //   });
  // }
  try {
    // const user = await getUser(req, res, true);
    const user = req?.user;
    if (!user) {
      return res
        .status(401)
        .json({ success: false, message: "Please Login To Continue" });
    }

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

    console.log(boxDetails, "Check the box details after items");

    let vendorId = boxDetails?.vendor;
    let vendorDetails = null;
    // if (!boxDetails?.vendor || boxDetails?.vendor === "") {
    //   return res.status(404).json({
    //     success: false,
    //     message: "No vendor assigned to this box.",
    //   });
    // }

    if (vendorId) {
      vendorDetails = await User.findOne({ _id: boxDetails.vendor });
    }

    // if (!vendorDetails) {
    //   return res.status(404).json({
    //     success: false,
    //     message: "No influencer assigned to this box.",
    //   });
    // }

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
        priceSale: boxDetails?.priceSale,
      },
      // vendorId: boxDetails.vendor,
      // vendorDetails: {
      //   _id: vendorDetails._id,
      //   firstName: vendorDetails.firstName,
      //   lastName: vendorDetails.lastName,
      //   gender: vendorDetails.gender,
      // },
      userId: user._id,
      userDetails: {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        gender: user.gender,
      },
      // shop: boxDetails.shop,
      shopDetails: boxDetails.shopDetails,
      winningItem: result.winningItem,
      nonce: nonce,
      clientSeed: clientSeed,
      serverSeed: serverSeed,
      serverSeedHash: serverSeedHash,
      normalized: result.normalized,
      hash: result.hash,
      oddsMap: result.oddsMap,
      spinCost: boxDetails?.priceSale,
    };

    if (vendorDetails) {
      desireSpinData.vendorDetails = {
        _id: vendorDetails._id,
        firstName: vendorDetails.firstName,
        lastName: vendorDetails.lastName,
        gender: vendorDetails.gender,
      };
      desireSpinData.vendorId = vendorDetails._id;
      desireSpinData.shop = boxDetails?.shop;
    }
    // console.log(desireSpinData, "Calling the spin data");

    const spin = await Spin.create({
      ...desireSpinData,
    });
    return res.status(200).json({
      success: true,
      data: spin,
    });
  } catch (error) {
    console.error("Error in createSpin:", error);
    return res.status(400).json({ success: false, message: error.message });
  }
};

const createSpinByUser = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    // Start transaction session
    await session.withTransaction(async () => {
      const user = req?.user;
      if (!user) {
        return res
          .status(401)
          .json({ success: false, message: "Please Login To Continue" });
      }

      const requestData = req.body;
      const boxId = requestData.boxId;
      const clientSeed = requestData.clientSeed;

      const boxDetails = await Product.findOne({ _id: boxId }).session(session);

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

      console.log(boxDetails, "Check the box details after items");

      let vendorId = boxDetails?.vendor;
      let vendorDetails = null;

      if (vendorId) {
        vendorDetails = await User.findOne({ _id: boxDetails.vendor }).session(
          session
        );
      }

      const previousNonce = await Spin.findOne({ boxId: boxId })
        .sort({ nonce: -1 })
        .session(session);
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
        // This error will trigger transaction rollback
        throw new Error("Failed to calculate item details. Please try again.");
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

      // HANDLE CHECKING AND DEBITING USER CREDITS
      const spinCost = Math.round(boxDetails.priceSale);

      let debitResult;
      try {
        const metadata = {
          initiatedBy: {
            firstName: user.firstName,
            lastName: user.lastName,
            id: user._id,
            role: user?.role,
          },
          boxDetails: {
            _id: boxDetails._id,
            name: boxDetails.name,
            slug: boxDetails.slug,
            images: boxDetails.images,
            items: boxDetails?.items,
            priceSale: boxDetails?.priceSale,
          },
          spinResult: result,
        };

        debitResult = await transactionService.debitForSpin(
          user._id,
          spinCost,
          session,
          boxDetails.name,
          metadata
        );
      } catch (error) {
        if (error.code === "INSUFFICIENT_BALANCE") {
          return res.status(400).json({
            success: false,
            message: "Insufficient balance to spin this box",
            errorCode: "INSUFFICIENT_BALANCE",
            requiredAmount: error.requiredAmount,
            availableAmount: error.availableAmount,
            deficit: error.requiredAmount - error.availableAmount,
          });
        }
        throw error; // Re-throw other errors
      }

      console.log("💳 Balance debited successfully:", debitResult);

      const desireSpinData = {
        boxId: boxId,
        boxDetails: {
          _id: boxDetails._id,
          name: boxDetails.name,
          slug: boxDetails.slug,
          images: boxDetails.images,
          items: boxDetails?.items,
          priceSale: boxDetails?.priceSale,
        },
        userId: user._id,
        userDetails: {
          _id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          gender: user.gender,
        },
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

      if (vendorDetails) {
        desireSpinData.vendorDetails = {
          _id: vendorDetails._id,
          firstName: vendorDetails.firstName,
          lastName: vendorDetails.lastName,
          gender: vendorDetails.gender,
        };
        desireSpinData.vendorId = vendorDetails._id;
        desireSpinData.shop = boxDetails?.shop;
      }

      // Create spin record within the transaction session
      const spin = new Spin({
        ...desireSpinData,
      });

      await spin.save({ session });

      // If we reach here, both debit and spin creation were successful
      // Maintain original response structure
      return res.status(200).json({
        success: true,
        data: spin,
      });
    });
  } catch (error) {
    console.error("Error in createSpin:", error);

    // Handle specific error types
    if (error.message.includes("Failed to calculate item details")) {
      return res.status(403).json({
        success: false,
        message: "Failed to calculate item details. Please try again.",
        errorCode: "SPIN_CALCULATION_ERROR",
      });
    }

    return res.status(400).json({
      success: false,
      message: error.message,
      errorCode: "SPIN_ERROR",
    });
  } finally {
    // End the session
    await session.endSession();
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
      message: "Spin has been successfully verified.",
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
module.exports = { createSpin, spinVerify, getSpinsByAdmin, createSpinByUser };
