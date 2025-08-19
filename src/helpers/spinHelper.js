import crypto from "crypto";

export class ProvablyFair {
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

  static generateSpinResult(serverSeed, clientSeed, nonce, items) {
    console.log(items, "check the items is here or not");
    console.log("🎲 Generating spin result with provably fair algorithm");
    console.log("📊 Inputs:", {
      serverSeed: serverSeed.substring(0, 8) + "...",
      clientSeed,
      nonce,
    });

    // Combine seeds and nonce
    const combined = `${serverSeed}-${clientSeed}-${nonce}`;
    console.log("🔗 Combined string:", combined.substring(0, 20) + "...");

    // Generate hash
    const hash = crypto
      .createHash("sha256")
      .update(combined)
      .digest("hex");
    console.log("🔐 Generated hash:", hash);

    // Convert first 8 characters to decimal
    const hexSubstring = hash.substring(0, 8);
    const decimal = Number.parseInt(hexSubstring, 16);
    console.log("🔢 Hex to decimal:", { hex: hexSubstring, decimal });

    // Normalize to 0-1
    const normalized = decimal / 0xffffffff;
    console.log("📏 Normalized value:", normalized);

    // Calculate cumulative odd and find winning item
    let cumulativeOdds = 0;
    const oddsMap = items.map((item) => {
      const range = {
        item: item.name,
        start: cumulativeOdds,
        end: cumulativeOdds + item.odd,
      };
      cumulativeOdds += item.odd;
      return range;
    });

    console.log("🎯 Odd mapping:", oddsMap);

    const winningItem = items.find((item, index) => {
      const range = oddsMap[index];
      return normalized >= range.start && normalized < range.end;
    });

    console.log("🏆 Winning item:", winningItem?.name);
    console.log("✅ Spin result generated successfully");

    return {
      winningItem,
      hash,
      normalized,
      verification: {
        serverSeed,
        clientSeed,
        nonce,
        hash,
        normalized,
      },
    };
  }

  static verifyResult(serverSeed, clientSeed, nonce, expectedHash) {
    const combined = `${serverSeed}-${clientSeed}-${nonce}`;
    const hash = crypto
      .createHash("sha256")
      .update(combined)
      .digest("hex");
    return hash === expectedHash;
  }
}
