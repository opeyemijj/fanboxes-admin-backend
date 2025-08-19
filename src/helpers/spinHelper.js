import crypto from "crypto";
export class SpinHelper {
  static generateServerSeed() {
    return crypto.randomBytes(32).toString("hex");
  }

  static generateClientSeed() {
    return crypto.randomBytes(16).toString("hex");
  }

  static hashServerSeed(serverSeed) {
    return crypto
      .createHash("sha256")
      .update(serverSeed)
      .digest("hex");
  }
  static generateHash({ serverSeed, clientSeed, nonce }) {
    const combined = `${serverSeed}-${clientSeed}-${nonce}`;
    console.log("🔗 Combined string:", combined.substring(0, 20) + "...");

    return crypto
      .createHash("sha256")
      .update(combined)
      .digest("hex");
  }
}
