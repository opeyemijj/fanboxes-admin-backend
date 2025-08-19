const { SpinHelper } = require("../helpers/spinHelper");
const Product = require("../models/Product");
const Spin = require("../models/Spin");

const createSpinByAdmin = async (req, res) => {
  try {
    const requestData = req.body;
    const boxId = requestData.boxId;
    const item = requestData.item;
    const clientSeed = requestData.clientSeed;

    const boxDetails = await Product.findOne({ _id: boxId });

    if (!boxDetails) {
      return res.status(404).json({ success: false, message: "Box not found" });
    }

    const previousNonce = await Spin.find({ boxId: boxId });

    const winningItem = boxDetails?.items?.find(
      (it) => String(it._id) === String(item._id)
    );
    // console.log(winningItem, "check the winning item");
    if (!winningItem) {
      return res
        .status(404)
        .json({ success: false, message: "Item not found" });
    }

    // Generate server seed
    const serverSeed = SpinHelper.generateServerSeed();
    const serverSeedHash = SpinHelper.hashServerSeed(serverSeed);
    const hash = SpinHelper.generateHash({
      serverSeed: serverSeed,
      clientSeed: clientSeed,
      nonce: previousNonce.length + 1,
    });

    const desireSpinData = {
      boxId: boxId,
      boxDetails: {
        _id: boxDetails._id,
        name: boxDetails.name,
        slug: boxDetails.slug,
        images: boxDetails.images,
        _id: boxDetails._id,
      },
      winningItem: winningItem,
      nonce: previousNonce.length + 1,
      clientSeed: clientSeed,
      serverSeed: serverSeed,
      serverSeedHash: serverSeedHash,
      hash: hash,
    };

    console.log(desireSpinData, "Calling the spin data");

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
module.exports = { createSpinByAdmin };
