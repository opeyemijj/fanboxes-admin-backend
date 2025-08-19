const { getAdmin } = require("../config/getUser");
const { ProvablyFair } = require("../helpers/spinHelper");
const Product = require("../models/Product");
const Spin = require("../models/Spin");

const createSpinByAdmin = async (req, res) => {
  try {
    const requestData = req.body;
    const boxId = requestData.boxId;
    const clientSeed = requestData.clientSeed;

    const boxDetails = await Product.findOne({ _id: boxId });
    console.log(boxDetails, "Check teh box details");

    if (!boxDetails) {
      return res.status(404).json({ success: false, message: "Box not found" });
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
    };

    console.log("📝 Spin log entry:", spinLog);

    const desireSpinData = {
      boxId: boxId,
      boxDetails: {
        _id: boxDetails._id,
        name: boxDetails.name,
        slug: boxDetails.slug,
        images: boxDetails.images,
        _id: boxDetails._id,
      },
      winningItem: result.winningItem,
      nonce: nonce,
      clientSeed: clientSeed,
      serverSeed: serverSeed,
      serverSeedHash: serverSeedHash,
      hash: result.hash,
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

    const finalResult = {
      hash: spin.hash,
      winningItem: {
        name: spin.winningItem?.name,
        value: spin.winningItem?.value,
        images: spin.winningItem?.images,
      },
    };

    return res.status(200).json({
      success: true,
      data: finalResult,
    });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

const getSpinsByAdmin = async (req, res) => {
  try {
    const admin = await getAdmin(req, res);
    if (!admin) {
      return res
        .status(401)
        .json({ success: false, message: "Sorry you don't have access" });
    }
    const spin = await Spin.find();

    return res.status(200).json({
      success: true,
      data: spin,
    });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};
module.exports = { createSpinByAdmin, spinVerify, getSpinsByAdmin };
